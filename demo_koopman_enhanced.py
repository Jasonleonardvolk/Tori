#!/usr/bin/env python3
"""
Enhanced Koopman Demo - Showcasing all three fast-follow improvements:

1. Cross-validation
2. MILP-CE → EDMD feedback loop
3. Dynamic λ-cut and weighting adjustments

This demo creates pendulum and VDP oscillator models, performs cross-validation,
simulates counterexample feedback, and adjusts parameters dynamically.
"""

import os
import sys
import numpy as np
import matplotlib.pyplot as plt
from typing import Dict, Tuple, Optional, List, Callable, Any

# Add parent directory to path
import pathlib
current_dir = pathlib.Path(__file__).parent.absolute()
parent_dir = current_dir.parent
if str(parent_dir) not in sys.path:
    sys.path.append(str(parent_dir))

# Import Koopman components
from alan_backend.elfin.koopman.koopman_bridge_agent import (
    KoopmanBridgeAgent,
    create_pendulum_agent,
    create_vdp_agent
)
from alan_backend.elfin.koopman.edmd import kfold_validation
from alan_backend.elfin.koopman.koopman_lyap import KoopmanLyapunov


def plot_eigenvalues(
    eigenvalues: List[complex],
    stable_indices: List[int],
    title: str = "Eigenvalues"
) -> None:
    """Plot eigenvalues in complex plane."""
    plt.figure(figsize=(10, 8))
    
    # Plot unit circle for discrete-time systems
    theta = np.linspace(0, 2*np.pi, 100)
    plt.plot(np.cos(theta), np.sin(theta), 'k--', alpha=0.3, label="Unit circle")
    
    # Plot imaginary axis for continuous-time systems
    plt.axvline(x=0, color='k', linestyle='--', alpha=0.3)
    
    # Plot eigenvalues
    real = np.real(eigenvalues)
    imag = np.imag(eigenvalues)
    
    # Unstable eigenvalues
    unstable_mask = np.ones(len(eigenvalues), dtype=bool)
    unstable_mask[stable_indices] = False
    
    if np.any(unstable_mask):
        plt.scatter(
            real[unstable_mask],
            imag[unstable_mask],
            c='r',
            marker='x',
            s=100,
            label="Unstable modes"
        )
    
    # Stable eigenvalues
    plt.scatter(
        real[stable_indices],
        imag[stable_indices],
        c='g',
        marker='o',
        s=100,
        alpha=0.7,
        label="Stable modes"
    )
    
    # Add labels and legend
    plt.xlabel("Re(λ)", fontsize=14)
    plt.ylabel("Im(λ)", fontsize=14)
    plt.title(title, fontsize=16)
    plt.grid(True, alpha=0.3)
    plt.axhline(y=0, color='k', linestyle='-', alpha=0.2)
    plt.axvline(x=0, color='k', linestyle='-', alpha=0.2)
    plt.legend(fontsize=12)
    
    # Equal aspect ratio
    plt.axis('equal')


