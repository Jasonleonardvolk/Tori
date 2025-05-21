"""
Memory System Traffic Capture and Replay

This module provides utilities for capturing and replaying memory patterns and cues,
facilitating fair comparisons between memory backends (Hopfield, Ising).
"""

import os
import time
import json
import logging
import threading
import numpy as np
from typing import Dict, List, Optional, Union, Tuple, Any, Callable
from concurrent.futures import ThreadPoolExecutor

from .manager import MemoryManager

# Configure logging
logger = logging.getLogger("tori.memory.traffic_replay")

class MemoryCapture:
    """
    Capture memory patterns and recall requests for later replay.
    
    This class intercepts memory operations to record patterns and cues,
    allowing for exact replay of traffic to compare different backends.
    """
    
    def __init__(self, filepath: str = None):
        """
        Initialize a new memory capture session.
        
        Args:
            filepath: Optional path to save captured traffic
        """
        self.filepath = filepath
        self.patterns: List[Dict[str, Any]] = []
        self.cues: List[Dict[str, Any]] = []
        self.start_time = time.time()
        self.lock = threading.Lock()
        
    def record_pattern(self, pattern: np.ndarray, metadata: Dict[str, Any] = None) -> None:
        """
        Record a pattern.
        
        Args:
            pattern: Pattern to record
            metadata: Optional metadata about the pattern
        """
        with self.lock:
            record = {
                "timestamp": time.time(),
                "type": "pattern",
                "data": pattern.tolist() if isinstance(pattern, np.ndarray) else pattern,
                "metadata": metadata or {}
            }
            self.patterns.append(record)
            
            # Autosave if filepath provided
            if self.filepath:
                self._save()
    
    def record_cue(self, cue: np.ndarray, metadata: Dict[str, Any] = None) -> None:
        """
        Record a cue.
        
        Args:
            cue: Cue to record
            metadata: Optional metadata about the cue
        """
        with self.lock:
            record = {
                "timestamp": time.time(),
                "type": "cue",
                "data": cue.tolist() if isinstance(cue, np.ndarray) else cue,
                "metadata": metadata or {}
            }
            self.cues.append(record)
            
            # Autosave if filepath provided
            if self.filepath:
                self._save()
    
    def save(self, filepath: str = None) -> None:
        """
        Save captured traffic to file.
        
        Args:
            filepath: Path to save to, defaults to self.filepath
        """
        with self.lock:
            self._save(filepath)
    
    def _save(self, filepath: str = None) -> None:
        """
        Internal save method (without lock).
        
        Args:
            filepath: Path to save to, defaults to self.filepath
        """
        filepath = filepath or self.filepath
        if not filepath:
            raise ValueError("No filepath provided")
            
        data = {
            "start_time": self.start_time,
            "end_time": time.time(),
            "patterns": self.patterns,
            "cues": self.cues
        }
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        
        # Save to file
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved {len(self.patterns)} patterns and {len(self.cues)} cues to {filepath}")
    
    @classmethod
    def load(cls, filepath: str) -> 'MemoryCapture':
        """
        Load captured traffic from file.
        
        Args:
            filepath: Path to load from
            
        Returns:
            Loaded MemoryCapture instance
        """
        with open(filepath, 'r') as f:
            data = json.load(f)
            
        capture = cls(filepath)
        capture.start_time = data.get("start_time", time.time())
        capture.patterns = data.get("patterns", [])
        capture.cues = data.get("cues", [])
        
        logger.info(f"Loaded {len(capture.patterns)} patterns and {len(capture.cues)} cues from {filepath}")
        return capture


