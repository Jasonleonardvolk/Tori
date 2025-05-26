#!/usr/bin/env python
"""
Command-line interface for the EpisodicVault service.
Used for testing and interacting with the vault.
"""

import argparse
import grpc
import json
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from tabulate import tabulate

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


def put_get_loop(host, port, count=50, verbose=False):
    """Run a put-get loop test for the EpisodicVault service."""
    address = f"{host}:{port}"
    
    # Create a gRPC channel
    with grpc.insecure_channel(address) as channel:
        # Create a stub (client)
        stub = episodic_pb2_grpc.EpisodicVaultStub(channel)
        
        print(f"Running put-get loop test with {count} episodes...")
        
        # Stats
        total_put_time = 0
        total_get_time = 0
        put_latencies = []
        get_latencies = []
        success_count = 0
        episode_ids = []
        
        # Put phase
        print("\nPHASE 1: PUT EPISODES")
        start_time = time.time()
        
        for i in range(count):
            # Create a simple episode
            episode = episodic_pb2.Episode(
                id=f"test-{int(time.time() * 1000)}-{i}",
                sequence_id=i,
                timestamp=datetime.now().isoformat(),
                metadata=json.dumps({
                    "source": "vault-cli",
                    "test_type": "put-get-loop",
                    "index": i
                })
            )
            
            # Add a few concept activations
            for j in range(10):
                episode.activations.append(
                    episodic_pb2.ConceptActivation(
                        concept_id=j + 1,
                        activation_value=0.5 if j % 2 == 0 else -0.5
                    )
                )
            
            try:
                # Measure put latency
                put_start = time.time()
                response = stub.PutEpisode(episode)
                put_end = time.time()
                put_latency = (put_end - put_start) * 1000  # ms
                
                total_put_time += put_latency
                put_latencies.append(put_latency)
                
                if response.success:
                    success_count += 1
                    episode_ids.append(episode.id)
                    
                    if verbose:
                        print(f"Episode {i+1}/{count} stored: {episode.id} ({put_latency:.2f} ms)")
                else:
                    print(f"Failed to store episode {i+1}: {response.message}")
                
            except grpc.RpcError as e:
                print(f"RPC error during PUT: {e.code()}: {e.details()}")
        
        # Calculate put statistics
        put_elapsed = time.time() - start_time
        avg_put_latency = total_put_time / count if count > 0 else 0
        p50_put = sorted(put_latencies)[count // 2] if put_latencies else 0
        p95_put = sorted(put_latencies)[int(count * 0.95)] if put_latencies else 0
        
        # Print put statistics
        print(f"\nPut phase completed in {put_elapsed:.2f} seconds")
        print(f"Success rate: {success_count}/{count} ({success_count/count*100:.1f}%)")
        print(f"Average put latency: {avg_put_latency:.2f} ms")
        print(f"p50 latency: {p50_put:.2f} ms")
        print(f"p95 latency: {p95_put:.2f} ms")
        
        # Get phase
        print("\nPHASE 2: GET EPISODES")
        start_time = time.time()
        
        get_success = 0
        for i, episode_id in enumerate(episode_ids):
            try:
                # Create get request
                request = episodic_pb2.EpisodeRequest(id=episode_id)
                
                # Measure get latency
                get_start = time.time()
                response = stub.GetEpisode(request)
                get_end = time.time()
                get_latency = (get_end - get_start) * 1000  # ms
                
                total_get_time += get_latency
                get_latencies.append(get_latency)
                
                if response.success:
                    get_success += 1
                    
                    if verbose:
                        print(f"Episode {i+1}/{len(episode_ids)} retrieved: {episode_id} ({get_latency:.2f} ms)")
                else:
                    print(f"Failed to retrieve episode {episode_id}: {response.message}")
                
            except grpc.RpcError as e:
                print(f"RPC error during GET: {e.code()}: {e.details()}")
        
        # Calculate get statistics
        get_elapsed = time.time() - start_time
        avg_get_latency = total_get_time / len(episode_ids) if episode_ids else 0
        p50_get = sorted(get_latencies)[len(get_latencies) // 2] if get_latencies else 0
        p95_get = sorted(get_latencies)[int(len(get_latencies) * 0.95)] if get_latencies else 0
        
        # Print get statistics
        print(f"\nGet phase completed in {get_elapsed:.2f} seconds")
        print(f"Success rate: {get_success}/{len(episode_ids)} ({get_success/len(episode_ids)*100 if episode_ids else 0:.1f}%)")
        print(f"Average get latency: {avg_get_latency:.2f} ms")
        print(f"p50 latency: {p50_get:.2f} ms")
        print(f"p95 latency: {p95_get:.2f} ms")
        
        # Final summary
        print("\nTEST SUMMARY:")
        print(f"Total episodes: {count}")
        print(f"Put success rate: {success_count}/{count} ({success_count/count*100:.1f}%)")
        print(f"Get success rate: {get_success}/{len(episode_ids)} ({get_success/len(episode_ids)*100 if episode_ids else 0:.1f}%)")
        print(f"p50 latency (put/get): {p50_put:.2f}/{p50_get:.2f} ms")
        print(f"p95 latency (put/get): {p95_put:.2f}/{p95_get:.2f} ms")
        
        # Test outcome
        success = success_count == count and get_success == len(episode_ids)
        if success:
            print("\nPut-Get Loop Test: SUCCESS")
        else:
            print("\nPut-Get Loop Test: FAILURE")
            
        return success


def list_episodes(host, port, limit=10, verbose=False):
    """List recent episodes from the EpisodicVault service."""
    address = f"{host}:{port}"
    
    # Create a gRPC channel
    with grpc.insecure_channel(address) as channel:
        # Create a stub (client)
        stub = episodic_pb2_grpc.EpisodicVaultStub(channel)
        
        print(f"Retrieving {limit} most recent episodes...")
        
        try:
            # Create list request
            request = episodic_pb2.ListRequest(
                limit=limit,
                offset=0
            )
            
            # Send request
            start_time = time.time()
            response = stub.ListRecent(request)
            elapsed = time.time() - start_time
            
            # Process response
            if response.success:
                print(f"Retrieved {len(response.episodes)} episodes in {elapsed*1000:.2f} ms")
                print(f"Total episodes in vault: {response.total}")
                
                if response.episodes:
                    # Create a table of episodes
                    episode_table = []
                    for episode in response.episodes:
                        # Parse timestamp
                        try:
                            ts = datetime.fromisoformat(episode.timestamp)
                            ts_str = ts.strftime("%Y-%m-%d %H:%M:%S")
                        except (ValueError, TypeError):
                            ts_str = episode.timestamp
                            
                        # Parse metadata
                        source = "unknown"
                        try:
                            meta = json.loads(episode.metadata) if episode.metadata else {}
                            source = meta.get("source", "unknown")
                        except json.JSONDecodeError:
                            pass
                            
                        # Add to table
                        episode_table.append([
                            episode.id[:8] + "...",
                            episode.sequence_id,
                            ts_str,
                            source,
                            len(episode.activations)
                        ])
                    
                    # Print table
                    print("\nRecent Episodes:")
                    print(tabulate(
                        episode_table,
                        headers=["ID", "Sequence", "Timestamp", "Source", "Concepts"]
                    ))
                else:
                    print("No episodes found in the vault.")
            else:
                print(f"Failed to list episodes: {response.message}")
                return False
            
            # Print word count (line count)
            if verbose:
                print(f"\nwc -l output: {len(response.episodes)}")
                
            return True
            
        except grpc.RpcError as e:
            print(f"RPC error: {e.code()}: {e.details()}")
            return False


def stats(host, port):
    """Get vault statistics."""
    address = f"{host}:{port}"
    
    # Create a gRPC channel
    with grpc.insecure_channel(address) as channel:
        # Create a stub (client)
        stub = episodic_pb2_grpc.EpisodicVaultStub(channel)
        
        print("Retrieving vault statistics...")
        
        try:
            # Create stats request
            request = episodic_pb2.StatsRequest()
            
            # Send request
            response = stub.GetStats(request)
            
            # Process response
            if response.success:
                print("\nVault Statistics:")
                print(f"Total episodes: {response.total_episodes}")
                print(f"Storage size: {response.storage_size_mb:.2f} MB")
                print(f"Average episode size: {response.avg_episode_size_kb:.2f} KB")
                print(f"Oldest episode: {response.oldest_episode_timestamp}")
                print(f"Newest episode: {response.newest_episode_timestamp}")
                
                # Additional statistics
                if response.stats_json:
                    try:
                        stats = json.loads(response.stats_json)
                        if "source_distribution" in stats:
                            print("\nSource Distribution:")
                            sources = []
                            for source, count in stats["source_distribution"].items():
                                sources.append([source, count, f"{count/response.total_episodes*100:.1f}%"])
                            print(tabulate(sources, headers=["Source", "Count", "Percentage"]))
                    except json.JSONDecodeError:
                        pass
                
                return True
            else:
                print(f"Failed to get stats: {response.message}")
                return False
            
        except grpc.RpcError as e:
            print(f"RPC error: {e.code()}: {e.details()}")
            return False


def main():
    """Parse arguments and run specified command."""
    parser = argparse.ArgumentParser(description="EpisodicVault CLI")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Host address")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port number")
    
    # Commands
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Put-get loop command
    put_get_parser = subparsers.add_parser("put-get-loop", help="Run put-get loop test")
    put_get_parser.add_argument("count", type=int, nargs="?", default=50, 
                               help="Number of episodes to test")
    put_get_parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    
    # List command
    list_parser = subparsers.add_parser("list", help="List recent episodes")
    list_parser.add_argument("limit", type=int, nargs="?", default=10, 
                            help="Maximum number of episodes to list")
    list_parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    
    # Stats command
    subparsers.add_parser("stats", help="Get vault statistics")
    
    args = parser.parse_args()
    
    # Run the specified command
    if args.command == "put-get-loop":
        success = put_get_loop(args.host, args.port, args.count, args.verbose)
    elif args.command == "list":
        success = list_episodes(args.host, args.port, args.limit, args.verbose)
    elif args.command == "stats":
        success = stats(args.host, args.port)
    else:
        parser.print_help()
        success = False
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