def plot_lyapunov_function(
    lyap_fn: KoopmanLyapunov,
    domain: Tuple[np.ndarray, np.ndarray],
    resolution: int = 50,
    title: str = "Koopman Lyapunov Function",
    show_modes: bool = False
) -> None:
    """Plot a 2D Lyapunov function."""
    # Get bounds
    x_min, y_min = domain[0]
    x_max, y_max = domain[1]
    
    # Create grid
    x = np.linspace(x_min, x_max, resolution)
    y = np.linspace(y_min, y_max, resolution)
    X, Y = np.meshgrid(x, y)
    
    # Evaluate Lyapunov function
    states = np.column_stack((X.flatten(), Y.flatten()))
    V = lyap_fn(states).reshape(X.shape)
    
    # Create plot
    plt.figure(figsize=(12, 10))
    
    # Main plot (3D)
    ax1 = plt.subplot(221, projection='3d')
    surf = ax1.plot_surface(X, Y, V, cmap='viridis', alpha=0.8, antialiased=True)
    ax1.set_xlabel('$x_1$', fontsize=12)
    ax1.set_ylabel('$x_2$', fontsize=12)
    ax1.set_zlabel('$V(x)$', fontsize=12)
    ax1.set_title(f'{title} (3D View)', fontsize=14)
    
    # Contour plot
    ax2 = plt.subplot(222)
    contour = ax2.contourf(X, Y, V, levels=20, cmap='viridis')
    ax2.set_xlabel('$x_1$', fontsize=12)
    ax2.set_ylabel('$x_2$', fontsize=12)
    ax2.set_title(f'{title} (Contour)', fontsize=14)
    plt.colorbar(contour, ax=ax2, label='$V(x)$')
    
    # Level sets
    ax3 = plt.subplot(223)
    levels = np.linspace(np.min(V) + 0.1, np.max(V) * 0.8, 10)
    cs = ax3.contour(X, Y, V, levels=levels, colors='k')
    ax3.clabel(cs, inline=1, fontsize=10)
    ax3.set_xlabel('$x_1$', fontsize=12)
    ax3.set_ylabel('$x_2$', fontsize=12)
    ax3.set_title(f'{title} (Level Sets)', fontsize=14)
    
    # Eigenvalues
    if show_modes:
        ax4 = plt.subplot(224)
        eigenvalues = lyap_fn.eigenvalues
        stable_indices = lyap_fn.stable_indices
        
        # Plot eigenvalues
        real = np.real(eigenvalues)
        imag = np.imag(eigenvalues)
        
        # Unstable eigenvalues
        unstable_mask = np.ones(len(eigenvalues), dtype=bool)
        unstable_mask[stable_indices] = False
        
        if np.any(unstable_mask):
            ax4.scatter(
                real[unstable_mask],
                imag[unstable_mask],
                c='r',
                marker='x',
                s=100,
                label="Unstable modes"
            )
        
        # Stable eigenvalues
        ax4.scatter(
            real[stable_indices],
            imag[stable_indices],
            c='g',
            marker='o',
            s=100,
            alpha=0.7,
            label="Stable modes"
        )
        
        # Plot unit circle for discrete-time systems
        theta = np.linspace(0, 2*np.pi, 100)
        ax4.plot(np.cos(theta), np.sin(theta), 'k--', alpha=0.3)
        
        # Plot imaginary axis for continuous-time systems
        ax4.axvline(x=0, color='k', linestyle='--', alpha=0.3)
        
        ax4.set_xlabel('Re(λ)', fontsize=12)
        ax4.set_ylabel('Im(λ)', fontsize=12)
        ax4.grid(True, alpha=0.3)
        ax4.set_title(f'Koopman Eigenvalues (n={len(stable_indices)})', fontsize=14)
        ax4.legend(fontsize=10)
        
        # Equal aspect ratio
        ax4.axis('equal')
    
    plt.tight_layout()


