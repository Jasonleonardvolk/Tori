#!/usr/bin/env python
"""
Trigger script for the SleepScheduler service.
Used to manually initiate memory consolidation cycles.
"""

import argparse
import grpc
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# Add the project root to sys.path to import proto modules
sys.path.append(str(Path(__file__).parents[2]))

try:
    from mcp_services.sleep_scheduler.proto import sleep_scheduler_pb2, sleep_scheduler_pb2_grpc
except ImportError:
    print("Error: Proto modules not found. Run 'make proto' first.")
    sys.exit(1)

# Constants
DEFAULT_HOST = "localhost"
DEFAULT_PORT = 50052


def trigger_consolidation(host, port, once=False, verbose=False, max_episodes=100, wait_for_completion=False):
    """Trigger a consolidation cycle in the SleepScheduler service."""
    address = f"{host}:{port}"
    
    # Create a gRPC channel
    with grpc.insecure_channel(address) as channel:
        # Create a stub (client)
        stub = sleep_scheduler_pb2_grpc.SleepSchedulerStub(channel)
        
        # Prepare the request
        request = sleep_scheduler_pb2.ConsolidationRequest(
            max_episodes=max_episodes,
            once=once,
            wait_for_completion=wait_for_completion
        )
        
        try:
            # Send the request
            start_time = time.time()
            response = stub.StartConsolidation(request)
            elapsed_time = time.time() - start_time
            
            # Process response
            if response.success:
                print(f"Consolidation triggered successfully in {elapsed_time:.2f}s")
                print(f"Consolidation ID: {response.consolidation_id}")
                
                if response.energy_delta != 0:
                    print(f"Energy change: ΔE={response.energy_delta:.2f}")
                
                print(f"Episodes processed: {response.episodes_processed}")
                
                if verbose:
                    if response.details:
                        details = json.loads(response.details)
                        print("\nConsolidation Details:")
                        for key, value in details.items():
                            print(f"  {key}: {value}")
                
                # If waiting for completion and it's done
                if wait_for_completion and response.status == sleep_scheduler_pb2.ConsolidationStatus.COMPLETED:
                    print("\nConsolidation completed")
                    print(f"Total time: {elapsed_time:.2f}s")
                    
            else:
                print(f"Failed to trigger consolidation: {response.message}")
                return False
            
            # If waiting for completion but it's not done yet, poll for status
            if wait_for_completion and response.status == sleep_scheduler_pb2.ConsolidationStatus.RUNNING:
                poll_status(stub, response.consolidation_id, verbose)
                
            return response.success
            
        except grpc.RpcError as e:
            print(f"RPC error: {e.code()}: {e.details()}")
            return False


def poll_status(stub, consolidation_id, verbose=False):
    """Poll for consolidation status until completion."""
    print("\nWaiting for consolidation to complete...")
    
    status_request = sleep_scheduler_pb2.StatusRequest(
        consolidation_id=consolidation_id
    )
    
    start_time = time.time()
    completed = False
    
    while not completed:
        try:
            time.sleep(1)  # Poll every second
            status_response = stub.GetConsolidationStatus(status_request)
            
            if verbose:
                print(f"Status: {status_response.status_str}")
                
            # Check if completed
            if status_response.status in [
                sleep_scheduler_pb2.ConsolidationStatus.COMPLETED,
                sleep_scheduler_pb2.ConsolidationStatus.FAILED,
                sleep_scheduler_pb2.ConsolidationStatus.CANCELLED
            ]:
                completed = True
                elapsed_time = time.time() - start_time
                
                if status_response.status == sleep_scheduler_pb2.ConsolidationStatus.COMPLETED:
                    print(f"\nConsolidation completed in {elapsed_time:.2f}s")
                    print(f"Energy change: ΔE={status_response.energy_delta:.2f}")
                else:
                    print(f"\nConsolidation ended with status: {status_response.status_str}")
                    
        except grpc.RpcError as e:
            print(f"RPC error while polling: {e.code()}: {e.details()}")
            completed = True


def main():
    """Parse arguments and trigger consolidation."""
    parser = argparse.ArgumentParser(description="Trigger SleepScheduler consolidation")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Host address")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port number")
    parser.add_argument("--once", action="store_true", help="Run only once and exit")
    parser.add_argument("--max-episodes", type=int, default=100, 
                        help="Maximum number of episodes to process")
    parser.add_argument("--wait", action="store_true", 
                        help="Wait for consolidation to complete")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    print(f"Triggering consolidation on {args.host}:{args.port}...")
    
    success = trigger_consolidation(
        args.host, 
        args.port, 
        once=args.once,
        verbose=args.verbose,
        max_episodes=args.max_episodes,
        wait_for_completion=args.wait
    )
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
