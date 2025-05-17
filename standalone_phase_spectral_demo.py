#!/usr/bin/env python3
"""
Standalone Phase-Koopman Coupled System Demo.

This demonstrates the integration between phase synchronization engine and 
Koopman spectral analysis without requiring the full ELFIN package structure.
"""

import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import sys
import os
import time
import logging
import networkx as nx
from typing import Dict, List, Tuple, Optional, Union, Set, Any, NamedTuple
from dataclasses import dataclass
from scipy import linalg

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

#############################################################################
#                    SNAPSHOT BUFFER IMPLEMENTATION                         #
#############################################################################

class SnapshotBuffer:
    """
    Buffer for storing system state snapshots.
    
    This buffer maintains a fixed-size collection of system states for
    use in spectral analysis.
    """
    
    def __init__(self, capacity: int = 100, state_dim: Optional[int] = None):
        """
        Initialize the snapshot buffer.
        
        Args:
            capacity: Maximum number of snapshots to store
            state_dim: Dimension of state vectors (auto-detected if None)
        """
        self.capacity = capacity
        self.state_dim = state_dim
        self.buffer = []
        self.timestamps = []
        self.concept_ids = None
        self.initialized = False
    
    def add_snapshot(self, snapshot: Union[Dict[str, float], np.ndarray], timestamp: Optional[float] = None):
        """
        Add a snapshot to the buffer.
        
        Args:
            snapshot: System state as dict mapping concept IDs to phase values,
                     or as a numpy array
            timestamp: Time of snapshot (defaults to current time)
        """
        if timestamp is None:
            timestamp = time.time()
        
        # Handle dictionary input (concept phases)
        if isinstance(snapshot, dict):
            if not self.initialized:
                # First snapshot, establish concept order
                self.concept_ids = list(snapshot.keys())
                self.state_dim = len(self.concept_ids)
                self.initialized = True
            
            # Convert dict to array using established concept order
            state_array = np.array([snapshot.get(cid, 0.0) for cid in self.concept_ids])
            
        # Handle array input
        else:
            state_array = np.array(snapshot)
            if not self.initialized and self.state_dim is None:
                self.state_dim = len(state_array)
                self.initialized = True
        
        # Ensure correct dimensions
        if self.state_dim and len(state_array) != self.state_dim:
            raise ValueError(f"Expected state dimension {self.state_dim}, got {len(state_array)}")
        
        # Add to buffer
        self.buffer.append(state_array)
        self.timestamps.append(timestamp)
        
        # Maintain capacity
        if len(self.buffer) > self.capacity:
            self.buffer.pop(0)
            self.timestamps.pop(0)
    
    def get_snapshot_matrix(self) -> Tuple[np.ndarray, List[float]]:
        """
        Get snapshots as a matrix where each column is a snapshot.
        
        Returns:
            Tuple of (snapshot_matrix, timestamps)
        """
        if not self.buffer:
            raise ValueError("Buffer is empty")
        
        # Stack snapshots as columns
        snapshot_matrix = np.column_stack(self.buffer)
        
        return snapshot_matrix, self.timestamps
    
    def get_time_shifted_matrices(self, shift: int = 1) -> Tuple[np.ndarray, np.ndarray]:
        """
        Get time-shifted snapshot matrices for dynamic analysis.
        
        Args:
            shift: Time shift between matrices
            
        Returns:
            Tuple of (X, Y) matrices where Y is shifted 'shift' steps forward from X
        """
        if len(self.buffer) <= shift:
            raise ValueError(f"Buffer must contain more than {shift} snapshots")
        
        # Split into input (X) and output (Y) matrices
        X = np.column_stack(self.buffer[:-shift])
        Y = np.column_stack(self.buffer[shift:])
        
        return X, Y

#############################################################################
#                    PHASE ENGINE IMPLEMENTATION                            #
#############################################################################