class MemoryReplay:
    """
    Replay captured memory patterns and cues to multiple backends for comparison.
    
    This class allows for simultaneous replay to multiple memory backends,
    enabling fair, apples-to-apples comparison of different backends.
    """
    
    def __init__(self, capture: MemoryCapture):
        """
        Initialize a new memory replay session.
        
        Args:
            capture: Captured traffic to replay
        """
        self.capture = capture
        self.backends: Dict[str, MemoryManager] = {}
        self.results: Dict[str, Dict[str, Any]] = {}
        
    def add_backend(self, name: str, manager: MemoryManager) -> None:
        """
        Add a backend for replay.
        
        Args:
            name: Backend name
            manager: Memory manager instance
        """
        self.backends[name] = manager
        self.results[name] = {
            "cue_results": [],
            "timing": {
                "total_time": 0,
                "pattern_time": 0,
                "cue_time": 0
            }
        }
        
    def replay_patterns(self) -> Dict[str, float]:
        """
        Replay patterns to all backends.
        
        Returns:
            Dictionary of backend name -> time taken
        """
        timing = {}
        
        # Convert patterns to NumPy arrays
        patterns = []
        for pattern_record in self.capture.patterns:
            pattern_data = pattern_record["data"]
            pattern = np.array(pattern_data, dtype=np.int8)
            patterns.append(pattern)
            
        # Stack patterns
        if patterns:
            patterns_array = np.stack(patterns)
            
            # Replay to each backend
            for name, manager in self.backends.items():
                logger.info(f"Replaying {len(patterns)} patterns to {name} backend")
                
                start_time = time.time()
                manager.patterns = patterns_array
                
                # For Ising backend, ensure coupling matrix is computed
                if manager.backend == "ising" and manager.coupling_matrix is None:
                    from .hopfield_to_ising import hopfield_to_ising
                    manager.coupling_matrix = hopfield_to_ising(patterns_array)
                
                end_time = time.time()
                timing[name] = end_time - start_time
                
                # Record timing
                self.results[name]["timing"]["pattern_time"] = timing[name]
                self.results[name]["timing"]["total_time"] += timing[name]
        
        return timing
    
    def replay_cues(self, parallel: bool = False) -> Dict[str, List[Tuple[np.ndarray, float]]]:
        """
        Replay cues to all backends.
        
        Args:
            parallel: Whether to execute cues in parallel across backends
            
        Returns:
            Dictionary of backend name -> list of (result, time taken) tuples
        """
        results = {name: [] for name in self.backends}
        
        # Process each cue
        for cue_record in self.capture.cues:
            cue_data = cue_record["data"]
            cue = np.array(cue_data, dtype=np.int8)
            metadata = cue_record["metadata"]
            
            # Get replay parameters
            kwargs = metadata.get("kwargs", {})
            
            # Replay to each backend (in parallel or sequentially)
            if parallel:
                with ThreadPoolExecutor() as executor:
                    futures = {
                        name: executor.submit(self._replay_single_cue, name, manager, cue, kwargs)
                        for name, manager in self.backends.items()
                    }
                    
                    for name, future in futures.items():
                        result, elapsed = future.result()
                        results[name].append((result, elapsed))
                        
                        # Record timing
                        self.results[name]["timing"]["cue_time"] += elapsed
                        self.results[name]["timing"]["total_time"] += elapsed
                        self.results[name]["cue_results"].append({
                            "cue": cue.tolist(),
                            "result": result.tolist(),
                            "time": elapsed
                        })
            else:
                for name, manager in self.backends.items():
                    result, elapsed = self._replay_single_cue(name, manager, cue, kwargs)
                    results[name].append((result, elapsed))
                    
                    # Record timing
                    self.results[name]["timing"]["cue_time"] += elapsed
                    self.results[name]["timing"]["total_time"] += elapsed
                    self.results[name]["cue_results"].append({
                        "cue": cue.tolist(),
                        "result": result.tolist(),
                        "time": elapsed
                    })
        
        return results
    
    def _replay_single_cue(
        self, 
        backend_name: str,
        manager: MemoryManager,
        cue: np.ndarray,
        kwargs: Dict[str, Any]
    ) -> Tuple[np.ndarray, float]:
        """
        Replay a single cue to a backend.
        
        Args:
            backend_name: Backend name
            manager: Memory manager
            cue: Cue to replay
            kwargs: Recall parameters
            
        Returns:
            Tuple of (recall result, time taken)
        """
        logger.debug(f"Replaying cue to {backend_name} backend")
        
        start_time = time.time()
        result = manager.recall(cue, **kwargs)
        end_time = time.time()
        
        elapsed = end_time - start_time
        logger.debug(f"Cue replay on {backend_name} took {elapsed:.6f} seconds")
        
        return result, elapsed
    
    def compare_results(self) -> Dict[str, Dict[str, Any]]:
        """
        Compare recall results across backends.
        
        Returns:
            Comparison metrics
        """
        if len(self.backends) < 2:
            logger.warning("Need at least 2 backends to compare results")
            return {}
            
        # Get backend names
        backend_names = list(self.backends.keys())
        
        # Prepare comparison metrics
        comparisons = {}
        
        # Compare each pair of backends
        for i in range(len(backend_names)):
            for j in range(i+1, len(backend_names)):
                name_a = backend_names[i]
                name_b = backend_names[j]
                comparison_key = f"{name_a}_vs_{name_b}"
                
                results_a = self.results[name_a]["cue_results"]
                results_b = self.results[name_b]["cue_results"]
                
                # Skip if results are missing
                if not results_a or not results_b:
                    continue
                    
                # Compare results
                agreement = []
                hamming_distances = []
                
                for res_a, res_b in zip(results_a, results_b):
                    result_a = np.array(res_a["result"])
                    result_b = np.array(res_b["result"])
                    
                    # Check if results match exactly
                    exact_match = np.array_equal(result_a, result_b)
                    agreement.append(exact_match)
                    
                    # Calculate Hamming distance
                    hamming = np.sum(result_a != result_b)
                    hamming_distances.append(hamming)
                
                # Calculate summary statistics
                comparisons[comparison_key] = {
                    "exact_match_rate": sum(agreement) / len(agreement) if agreement else 0,
                    "avg_hamming_distance": np.mean(hamming_distances) if hamming_distances else 0,
                    "max_hamming_distance": np.max(hamming_distances) if hamming_distances else 0,
                    "timing_ratio": self.results[name_a]["timing"]["total_time"] / self.results[name_b]["timing"]["total_time"]
                        if self.results[name_b]["timing"]["total_time"] > 0 else float('inf')
                }
        
        return comparisons
    
    def save_results(self, filepath: str) -> None:
        """
        Save replay results to file.
        
        Args:
            filepath: Path to save to
        """
        # Get overall comparison
        comparisons = self.compare_results()
        
        # Prepare full results
        data = {
            "backends": list(self.backends.keys()),
            "pattern_count": len(self.capture.patterns),
            "cue_count": len(self.capture.cues),
            "backend_results": self.results,
            "comparisons": comparisons
        }
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        
        # Save to file
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved replay results to {filepath}")


