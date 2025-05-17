#!/usr/bin/env python3
"""
Fully standalone Koopman Bridge demo.

This script contains all necessary code to demonstrate Koopman-based
Lyapunov function generation without any external dependencies beyond
numpy and matplotlib.
"""

import numpy as np
import matplotlib.pyplot as plt
import argparse
from typing import Tuple, Dict, Any, List, Optional, Callable
from functools import partial


#####################################################################
# Dictionary implementation
#####################################################################

class StandardDictionary:
    """Standard dictionary for Koopman operator analysis."""
    
    def __init__(
        self, 
        dict_fn: Callable[[np.ndarray], np.ndarray],
        name: str,
        dimension: int,
        params: Optional[Dict[str, Any]] = None
    ):
        """Initialize a standard dictionary."""
        self.dict_fn = dict_fn
        self.name = name
        self.dimension = dimension
        self.params = params or {}
    
    def __call__(self, x: np.ndarray) -> np.ndarray:
        """Apply the dictionary function to a state."""
        return self.dict_fn(x)
    
    def __repr__(self) -> str:
        return f"StandardDictionary({self.name}, dim={self.dimension}, params={self.params})"


def rbf_dict(
    x: np.ndarray,
    centers: np.ndarray,
    sigma: float = 1.0,
    include_linear: bool = True,
    include_constant: bool = True
) -> np.ndarray:
    """Radial basis function dictionary."""
    # Ensure x is 2D
    if x.ndim == 1:
        x = x.reshape(1, -1)
    
    n_samples, n_dims = x.shape
    
    # Compute RBF features
    features = []
    
    if include_constant:
        # Add constant term
        features.append(np.ones((n_samples, 1)))
    
    if include_linear:
        # Add linear terms
        features.append(x)
    
    # Add RBF terms
    for center in centers:
        # Compute squared distance to center for each sample
        dist_sq = np.sum((x - center)**2, axis=1)
        # Add RBF feature
        features.append(np.exp(-dist_sq / (2 * sigma**2)).reshape(-1, 1))
    
    # Concatenate all features
    return np.hstack(features)


def create_rbf_dict(
    dim: int,
    n_centers: int,
    sigma: float = 1.0,
    domain: Optional[Tuple[np.ndarray, np.ndarray]] = None,
    include_linear: bool = True,
    include_constant: bool = True,
    random_seed: Optional[int] = None
) -> StandardDictionary:
    """Create a radial basis function dictionary."""
    # Set random seed
    if random_seed is not None:
        np.random.seed(random_seed)
    
    # Generate random centers
    if domain is not None:
        lower, upper = domain
        centers = np.random.uniform(
            lower, upper, (n_centers, dim)
        )
    else:
        # Default domain is [-1, 1]^dim
        centers = np.random.uniform(-1, 1, (n_centers, dim))
    
    # Calculate output dimension
    output_dim = n_centers
    if include_linear:
        output_dim += dim
    if include_constant:
        output_dim += 1
    
    # Create the dictionary function
    dict_fn = partial(
        rbf_dict, 
        centers=centers, 
        sigma=sigma,
        include_linear=include_linear,
        include_constant=include_constant
    )
    
    # Create the dictionary object
    return StandardDictionary(
        dict_fn=dict_fn,
        name="rbf",
        dimension=output_dim,
        params={
            "dim": dim,
            "n_centers": n_centers,
            "sigma": sigma,
            "include_linear": include_linear,
            "include_constant": include_constant
        }
    )


def fourier_dict(
    x: np.ndarray,
    frequencies: np.ndarray,
    include_linear: bool = True,
    include_constant: bool = True
) -> np.ndarray:
    """Fourier dictionary function."""
    # Ensure x is 2D
    if x.ndim == 1:
        x = x.reshape(1, -1)
    
    n_samples, n_dims = x.shape
    
    # Compute Fourier features
    features = []
    
    if include_constant:
        # Add constant term
        features.append(np.ones((n_samples, 1)))
    
    if include_linear:
        # Add linear terms
        features.append(x)
    
    # Add Fourier terms
    for freq in frequencies:
        # Compute w·x for each sample
        wx = np.dot(x, freq)
        # Add sin and cos features
        features.append(np.sin(wx).reshape(-1, 1))
        features.append(np.cos(wx).reshape(-1, 1))
    
    # Concatenate all features
    return np.hstack(features)