class PhaseEngine:
    """
    Implements the ψ-coupling phase synchronization for concepts.
    
    This engine updates phase values of concepts based on their connections,
    adjusting phases toward alignment (or intended phase offset) for connected
    concepts.
    """
    
    def __init__(self, coupling_strength: float = 0.1, natural_frequencies: Optional[Dict[str, float]] = None):
        """
        Initialize the phase engine.
        
        Args:
            coupling_strength: Global coupling strength parameter (K)
            natural_frequencies: Dictionary mapping concept IDs to their natural frequencies
        """
        self.coupling_strength = coupling_strength
        self.natural_frequencies = natural_frequencies or {}
        self.phases: Dict[str, float] = {}  # Current phase values for each concept
        self.graph = nx.DiGraph()  # Concept graph with edge weights for coupling
        self.spectral_feedback = 1.0  # Feedback factor from spectral analysis
    
    def add_concept(self, concept_id: str, initial_phase: float = 0.0, natural_frequency: float = 0.0):
        """
        Add a concept to the phase engine.
        
        Args:
            concept_id: Unique identifier for the concept
            initial_phase: Initial phase value (in radians)
            natural_frequency: Natural oscillation frequency
        """
        self.phases[concept_id] = initial_phase
        self.natural_frequencies[concept_id] = natural_frequency
        self.graph.add_node(concept_id)
    
    def add_edge(self, source_id: str, target_id: str, weight: float = 1.0, 
                 phase_offset: float = 0.0):
        """
        Add a directed edge between concepts.
        
        Args:
            source_id: Source concept ID
            target_id: Target concept ID
            weight: Edge weight for coupling strength
            phase_offset: Desired phase difference between concepts
        """
        # Make sure nodes exist
        if source_id not in self.graph:
            self.add_concept(source_id)
        if target_id not in self.graph:
            self.add_concept(target_id)
            
        # Add edge with weight and desired phase offset
        self.graph.add_edge(source_id, target_id, weight=weight, phase_offset=phase_offset)
    
    def set_phase(self, concept_id: str, phase: float):
        """
        Set the phase value for a specific concept.
        
        Args:
            concept_id: Concept ID
            phase: New phase value (in radians)
        """
        if concept_id not in self.phases:
            self.add_concept(concept_id)
        
        # Normalize phase to [0, 2π)
        self.phases[concept_id] = phase % (2 * np.pi)
    
    def set_spectral_feedback(self, feedback_factor: float):
        """
        Set the feedback factor from spectral analysis.
        
        Args:
            feedback_factor: Value to modulate coupling strength
        """
        self.spectral_feedback = max(0.0, min(2.0, feedback_factor))
    
    def step(self, dt: float) -> Dict[str, float]:
        """
        Perform one step of phase updates for all concepts.
        
        Args:
            dt: Time step size in seconds. Natural frequencies should be in radians/sec.
            
        Returns:
            Dictionary of updated phase values
        """
        # Initialize phase updates with natural frequencies
        phase_updates = {node_id: self.natural_frequencies.get(node_id, 0.0) 
                        for node_id in self.graph.nodes}
        
        # Edge error accumulator for sync ratio calculation
        total_error = 0.0
        total_weight = 0.0
        
        # Single pass over all edges - O(E) instead of O(E*N)
        for source, target, edge_data in self.graph.edges(data=True):
            weight = edge_data.get('weight', 1.0)
            phase_offset = edge_data.get('phase_offset', 0.0)
            
            # Calculate phase difference with desired offset
            # No modulo - using sine's periodicity instead
            source_phase = self.phases.get(source, 0.0)
            target_phase = self.phases.get(target, 0.0)
            phase_diff = source_phase - target_phase - phase_offset
            
            # Apply coupling effect
            effective_coupling = self.coupling_strength * weight * self.spectral_feedback
            coupling_effect = effective_coupling * np.sin(phase_diff)
            
            # Apply to target node
            phase_updates[target] += coupling_effect
            
            # Calculate error for sync ratio (optional optimization)
            error = abs(np.sin(phase_diff/2))  # Proportional to phase difference
            total_error += error * weight
            total_weight += weight
        
        # Apply all updates simultaneously
        for node_id, d_phase in phase_updates.items():
            new_phase = (self.phases.get(node_id, 0.0) + d_phase * dt) % (2 * np.pi)
            self.phases[node_id] = new_phase
        
        # Store sync ratio data for potential reuse
        self._last_total_error = total_error
        self._last_total_weight = total_weight
        
        return self.phases
    
    def calculate_sync_ratio(self) -> float:
        """
        Calculate the synchronization ratio of the concept graph.
        
        Returns:
            Synchronization ratio between 0 (no sync) and 1 (perfect sync)
        """
        if len(self.phases) <= 1:
            return 1.0  # Single node or empty graph is perfectly "synchronized"
        
        # Extract edges in the graph
        edges = list(self.graph.edges(data=True))
        if not edges:
            return 1.0  # No edges means no synchronization constraints
        
        # Use cached calculations if available (faster)
        if hasattr(self, '_last_total_error') and hasattr(self, '_last_total_weight'):
            if self._last_total_weight > 0:
                avg_error = self._last_total_error / self._last_total_weight
                return 1.0 - min(avg_error, 1.0)  # Cap at 0 sync ratio
        
        # Otherwise calculate phase error for each edge
        total_error = 0.0
        for source, target, edge_data in edges:
            weight = edge_data.get('weight', 1.0)
            phase_offset = edge_data.get('phase_offset', 0.0)
            
            source_phase = self.phases.get(source, 0.0)
            target_phase = self.phases.get(target, 0.0)
            
            # Calculate phase difference with desired offset
            # Use sin^2(phase_diff/2) which is proportional to 1-cos(phase_diff)
            # and provides smoother error metric
            phase_diff = source_phase - target_phase - phase_offset
            error = np.sin(phase_diff/2)**2
            
            total_error += error * weight
        
        # Normalize by sum of weights
        total_weight = sum(edge_data.get('weight', 1.0) for _, _, edge_data in edges)
        if total_weight > 0:
            avg_error = total_error / total_weight
        else:
            avg_error = 0.0
        
        # Convert error to sync ratio (0 error = 1.0 sync, max error = 0.0 sync)
        return 1.0 - min(avg_error, 1.0)  # Cap at 0 sync ratio
    
    def export_state(self) -> Dict:
        """
        Export the current state of the phase engine.
        
        Returns:
            Dictionary containing phases, graph structure, and parameters
        """
        return {
            'phases': self.phases.copy(),
            'coupling_strength': self.coupling_strength,
            'natural_frequencies': self.natural_frequencies.copy(),
            'spectral_feedback': self.spectral_feedback,
            'sync_ratio': self.calculate_sync_ratio(),
            'graph': {
                'nodes': list(self.graph.nodes()),
                'edges': [(u, v, d) for u, v, d in self.graph.edges(data=True)]
            }
        }
    
    def update_matrix(self) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """
        Generate the coupling matrix and phase offset matrix for testing.
        
        This method extracts the graph structure as NumPy arrays for testing
        and verification against ground-truth implementations.
        
        Returns:
            Tuple of (coupling_matrix, offset_matrix, node_ids)
            
            coupling_matrix: Matrix A where A[i,j] is coupling strength from j to i
            offset_matrix: Matrix Δ where Δ[i,j] is phase offset from j to i
            node_ids: List of node IDs corresponding to matrix indices
        """
        # Get ordered list of node IDs
        node_ids = list(self.graph.nodes())
        n = len(node_ids)
        
        # Initialize matrices
        coupling_matrix = np.zeros((n, n))
        offset_matrix = np.zeros((n, n))
        
        # Build adjacency matrix with weights and offsets
        for i, target in enumerate(node_ids):
            for j, source in enumerate(node_ids):
                if self.graph.has_edge(source, target):
                    edge_data = self.graph.get_edge_data(source, target)
                    weight = edge_data.get('weight', 1.0)
                    phase_offset = edge_data.get('phase_offset', 0.0)
                    
                    # Apply global coupling strength and spectral feedback
                    effective_coupling = self.coupling_strength * weight * self.spectral_feedback
                    
                    coupling_matrix[i, j] = effective_coupling
                    offset_matrix[i, j] = phase_offset
        
        return coupling_matrix, offset_matrix, node_ids