def plot_cv_results(cv_results: Dict[str, Any], title: str = "Cross-Validation Results") -> None:
    """Plot cross-validation results."""
    plt.figure(figsize=(12, 6))
    
    # Bar plot of MSE
    plt.subplot(121)
    labels = ['Train', 'Validation', 'All Data']
    means = [
        cv_results['train_mse_mean'],
        cv_results['val_mse_mean'],
        cv_results['all_mse']
    ]
    stds = [
        cv_results['train_mse_std'],
        cv_results['val_mse_std'],
        0
    ]
    
    x = np.arange(len(labels))
    bar_width = 0.5
    
    plt.bar(x, means, bar_width, yerr=stds, alpha=0.8, 
            color=['blue', 'orange', 'green'],
            capsize=10, label='MSE')
    
    plt.xlabel('Dataset')
    plt.ylabel('Mean Squared Error')
    plt.title('MSE Comparison')
    plt.xticks(x, labels)
    plt.grid(True, alpha=0.3)
    
    # Eigenvalue drift
    plt.subplot(122)
    
    if 'eigenvalues_drift' in cv_results:
        drift_mean = cv_results['eigenvalues_drift']['mean']
        drift_max = cv_results['eigenvalues_drift']['max']
        
        plt.bar([0, 1], [drift_mean, drift_max], bar_width, alpha=0.8,
                color=['blue', 'red'], 
                capsize=10)
        
        plt.xlabel('Metric')
        plt.ylabel('Eigenvalue Drift')
        plt.title('Eigenvalue Stability')
        plt.xticks([0, 1], ['Mean Drift', 'Max Drift'])
        plt.grid(True, alpha=0.3)
    else:
        plt.text(0.5, 0.5, "Eigenvalue drift data not available", 
                 horizontalalignment='center', verticalalignment='center',
                 transform=plt.gca().transAxes)
    
    plt.suptitle(title, fontsize=16)
    plt.tight_layout(rect=[0, 0, 1, 0.95])


def pendulum_dynamics(x: np.ndarray, alpha: float = 0.1) -> np.ndarray:
    """
    Pendulum dynamics: x' = [x[1], -sin(x[0]) - alpha*x[1]]
    
    Args:
        x: State [theta, omega]
        alpha: Damping coefficient
        
    Returns:
        Derivative of state
    """
    theta, omega = x
    return np.array([omega, -np.sin(theta) - alpha*omega])


def vdp_dynamics(x: np.ndarray, mu: float = 1.0) -> np.ndarray:
    """
    Van der Pol oscillator dynamics: x' = [x[1], mu*(1-x[0]^2)*x[1] - x[0]]
    
    Args:
        x: State [x, v]
        mu: Nonlinearity parameter
        
    Returns:
        Derivative of state
    """
    return np.array([x[1], mu*(1-x[0]**2)*x[1] - x[0]])


def generate_counterexample(system_name: str) -> np.ndarray:
    """
    Generate a "difficult" counterexample state for a system.
    
    Args:
        system_name: Name of the system
        
    Returns:
        Counterexample state
    """
    if system_name == "pendulum":
        # A state near the unstable equilibrium
        return np.array([np.pi - 0.1, 0.5])
    elif system_name == "vdp":
        # A state far from the limit cycle
        return np.array([3.0, 3.0])
    else:
        raise ValueError(f"Unknown system: {system_name}")


