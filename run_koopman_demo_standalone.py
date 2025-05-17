#!/usr/bin/env python3
"""
Standalone runner for Koopman Bridge demos.

This script provides a self-contained way to run the Koopman demos
without relying on the full ELFIN infrastructure.
"""

import os
import sys
import numpy as np
import matplotlib.pyplot as plt
import pathlib
import time
import argparse
from typing import Tuple, Dict, Any, List, Optional, Callable

# Add the parent directory to sys.path so we can import from alan_backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Try importing our Koopman modules directly
try:
    from alan_backend.elfin.koopman.dictionaries import (
        create_dictionary,
        StandardDictionary
    )
    from alan_backend.elfin.koopman.edmd import (
        edmd_fit,
        compute_dmd_spectrum
    )
    from alan_backend.elfin.koopman.koopman_lyap import (
        get_stable_modes,
        KoopmanLyapunov,
        create_koopman_lyapunov
    )
    from alan_backend.elfin.koopman.koopman_bridge_agent import (
        create_pendulum_agent,
        create_vdp_agent
    )
    DIRECT_IMPORT = True
except ImportError:
    print("Failed to import Koopman modules directly.")
    DIRECT_IMPORT = False


def run_pendulum_demo(dict_type="rbf", dict_size=100, plot_results=True):
    """
    Run the pendulum demo directly.
    
    Args:
        dict_type: Dictionary type
        dict_size: Dictionary size
        plot_results: Whether to plot results
    """
    print("\n" + "="*80)
    print(" Koopman Bridge Demo: Pendulum System ".center(80, "="))
    print("="*80)
    
    # Create pendulum trajectory data
    print("\nGenerating pendulum data...")
    
    # Parameters
    n_points = 1000
    t = np.linspace(0, 10, n_points)
    dt = t[1] - t[0]
    alpha = 0.1  # Damping coefficient
    noise_level = 0.01
    
    # Initial conditions (multiple trajectories)
    x0_list = [
        np.array([np.pi/4, 0.0]),  # Small angle
        np.array([np.pi/2, 0.0]),  # Medium angle
        np.array([np.pi*0.8, 0.0]),  # Large angle
        np.array([0.0, 0.5]),  # Zero angle, nonzero velocity
        np.array([np.pi/4, 0.5]),  # Small angle, positive velocity
        np.array([np.pi/4, -0.5]),  # Small angle, negative velocity
        np.array([-np.pi/4, 0.0]),  # Negative angle
        np.array([-np.pi/4, -0.5]),  # Negative angle, negative velocity
        np.array([0.1, 0.1]),  # Small perturbation
        np.array([-0.1, -0.1])  # Small negative perturbation
    ]
    
    # Pendulum dynamics
    def pendulum_dynamics(x, alpha=0.1):
        """Pendulum dynamics: x' = [x[1], -sin(x[0]) - alpha*x[1]]"""
        theta, omega = x
        return np.array([omega, -np.sin(theta) - alpha*omega])
    
    # Generate trajectory data
    all_x = []
    all_x_next = []
    
    for x0 in x0_list:
        # Simulate trajectory
        x_traj = [x0]
        for i in range(1, len(t)):
            # Simple Euler integration
            x_prev = x_traj[-1]
            x_next = x_prev + dt * pendulum_dynamics(x_prev, alpha)
            x_traj.append(x_next)
        
        # Convert to numpy array
        x_traj = np.array(x_traj)
        
        # Add noise
        x_traj += noise_level * np.random.randn(*x_traj.shape)
        
        # Extract x and x_next
        x = x_traj[:-1]
        x_next = x_traj[1:]
        
        # Append to data
        all_x.append(x)
        all_x_next.append(x_next)
    
    # Concatenate data
    x = np.vstack(all_x)
    x_next = np.vstack(all_x_next)
    
    print(f"Generated {len(x)} data points for pendulum system")
    
    # Create dictionary
    print(f"\nCreating {dict_type} dictionary with {dict_size} elements...")
    
    state_dim = x.shape[1]
    dictionary = create_dictionary(
        dict_type=dict_type,
        dim=state_dim,
        n_centers=dict_size if dict_type == "rbf" else None,
        n_frequencies=dict_size if dict_type == "fourier" else None,
        degree=dict_size if dict_type == "poly" else None
    )
    
    # Fit Koopman operator
    print("\nFitting Koopman operator using EDMD...")
    
    k_matrix, meta = edmd_fit(
        dictionary=dictionary,
        x=x,
        x_next=x_next
    )
    
    print(f"K-matrix shape: {k_matrix.shape}")
    print(f"Fitting MSE: {meta['mse']:.6f}")
    
    # Create Koopman-based Lyapunov function
    print("\nCreating Koopman-based Lyapunov function...")
    
    lyap_fn = create_koopman_lyapunov(
        name="pendulum_lyap",
        k_matrix=k_matrix,
        dictionary=dictionary,
        lambda_cut=0.98,
        continuous_time=True,
        dt=dt
    )
    
    print(f"Created Lyapunov function with {len(lyap_fn.stable_indices)} stable modes")
    print(f"Eigenvalues: {[complex(lyap_fn.get_eigenvalue(i)) for i in range(min(3, len(lyap_fn.stable_indices)))]}")
    
    # Verify Lyapunov function
    print("\nVerifying Lyapunov function...")
    
    # Define domain
    domain = (np.array([-np.pi/2, -1.0]), np.array([np.pi/2, 1.0]))
    
    # Check positive definiteness
    grid_size = 20
    x_grid = np.linspace(domain[0][0], domain[1][0], grid_size)
    y_grid = np.linspace(domain[0][1], domain[1][1], grid_size)
    X, Y = np.meshgrid(x_grid, y_grid)
    points = np.column_stack([X.ravel(), Y.ravel()])
    
    # Evaluate Lyapunov function
    v_values = lyap_fn(points).reshape(X.shape)
    
    # Check if values are positive (except at origin)
    min_val = np.min(v_values)
    is_pd = min_val >= 0
    
    # Check decreasing along trajectories
    decreasing_count = 0
    total_count = 0
    
    for i in range(grid_size):
        for j in range(grid_size):
            point = np.array([x_grid[i], y_grid[j]])
            if np.linalg.norm(point) > 1e-10:  # Skip origin
                v = lyap_fn(point)
                dx = pendulum_dynamics(point)
                grad = lyap_fn.gradient(point)
                dv = np.dot(grad, dx)
                
                total_count += 1
                if dv < 0:
                    decreasing_count += 1
    
    print(f"Lyapunov function positive definite: {is_pd} (min value: {min_val:.6f})")
    print(f"Decreasing along trajectories: {decreasing_count}/{total_count} points")
    
    # Plot results if requested
    if plot_results:
        print("\nPlotting results...")
        
        plt.figure(figsize=(15, 10))
        
        # Plot Lyapunov function
        plt.subplot(2, 3, 1)
        contour = plt.contourf(X, Y, v_values, 50, cmap='viridis')
        plt.colorbar(contour)
        plt.title("Lyapunov Function V(x)")
        plt.xlabel("θ")
        plt.ylabel("ω")
        
        # Plot vector field
        plt.subplot(2, 3, 2)
        U = np.zeros_like(X)
        V = np.zeros_like(Y)
        
        for i in range(grid_size):
            for j in range(grid_size):
                dx = pendulum_dynamics(np.array([X[i, j], Y[i, j]]))
                U[i, j] = dx[0]
                V[i, j] = dx[1]
        
        plt.streamplot(X, Y, U, V, density=1, color='white')
        plt.contour(X, Y, v_values, 10, colors='black', alpha=0.5)
        plt.title("Phase Portrait with V(x) Level Sets")
        plt.xlabel("θ")
        plt.ylabel("ω")
        
        # Plot eigenvalues
        if len(lyap_fn.eigenvalues) > 0:
            plt.subplot(2, 3, 3)
            evals = lyap_fn.eigenvalues
            plt.scatter(np.real(evals), np.imag(evals), c='blue', alpha=0.5)
            
            # Highlight stable eigenvalues
            stable_evals = [lyap_fn.get_eigenvalue(i) for i in range(len(lyap_fn.stable_indices))]
            plt.scatter(np.real(stable_evals), np.imag(stable_evals), c='red')
            
            # Add unit circle
            theta = np.linspace(0, 2*np.pi, 100)
            plt.plot(np.cos(theta), np.sin(theta), 'k--', alpha=0.5)
            
            plt.axhline(y=0, color='k', linestyle='-', alpha=0.2)
            plt.axvline(x=0, color='k', linestyle='-', alpha=0.2)
            plt.title("Koopman Eigenvalues")
            plt.xlabel("Re(λ)")
            plt.ylabel("Im(λ)")
            
        # Plot some eigenfunctions
        if len(lyap_fn.stable_indices) > 0:
            for i in range(min(3, len(lyap_fn.stable_indices))):
                plt.subplot(2, 3, 4 + i)
                
                # Get eigenfunction
                eigenfunction = lyap_fn.get_eigenfunction(i)
                eigenvalue = lyap_fn.get_eigenvalue(i)
                
                # Evaluate eigenfunction
                psi = eigenfunction(points)
                psi_real = np.real(psi).reshape(X.shape)
                
                plt.contourf(X, Y, psi_real, 50, cmap='coolwarm')
                plt.colorbar()
                plt.title(f"Re(ψ_{i+1}) (λ={eigenvalue:.4f})")
                plt.xlabel("θ")
                plt.ylabel("ω")
        
        plt.tight_layout()
        plt.show()
    
    print("\n" + "="*80)
    print(" Demo Complete ".center(80, "="))
    print("="*80)