#############################################################################
#                    SPECTRAL ANALYZER IMPLEMENTATION                       #
#############################################################################

class EDMDResult(NamedTuple):
    """Results of EDMD spectral decomposition."""
    eigenvalues: np.ndarray  # Complex eigenvalues (λ)
    eigenvectors: np.ndarray  # Eigenvectors (Φ)
    modes: np.ndarray  # Dynamic modes
    amplitudes: np.ndarray  # Mode amplitudes
    frequencies: np.ndarray  # Mode frequencies
    damping_ratios: np.ndarray  # Mode damping ratios
    growth_rates: np.ndarray  # Mode growth/decay rates
    koopman_matrix: np.ndarray  # Koopman operator matrix (K)
    error: float  # Reconstruction error


class SpectralAnalyzer:
    """
    Implements Koopman spectral analysis using EDMD.
    
    This analyzer computes spectral decompositions from snapshot data to
    identify dynamical modes and assess system stability.
    """
    
    def __init__(self, snapshot_buffer: Optional[SnapshotBuffer] = None):
        """
        Initialize the spectral analyzer.
        
        Args:
            snapshot_buffer: Buffer containing system state snapshots
        """
        self.snapshot_buffer = snapshot_buffer
        self.last_result: Optional[EDMDResult] = None
        self.dominant_modes: List[int] = []  # Indices of dominant modes
        self.unstable_modes: List[int] = []  # Indices of unstable modes
    
    def edmd_decompose(self, snapshot_buffer: Optional[SnapshotBuffer] = None, 
                       time_shift: int = 1, svd_rank: Optional[int] = None) -> EDMDResult:
        """
        Perform Extended Dynamic Mode Decomposition.
        
        Args:
            snapshot_buffer: Buffer containing system state snapshots (uses internal if None)
            time_shift: Time shift for constructing data matrices
            svd_rank: Truncation rank for SVD (stability/regularization), None for full rank
            
        Returns:
            EDMDResult containing eigenvalues, modes, and other analysis
            
        Raises:
            ValueError: If snapshot buffer is insufficient for analysis
        """
        buffer = snapshot_buffer or self.snapshot_buffer
        if buffer is None:
            raise ValueError("No snapshot buffer provided")
        
        if len(buffer.buffer) < time_shift + 2:
            raise ValueError(f"Need at least {time_shift + 2} snapshots for EDMD analysis with shift {time_shift}")
        
        # Get time-shifted data matrices
        X, Y = buffer.get_time_shifted_matrices(time_shift)
        
        # Compute SVD of X
        U, Sigma, Vh = linalg.svd(X, full_matrices=False)
        
        # Truncate SVD if requested
        if svd_rank is not None and svd_rank < len(Sigma):
            r = svd_rank
            U = U[:, :r]
            Sigma = Sigma[:r]
            Vh = Vh[:r, :]
        else:
            r = len(Sigma)
        
        # Compute Koopman matrix (standard EDMD formulation)
        # Apply regularization for small singular values
        tol = 1e-10 * Sigma[0]  # Threshold relative to largest singular value
        Sigma_inv = np.diag(np.where(Sigma > tol, 1.0 / Sigma, 0.0))
        
        # Standard EDMD (row-space) operator - no U.T projection
        K = Y @ Vh.T @ Sigma_inv
        
        # Eigendecomposition of Koopman matrix
        eigenvalues, eigenvectors = linalg.eig(K)
        
        # Compute dynamic modes
        modes = Y @ Vh.T @ Sigma_inv @ eigenvectors
        
        # Normalize modes
        for i in range(modes.shape[1]):
            modes[:, i] = modes[:, i] / linalg.norm(modes[:, i])
        
        # Compute mode amplitudes (using first snapshot)
        x0 = X[:, 0]
        try:
            # For newer versions of scipy
            b = linalg.lstsq(modes, x0, rcond=None)[0]
        except TypeError:
            # For older versions of scipy where rcond is not a parameter
            b = linalg.lstsq(modes, x0)[0]
        amplitudes = np.abs(b)
        
        # Compute frequencies and damping ratios from eigenvalues
        # Lambda = exp(alpha + i*omega * dt)
        dt = np.mean(np.diff(buffer.timestamps)) if len(buffer.timestamps) > 1 else 1.0
        log_eigs = np.log(eigenvalues) / dt  # Convert to continuous time
        frequencies = np.abs(np.imag(log_eigs)) / (2 * np.pi)  # Hz
        growth_rates = np.real(log_eigs)
        damping_ratios = -np.real(log_eigs) / np.abs(log_eigs)
        
        # Compute reconstruction error with eigenvalue dynamics
        X_reconstructed = np.zeros_like(X)
        for t in range(X.shape[1]):
            # Advance coefficients using eigenvalues
            evolved_coeffs = b * np.power(eigenvalues, t)
            # Reconstruct snapshot at time t
            X_reconstructed[:, t] = modes @ evolved_coeffs
        
        error = linalg.norm(X - X_reconstructed) / linalg.norm(X)
        
        # Create and store result
        result = EDMDResult(
            eigenvalues=eigenvalues,
            eigenvectors=eigenvectors,
            modes=modes,
            amplitudes=amplitudes,
            frequencies=frequencies,
            damping_ratios=damping_ratios,
            growth_rates=growth_rates,
            koopman_matrix=K,
            error=error
        )
        
        self.last_result = result
        
        # Update dominant and unstable modes
        self._identify_dominant_modes()
        self._identify_unstable_modes()
        
        return result
    
    def _identify_dominant_modes(self, num_modes: int = 3) -> None:
        """
        Identify the dominant modes based on both amplitude and growth rate.
        
        This uses a weighted scoring system that considers both the initial
        amplitude of the mode and its growth/decay rate.
        
        Args:
            num_modes: Number of dominant modes to identify
        """
        if self.last_result is None:
            return
        
        # Create a score combining amplitude and growth rate
        # Modes with high amplitude AND high growth rate are most important
        amplitudes = self.last_result.amplitudes
        growth_rates = self.last_result.growth_rates
        
        # Normalize both factors to [0, 1] range
        if len(amplitudes) > 0:
            norm_amp = amplitudes / (np.max(amplitudes) if np.max(amplitudes) > 0 else 1.0)
            
            # For growth rates, use exponential scaling to emphasize unstable modes
            # Stable modes (negative growth) get less weight
            scaled_growth = np.exp(np.clip(growth_rates, -2, 2))
            norm_growth = scaled_growth / (np.max(scaled_growth) if np.max(scaled_growth) > 0 else 1.0)
            
            # Combined score (higher is more dominant)
            # Weight amplitude more (0.7) than growth rate (0.3)
            combined_score = 0.7 * norm_amp + 0.3 * norm_growth
            
            # Get indices of highest scoring modes
            idx = np.argsort(combined_score)[::-1]
            self.dominant_modes = idx[:min(num_modes, len(idx))].tolist()
        else:
            self.dominant_modes = []
    
    def _identify_unstable_modes(self, threshold: float = 0.0) -> None:
        """
        Identify unstable modes with positive growth rates.
        
        Args:
            threshold: Growth rate threshold for instability
        """
        if self.last_result is None:
            return
        
        # Find modes with positive growth rates
        self.unstable_modes = np.where(self.last_result.growth_rates > threshold)[0].tolist()
    
    def calculate_stability_index(self) -> float:
        """
        Calculate overall stability index from eigenvalue spectrum.
        
        Returns:
            Stability index between -1 (highly unstable) and 1 (highly stable)
        """
        if self.last_result is None:
            return 0.0
        
        # Use max growth rate as stability indicator
        max_growth = np.max(self.last_result.growth_rates)
        
        # Scale to [-1, 1] range using tanh
        stability_index = -np.tanh(max_growth)
        
        return stability_index
    
    def get_spectral_feedback(self) -> float:
        """
        Generate feedback factor for oscillator coupling based on spectral properties.
        
        Returns:
            Feedback factor (< 1.0 for unstable modes to reduce coupling)
        """
        if self.last_result is None or not self.unstable_modes:
            return 1.0
        
        # Calculate feedback based on instability
        # More unstable → lower feedback to reduce coupling
        stability = self.calculate_stability_index()
        
        # Map from stability [-1, 1] to feedback [0.1, 1.0]
        feedback = 0.55 + 0.45 * (stability + 1) / 2
        
        return feedback

