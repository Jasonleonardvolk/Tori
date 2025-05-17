#!/usr/bin/env python3
"""
ELFIN Stability Verification CLI.

This script provides a command-line interface for verifying the stability
of dynamical systems using the ELFIN stability framework.
"""

import os
import sys
import argparse
import logging
import time
import json
import numpy as np
import torch
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("elfin-verify")

# Try to import from current directory, then from installed packages
try:
    from stability_demo import (
        ConstraintType, VerificationStatus, ConstraintIR, VerificationResult,
        SOSVerifier, DynamicsModel, NeuralLyapunovLearner
    )
except ImportError:
    # If not found, try to import from alan_backend module
    try:
        from alan_backend.elfin.stability import (
            ConstraintIR, VerificationResult, VerificationStatus, ConstraintType,
            ProofCache
        )
        from alan_backend.elfin.stability.backends import SOSVerifier
        from alan_backend.elfin.stability.learn_neural_lyap import (
            DynamicsModel, NeuralLyapunovLearner
        )
    except ImportError:
        logger.error("Could not import ELFIN stability modules.")
        logger.error("Make sure you're running this script from the correct directory,")
        logger.error("or that alan_backend is in your PYTHONPATH.")
        sys.exit(1)


def load_dynamics_from_file(filepath: str, function_name: str = "dynamics") -> callable:
    """
    Load a dynamics function from a Python file.
    
    Args:
        filepath: Path to Python file containing dynamics function
        function_name: Name of the dynamics function in the file
        
    Returns:
        The dynamics function
    """
    if not os.path.isfile(filepath):
        raise FileNotFoundError(f"Dynamics file not found: {filepath}")
    
    # Add directory to path to allow imports
    sys.path.insert(0, os.path.dirname(os.path.abspath(filepath)))
    
    # Load module
    module_name = os.path.splitext(os.path.basename(filepath))[0]
    try:
        # Use importlib to load the module
        import importlib.util
        spec = importlib.util.spec_from_file_location(module_name, filepath)
        if spec is None:
            raise ImportError(f"Could not load module spec from {filepath}")
        
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        # Get dynamics function
        if not hasattr(module, function_name):
            raise AttributeError(f"Module {module_name} has no attribute '{function_name}'")
        
        dynamics_fn = getattr(module, function_name)
        return dynamics_fn
        
    except Exception as e:
        logger.error(f"Error loading dynamics function: {e}")
        raise
        

def load_matrix_from_file(filepath: str) -> np.ndarray:
    """
    Load a matrix from a file.
    
    Supports .npy, .npz, .json, and .txt formats.
    
    Args:
        filepath: Path to file containing matrix
        
    Returns:
        Numpy array containing matrix
    """
    if not os.path.isfile(filepath):
        raise FileNotFoundError(f"Matrix file not found: {filepath}")
    
    ext = os.path.splitext(filepath)[1].lower()
    
    if ext == '.npy':
        return np.load(filepath)
    elif ext == '.npz':
        npz = np.load(filepath)
        if len(npz.files) > 0:
            return npz[npz.files[0]]
        else:
            raise ValueError(f"NPZ file {filepath} contains no arrays")
    elif ext == '.json':
        with open(filepath, 'r') as f:
            data = json.load(f)
        return np.array(data)
    elif ext == '.txt' or ext == '.csv':
        return np.loadtxt(filepath, delimiter=',' if ext == '.csv' else None)
    else:
        raise ValueError(f"Unsupported file format: {ext}")


