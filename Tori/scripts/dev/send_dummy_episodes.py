#!/usr/bin/env python
"""
Generate and send dummy episodes to the EpisodicVault service.
Used for testing the memory consolidation pipeline.
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


def create_dummy_episode(sequence_id, concept_count=100, activation_range=(-1.0, 1.0)):
    """Create a dummy episode with random concept activations."""
    # Create a timestamp slightly in the past
    timestamp = datetime.now() - timedelta(minutes=sequence_id % 60)
    
    # Generate random concept activations
    concept_ids = list(range(1, concept_count + 1))
    activation_values = np.random.uniform(
        activation_range[0], activation_range[1], size=concept_count
    ).tolist()
    
    # Create the episode
    episode = episodic_pb2.Episode(
        id=str(uuid.uuid4()),
        sequence_id=sequence_id,
        timestamp=timestamp.isoformat(),
        metadata=json.dumps({
            "source": "test_generator",
            "batch": "dummy_batch",
            "sequence_position": sequence_id,
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


def send_episodes(host, port, count, verbose=False):
    """Send dummy episodes to the EpisodicVault service."""
    address = f"{host}:{port}"
    
    # Create a gRPC channel
    with grpc.insecure_channel(address) as channel:
        # Create a stub (client)
        stub = episodic_pb2_grpc.EpisodicVaultStub(channel)
        
        # Send episodes
        success_count = 0
        start_time = time.time()
        
        for i in range(count):
            try:
                # Create a dummy episode
                episode = create_dummy_episode(i)
                
                # Send the episode
                response = stub.PutEpisode(episode)
                
                if verbose:
                    print(f"Episode {i+1}/{count} sent: {response.success}")
                
                if response.success:
                    success_count += 1
                    
            except grpc.RpcError as e:
                print(f"RPC error: {e.code()}: {e.details()}")
                break
        
        elapsed_time = time.time() - start_time
        
        # Print summary
        print(f"\nSent {success_count}/{count} episodes in {elapsed_time:.2f} seconds.")
        if count > 0:
            print(f"Average rate: {count / elapsed_time:.2f} episodes/second")
            if success_count > 0:
                print(f"Success rate: {success_count / count * 100:.1f}%")
        
        return success_count


def main():
    """Parse arguments and send episodes."""
    parser = argparse.ArgumentParser(description="Send dummy episodes to EpisodicVault")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Host address")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port number")
    parser.add_argument(
        "-n", "--count", type=int, default=10, help="Number of episodes to send"
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    print(f"Sending {args.count} dummy episodes to {args.host}:{args.port}...")
    
    success_count = send_episodes(args.host, args.port, args.count, args.verbose)
    
    # Return appropriate exit code
    sys.exit(0 if success_count == args.count else 1)


if __name__ == "__main__":
    main()