def create_fourier_dict(
    dim: int,
    n_frequencies: int,
    max_freq: float = 2.0,
    include_linear: bool = True,
    include_constant: bool = True,
    random_seed: Optional[int] = None
) -> StandardDictionary:
    """Create a Fourier dictionary function."""
    # Set random seed
    if random_seed is not None:
        np.random.seed(random_seed)
    
    # Generate random frequencies
    frequencies = np.random.uniform(-max_freq, max_freq, (n_frequencies, dim))
    
    # Calculate output dimension
    output_dim = 2 * n_frequencies
    if include_linear:
        output_dim += dim
    if include_constant:
        output_dim += 1
    
    # Create the dictionary function
    dict_fn = partial(
        fourier_dict, 
        frequencies=frequencies, 
        include_linear=include_linear,
        include_constant=include_constant
    )
    
    # Create the dictionary object
    return StandardDictionary(
        dict_fn=dict_fn,
        name="fourier",
        dimension=output_dim,
        params={
            "dim": dim,
            "n_frequencies": n_frequencies,
            "max_freq": max_freq,
            "include_linear": include_linear,
            "include_constant": include_constant
        }
    )


def create_dictionary(
    dict_type: str,
    dim: int,
    **kwargs
) -> StandardDictionary:
    """Create a dictionary function based on type."""
    if dict_type.lower() == 'rbf':
        return create_rbf_dict(dim, **kwargs)
    elif dict_type.lower() == 'fourier':
        return create_fourier_dict(dim, **kwargs)
    else:
        valid_types = ['rbf', 'fourier']
        raise ValueError(f"Unknown dictionary type: {dict_type}. Valid types: {valid_types}")


#####################################################################
# EDMD implementation
#####################################################################