def save_verification_result(result: Dict[str, Any], filepath: str) -> None:
    """
    Save verification result to a file.
    
    Args:
        result: Verification result dictionary
        filepath: Path to save the result
    """
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    
    ext = os.path.splitext(filepath)[1].lower()
    
    if ext == '.json':
        with open(filepath, 'w') as f:
            json.dump(result, f, indent=2)
    elif ext == '.html':
        # Create a simple HTML report
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>ELFIN Stability Verification Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .success {{ color: green; }}
                .failure {{ color: red; }}
                .metric {{ margin-bottom: 10px; }}
                .container {{ max-width: 800px; margin: 0 auto; }}
                table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                tr:nth-child(even) {{ background-color: #f9f9f9; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>ELFIN Stability Verification Report</h1>
                <h2 class="{'success' if result.get('success', False) else 'failure'}">
                    Status: {'VERIFIED' if result.get('success', False) else 'FAILED'}
                </h2>
                
                <h3>Summary</h3>
                <div class="metric">Verification Time: {result.get('verification_time', 0):.3f} seconds</div>
                <div class="metric">System Type: {result.get('system_type', 'Unknown')}</div>
                <div class="metric">Verification Method: {result.get('method', 'Unknown')}</div>
                
                <h3>Detailed Results</h3>
                <table>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                    </tr>
        """
        
        # Add all metrics to the table
        for key, value in result.items():
            if key not in ['success', 'verification_time', 'system_type', 'method']:
                if isinstance(value, (int, float)):
                    value_str = f"{value:.6f}" if isinstance(value, float) else str(value)
                else:
                    value_str = str(value)
                
                html += f"""
                    <tr>
                        <td>{key}</td>
                        <td>{value_str}</td>
                    </tr>
                """
        
        html += """
                </table>
            </div>
        </body>
        </html>
        """
        
        with open(filepath, 'w') as f:
            f.write(html)
    else:
        # Default to JSON
        with open(filepath, 'w') as f:
            json.dump(result, f, indent=2)


def verify_polynomial_lyapunov(args):
    """
    Verify a polynomial Lyapunov function.
    
    Args:
        args: Command-line arguments
    """
    logger.info("Verifying polynomial Lyapunov function...")
    
    # Load Q matrix
    q_matrix = load_matrix_from_file(args.matrix)
    
    # Verify dimensions
    if args.state_dim is not None:
        if q_matrix.shape != (args.state_dim, args.state_dim):
            logger.warning(f"Matrix dimensions {q_matrix.shape} don't match state_dim {args.state_dim}")
            logger.warning("Using matrix dimensions for verification")
    
    # Create variables list
    dim = q_matrix.shape[0]
    variables = [f"x{i}" for i in range(dim)]
    
    # Create constraint
    constraint = ConstraintIR(
        id="lyapunov_verification",
        variables=variables,
        expression="V(x) > 0",
        constraint_type=ConstraintType.POSITIVE,
        context={
            "q_matrix": q_matrix.tolist(),
            "dimension": dim,
            "lyapunov_type": "polynomial"
        },
        solver_hint="sos",
        proof_needed=True
    )
    
    # Create verifier
    verifier = SOSVerifier()
    
    # Verify positive definiteness
    start_time = time.time()
    success, details = verifier.verify_pd(q_matrix)
    verification_time = time.time() - start_time
    
    # Prepare result
    status = VerificationStatus.VERIFIED if success else VerificationStatus.REFUTED
    
    result = {
        "success": success,
        "status": status.name,
        "verification_time": verification_time,
        "system_type": "polynomial",
        "method": "eigenvalue_analysis",
        "matrix_dimensions": q_matrix.shape,
        "state_dimension": dim
    }
    
    # Add certificate/counterexample details
    if success:
        certificate = details.get("certificate", {})
        if "eigenvalues" in certificate:
            # Only include the first few eigenvalues if there are many
            eigenvalues = certificate["eigenvalues"]
            if len(eigenvalues) > 10:
                certificate["eigenvalues"] = eigenvalues[:10] + ["..."]
        
        result.update({
            "certificate_type": certificate.get("type", "unknown"),
            "min_eigenvalue": certificate.get("min_eigenvalue", 0.0)
        })
    else:
        counterexample = details.get("counterexample", {})
        result["counterexample"] = counterexample
    
    # Save result
    if args.output:
        save_verification_result(result, args.output)
        logger.info(f"Verification result saved to {args.output}")
    
    # Print summary
    logger.info(f"Verification result: {status.name}")
    logger.info(f"Verification time: {verification_time:.3f} seconds")
    
    return result


def verify_neural_lyapunov(args):
    """
    Verify a neural Lyapunov function.
    
    Args:
        args: Command-line arguments
    """
    logger.info("Verifying neural Lyapunov function...")
    
    # Load dynamics function
    dynamics_fn = load_dynamics_from_file(args.dynamics, args.function_name)
    
    # Load model if provided
    if args.model:
        logger.info(f"Loading model from {args.model}")
        state_dim = args.state_dim or 2
        
        # Load PyTorch model
        if torch.cuda.is_available() and not args.cpu:
            device = torch.device("cuda")
            logger.info("Using CUDA for verification")
        else:
            device = torch.device("cpu")
            logger.info("Using CPU for verification")
        
        # Create model (simplified placeholder implementation)
        model = torch.load(args.model, map_location=device)
        
        # Create dynamics model
        dynamics = DynamicsModel(
            forward_fn=dynamics_fn,
            input_dim=state_dim
        )
        
        # Create dummy learner just for verification
        learner = NeuralLyapunovLearner(
            dynamics=dynamics,
            state_dim=state_dim,
            hidden_dims=[64, 64],  # Will be overridden by loaded model
            device=str(device)
        )
        
        # Load weights into network
        learner.network.load_state_dict(model)
        
        # Verify with batch verification
        logger.info("Running batch verification...")
        start_time = time.time()
        success, details = learner.verify_around_equilibrium_batched(
            radius=args.radius,
            n_samples=args.samples,
            grid_dims=(args.grid_size, args.grid_size) if args.grid_size else None
        )
        verification_time = time.time() - start_time
        
        # Prepare result
        result = {
            "success": success,
            "verification_time": verification_time,
            "system_type": "neural",
            "method": "batch_sampling",
            "state_dimension": state_dim,
            "radius": args.radius,
            "samples": details["n_samples"]
        }
        
        # Add details
        result.update({
            "pd_violations": details["pd_violations"],
            "decreasing_violations": details["decreasing_violations"],
            "pd_violation_rate": details["pd_violation_rate"],
            "decreasing_violation_rate": details["decreasing_violation_rate"],
            "V_min": details["V_min"],
            "V_max": details["V_max"],
            "dVdt_min": details["dVdt_min"],
            "dVdt_max": details["dVdt_max"]
        })
        
        # Save result
        if args.output:
            save_verification_result(result, args.output)
            logger.info(f"Verification result saved to {args.output}")
        
        # Print summary
        logger.info(f"Verification result: {'Success' if success else 'Failed'}")
        logger.info(f"Verification time: {verification_time:.3f} seconds")
        logger.info(f"PD violations: {details['pd_violations']}/{details['n_samples']}")
        logger.info(f"Decreasing violations: {details['decreasing_violations']}/{details['n_samples']}")
        
        return result
    else:
        logger.error("Neural Lyapunov verification requires a model file")
        sys.exit(1)


def main():
    """Main function for CLI."""
    parser = argparse.ArgumentParser(
        description="ELFIN Stability Verification CLI",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    # Common arguments
    parser.add_argument("--output", "-o", type=str, help="Output file for results (.json or .html)")
    parser.add_argument("--state-dim", "-d", type=int, help="State dimension")
    
    # Create subparsers for different verification types
    subparsers = parser.add_subparsers(dest="command", help="Verification type")
    
    # Polynomial Lyapunov verification
    poly_parser = subparsers.add_parser("polynomial", help="Verify polynomial Lyapunov function")
    poly_parser.add_argument("matrix", type=str, help="Matrix file (.npy, .npz, .json, or .txt)")
    
    # Neural Lyapunov verification
    neural_parser = subparsers.add_parser("neural", help="Verify neural Lyapunov function")
    neural_parser.add_argument("dynamics", type=str, help="Python file containing dynamics function")
    neural_parser.add_argument("--function-name", "-f", type=str, default="dynamics", 
                               help="Name of dynamics function in the file")
    neural_parser.add_argument("--model", "-m", type=str, required=True, 
                               help="PyTorch model file (.pt or .pth)")
    neural_parser.add_argument("--radius", "-r", type=float, default=2.0, 
                               help="Verification radius")
    neural_parser.add_argument("--samples", "-s", type=int, default=5000, 
                               help="Number of samples for verification")
    neural_parser.add_argument("--grid-size", "-g", type=int, 
                               help="Grid size for deterministic sampling")
    neural_parser.add_argument("--cpu", action="store_true", 
                               help="Force CPU usage even if CUDA is available")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Run verification
    if args.command == "polynomial":
        verify_polynomial_lyapunov(args)
    elif args.command == "neural":
        verify_neural_lyapunov(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
