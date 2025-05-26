#!/usr/bin/env python
"""
Feed generator script for simulating continuous episode input to the TORI Memory System.
This script continuously sends dummy episodes to the EpisodicVault service at a specified rate.
"""

import argparse
import grpc
import json
import numpy as np
import os
import sys
import time
import uuid
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
DEFAULT_RATE = 0.5  # Episodes per second


def create_episode(sequence_id, concept_count=100, activation_range=(-1.0, 1.0)):
    """Create a dummy episode with random concept activations."""
    # Create a timestamp slightly in the past
    timestamp = datetime.now() - timedelta(milliseconds=100)
    
    # Generate random concept activations with some structure
    concept_ids = list(range(1, concept_count + 1))
    
    # Use sine waves with different phases to create structured activations
    t = sequence_id % 1000 / 100  # Time parameter cycling every 1000 episodes
    
    activation_values = []
    for i in range(concept_count):
        # Different concepts have different oscillation patterns
        freq = 0.1 + (i % 10) * 0.02
        phase = (i % 5) * 0.2 * np.pi
        
        # Combine different oscillations with some noise
        activation = 0.6 * np.sin(freq * t + phase) + 0.2 * np.cos(freq * 2 * t)
        activation += np.random.normal(0, 0.1)
        
        # Clip to activation range
        activation = max(min(activation, activation_range[1]), activation_range[0])
        activation_values.append(activation)
    
    # Create the episode
    episode = episodic_pb2.Episode(
        id=str(uuid.uuid4()),
        sequence_id=sequence_id,
        timestamp=timestamp.isoformat(),
        metadata=json.dumps({
            "source": "feedgen",
            "timestamp": timestamp.isoformat(),
            "sequence_position": sequence_id,
            "generated": True
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


def run_feed_generator(host, port, rate=DEFAULT_RATE, max_episodes=None, verbose=False):
    """Generate and send episodes continuously at the specified rate."""
    address = f"{host}:{port}"
    
    # Create a gRPC channel
    with grpc.insecure_channel(address) as channel:
        # Create a stub (client)
        stub = episodic_pb2_grpc.EpisodicVaultStub(channel)
        
        print(f"Starting feed generator - sending episodes at {rate:.2f} eps to {host}:{port}")
        print("Press Ctrl+C to stop")
        
        # Calculate sleep time between episodes
        sleep_time = 1.0 / rate if rate > 0 else 1.0
        
        # Track statistics
        start_time = time.time()
        episode_count = 0
        success_count = 0
        sequence_id = int(time.time() * 1000)  # Use timestamp for sequence_id
        
        try:
            while max_episodes is None or episode_count < max_episodes:
                # Create and send episode
                episode = create_episode(sequence_id)
                
                try:
                    # Send the episode
                    response = stub.PutEpisode(episode)
                    
                    # Update counters
                    episode_count += 1
                    if response.success:
                        success_count += 1
                    
                    # Print status
                    if verbose:
                        print(f"Episode {episode_count} sent: {response.success}")
                    elif episode_count % 10 == 0:
                        elapsed = time.time() - start_time
                        rate_achieved = episode_count / elapsed if elapsed > 0 else 0
                        print(f"Sent {episode_count} episodes ({success_count} successful) - "
                              f"Rate: {rate_achieved:.2f} eps")
                    
                except grpc.RpcError as e:
                    print(f"RPC error: {e.code()}: {e.details()}")
                    # Continue despite errors
                
                # Increment sequence_id for next episode
                sequence_id += 1
                
                # Sleep until next episode
                time.sleep(sleep_time)
                
        except KeyboardInterrupt:
            print("\nFeed generator stopped by user")
        
        # Print final stats
        elapsed_time = time.time() - start_time
        print(f"\nSent {episode_count} episodes in {elapsed_time:.2f} seconds.")
        if episode_count > 0:
            print(f"Average rate: {episode_count / elapsed_time:.2f} episodes/second")
            print(f"Success rate: {success_count / episode_count * 100:.1f}%")
        
        return success_count, episode_count


def main():
    """Parse arguments and run the feed generator."""
    parser = argparse.ArgumentParser(description="Episode feed generator for TORI Memory System")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Host address")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port number")
    parser.add_argument("--rate", type=float, default=DEFAULT_RATE, 
                        help="Episodes per second to generate")
    parser.add_argument("--max", type=int, help="Maximum number of episodes to send (default: unlimited)")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    success_count, total_count = run_feed_generator(
        args.host, 
        args.port, 
        rate=args.rate,
        max_episodes=args.max,
        verbose=args.verbose
    )
    
    # Return appropriate exit code
    sys.exit(0 if success_count == total_count else 1)


if __name__ == "__main__":
    main()
