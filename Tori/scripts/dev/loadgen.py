#!/usr/bin/env python
"""
Load generator script for TORI Memory System.
This script creates a high-volume, sustained load of episodes for soak testing.
"""

import argparse
import grpc
import json
import numpy as np
import os
import signal
import sys
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from pathlib import Path

# Add the project root to sys.path to import proto modules
sys.path.append(str(Path(__file__).parents[2]))

try:
    from mcp_services.episodic_vault.proto import episodic_pb2, episodic_pb2_grpc
except ImportError:
    print("Error: Proto modules not found. Run 'make proto' first.")
    sys.exit(1)

# Constants
DEFAULT_HOST = "localhost"
DEFAULT_PORT = 50051
DEFAULT_RATE = 5.0  # Episodes per second
DEFAULT_DURATION = 24 * 60 * 60  # 24 hours in seconds
DEFAULT_WORKERS = 4
DEFAULT_CONCEPT_COUNT = 200


def create_episode(sequence_id, worker_id=0, concept_count=DEFAULT_CONCEPT_COUNT):
    """Create a dummy episode with random concept activations and patterns."""
    # Create a timestamp slightly in the past
    timestamp = datetime.now() - timedelta(milliseconds=100)
    
    # Generate concept IDs
    concept_ids = list(range(1, concept_count + 1))
    
    # Create structured activation pattern
    t = sequence_id % 2000 / 200  # Time parameter cycling every 2000 episodes
    
    # Generate activation values with patterns
    activation_values = []
    for i in range(concept_count):
        # Create different oscillation patterns for different concepts
        freq1 = 0.1 + (i % 10) * 0.02
        freq2 = 0.05 + (i % 7) * 0.03
        phase1 = (i % 5) * 0.2 * np.pi
        phase2 = (i % 3) * 0.3 * np.pi
        
        # Mix different frequencies and add noise
        activation = 0.5 * np.sin(freq1 * t + phase1) + 0.3 * np.cos(freq2 * t + phase2)
        
        # Add some intermittent spikes for certain concepts
        if i % 20 == 0 and np.random.random() < 0.1:
            activation = 0.9 * np.sign(activation)
            
        # Add random noise
        activation += np.random.normal(0, 0.1)
        
        # Clip to range [-1, 1]
        activation = max(min(activation, 1.0), -1.0)
        activation_values.append(activation)
    
    # Create the episode
    episode = episodic_pb2.Episode(
        id=str(uuid.uuid4()),
        sequence_id=sequence_id,
        timestamp=timestamp.isoformat(),
        metadata=json.dumps({
            "source": "loadgen",
            "worker_id": worker_id,
            "timestamp": timestamp.isoformat(),
            "sequence_position": sequence_id,
            "generated": True,
            "test": True
        })
    )
    
    # Add concepts and activations
    for concept_id, activation in zip(concept_ids, activation_values):
        episode.activations.append(
            episodic_pb2.ConceptActivation(
                concept_id=concept_id,
                activation_value=activation
            )
        )
    
    return episode