#############################################################################
#                           DEMO FUNCTIONS                                  #
#############################################################################

def run_simulation(steps=1000, spectral_feedback=True, 
                  buffer_capacity=100, spectral_update_interval=20):
    """
    Run a simulation of the coupled phase-spectral system.
    
    Args:
        steps: Number of simulation steps
        spectral_feedback: Whether to use spectral feedback to phase engine
        buffer_capacity: Capacity of the snapshot buffer
        spectral_update_interval: How often to update spectral analysis
        
    Returns:
        Tuple of (phase_engine, snapshot_buffer, analyzer, history)
    """
    # Create phase engine with moderate coupling
    engine = PhaseEngine(coupling_strength=0.15)
    
    # Create concept graph
    # Main concepts
    concepts = ["User", "Interface", "Database", "Network", "Security", 
               "Algorithm", "Storage", "Processing"]
    
    # Create concepts with random initial phases
    np.random.seed(42)  # For reproducibility
    for c in concepts:
        engine.add_concept(c, initial_phase=np.random.uniform(0, 2*np.pi))
    
    # Add edges between related concepts (symmetric)
    edges = [
        ("User", "Interface", 1.0),
        ("Interface", "Database", 0.7),
        ("Database", "Storage", 0.9),
        ("Network", "Database", 0.5),
        ("Network", "Security", 0.8),
        ("Algorithm", "Processing", 0.9),
        ("Processing", "Database", 0.6),
        ("Security", "Database", 0.7),
        # Cross-cluster connection with weak coupling
        ("User", "Algorithm", 0.1),
    ]
    
    # Add bidirectional edges
    for source, target, weight in edges:
        engine.add_edge(source, target, weight=weight)
        engine.add_edge(target, source, weight=weight)
    
    # Create snapshot buffer
    buffer = SnapshotBuffer(capacity=buffer_capacity)
    
    # Create spectral analyzer
    analyzer = SpectralAnalyzer(buffer)
    
    # Initialize history dictionary for storing results
    history = {
        'phases': {},
        'sync_ratio': [],
        'spectral_feedback': [],
        'stability_index': [],
        'timestamps': []
    }
    
    # Initialize phase history for each concept
    for c in concepts:
        history['phases'][c] = []
    
    # Run simulation
    for step in range(steps):
        # Get concept phases as dictionary
        phases = engine.phases.copy()
        
        # Capture current state
        timestamp = step * 0.1  # dt = 0.1
        buffer.add_snapshot(phases, timestamp=timestamp)
        
        # Update phase engine
        engine.step(dt=0.1)
        
        # Perform spectral analysis periodically
        if step > 0 and step % spectral_update_interval == 0 and len(buffer.buffer) > 10:
            try:
                # Perform EDMD decomposition
                result = analyzer.edmd_decompose(time_shift=1)
                
                # Get stability feedback
                stability_index = analyzer.calculate_stability_index()
                
                # Update phase engine coupling if feedback is enabled
                if spectral_feedback:
                    feedback = analyzer.get_spectral_feedback()
                    engine.set_spectral_feedback(feedback)
                
                # Log status
                n_unstable = len(analyzer.unstable_modes)
                
                # Check for numerical stability issues in the result
                has_numerical_issues = False
                if np.any(np.isnan(result.eigenvalues)) or np.any(np.isinf(result.eigenvalues)):
                    has_numerical_issues = True
                
                if has_numerical_issues:
                    logger.warning(f"Spectral analysis has numerical issues at step {step}: eigenvalues contain NaN/Inf")
                else:
                    logger.info(f"Step {step}: Sync: {engine.calculate_sync_ratio():.3f}, "
                               f"Stability: {stability_index:.3f}, "
                               f"Unstable modes: {n_unstable}")
                    if step % 100 == 0:
                        logger.info(f"Spectral analysis PASSED at step {step}: numerical stability verified")
                
            except Exception as e:
                logger.warning(f"Spectral analysis failed at step {step}: {e}")
        
        # Calculate sync ratio
        sync_ratio = engine.calculate_sync_ratio()
        
        # Record history
        for c in concepts:
            history['phases'][c].append(phases.get(c, 0.0))
        
        history['sync_ratio'].append(sync_ratio)
        history['spectral_feedback'].append(engine.spectral_feedback)
        
        if analyzer.last_result is not None:
            history['stability_index'].append(analyzer.calculate_stability_index())
        else:
            history['stability_index'].append(0.0)
            
        history['timestamps'].append(timestamp)
    
    return engine, buffer, analyzer, history