def demo_cross_validation(system_name: str = "pendulum") -> None:
    """
    Demonstrate cross-validation for Koopman models.
    
    Args:
        system_name: Name of the system to demonstrate
    """
    print(f"\n===== Cross-Validation Demo: {system_name} =====")
    
    # Create Koopman agent
    if system_name == "pendulum":
        agent, lyap_fn = create_pendulum_agent(
            name="pendulum_cv",
            dict_type="rbf",
            dict_size=100,
            verify=False
        )
    elif system_name == "vdp":
        agent, lyap_fn = create_vdp_agent(
            name="vdp_cv",
            dict_type="rbf",
            dict_size=100,
            verify=False
        )
    else:
        raise ValueError(f"Unknown system: {system_name}")
    
    # Get data and dictionary
    result = agent.results[system_name]
    x = result['data']['x']
    x_next = result['data']['x_next']
    dictionary = result['dictionary']
    
    # Run cross-validation with different numbers of folds
    n_folds_list = [3, 5, 10]
    cv_results_list = []
    
    for n_folds in n_folds_list:
        print(f"Running {n_folds}-fold cross-validation...")
        cv_results = kfold_validation(
            dictionary=dictionary,
            x=x,
            x_next=x_next,
            n_splits=n_folds
        )
        
        # Add eigenvalue drift information
        eigenvalues = cv_results['eigenvalues']
        eigenvalues_folds = cv_results['eigenvalues_folds'][0]
        
        # Calculate drift
        drift = np.abs(eigenvalues - eigenvalues_folds)
        cv_results['eigenvalues_drift'] = {
            'mean': float(np.mean(drift)),
            'max': float(np.max(drift))
        }
        
        cv_results_list.append(cv_results)
        
        # Print results
        print(f"  Train MSE: {cv_results['train_mse_mean']:.6f} ± {cv_results['train_mse_std']:.6f}")
        print(f"  Val MSE: {cv_results['val_mse_mean']:.6f} ± {cv_results['val_mse_std']:.6f}")
        print(f"  All MSE: {cv_results['all_mse']:.6f}")
        print(f"  Eigenvalue drift - Mean: {cv_results['eigenvalues_drift']['mean']:.6f}, Max: {cv_results['eigenvalues_drift']['max']:.6f}")
    
    # Plot results
    plt.figure(figsize=(15, 10))
    for i, (n_folds, cv_results) in enumerate(zip(n_folds_list, cv_results_list)):
        plt.subplot(2, 2, i+1)
        plot_cv_results(cv_results, title=f"{n_folds}-fold CV: {system_name}")
    
    # Plot eigenvalues
    plt.subplot(2, 2, 4)
    eigenvalues = lyap_fn.eigenvalues
    stable_indices = lyap_fn.stable_indices
    plot_eigenvalues(
        eigenvalues=eigenvalues,
        stable_indices=stable_indices,
        title=f"Eigenvalues: {system_name}"
    )
    
    plt.tight_layout()
    plt.suptitle(f"Cross-Validation Results: {system_name}", fontsize=18, y=1.05)
    plt.show()


def demo_milp_ce_feedback(system_name: str = "pendulum") -> None:
    """
    Demonstrate MILP counterexample feedback loop.
    
    Args:
        system_name: Name of the system to demonstrate
    """
    print(f"\n===== MILP-CE Feedback Demo: {system_name} =====")
    
    # Create Koopman agent
    if system_name == "pendulum":
        agent, lyap_fn = create_pendulum_agent(
            name="pendulum_ce",
            dict_type="rbf",
            dict_size=100,
            verify=False
        )
        dynamics_fn = pendulum_dynamics
    elif system_name == "vdp":
        agent, lyap_fn = create_vdp_agent(
            name="vdp_ce",
            dict_type="rbf",
            dict_size=100,
            verify=False
        )
        dynamics_fn = vdp_dynamics
    else:
        raise ValueError(f"Unknown system: {system_name}")
    
    # Generate counterexample
    ce = generate_counterexample(system_name)
    print(f"Generated counterexample: {ce}")
    
    # Evaluate Lyapunov function at counterexample
    v_before = lyap_fn(ce)
    print(f"Lyapunov value at counterexample (before): {v_before}")
    
    # Check eigenvalues before refinement
    eigenvalues_before = lyap_fn.eigenvalues
    stable_indices_before = lyap_fn.stable_indices
    
    # Refine Lyapunov function
    print("Refining Lyapunov function with counterexample...")
    refined_lyap_fn = agent.refine_once(
        lyap_fn=lyap_fn,
        system_name=system_name,
        counterexample=ce,
        dynamics_fn=dynamics_fn
    )
    
    # Evaluate refined Lyapunov function at counterexample
    v_after = refined_lyap_fn(ce)
    print(f"Lyapunov value at counterexample (after): {v_after}")
    
    # Check eigenvalues after refinement
    eigenvalues_after = refined_lyap_fn.eigenvalues
    stable_indices_after = refined_lyap_fn.stable_indices
    
    # Define domain for plotting
    if system_name == "pendulum":
        domain = (np.array([-np.pi, -2.0]), np.array([np.pi, 2.0]))
    elif system_name == "vdp":
        domain = (np.array([-3.0, -3.0]), np.array([3.0, 3.0]))
    
    # Plot before and after
    plt.figure(figsize=(15, 10))
    
    # Eigenvalues before
    plt.subplot(2, 2, 1)
    plot_eigenvalues(
        eigenvalues=eigenvalues_before,
        stable_indices=stable_indices_before,
        title=f"Eigenvalues Before: {system_name}"
    )
    
    # Eigenvalues after
    plt.subplot(2, 2, 2)
    plot_eigenvalues(
        eigenvalues=eigenvalues_after,
        stable_indices=stable_indices_after,
        title=f"Eigenvalues After: {system_name}"
    )
    
    # Lyapunov function before
    plt.subplot(2, 2, 3)
    X, Y = np.meshgrid(
        np.linspace(domain[0][0], domain[1][0], 50),
        np.linspace(domain[0][1], domain[1][1], 50)
    )
    states = np.column_stack((X.flatten(), Y.flatten()))
    V_before = lyap_fn(states).reshape(X.shape)
    
    plt.contourf(X, Y, V_before, levels=20, cmap='viridis')
    plt.colorbar(label='$V(x)$')
    plt.scatter(ce[0], ce[1], c='r', marker='x', s=100, label='Counterexample')
    plt.xlabel('$x_1$')
    plt.ylabel('$x_2$')
    plt.title(f'Lyapunov Function Before: {system_name}')
    plt.legend()
    
    # Lyapunov function after
    plt.subplot(2, 2, 4)
    V_after = refined_lyap_fn(states).reshape(X.shape)
    
    plt.contourf(X, Y, V_after, levels=20, cmap='viridis')
    plt.colorbar(label='$V(x)$')
    plt.scatter(ce[0], ce[1], c='r', marker='x', s=100, label='Counterexample')
    plt.xlabel('$x_1$')
    plt.ylabel('$x_2$')
    plt.title(f'Lyapunov Function After: {system_name}')
    plt.legend()
    
    plt.tight_layout()
    plt.suptitle(f"MILP-CE Feedback Demo: {system_name}", fontsize=18, y=1.05)
    plt.show()