def create_tracer_manager(base_manager: MemoryManager, capture: MemoryCapture) -> MemoryManager:
    """
    Create a traced memory manager that records operations.
    
    Args:
        base_manager: Base memory manager to wrap
        capture: Capture object to record to
        
    Returns:
        Traced memory manager
    """
    # Create a new manager with the same initial state
    tracer = MemoryManager(
        patterns=base_manager.patterns.copy() if base_manager.patterns is not None else None,
        backend=base_manager.backend,
        coupling_matrix=base_manager.coupling_matrix.copy() if base_manager.coupling_matrix is not None else None
    )
    
    # Override add_patterns to capture
    original_add_patterns = tracer.add_patterns
    def traced_add_patterns(new_patterns):
        capture.record_pattern(
            new_patterns, 
            metadata={"backend": tracer.backend}
        )
        return original_add_patterns(new_patterns)
    tracer.add_patterns = traced_add_patterns
    
    # Override recall to capture
    original_recall = tracer.recall
    def traced_recall(cue, backend=None, **kwargs):
        capture.record_cue(
            cue, 
            metadata={
                "backend": backend or tracer.backend,
                "kwargs": kwargs
            }
        )
        return original_recall(cue, backend, **kwargs)
    tracer.recall = traced_recall
    
    return tracer


# Command-line interface for replay testing
if __name__ == "__main__":
    import argparse
    
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    parser = argparse.ArgumentParser(description="Memory system traffic replay")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Capture command
    capture_parser = subparsers.add_parser("capture", help="Capture memory traffic")
    capture_parser.add_argument("--output", "-o", type=str, required=True, help="Output file path")
    capture_parser.add_argument("--patterns", "-p", type=int, default=10, help="Number of random patterns to create")
    capture_parser.add_argument("--size", "-s", type=int, default=100, help="Pattern size")
    capture_parser.add_argument("--cues", "-c", type=int, default=5, help="Number of cues to generate")
    capture_parser.add_argument("--noise", "-n", type=float, default=0.1, help="Noise level for cues")
    
    # Replay command
    replay_parser = subparsers.add_parser("replay", help="Replay memory traffic")
    replay_parser.add_argument("--input", "-i", type=str, required=True, help="Input capture file")
    replay_parser.add_argument("--output", "-o", type=str, required=True, help="Output results file")
    replay_parser.add_argument("--parallel", "-p", action="store_true", help="Execute in parallel")
    
    args = parser.parse_args()
    
    if args.command == "capture":
        # Create a memory capture
        capture = MemoryCapture(args.output)
        
        # Generate random patterns
        patterns = np.random.choice([-1, 1], size=(args.patterns, args.size))
        
        # Record patterns
        for pattern in patterns:
            capture.record_pattern(pattern)
        
        # Generate cues with noise
        for i in range(args.cues):
            # Choose a random pattern as basis
            pattern_idx = np.random.randint(args.patterns)
            pattern = patterns[pattern_idx]
            
            # Add noise
            noise_mask = np.random.random(args.size) < args.noise
            cue = pattern.copy()
            cue[noise_mask] *= -1
            
            # Record cue
            capture.record_cue(cue, metadata={"base_pattern": int(pattern_idx)})
        
        # Save capture
        capture.save()
        print(f"Captured {args.patterns} patterns and {args.cues} cues to {args.output}")
        
    elif args.command == "replay":
        # Load capture
        capture = MemoryCapture.load(args.input)
        
        # Create replay
        replay = MemoryReplay(capture)
        
        # Create backends
        dense_manager = MemoryManager(backend="dense")
        ising_manager = MemoryManager(backend="ising")
        
        # Add backends
        replay.add_backend("dense", dense_manager)
        replay.add_backend("ising", ising_manager)
        
        # Replay patterns
        pattern_timing = replay.replay_patterns()
        print("Pattern loading times:")
        for backend, timing in pattern_timing.items():
            print(f"  {backend}: {timing:.6f} seconds")
        
        # Replay cues
        print("\nReplaying cues...")
        cue_results = replay.replay_cues(parallel=args.parallel)
        
        # Compare results
        comparisons = replay.compare_results()
        print("\nBackend comparisons:")
        for key, comparison in comparisons.items():
            print(f"  {key}:")
            for metric, value in comparison.items():
                print(f"    {metric}: {value}")
        
        # Save results
        replay.save_results(args.output)
        print(f"\nSaved replay results to {args.output}")
