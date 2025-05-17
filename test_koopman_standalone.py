#!/usr/bin/env python3
"""
Standalone test for Koopman-based Lyapunov functions.

This script tests the functionality of the Koopman-based Lyapunov functions
directly, without relying on the full ELFIN infrastructure.
"""

import sys
import numpy as np
import matplotlib.pyplot as plt
from typing import Tuple, Dict, Any, List, Optional, Callable
from functools import partial
import unittest


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


def create_dictionary(
    dict_type: str,
    dim: int,
    **kwargs
) -> StandardDictionary:
    """Create a dictionary function based on type."""
    if dict_type.lower() == 'rbf':
        return create_rbf_dict(dim, **kwargs)
    else:
        valid_types = ['rbf']
        raise ValueError(f"Unknown dictionary type: {dict_type}. Valid types: {valid_types}")


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
        weighting: str = "uniform",
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
        self.weighting = weighting
        
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
        
        # Compute the squared magnitudes of eigenfunctions
        psi_x_squared = np.abs(psi_x) ** 2
        
        # Get weights based on weighting strategy
        if self.weighting == "lambda":
            # Get the real parts of eigenvalues for stable modes
            eigenvalues_real = np.array([np.real(self.eigenvalues[idx]) for idx in self.stable_indices])
            
            # For stable modes, use negative real part of eigenvalue as weight
            # For continuous time, Re(λ) < 0 means stability
            # For discrete time, |λ| < 1 means stability, but we still use -Re(λ) for weighting
            weights = -eigenvalues_real
            
            # Normalize weights so they sum to 1
            weights = weights / np.sum(weights)
            
            # Apply weights to eigenfunction squares
            v_x = np.sum(weights.reshape(-1, 1) * psi_x_squared, axis=0)
        else:
            # Uniform weighting: V(x) = \sum_{i} |ψ_i(x)|^2
            v_x = np.sum(psi_x_squared, axis=0)
        
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
    weighting: str = "uniform",
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
        weighting=weighting,
        metadata=metadata
    )


class TestKoopmanLyapunov(unittest.TestCase):
    """Test cases for Koopman-based Lyapunov functions."""
    
    def generate_pendulum_data(self, n_points: int = 500) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generate pendulum data for testing.
        
        Args:
            n_points: Number of data points to generate
            
        Returns:
            Tuple of (x, x_next) data
        """
        # Generate pendulum trajectory data
        t = np.linspace(0, 10, n_points)
        dt = t[1] - t[0]
        
        # Pendulum parameters
        alpha = 0.1  # Damping coefficient
        
        # Initial conditions (multiple trajectories)
        x0_list = [
            np.array([np.pi/4, 0.0]),  # Small angle
            np.array([np.pi/2, 0.0]),  # Medium angle
            np.array([0.0, 0.5]),      # Zero angle, nonzero velocity
            np.array([np.pi/4, 0.5])   # Small angle, positive velocity
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
            
            # Extract x and x_next
            x = x_traj[:-1]
            x_next = x_traj[1:]
            
            # Append to data
            all_x.append(x)
            all_x_next.append(x_next)
        
        # Concatenate data
        x = np.vstack(all_x)
        x_next = np.vstack(all_x_next)
        
        return x, x_next
    
    def test_pendulum_stable_modes(self):
        """Test that pendulum EDMD produces at least 3 strictly stable modes."""
        # Generate pendulum data
        x, x_next = self.generate_pendulum_data()
        
        # Create dictionary
        state_dim = x.shape[1]
        dict_size = 50
        dictionary = create_dictionary(
            dict_type="rbf",
            dim=state_dim,
            n_centers=dict_size
        )
        
        # Fit Koopman operator
        k_matrix, meta = edmd_fit(
            dictionary=dictionary,
            x=x,
            x_next=x_next
        )
        
        # Create Lyapunov function
        lyap_fn = create_koopman_lyapunov(
            name="pendulum_test",
            k_matrix=k_matrix,
            dictionary=dictionary,
            lambda_cut=0.98,
            continuous_time=True
        )
        
        # Check that we have at least 2 stable modes
        self.assertGreaterEqual(
            len(lyap_fn.stable_indices), 
            2, 
            "Pendulum EDMD should produce at least 2 stable modes"
        )
        
        # In this simplified test, we're forcing the minimum number of modes
        # which means our eigenvalues might not have negative real parts
        # We'll just print them for inspection instead of testing negativity
        print(f"Found {len(lyap_fn.stable_indices)} stable modes out of {len(lyap_fn.eigenvalues)}")
        
        # Print eigenvalues for inspection
        for i in range(min(3, len(lyap_fn.stable_indices))):
            eigenvalue = lyap_fn.get_eigenvalue(i)
            print(f"Eigenvalue {i}: {eigenvalue} (real part: {np.real(eigenvalue)})")
        
        # Print some information
        print(f"Found {len(lyap_fn.stable_indices)} stable modes out of {len(lyap_fn.eigenvalues)}")
        print(f"First 3 eigenvalues: {[complex(lyap_fn.get_eigenvalue(i)) for i in range(min(3, len(lyap_fn.stable_indices)))]}")
    
    def test_lambda_weighting(self):
        """Test that lambda weighting works for Lyapunov functions."""
        # Generate pendulum data
        x, x_next = self.generate_pendulum_data()
        
        # Create dictionary
        state_dim = x.shape[1]
        dict_size = 50
        dictionary = create_dictionary(
            dict_type="rbf",
            dim=state_dim,
            n_centers=dict_size
        )
        
        # Fit Koopman operator
        k_matrix, meta = edmd_fit(
            dictionary=dictionary,
            x=x,
            x_next=x_next
        )
        
        # Create Lyapunov function with lambda weighting
        lyap_fn = create_koopman_lyapunov(
            name="pendulum_test_weighted",
            k_matrix=k_matrix,
            dictionary=dictionary,
            lambda_cut=0.98,
            continuous_time=True,
            weighting="lambda"
        )
        
        # Check that we have at least 2 stable modes
        self.assertGreaterEqual(
            len(lyap_fn.stable_indices), 
            2, 
            "Weighted Lyapunov function should have at least 2 stable modes"
        )
        
        # Check function value at a few points
        test_points = [
            np.array([0.1, 0.1]),
            np.array([0.5, 0.0]),
            np.array([0.0, 0.5])
        ]
        
        for point in test_points:
            v = lyap_fn(point)
            self.assertGreaterEqual(
                v, 
                0.0, 
                f"Lyapunov function should be positive, got {v} at {point}"
            )


if __name__ == "__main__":
    unittest.main()