def edmd_fit(
    dictionary: StandardDictionary,
    x: np.ndarray,
    x_next: np.ndarray,
    reg_param: float = 1e-10,
    method: str = "svd"
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """Fit a Koopman operator using Extended Dynamic Mode Decomposition (EDMD)."""
    # Apply dictionary to states
    phi_x = dictionary(x)
    phi_x_next = dictionary(x_next)
    
    # Get dimensions
    n_samples, n_features = phi_x.shape
    
    # Compute the Koopman matrix
    if method == "svd":
        # Use SVD for improved numerical stability
        # Solve Φ(X') = Φ(X) K using SVD
        u, s, vh = np.linalg.svd(phi_x, full_matrices=False)
        
        # Apply regularization by setting small singular values to zero
        s_reg = np.where(s > reg_param, s, reg_param)
        s_inv = 1.0 / s_reg
        
        # Compute the pseudoinverse: pinv(Φ(X)) = V * S^-1 * U^T
        phi_x_pinv = vh.T @ np.diag(s_inv) @ u.T
        
        # Compute K = pinv(Φ(X)) * Φ(X')
        k_matrix = phi_x_pinv @ phi_x_next
        
        # Store metadata
        meta = {
            "singular_values": s,
            "cond_number": np.max(s) / np.min(s_reg),
            "method": "svd",
            "reg_param": reg_param,
            "rank": np.sum(s > reg_param)
        }
    
    else:
        # Direct solution
        phi_x_t_phi_x = phi_x.T @ phi_x
        reg_matrix = reg_param * np.eye(n_features)
        k_matrix = np.linalg.solve(
            phi_x_t_phi_x + reg_matrix,
            phi_x.T @ phi_x_next
        )
        
        # Store metadata
        meta = {
            "method": "direct",
            "reg_param": reg_param,
            "cond_number": np.linalg.cond(phi_x_t_phi_x + reg_matrix),
            "rank": np.linalg.matrix_rank(phi_x)
        }
    
    # Calculate fit quality metrics
    prediction = phi_x @ k_matrix
    residuals = phi_x_next - prediction
    mse = np.mean(np.sum(residuals**2, axis=1))
    
    # Update metadata
    meta.update({
        "n_samples": n_samples,
        "n_features": n_features,
        "mse": mse,
        "rmse": np.sqrt(mse)
    })
    
    return k_matrix, meta


#####################################################################
# Koopman Lyapunov implementation
#####################################################################

def get_stable_modes(
    eigenvalues: np.ndarray,
    eigenvectors: np.ndarray,
    lambda_cut: float = 0.99,
    continuous_time: bool = False,
    min_modes: int = 2,
    max_modes: Optional[int] = None
) -> Tuple[np.ndarray, np.ndarray, List[int]]:
    """Get stable modes from Koopman eigendecomposition."""
    # Determine which modes are stable
    if continuous_time:
        # For continuous time, modes are stable if Re(λ) < 0
        stable_indices = np.where(np.real(eigenvalues) < 0)[0]
    else:
        # For discrete time, modes are stable if |λ| < λ_cut
        stable_indices = np.where(np.abs(eigenvalues) < lambda_cut)[0]
    
    # Sort by stability (most stable first)
    if continuous_time:
        # Sort by real part (most negative first)
        sort_idx = np.argsort(np.real(eigenvalues[stable_indices]))
    else:
        # Sort by magnitude (smallest first)
        sort_idx = np.argsort(np.abs(eigenvalues[stable_indices]))
    
    stable_indices = stable_indices[sort_idx]
    
    # Ensure minimum number of modes
    if len(stable_indices) < min_modes:
        if continuous_time:
            # Sort all eigenvalues by real part (most negative first)
            all_idx = np.argsort(np.real(eigenvalues))
        else:
            # Sort all eigenvalues by magnitude (smallest first)
            all_idx = np.argsort(np.abs(eigenvalues))
        
        # Take the minimum required number
        stable_indices = all_idx[:min_modes]
        
        # Warn about having to use unstable modes
        if min_modes > 0:
            print(
                f"Warning: Only {len(np.where(np.real(eigenvalues) < 0)[0] if continuous_time else np.where(np.abs(eigenvalues) < lambda_cut)[0])} "
                f"stable modes found, using {min_modes} modes including potentially unstable ones"
            )
    
    # Limit to maximum number of modes if specified
    if max_modes is not None and len(stable_indices) > max_modes:
        stable_indices = stable_indices[:max_modes]
    
    # Extract stable eigenvalues and eigenvectors
    stable_eigenvalues = eigenvalues[stable_indices]
    stable_eigenvectors = eigenvectors[:, stable_indices]
    
    return stable_eigenvalues, stable_eigenvectors, stable_indices.tolist()


class KoopmanLyapunov:
    """
    Koopman-based Lyapunov function.
    
    This class implements a Lyapunov function based on the spectral
    decomposition of the Koopman operator. The function is of the form
    
    V(x) = Σ|ψ_i(x)|^2
    
    where ψ_i are Koopman eigenfunctions corresponding to stable eigenvalues.
    """
    
    def __init__(
        self,
        name: str,
        dictionary: StandardDictionary,
        k_matrix: np.ndarray,
        eigenvectors: np.ndarray,
        eigenvalues: np.ndarray,
        stable_indices: List[int],
        phi_origin: Optional[np.ndarray] = None,
        is_continuous: bool = False,
        dt: float = 1.0,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Initialize a Koopman-based Lyapunov function."""
        self.name = name
        self.dictionary = dictionary
        self.k_matrix = k_matrix
        self.eigenvectors = eigenvectors
        self.eigenvalues = eigenvalues
        self.stable_indices = stable_indices
        self.is_continuous = is_continuous
        self.dt = dt
        self.metadata = metadata or {}
        
        # Compute dictionary at origin if not provided
        if phi_origin is None:
            origin = np.zeros(dictionary.params.get("dim", 2))
            self.phi_origin = dictionary(origin)
        else:
            self.phi_origin = phi_origin
            
        # Precompute projection matrix for efficiency
        # We want to compute ψ_i(x) = v_i^T (Φ(x) - Φ(0))
        self.projection_matrix = eigenvectors[:, stable_indices].T
        
    def __call__(self, x: np.ndarray) -> np.ndarray:
        """Evaluate the Lyapunov function."""
        # Ensure x is 2D
        single_input = x.ndim == 1
        if single_input:
            x = x.reshape(1, -1)
        
        # Apply dictionary to state
        phi_x = self.dictionary(x)
        
        # Center around origin
        phi_x_centered = phi_x - self.phi_origin
        
        # Compute Koopman eigenfunctions: ψ_i(x) = v_i^T (Φ(x) - Φ(0))
        psi_x = self.projection_matrix @ phi_x_centered.T  # shape: (n_modes, n_samples)
        
        # Compute Lyapunov function: V(x) = Σ|ψ_i(x)|^2
        # Take sum of squared magnitudes of eigenfunctions
        v_x = np.sum(np.abs(psi_x) ** 2, axis=0)
        
        if single_input:
            return v_x[0]
        return v_x
        
    def gradient(self, x: np.ndarray) -> np.ndarray:
        """Compute the gradient of the Lyapunov function."""
        # For complex Koopman eigenfunctions, the gradient is more complex
        # We'll use numerical differentiation for now
        epsilon = 1e-6
        dim = len(x)
        grad = np.zeros(dim)
        
        for i in range(dim):
            # Create perturbation vectors
            x_plus = x.copy()
            x_plus[i] += epsilon
            x_minus = x.copy()
            x_minus[i] -= epsilon
            
            # Compute central difference
            grad[i] = (self(x_plus) - self(x_minus)) / (2 * epsilon)
            
        return grad
    
    def get_eigenfunction(self, idx: int) -> Callable[[np.ndarray], np.ndarray]:
        """Get a specific Koopman eigenfunction."""
        if idx < 0 or idx >= len(self.stable_indices):
            raise ValueError(f"Invalid eigenfunction index: {idx}")
        
        mode_idx = self.stable_indices[idx]
        eigenvector = self.eigenvectors[:, mode_idx]
        
        def eigenfunction(x: np.ndarray) -> np.ndarray:
            """Evaluate the Koopman eigenfunction."""
            # Ensure x is 2D
            single_input = x.ndim == 1
            if single_input:
                x = x.reshape(1, -1)
            
            # Apply dictionary to state
            phi_x = self.dictionary(x)
            
            # Center around origin
            phi_x_centered = phi_x - self.phi_origin
            
            # Compute eigenfunction: ψ(x) = v^T (Φ(x) - Φ(0))
            psi_x = eigenvector @ phi_x_centered.T
            
            if single_input:
                return psi_x[0]
            return psi_x
        
        return eigenfunction
    
    def get_eigenvalue(self, idx: int) -> complex:
        """Get a specific Koopman eigenvalue."""
        if idx < 0 or idx >= len(self.stable_indices):
            raise ValueError(f"Invalid eigenvalue index: {idx}")
        
        mode_idx = self.stable_indices[idx]
        return self.eigenvalues[mode_idx]


def create_koopman_lyapunov(
    name: str,
    k_matrix: np.ndarray,
    dictionary: StandardDictionary,
    lambda_cut: float = 0.99,
    continuous_time: bool = False,
    min_modes: int = 2,
    max_modes: Optional[int] = None,
    dt: float = 1.0,
    metadata: Optional[Dict[str, Any]] = None
) -> KoopmanLyapunov:
    """Create a Koopman-based Lyapunov function."""
    # Compute eigendecomposition
    eigenvalues, eigenvectors = np.linalg.eig(k_matrix)
    
    # Get stable modes
    stable_eigenvalues, stable_eigenvectors, stable_indices = get_stable_modes(
        eigenvalues=eigenvalues,
        eigenvectors=eigenvectors,
        lambda_cut=lambda_cut,
        continuous_time=continuous_time,
        min_modes=min_modes,
        max_modes=max_modes
    )
    
    # Create Lyapunov function
    return KoopmanLyapunov(
        name=name,
        dictionary=dictionary,
        k_matrix=k_matrix,
        eigenvectors=eigenvectors,
        eigenvalues=eigenvalues,
        stable_indices=stable_indices,
        is_continuous=continuous_time,
        dt=dt,
        metadata=metadata
    )


#####################################################################
# Demo implementation
#####################################################################

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
    if dict_type == "rbf":
        dictionary = create_rbf_dict(dim=state_dim, n_centers=dict_size)
    elif dict_type == "fourier":
        dictionary = create_fourier_dict(dim=state_dim, n_frequencies=dict_size)
    else:
        raise ValueError(f"Unknown dictionary type: {dict_type}")
    
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
    if dict_type == "rbf":
        dictionary = create_rbf_dict(dim=state_dim, n_centers=dict_size)
    elif dict_type == "fourier":
        dictionary = create_fourier_dict(dim=state_dim, n_frequencies=dict_size)
    else:
        raise ValueError(f"Unknown dictionary type: {dict_type}")
    
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
            # Skip points near the limit cycle
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
        choices=["rbf", "fourier"],
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