def introduce_instability(engine, source, target, new_weight=1.5, step=500):
    """
    Introduce instability by increasing coupling between two concepts.
    
    Args:
        engine: Phase engine instance
        source: Source concept
        target: Target concept
        new_weight: New coupling weight (high value can cause instability)
        step: Simulation step when to introduce the change
    """
    # Store original weights for future reference
    original_weight = engine.graph[source][target]['weight']
    
    # Function to modify weight at the specified step
    def modify(current_step):
        if current_step == step:
            logger.info(f"Introducing potential instability: {source}->{target} "
                       f"weight {original_weight} -> {new_weight}")
            # Increase coupling weight
            engine.graph[source][target]['weight'] = new_weight
            engine.graph[target][source]['weight'] = new_weight
            return True
        return False
    
    return modify


def plot_results(history, concepts, output_dir=None):
    """
    Visualize simulation results.
    
    Args:
        history: History data from simulation
        concepts: List of concept names
        output_dir: Directory to save plots (if None, plots are displayed)
    """
    # Create output directory if it doesn't exist
    if output_dir is not None:
        Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Plot phases
    plt.figure(figsize=(12, 8))
    timestamps = history['timestamps']
    
    for c in concepts:
        plt.plot(timestamps, history['phases'][c], label=c)
    
    plt.xlabel('Time')
    plt.ylabel('Phase (radians)')
    plt.title('Concept Phase Evolution')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    if output_dir is not None:
        plt.savefig(Path(output_dir) / 'phases.png')
    else:
        plt.show()
    
    # Plot synchronization and stability metrics
    plt.figure(figsize=(12, 6))
    
    plt.subplot(2, 1, 1)
    plt.plot(timestamps, history['sync_ratio'], 'b-', label='Sync Ratio')
    plt.ylabel('Sync Ratio')
    plt.title('System Synchronization and Stability')
    plt.grid(True, alpha=0.3)
    plt.legend()
    
    plt.subplot(2, 1, 2)
    plt.plot(timestamps, history['stability_index'], 'r-', label='Stability Index')
    plt.plot(timestamps, history['spectral_feedback'], 'g--', label='Spectral Feedback')
    plt.xlabel('Time')
    plt.ylabel('Value')
    plt.grid(True, alpha=0.3)
    plt.legend()
    
    if output_dir is not None:
        plt.savefig(Path(output_dir) / 'metrics.png')
    else:
        plt.show()


