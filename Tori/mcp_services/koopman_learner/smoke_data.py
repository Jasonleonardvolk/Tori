#!/usr/bin/env python
"""
Smoke test script for the KoopmanLearner service.
Used to validate spectral mode extraction and verify service functionality.
"""

import argparse
import grpc
import json
import numpy as np
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from tabulate import tabulate

# Add the project root to sys.path to import proto modules
sys.path.append(str(Path(__file__).parents[2]))

try:
    from mcp_services.koopman_learner.proto import koopman_learner_pb2, koopman_learner_pb2_grpc
except ImportError:
    print("Error: Proto modules not found. Run 'make proto' first.")
    sys.exit(1)

# Constants
DEFAULT_HOST = "localhost"
DEFAULT_PORT = 50054
DEFAULT_CONCEPT_COUNT = 200
DEFAULT_TRACE_LENGTH = 100


def generate_synthetic_data(concept_count=DEFAULT_CONCEPT_COUNT, trace_length=DEFAULT_TRACE_LENGTH):
    """Generate synthetic concept activation traces for testing."""
    # Create time points
    t = np.linspace(0, 2*np.pi, trace_length)
    
    # Create oscillatory patterns with different frequencies
    traces = []
    for i in range(concept_count):
        # Create a combination of sine waves with different frequencies
        freq1 = 0.5 + (i % 5) * 0.2  # Different frequencies based on concept ID
        freq2 = 0.3 + (i % 7) * 0.15
        
        # Generate the trace with some noise
        trace = 0.7 * np.sin(freq1 * t) + 0.3 * np.cos(freq2 * t)
        trace += np.random.normal(0, 0.05, size=len(t))  # Add noise
        
        # Normalize to [-1, 1]
        max_val = max(abs(trace.min()), abs(trace.max()))
        if max_val > 0:
            trace = trace / max_val
            
        traces.append(trace)
    
    # Convert to batch format: [trace_length, concept_count]
    traces = np.array(traces).T
    
    return traces


def send_synthetic_data(host, port, concept_count=DEFAULT_CONCEPT_COUNT, 
                        trace_length=DEFAULT_TRACE_LENGTH, verbose=False):
    """Send synthetic activation traces to the KoopmanLearner service."""
    address = f"{host}:{port}"
    
    # Create a gRPC channel
    with grpc.insecure_channel(address) as channel:
        # Create a stub (client)
        stub = koopman_learner_pb2_grpc.KoopmanLearnerStub(channel)
        
        # Generate synthetic data
        print(f"Generating synthetic data with {concept_count} concepts, {trace_length} time steps...")
        activation_traces = generate_synthetic_data(concept_count, trace_length)
        
        # Prepare the request
        request = koopman_learner_pb2.ActivationBatch(
            batch_id=f"synthetic-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            concept_count=concept_count,
            trace_length=trace_length,
            metadata=json.dumps({
                "source": "smoke_test",
                "synthetic": True,
                "timestamp": datetime.now().isoformat()
            })
        )
        
        # Add activation traces
        for t in range(trace_length):
            trace = koopman_learner_pb2.ActivationTrace(
                timestamp=datetime.now().isoformat(),
                sequence_position=t
            )
            
            # Add concept activations for this time step
            for c in range(concept_count):
                trace.activations.append(
                    koopman_learner_pb2.ConceptActivation(
                        concept_id=c + 1,  # 1-indexed concepts
                        activation_value=float(activation_traces[t, c])
                    )
                )
            
            request.traces.append(trace)
        
        try:
            # Send the activation batch
            print(f"Sending activation batch to {host}:{port}...")
            start_time = time.time()
            response = stub.ProcessActivationBatch(request)
            elapsed_time = time.time() - start_time
            
            # Process response
            if response.success:
                print(f"Activation batch processed successfully in {elapsed_time:.2f}s")
                print(f"Batch ID: {response.batch_id}")
                print(f"Modes extracted: {response.modes_extracted}")
                print(f"Total modes: {response.total_modes}")
                
                if verbose and response.details:
                    try:
                        details = json.loads(response.details)
                        print("\nProcessing Details:")
                        for key, value in details.items():
                            if key != "eigenvalues":
                                print(f"  {key}: {value}")
                    except json.JSONDecodeError:
                        print(f"Details: {response.details}")
                
                # Get spectral modes to validate
                get_spectral_modes(stub, verbose)
                
            else:
                print(f"Failed to process activation batch: {response.message}")
                return False
                
            return response.success
            
        except grpc.RpcError as e:
            print(f"RPC error: {e.code()}: {e.details()}")
            return False


def get_spectral_modes(stub, verbose=False):
    """Retrieve and display current spectral modes."""
    try:
        # Request current spectral modes
        print("\nRetrieving current spectral modes...")
        request = koopman_learner_pb2.ModesRequest(max_modes=20)
        response = stub.GetSpectralModes(request)
        
        if response.success:
            print(f"Retrieved {len(response.modes)} spectral modes")
            
            if len(response.modes) > 0:
                # Display eigenvalues
                eigenvalues = []
                for mode in response.modes:
                    real = mode.eigenvalue_real
                    imag = mode.eigenvalue_imag
                    mag = (real**2 + imag**2)**0.5
                    phase = np.arctan2(imag, real) if real != 0 else np.pi/2 if imag > 0 else -np.pi/2
                    phase_deg = phase * 180 / np.pi
                    
                    eigenvalues.append([
                        mode.mode_id, 
                        f"{real:.4f} + {imag:.4f}j", 
                        f"{mag:.4f}", 
                        f"{phase_deg:.1f}°",
                        mode.stability,
                        mode.sparsity
                    ])
                
                print("\nEigenvalues (top modes):")
                print(tabulate(
                    eigenvalues, 
                    headers=["Mode ID", "Eigenvalue", "Magnitude", "Phase", "Stability", "Sparsity"]
                ))
                
                # In verbose mode, show concept weights for top mode
                if verbose and len(response.modes) > 0:
                    top_mode = response.modes[0]
                    print(f"\nTop Mode (ID: {top_mode.mode_id}) - Concept Weights:")
                    weights = []
                    for i, weight in enumerate(top_mode.concept_weights[:10]):  # Show top 10 weights
                        weights.append([i+1, weight])
                    print(tabulate(weights, headers=["Concept ID", "Weight"]))
                    
                    if len(top_mode.concept_weights) > 10:
                        print(f"... and {len(top_mode.concept_weights) - 10} more concept weights")
            
            else:
                print("No spectral modes available yet.")
                
        else:
            print(f"Failed to retrieve spectral modes: {response.message}")
            
    except grpc.RpcError as e:
        print(f"RPC error: {e.code()}: {e.details()}")


def main():
    """Parse arguments and send synthetic data."""
    parser = argparse.ArgumentParser(description="Smoke test for KoopmanLearner")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Host address")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port number")
    parser.add_argument("--concept-count", type=int, default=DEFAULT_CONCEPT_COUNT,
                        help="Number of concepts in synthetic data")
    parser.add_argument("--trace-length", type=int, default=DEFAULT_TRACE_LENGTH,
                        help="Number of time steps in synthetic traces")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    print(f"Running smoke test for KoopmanLearner at {args.host}:{args.port}...")
    
    success = send_synthetic_data(
        args.host,
        args.port,
        concept_count=args.concept_count,
        trace_length=args.trace_length,
        verbose=args.verbose
    )
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