def run_vdp_demo(dict_type="rbf", dict_size=100, plot_results=True):
    """
    Run the Van der Pol oscillator demo directly.
    
    Args:
        dict_type: Dictionary type
        dict_size: Dictionary size
        plot_results: Whether to plot results
    """
    print("\n" + "="*80)
    print(" Koopman Bridge Demo: Van der Pol System ".center(80, "="))
    print("="*80)
    
    # Create VdP trajectory data
    print("\nGenerating Van der Pol data...")
    
    # Parameters
    n_points = 1000
    t = np.linspace(0, 10, n_points)
    dt = t[1] - t[0]
    mu = 1.0  # Nonlinearity parameter
    noise_level = 0.01
    
    # Initial conditions (multiple trajectories)
    x0_list = [
        np.array([1.0, 0.0]),
        np.array([0.0, 1.0]),
        np.array([1.0, 1.0]),
        np.array([0.5, 0.5]),
        np.array([-0.5, -0.5]),
        np.array([-1.0, 0.0]),
        np.array([0.0, -1.0]),
        np.array([-1.0, -1.0]),
        np.array([0.2, 0.2]),
        np.array([-0.2, -0.2])
    ]
    
    # VdP dynamics
    def vdp_dynamics(x, mu=1.0):
        """Van der Pol dynamics: x' = [x[1], mu*(1-x[0]^2)*x[1] - x[0]]"""
        return np.array([x[1], mu*(1-x[0]**2)*x[1] - x[0]])
    
    # Generate trajectory data
    all_x = []
    all_x_next = []
    
    for x0 in x0_list:
        # Simulate trajectory
        x_traj = [x0]
        for i in range(1, len(t)):
            # Simple Euler integration
            x_prev = x_traj[-1]
            x_next = x_prev + dt * vdp_dynamics(x_prev, mu)
            x_traj.append(x_next)
        
        # Convert to numpy array
        x_traj = np.array(x_traj)
        
        # Add noise
        x_traj += noise_level * np.random.randn(*x_traj.shape)
        
        # Extract x and x_next
        x = x_traj[:-1]
        x_next = x_traj[1:]
        
        # Append to data
        all_x.append(x)
        all_x_next.append(x_next)
    
    # Concatenate data
    x = np.vstack(all_x)
    x_next = np.vstack(all_x_next)
    
    print(f"Generated {len(x)} data points for Van der Pol system")
    
    # Create dictionary
    print(f"\nCreating {dict_type} dictionary with {dict_size} elements...")
    
    state_dim = x.shape[1]
    dictionary = create_dictionary(
        dict_type=dict_type,
        dim=state_dim,
        n_centers=dict_size if dict_type == "rbf" else None,
        n_frequencies=dict_size if dict_type == "fourier" else None,
        degree=dict_size if dict_type == "poly" else None
    )
    
    # Fit Koopman operator
    print("\nFitting Koopman operator using EDMD...")
    
    k_matrix, meta = edmd_fit(
        dictionary=dictionary,
        x=x,
        x_next=x_next
    )
    
    print(f"K-matrix shape: {k_matrix.shape}")
    print(f"Fitting MSE: {meta['mse']:.6f}")
    
    # Create Koopman-based Lyapunov function
    print("\nCreating Koopman-based Lyapunov function...")
    
    lyap_fn = create_koopman_lyapunov(
        name="vdp_lyap",
        k_matrix=k_matrix,
        dictionary=dictionary,
        lambda_cut=0.98,
        continuous_time=True,
        dt=dt
    )
    
    print(f"Created Lyapunov function with {len(lyap_fn.stable_indices)} stable modes")
    print(f"Eigenvalues: {[complex(lyap_fn.get_eigenvalue(i)) for i in range(min(3, len(lyap_fn.stable_indices)))]}")
    
    # Verify Lyapunov function
    print("\nVerifying Lyapunov function...")
    
    # Define domain
    domain = (np.array([-2.0, -2.0]), np.array([2.0, 2.0]))
    
    # Check positive definiteness
    grid_size = 20
    x_grid = np.linspace(domain[0][0], domain[1][0], grid_size)
    y_grid = np.linspace(domain[0][1], domain[1][1], grid_size)
    X, Y = np.meshgrid(x_grid, y_grid)
    points = np.column_stack([X.ravel(), Y.ravel()])
    
    # Evaluate Lyapunov function
    v_values = lyap_fn(points).reshape(X.shape)
    
    # Check if values are positive (except at origin)
    min_val = np.min(v_values)
    is_pd = min_val >= 0
    
    # Check decreasing along trajectories
    decreasing_count = 0
    total_count = 0
    
    for i in range(grid_size):
        for j in range(grid_size):
            point = np.array([x_grid[i], y_grid[j]])
            # Skip points on the limit cycle
            if np.linalg.norm(point) > 0.1 and np.linalg.norm(point) < 1.9:
                v = lyap_fn(point)
                dx = vdp_dynamics(point)
                grad = lyap_fn.gradient(point)
                dv = np.dot(grad, dx)
                
                total_count += 1
                if dv < 0:
                    decreasing_count += 1
    
    print(f"Lyapunov function positive definite: {is_pd} (min value: {min_val:.6f})")
    print(f"Decreasing along trajectories: {decreasing_count}/{total_count} points")
    print(f"Note: For VdP, we expect decreasing outside the limit cycle only")
    
    # Plot results if requested
    if plot_results:
        print("\nPlotting results...")
        
        plt.figure(figsize=(15, 10))
        
        # Plot Lyapunov function
        plt.subplot(2, 3, 1)
        contour = plt.contourf(X, Y, v_values, 50, cmap='viridis')
        plt.colorbar(contour)
        plt.title("Lyapunov Function V(x)")
        plt.xlabel("x")
        plt.ylabel("y")
        
        # Plot vector field
        plt.subplot(2, 3, 2)
        U = np.zeros_like(X)
        V = np.zeros_like(Y)
        
        for i in range(grid_size):
            for j in range(grid_size):
                dx = vdp_dynamics(np.array([X[i, j], Y[i, j]]))
                U[i, j] = dx[0]
                V[i, j] = dx[1]
        
        plt.streamplot(X, Y, U, V, density=1, color='white')
        plt.contour(X, Y, v_values, 10, colors='black', alpha=0.5)
        plt.title("Phase Portrait with V(x) Level Sets")
        plt.xlabel("x")
        plt.ylabel("y")
        
        # Plot eigenvalues
        if len(lyap_fn.eigenvalues) > 0:
            plt.subplot(2, 3, 3)
            evals = lyap_fn.eigenvalues
            plt.scatter(np.real(evals), np.imag(evals), c='blue', alpha=0.5)
            
            # Highlight stable eigenvalues
            stable_evals = [lyap_fn.get_eigenvalue(i) for i in range(len(lyap_fn.stable_indices))]
            plt.scatter(np.real(stable_evals), np.imag(stable_evals), c='red')
            
            # Add unit circle
            theta = np.linspace(0, 2*np.pi, 100)
            plt.plot(np.cos(theta), np.sin(theta), 'k--', alpha=0.5)
            
            plt.axhline(y=0, color='k', linestyle='-', alpha=0.2)
            plt.axvline(x=0, color='k', linestyle='-', alpha=0.2)
            plt.title("Koopman Eigenvalues")
            plt.xlabel("Re(λ)")
            plt.ylabel("Im(λ)")
            
        # Plot some eigenfunctions
        if len(lyap_fn.stable_indices) > 0:
            for i in range(min(3, len(lyap_fn.stable_indices))):
                plt.subplot(2, 3, 4 + i)
                
                # Get eigenfunction
                eigenfunction = lyap_fn.get_eigenfunction(i)
                eigenvalue = lyap_fn.get_eigenvalue(i)
                
                # Evaluate eigenfunction
                psi = eigenfunction(points)
                psi_real = np.real(psi).reshape(X.shape)
                
                plt.contourf(X, Y, psi_real, 50, cmap='coolwarm')
                plt.colorbar()
                plt.title(f"Re(ψ_{i+1}) (λ={eigenvalue:.4f})")
                plt.xlabel("x")
                plt.ylabel("y")
        
        plt.tight_layout()
        plt.show()
    
    print("\n" + "="*80)
    print(" Demo Complete ".center(80, "="))
    print("="*80)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Standalone Koopman Bridge Demo Runner"
    )
    parser.add_argument(
        "system",
        type=str,
        choices=["pendulum", "vdp", "both"],
        help="System to demonstrate"
    )
    parser.add_argument(
        "--dict",
        type=str,
        default="rbf",
        choices=["rbf", "fourier", "poly"],
        help="Dictionary type (default: rbf)"
    )
    parser.add_argument(
        "--modes",
        type=int,
        default=100,
        help="Number of dictionary modes (default: 100)"
    )
    parser.add_argument(
        "--no-plot",
        action="store_true",
        help="Disable plotting"
    )
    
    args = parser.parse_args()
    
    # Run demo(s)
    if args.system == "pendulum" or args.system == "both":
        run_pendulum_demo(
            dict_type=args.dict,
            dict_size=args.modes,
            plot_results=not args.no_plot
        )
    
    if args.system == "vdp" or args.system == "both":
        run_vdp_demo(
            dict_type=args.dict,
            dict_size=args.modes,
            plot_results=not args.no_plot
        )


if __name__ == "__main__":
    main()
