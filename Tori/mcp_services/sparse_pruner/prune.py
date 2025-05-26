#!/usr/bin/env python
"""
Pruning script for the SparsePruner service.
Used to manually trigger graph pruning operations with optional dry-run support.
"""

import argparse
import grpc
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from tabulate import tabulate

# Add the project root to sys.path to import proto modules
sys.path.append(str(Path(__file__).parents[2]))

try:
    from mcp_services.sparse_pruner.proto import sparse_pruner_pb2, sparse_pruner_pb2_grpc
except ImportError:
    print("Error: Proto modules not found. Run 'make proto' first.")
    sys.exit(1)

# Constants
DEFAULT_HOST = "localhost"
DEFAULT_PORT = 50053


def trigger_pruning(host, port, dry_run=False, threshold=None, target_sparsity=None, 
                   backup=True, verbose=False, visualize=False):
    """Trigger a pruning operation in the SparsePruner service."""
    address = f"{host}:{port}"
    
    # Create a gRPC channel
    with grpc.insecure_channel(address) as channel:
        # Create a stub (client)
        stub = sparse_pruner_pb2_grpc.SparsePrunerStub(channel)
        
        # Prepare the request
        request = sparse_pruner_pb2.PruningRequest(
            dry_run=dry_run,
            create_backup=backup
        )
        
        # Set optional parameters if provided
        if threshold is not None:
            request.threshold = threshold
        if target_sparsity is not None:
            request.target_sparsity = target_sparsity
        
        try:
            # First, preview the pruning impact
            if verbose or dry_run:
                preview_request = sparse_pruner_pb2.PreviewRequest(
                    threshold=threshold if threshold is not None else 0.0,
                    target_sparsity=target_sparsity if target_sparsity is not None else 0.0
                )
                
                preview = stub.PreviewPruning(preview_request)
                
                print("\nPruning Preview:")
                print(f"Total edges: {preview.total_edges}")
                print(f"Prunable edges: {preview.prunable_edges} ({preview.prunable_percentage:.2f}%)")
                print(f"Estimated quality impact: {preview.estimated_quality_impact:.4f}")
                
                if preview.prunable_edges > 0 and preview.prunable_details:
                    try:
                        details = json.loads(preview.prunable_details)
                        if verbose and details.get('edge_types'):
                            print("\nPrunable edges by type:")
                            edge_types = []
                            for edge_type, count in details['edge_types'].items():
                                edge_types.append([edge_type, count, f"{count/preview.prunable_edges*100:.1f}%"])
                            print(tabulate(edge_types, headers=["Edge Type", "Count", "Percentage"]))
                    except json.JSONDecodeError:
                        pass
            
            # Only proceed with actual pruning if not a dry run or user confirms
            if dry_run:
                print("\nDRY RUN - No changes were made.")
                return True
            
            # Send the pruning request
            print("\nTriggering pruning operation...")
            start_time = time.time()
            response = stub.TriggerPruning(request)
            elapsed_time = time.time() - start_time
            
            # Process response
            if response.success:
                print(f"Pruning operation completed in {elapsed_time:.2f}s")
                print(f"Pruning job ID: {response.pruning_id}")
                print(f"Edges pruned: {response.edges_pruned}")
                print(f"Quality impact: {response.quality_impact:.4f}")
                
                if response.backup_path:
                    print(f"Backup created at: {response.backup_path}")
                
                if verbose and response.details:
                    try:
                        details = json.loads(response.details)
                        print("\nPruning Details:")
                        for key, value in details.items():
                            if key != "edge_types":
                                print(f"  {key}: {value}")
                    except json.JSONDecodeError:
                        print(f"Details: {response.details}")
                
                # If requested, generate visualization
                if visualize and not dry_run:
                    try:
                        viz_request = sparse_pruner_pb2.VisualizationRequest(
                            pruning_id=response.pruning_id,
                            include_weights=True,
                            include_pruned=True
                        )
                        viz_response = stub.GetPruningVisualization(viz_request)
                        
                        if viz_response.success and viz_response.visualization_path:
                            print(f"\nVisualization generated at: {viz_response.visualization_path}")
                        else:
                            print("\nFailed to generate visualization")
                    except grpc.RpcError as e:
                        print(f"Error generating visualization: {e.details()}")
                
            else:
                print(f"Failed to trigger pruning: {response.message}")
                return False
                
            return response.success
            
        except grpc.RpcError as e:
            print(f"RPC error: {e.code()}: {e.details()}")
            return False


def main():
    """Parse arguments and trigger pruning."""
    parser = argparse.ArgumentParser(description="Trigger SparsePruner pruning operation")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Host address")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port number")
    parser.add_argument("--dry-run", action="store_true", 
                        help="Preview pruning without making changes")
    parser.add_argument("--threshold", type=float, 
                        help="Override the default weight threshold for pruning")
    parser.add_argument("--target-sparsity", type=float, 
                        help="Target sparsity ratio (0.0-1.0)")
    parser.add_argument("--no-backup", action="store_true", 
                        help="Skip creating a backup before pruning")
    parser.add_argument("--visualize", action="store_true", 
                        help="Generate graph visualization")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    print(f"Connecting to SparsePruner at {args.host}:{args.port}...")
    
    success = trigger_pruning(
        args.host, 
        args.port, 
        dry_run=args.dry_run,
        threshold=args.threshold,
        target_sparsity=args.target_sparsity,
        backup=not args.no_backup,
        verbose=args.verbose,
        visualize=args.visualize
    )
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