def demo_lambda_weighting(system_name: str = "pendulum") -> None:
    """
    Demonstrate λ-cut and weighting adjustments.
    
    Args:
        system_name: Name of the system to demonstrate
    """
    print(f"\n===== λ-cut and Weighting Demo: {system_name} =====")
    
    # Create Koopman agent
    if system_name == "pendulum":
        agent, lyap_fn = create_pendulum_agent(
            name="pendulum_lambda",
            dict_type="rbf",
            dict_size=100,
            verify=False
        )
    elif system_name == "vdp":
        agent, lyap_fn = create_vdp_agent(
            name="vdp_lambda",
            dict_type="rbf",
            dict_size=100,
            verify=False
        )
    else:
        raise ValueError(f"Unknown system: {system_name}")
    
    # Define domain for plotting
    if system_name == "pendulum":
        domain = (np.array([-np.pi, -2.0]), np.array([np.pi, 2.0]))
    elif system_name == "vdp":
        domain = (np.array([-3.0, -3.0]), np.array([3.0, 3.0]))
    
    # Try different λ-cuts and weighting strategies
    lambda_cuts = [0.9, 0.95, 0.99]
    weightings = ["uniform", "lambda"]
    
    # Get original result
    original_result = agent.results[system_name]
    k_matrix = original_result['k_matrix']
    dictionary = original_result['dictionary']
    
    plt.figure(figsize=(15, 15))
    count = 1
    
    for lambda_cut in lambda_cuts:
        for weighting in weightings:
            # Create Lyapunov function with updated parameters
            from alan_backend.elfin.koopman.koopman_lyap import create_koopman_lyapunov
            
            print(f"Creating Lyapunov function with λ-cut={lambda_cut}, weighting={weighting}")
            new_lyap_fn = create_koopman_lyapunov(
                name=f"{system_name}_{weighting}_{lambda_cut}",
                k_matrix=k_matrix,
                dictionary=dictionary,
                lambda_cut=lambda_cut,
                continuous_time=True,
                weighting=weighting
            )
            
            # Plot Lyapunov function
            plt.subplot(3, 2, count)
            X, Y = np.meshgrid(
                np.linspace(domain[0][0], domain[1][0], 50),
                np.linspace(domain[0][1], domain[1][1], 50)
            )
            states = np.column_stack((X.flatten(), Y.flatten()))
            V = new_lyap_fn(states).reshape(X.shape)
            
            plt.contourf(X, Y, V, levels=20, cmap='viridis')
            plt.colorbar(label='$V(x)$')
            
            # Plot eigenvalues
            eigenvalues = new_lyap_fn.eigenvalues
            stable_indices = new_lyap_fn.stable_indices
            
            # Display eigenvalues as inset
            from mpl_toolkits.axes_grid1.inset_locator import inset_axes
            axins = inset_axes(plt.gca(), width="40%", height="40%", loc=4)
            
            # Unstable eigenvalues
            unstable_mask = np.ones(len(eigenvalues), dtype=bool)
            unstable_mask[stable_indices] = False
            
            if np.any(unstable_mask):
                axins.scatter(
                    np.real(eigenvalues[unstable_mask]),
                    np.imag(eigenvalues[unstable_mask]),
                    c='r',
                    marker='x',
                    s=50,
                    label="Unstable"
                )
            
            # Stable eigenvalues
            axins.scatter(
                np.real(eigenvalues[stable_indices]),
                np.imag(eigenvalues[stable_indices]),
                c='g',
                marker='o',
                s=50,
                alpha=0.7,
                label="Stable"
            )
            
            # Plot unit circle and imaginary axis
            theta = np.linspace(0, 2*np.pi, 100)
            axins.plot(np.cos(theta), np.sin(theta), 'k--', alpha=0.3)
            axins.axvline(x=0, color='k', linestyle='--', alpha=0.3)
            
            axins.set_aspect('equal')
            axins.grid(True, alpha=0.3)
            
            plt.xlabel('$x_1$')
            plt.ylabel('$x_2$')
            plt.title(f'λ-cut={lambda_cut}, weighting={weighting}\nStable Modes: {len(stable_indices)}')
            
            count += 1
    
    plt.tight_layout()
    plt.suptitle(f"λ-cut and Weighting Demo: {system_name}", fontsize=18, y=1.02)
    plt.show()