class LoadGenerator:
    """Load generator class for creating sustained load."""
    
    def __init__(self, host, port, rate, duration, workers, concept_count, verbose):
        """Initialize the load generator."""
        self.host = host
        self.port = port
        self.rate = rate
        self.duration = duration
        self.workers = workers
        self.concept_count = concept_count
        self.verbose = verbose
        
        # Initialize counters
        self.episode_count = 0
        self.success_count = 0
        self.error_count = 0
        self.start_time = None
        self.end_time = None
        
        # Threading control
        self.running = False
        self.lock = threading.Lock()
        self.workers_running = 0
        
        # Sequence counter
        self.sequence_counter = int(time.time() * 1000)  # Start with current timestamp
        
    def get_next_sequence_id(self):
        """Get the next sequence ID in a thread-safe way."""
        with self.lock:
            seq_id = self.sequence_counter
            self.sequence_counter += 1
            return seq_id
            
    def increment_counters(self, success):
        """Increment counters in a thread-safe way."""
        with self.lock:
            self.episode_count += 1
            if success:
                self.success_count += 1
            else:
                self.error_count += 1
    
    def worker_thread(self, worker_id):
        """Worker thread that sends episodes at the specified rate."""
        # Calculate per-worker rate and sleep time
        worker_rate = self.rate / self.workers
        sleep_time = 1.0 / worker_rate if worker_rate > 0 else 1.0
        
        # Create gRPC channel and stub
        address = f"{self.host}:{self.port}"
        with grpc.insecure_channel(address) as channel:
            stub = episodic_pb2_grpc.EpisodicVaultStub(channel)
            
            # Track worker start time
            worker_start = time.time()
            local_count = 0
            
            # Mark worker as running
            with self.lock:
                self.workers_running += 1
            
            try:
                # Run until stop signal or duration exceeded
                while self.running:
                    # Check if duration exceeded
                    if self.duration and time.time() - self.start_time >= self.duration:
                        break
                    
                    # Get next sequence ID
                    seq_id = self.get_next_sequence_id()
                    
                    # Create and send episode
                    episode = create_episode(seq_id, worker_id, self.concept_count)
                    
                    try:
                        # Send the episode
                        response = stub.PutEpisode(episode)
                        success = response.success
                        
                        # Update counters
                        self.increment_counters(success)
                        local_count += 1
                        
                        # Print worker status if verbose
                        if self.verbose and local_count % 10 == 0:
                            worker_elapsed = time.time() - worker_start
                            worker_rate_achieved = local_count / worker_elapsed if worker_elapsed > 0 else 0
                            print(f"Worker {worker_id}: Sent {local_count} episodes - "
                                 f"Rate: {worker_rate_achieved:.2f} eps")
                        
                    except grpc.RpcError as e:
                        print(f"Worker {worker_id} RPC error: {e.code()}: {e.details()}")
                        self.increment_counters(False)
                    
                    # Sleep until next episode
                    time.sleep(sleep_time)
            
            finally:
                # Mark worker as stopped
                with self.lock:
                    self.workers_running -= 1
                    
                print(f"Worker {worker_id} finished - Sent {local_count} episodes")
    
    def print_stats(self):
        """Print current statistics."""
        current_time = time.time()
        elapsed = current_time - self.start_time
        
        # Calculate rates
        overall_rate = self.episode_count / elapsed if elapsed > 0 else 0
        success_rate = self.success_count / self.episode_count * 100 if self.episode_count > 0 else 0
        
        # Calculate ETA if duration specified
        if self.duration:
            remaining = max(0, self.duration - elapsed)
            eta = datetime.now() + timedelta(seconds=remaining)
            eta_str = eta.strftime("%Y-%m-%d %H:%M:%S")
        else:
            eta_str = "N/A"
            
        # Print stats
        print(f"\n--- Load Generator Statistics ---")
        print(f"Runtime: {elapsed:.1f}s / {self.duration}s")
        print(f"ETA: {eta_str}")
        print(f"Episodes sent: {self.episode_count}")
        print(f"Successful: {self.success_count} ({success_rate:.1f}%)")
        print(f"Errors: {self.error_count}")
        print(f"Current rate: {overall_rate:.2f} eps (target: {self.rate:.2f})")
        print(f"Active workers: {self.workers_running} / {self.workers}")
        print("--------------------------------\n")
    
    def stats_thread(self):
        """Thread that periodically prints statistics."""
        while self.running:
            # Sleep for 10 seconds
            time.sleep(10)
            
            # Print stats if still running
            if self.running:
                self.print_stats()
    
    def run(self):
        """Run the load generator."""
        self.running = True
        self.start_time = time.time()
        
        print(f"Starting load generator - target {self.rate:.1f} eps using {self.workers} workers")
        print(f"Host: {self.host}:{self.port}")
        print(f"Duration: {timedelta(seconds=self.duration)}")
        print(f"Concept count: {self.concept_count}")
        print("Press Ctrl+C to stop\n")
        
        # Start stats thread
        stats_thread = threading.Thread(target=self.stats_thread)
        stats_thread.daemon = True
        stats_thread.start()
        
        # Start worker threads
        with ThreadPoolExecutor(max_workers=self.workers) as executor:
            # Submit worker tasks
            futures = [
                executor.submit(self.worker_thread, i)
                for i in range(self.workers)
            ]
            
            try:
                # Wait for all workers to complete or timeout
                if self.duration:
                    # Calculate timeout with a margin
                    timeout = self.duration + 10
                    for future in futures:
                        future.result(timeout=timeout)
                else:
                    # Wait indefinitely
                    for future in futures:
                        future.result()
            
            except KeyboardInterrupt:
                print("\nLoad generator stopped by user")
            
            finally:
                # Signal all threads to stop
                self.running = False
                
                # Print final stats
                self.end_time = time.time()
                final_elapsed = self.end_time - self.start_time
                
                print("\n--- Final Statistics ---")
                print(f"Total runtime: {final_elapsed:.2f} seconds")
                print(f"Episodes sent: {self.episode_count}")
                print(f"Successful: {self.success_count} "
                     f"({self.success_count / self.episode_count * 100:.1f}% if self.episode_count > 0 else 0}%)")
                print(f"Errors: {self.error_count}")
                
                if final_elapsed > 0:
                    print(f"Average rate: {self.episode_count / final_elapsed:.2f} eps")
                
                print("-------------------------")
        
        return self.success_count, self.episode_count


def main():
    """Parse arguments and run the load generator."""
    parser = argparse.ArgumentParser(description="Load generator for TORI Memory System")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Host address")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port number")
    parser.add_argument("--rate", type=float, default=DEFAULT_RATE, 
                        help="Episodes per second to generate")
    parser.add_argument("--duration", type=int, default=DEFAULT_DURATION, 
                        help="Duration in seconds (default: 24 hours)")
    parser.add_argument("--workers", type=int, default=DEFAULT_WORKERS, 
                        help="Number of worker threads")
    parser.add_argument("--concept-count", type=int, default=DEFAULT_CONCEPT_COUNT,
                        help="Number of concepts per episode")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    # Create and run load generator
    generator = LoadGenerator(
        args.host,
        args.port,
        args.rate,
        args.duration,
        args.workers,
        args.concept_count,
        args.verbose
    )
    
    success_count, total_count = generator.run()
    
    # Return appropriate exit code
    sys.exit(0 if success_count == total_count else 1)


if __name__ == "__main__":
    main()