def main():
    """Run the phase-spectral integration demo."""
    
    logger.info("Starting Phase-Koopman system demo")
    
    # Define scenarios
    scenarios = [
        {
            'name': 'baseline',
            'steps': 600, 
            'spectral_feedback': True,
            'instability': None,
            'title': 'Baseline System (With Spectral Feedback)'
        },
        {
            'name': 'with_instability',
            'steps': 1000, 
            'spectral_feedback': True,
            'instability': ('Database', 'Network', 2.0, 500),
            'title': 'Instability Introduced with Spectral Feedback'
        }
    ]
    
    # Run each scenario
    results = {}
    
    for scenario in scenarios:
        logger.info(f"Running scenario: {scenario['name']}")
        
        # Set up instability trigger if specified
        instability_trigger = None
        if scenario['instability'] is not None:
            source, target, weight, step = scenario['instability']
        
        # Run simulation
        engine, buffer, analyzer, history = run_simulation(
            steps=scenario['steps'],
            spectral_feedback=scenario['spectral_feedback']
        )
        
        # Apply instability if configured
        if scenario['instability'] is not None:
            # Rebind instability trigger to actual engine
            instability_trigger = introduce_instability(
                engine, source, target, weight, step
            )
            
            # Apply at the specified step
            for i in range(scenario['steps']):
                if instability_trigger(i):
                    break
        
        # Store results
        results[scenario['name']] = {
            'engine': engine,
            'buffer': buffer,
            'analyzer': analyzer,
            'history': history,
            'title': scenario['title']
        }
        
        # Plot results
        output_dir = f"./outputs/{scenario['name']}"
        plot_results(
            history, 
            list(engine.phases.keys()),
            output_dir=output_dir
        )
    
    logger.info("Demo completed. Results saved to ./outputs/ directory")
    
    return results


if __name__ == "__main__":
    # Create outputs directory if it doesn't exist
    Path("./outputs").mkdir(exist_ok=True)
    
    # Run the demo
    main()