def main() -> None:
    """Main function to run all demos."""
    print("ELFIN Koopman Enhanced Demo - Showcasing all three fast-follow improvements:")
    print("1. Cross-validation")
    print("2. MILP-CE → EDMD feedback loop")
    print("3. Dynamic λ-cut and weighting adjustments")
    
    # Ask which demos to run
    print("\nSelect demos to run:")
    print("1. Cross-validation")
    print("2. MILP-CE feedback loop")
    print("3. λ-cut and weighting adjustments")
    print("4. All demos")
    
    choice = input("Enter your choice (1-4): ")
    
    if choice == "1":
        demo_cross_validation("pendulum")
    elif choice == "2":
        demo_milp_ce_feedback("pendulum")
    elif choice == "3":
        demo_lambda_weighting("pendulum")
    elif choice == "4":
        # Run all demos
        demo_cross_validation("pendulum")
        demo_milp_ce_feedback("pendulum")
        demo_lambda_weighting("pendulum")
        
        # Optionally, run for VDP as well
        run_vdp = input("\nRun demos for Van der Pol oscillator as well? (y/n): ")
        if run_vdp.lower() == "y":
            demo_cross_validation("vdp")
            demo_milp_ce_feedback("vdp")
            demo_lambda_weighting("vdp")
    else:
        print("Invalid choice. Exiting.")
        return


if __name__ == "__main__":
    main()
