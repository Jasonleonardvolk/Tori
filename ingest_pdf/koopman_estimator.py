"""koopman_estimator.py - Implements Takata's robust Koopman eigenfunction estimation.

This module provides a robust implementation of Koopman operator spectral 
analysis based on Takata's (2025) approach using the Yosida approximation 
of the Koopman generator. It enables:

1. Robust eigenfunction (ψ) estimation from noisy or sparse time series
2. Confidence intervals for spectral decomposition
3. Dominant frequency and mode extraction
4. Multiple basis function support for lifting observables

The Koopman operator K advances observables (measurement functions) forward in time.
Rather than directly approximating K, Takata's method approximates its generator,
providing better stability under noise and data limitations.
"""

import numpy as np
import scipy.linalg as la
from scipy import stats
from typing import Dict, List, Tuple, Optional, Union, Callable, Any
import logging
from dataclasses import dataclass, field
import time
import math

# Configure logger
logger = logging.getLogger("koopman_estimator")

@dataclass
class KoopmanEigenMode:
    """
    Represents a Koopman eigenfunction with associated metadata.
    
    A KoopmanEigenMode encapsulates a specific mode of the system dynamics,
    including its eigenfunction (ψ), eigenvalue (λ), and confidence metrics.
    
    Attributes:
        eigenfunction: The eigenfunction vector (ψ)
        eigenvalue: The associated eigenvalue (λ)
        frequency: The frequency of oscillation (derived from eigenvalue)
        damping_ratio: The damping ratio (growth/decay)
        confidence: Confidence score for this eigenfunction (0.0-1.0)
        variance_explained: Proportion of variance explained by this mode
        amplitude: Amplitude of this mode in the system
        phase: Phase of this mode in the system
        stability_index: Lyapunov-based stability metric
    """
    
    eigenfunction: np.ndarray  # ψ vector
    eigenvalue: complex  # λ value
    frequency: float = 0.0  # ω value derived from eigenvalue
    damping_ratio: float = 0.0  # Damping ratio (growth/decay)
    confidence: float = 1.0  # Confidence in eigenfunction estimate (0.0-1.0)
    variance_explained: float = 0.0  # Proportion of variance explained
    amplitude: float = 1.0  # Mode amplitude
    phase: float = 0.0  # Mode phase
    stability_index: float = 0.0  # Stability index based on Lyapunov theory
    confidence_intervals: Optional[np.ndarray] = None  # Optional confidence intervals for ψ
    resolvent_norm: float = 0.0  # Norm of the resolvent at this eigenvalue
    
    def __post_init__(self):
        """Calculate derived properties from eigenvalue."""
        if hasattr(self, 'eigenvalue') and self.eigenvalue is not None:
            # Calculate frequency from eigenvalue
            self.frequency = np.abs(np.angle(self.eigenvalue)) / (2 * np.pi)
            
            # Calculate damping ratio
            magnitude = np.abs(self.eigenvalue)
            self.damping_ratio = np.log(magnitude)  # Positive means growth, negative means decay

class BasisFunction:
    """
    Defines a basis function for lifting state variables to observables.
    
    Basis functions transform raw state variables into a higher-dimensional
    space where the Koopman operator acts linearly. This class provides
    common basis function types and utilities.
    """
    
    @staticmethod
    def identity(x: np.ndarray) -> np.ndarray:
        """Identity basis: g(x) = x"""
        return x
        
    @staticmethod
    def polynomial(degree: int = 2) -> Callable:
        """
        Polynomial basis up to specified degree.
        
        Args:
            degree: Maximum polynomial degree
            
        Returns:
            Function that transforms input to polynomial basis
        """
        def poly_basis(x: np.ndarray) -> np.ndarray:
            """Apply polynomial basis transform."""
            if x.ndim == 1:
                x = x.reshape(-1, 1)
                
            n_samples, n_features = x.shape
            result = [np.ones((n_samples, 1))]  # Constant term
            
            # Linear terms
            result.append(x)
            
            # Higher-order terms up to degree
            for d in range(2, degree+1):
                # Add pure powers: x_i^d
                for i in range(n_features):
                    result.append(x[:, i:i+1] ** d)
                    
                # Add mixed terms: x_i * x_j * ... (for different i,j,...)
                if n_features > 1:
                    # Generate mixed terms (this is a simple version)
                    for i in range(n_features):
                        for j in range(i+1, n_features):
                            result.append(x[:, i:i+1] ** (d-1) * x[:, j:j+1])
            
            return np.hstack(result)
            
        return poly_basis
        
    @staticmethod
    def fourier(n_harmonics: int = 3) -> Callable:
        """
        Fourier basis with specified number of harmonics.
        
        Args:
            n_harmonics: Number of harmonic terms
            
        Returns:
            Function that transforms input to Fourier basis
        """
        def fourier_basis(x: np.ndarray) -> np.ndarray:
            """Apply Fourier basis transform."""
            if x.ndim == 1:
                x = x.reshape(-1, 1)
                
            n_samples, n_features = x.shape
            result = [np.ones((n_samples, 1))]  # Constant term
            
            # Add original features
            result.append(x)
            
            # Rescale x to approximate [-π,π] range for trig functions
            x_scaled = 2 * np.pi * (x - np.min(x, axis=0)) / (np.max(x, axis=0) - np.min(x, axis=0) + 1e-10) - np.pi
            
            # Add sin/cos terms for each feature and harmonic
            for i in range(n_features):
                xi = x_scaled[:, i:i+1]
                for h in range(1, n_harmonics+1):
                    result.append(np.sin(h * xi))
                    result.append(np.cos(h * xi))
            
            return np.hstack(result)
            
        return fourier_basis
        
    @staticmethod
    def radial(centers: np.ndarray, sigma: float = 1.0) -> Callable:
        """
        Radial basis functions centered at specified points.
        
        Args:
            centers: Array of center points for RBFs
            sigma: Width parameter for RBFs
            
        Returns:
            Function that transforms input to RBF basis
        """
        def rbf_basis(x: np.ndarray) -> np.ndarray:
            """Apply RBF basis transform."""
            if x.ndim == 1:
                x = x.reshape(-1, 1)
                
            n_samples = x.shape[0]
            n_centers = centers.shape[0]
            result = [np.ones((n_samples, 1))]  # Constant term
            
            # Add original features
            result.append(x)
            
            # Add RBF terms
            rbf_terms = np.zeros((n_samples, n_centers))
            for i in range(n_centers):
                # Compute squared distances
                diff = x - centers[i]
                dist_sq = np.sum(diff**2, axis=1).reshape(-1, 1)
                rbf_terms[:, i:i+1] = np.exp(-dist_sq / (2 * sigma**2))
                
            result.append(rbf_terms)
            return np.hstack(result)
            
        return rbf_basis

class KoopmanEstimator:
    """
    Implements Takata's Koopman eigenfunction estimation with Yosida approximation.
    
    This class estimates the Koopman operator and its eigenfunctions from time series
    data, providing robust estimates even under noise and data limitations. It uses
    the Yosida approximation of the Koopman generator for improved stability.
    
    Attributes:
        basis_type: Type of basis functions to use
        basis_params: Parameters for basis function
        dt: Time step between samples
        regularization: Regularization parameter for DMD
        n_eigenfunctions: Number of eigenfunctions to compute
        confidence_level: Confidence level for intervals (0.0-1.0)
        frequency_threshold: Min frequency to consider oscillatory
    """
    
    def __init__(
        self,
        basis_type: str = "fourier",
        basis_params: Dict[str, Any] = None,
        dt: float = 1.0,
        regularization: float = 1e-3,
        n_eigenfunctions: int = 5,
        confidence_level: float = 0.95,
        frequency_threshold: float = 1e-3
    ):
        """
        Initialize the KoopmanEstimator.
        
        Args:
            basis_type: Type of basis ("polynomial", "fourier", "radial", "identity")
            basis_params: Parameters for basis function
            dt: Time step between samples
            regularization: Regularization parameter for DMD
            n_eigenfunctions: Number of eigenfunctions to compute
            confidence_level: Confidence level for intervals (0.0-1.0)
            frequency_threshold: Min frequency to consider oscillatory
        """
        self.basis_type = basis_type
        self.basis_params = basis_params or {}
        self.dt = dt
        self.regularization = regularization
        self.n_eigenfunctions = n_eigenfunctions
        self.confidence_level = confidence_level
        self.frequency_threshold = frequency_threshold
        
        # Initialize basis function
        self.basis_function = self._get_basis_function()
        
        # Results storage
        self.eigenmodes: List[KoopmanEigenMode] = []
        self.generator: Optional[np.ndarray] = None
        self.koopman_operator: Optional[np.ndarray] = None
        self.X_lifted: Optional[np.ndarray] = None
        self.Y_lifted: Optional[np.ndarray] = None
        
    def _get_basis_function(self) -> Callable:
        """
        Get the specified basis function.
        
        Returns:
            Callable implementing the basis function
        """
        if self.basis_type == "polynomial":
            degree = self.basis_params.get("degree", 2)
            return BasisFunction.polynomial(degree)
        elif self.basis_type == "fourier":
            n_harmonics = self.basis_params.get("n_harmonics", 3)
            return BasisFunction.fourier(n_harmonics)
        elif self.basis_type == "radial":
            centers = self.basis_params.get("centers", None)
            sigma = self.basis_params.get("sigma", 1.0)
            if centers is None:
                raise ValueError("Centers must be provided for radial basis functions")
            return BasisFunction.radial(centers, sigma)
        elif self.basis_type == "identity":
            return BasisFunction.identity
        else:
            raise ValueError(f"Unknown basis type: {self.basis_type}")
            
    def fit(self, X: np.ndarray, max_rank: Optional[int] = None) -> 'KoopmanEstimator':
        """
        Fit the Koopman model to time series data.
        
        Args:
            X: Time series data with shape (n_samples, n_features)
                where rows are sequential time steps
            max_rank: Maximum rank for SVD truncation (optional)
            
        Returns:
            self: The fitted estimator
        """
        if X.ndim == 1:
            X = X.reshape(-1, 1)
            
        # Get number of samples and snapshot pairs
        n_samples, n_features = X.shape
        n_pairs = n_samples - 1
        
        # Get snapshot pairs
        X_snapshots = X[:-1]  # State at time t
        Y_snapshots = X[1:]   # State at time t+1
        
        # Lift snapshots to observable space
        X_lifted = self.basis_function(X_snapshots)
        Y_lifted = self.basis_function(Y_snapshots)
        
        # Store lifted data for diagnostics
        self.X_lifted = X_lifted
        self.Y_lifted = Y_lifted
        
        # Compute Yosida approximation of the Koopman generator
        # G ≈ (Y - X) * X† (instead of K ≈ Y * X†)
        try:
            # Calculate difference between consecutive snapshots
            # This approximates the time derivative (for the generator)
            dX = (Y_lifted - X_lifted) / self.dt
            
            # SVD of X_lifted for pseudoinverse with truncation
            U, Sigma, Vh = la.svd(X_lifted, full_matrices=False)
            
            # Determine rank for truncation
            rank = max_rank if max_rank is not None else min(X_lifted.shape)
            
            # Apply threshold to singular values to avoid numerical issues
            threshold = self.regularization * np.max(Sigma)
            rank = min(rank, np.sum(Sigma > threshold))
            
            # Truncated pseudoinverse of X_lifted using SVD components
            Sigma_inv = np.zeros((rank,))
            Sigma_inv = 1.0 / Sigma[:rank]
            
            # Compute generator using truncated SVD
            self.generator = dX @ (Vh[:rank].T * Sigma_inv) @ U[:, :rank].T
            
            # Compute Koopman operator as matrix exponential of generator*dt
            self.koopman_operator = la.expm(self.generator * self.dt)
            
            # Compute eigenmodes
            self._compute_eigenmodes()
            
            logger.info(f"Successfully fitted Koopman model with rank {rank}")
            return self
            
        except Exception as e:
            logger.error(f"Error fitting Koopman model: {e}")
            raise
            
    def _compute_eigenmodes(self) -> None:
        """
        Compute eigenmodes of the Koopman generator and operator.
        
        This implements Takata's approach using the resolvent to compute
        robust eigenfunction estimates with confidence intervals.
        """
        # Compute eigendecomposition of generator
        # This gives more stable results for the continuous dynamics
        try:
            eigvals, eigvecs = la.eig(self.generator)
            
            # Sort eigenvalues by magnitude of imaginary part (frequency)
            # This prioritizes oscillatory modes
            idx = np.argsort(-np.abs(np.imag(eigvals)))
            eigvals = eigvals[idx]
            eigvecs = eigvecs[:, idx]
            
            # Limit to requested number of eigenfunctions
            n_modes = min(self.n_eigenfunctions, len(eigvals))
            
            # Clear previous eigenmodes
            self.eigenmodes = []
            
            # Compute variance explained by each mode
            total_var = np.sum(np.var(self.X_lifted, axis=0))
            
            # Bootstrap for confidence intervals if we have enough data
            n_samples = self.X_lifted.shape[0]
            bootstrap_ci = n_samples >= 30
            n_bootstrap = 100 if bootstrap_ci else 0
            
            # Process each eigenmode
            for i in range(n_modes):
                eigenvalue = eigvals[i]
                eigenfunction = eigvecs[:, i]
                
                # Mode amplitude
                mode_amplitude = np.abs(np.mean(np.dot(self.X_lifted, eigenfunction)))
                
                # Variance explained
                projection = self.X_lifted @ eigenfunction
                mode_var = np.var(projection)
                var_explained = mode_var / total_var if total_var > 0 else 0
                
                # Compute resolvent norm (used for Yosida approximation quality)
                resolvent_norm = np.linalg.norm(
                    np.linalg.inv(np.eye(self.generator.shape[0]) - eigenvalue * self.generator)
                )
                
                # Compute confidence intervals using bootstrap if enabled
                conf_intervals = None
                confidence = 1.0
                
                if bootstrap_ci:
                    # Bootstrap samples
                    bootstrap_eigenfuncs = np.zeros((n_bootstrap, eigvecs.shape[0]), dtype=complex)
                    
                    for b in range(n_bootstrap):
                        # Sample with replacement
                        bootstrap_indices = np.random.choice(n_samples-1, n_samples-1, replace=True)
                        X_boot = self.X_lifted[bootstrap_indices]
                        Y_boot = self.Y_lifted[bootstrap_indices]
                        dX_boot = (Y_boot - X_boot) / self.dt
                        
                        # SVD of bootstrap sample
                        try:
                            # Simplified for bootstrap - less regularization
                            U_boot, Sigma_boot, Vh_boot = la.svd(X_boot, full_matrices=False)
                            
                            # Use same rank as original
                            rank_boot = min(len(Sigma_boot), eigvecs.shape[0])
                            Sigma_inv_boot = 1.0 / Sigma_boot[:rank_boot]
                            
                            # Generator for bootstrap sample
                            G_boot = dX_boot @ (Vh_boot[:rank_boot].T * Sigma_inv_boot) @ U_boot[:, :rank_boot].T
                            
                            # Eigendecomposition
                            eigvals_boot, eigvecs_boot = la.eig(G_boot)
                            
                            # Find closest eigenvalue to original
                            idx_boot = np.argmin(np.abs(eigvals_boot - eigenvalue))
                            bootstrap_eigenfuncs[b] = eigvecs_boot[:, idx_boot]
                            
                        except Exception as e:
                            # If bootstrap fails, use original
                            bootstrap_eigenfuncs[b] = eigenfunction
                    
                    # Mean and standard deviation of bootstrap samples
                    bootstrap_mean = np.mean(bootstrap_eigenfuncs, axis=0)
                    bootstrap_std = np.std(bootstrap_eigenfuncs, axis=0)
                    
                    # Confidence interval
                    z_score = stats.norm.ppf((1 + self.confidence_level) / 2)
                    margin = z_score * bootstrap_std
                    conf_intervals = np.vstack([
                        bootstrap_mean - margin,
                        bootstrap_mean + margin
                    ])
                    
                    # Confidence score based on coefficient of variation
                    cv = np.mean(bootstrap_std / np.abs(bootstrap_mean + 1e-10))
                    confidence = 1.0 / (1.0 + cv)
                
                # Create eigenmode object
                eigenmode = KoopmanEigenMode(
                    eigenfunction=eigenfunction,
                    eigenvalue=eigenvalue,
                    confidence=confidence,
                    variance_explained=var_explained,
                    amplitude=mode_amplitude,
                    confidence_intervals=conf_intervals,
                    resolvent_norm=resolvent_norm
                )
                
                self.eigenmodes.append(eigenmode)
                
            logger.info(f"Computed {len(self.eigenmodes)} Koopman eigenmodes")
            
        except Exception as e:
            logger.error(f"Error computing eigenmodes: {e}")
            raise
            
    def predict(self, X: np.ndarray, n_steps: int = 1) -> np.ndarray:
        """
        Predict future states using the fitted Koopman model.
        
        Args:
            X: Initial states with shape (n_samples, n_features)
            n_steps: Number of steps to predict forward
            
        Returns:
            Predicted states after n_steps
        """
        if self.koopman_operator is None:
            raise ValueError("Koopman model not fitted. Call fit() first.")
            
        if X.ndim == 1:
            X = X.reshape(1, -1)
            
        # Lift initial state
        X_lifted = self.basis_function(X)
        
        # Evolve lifted state using Koopman operator
        Y_lifted = X_lifted @ np.linalg.matrix_power(self.koopman_operator, n_steps)
        
        # Project back to state space (use only the original state variables)
        n_features = X.shape[1]
        return Y_lifted[:, 1:n_features+1]  # Skip constant term, take original features
    
    def get_dominant_mode(self) -> KoopmanEigenMode:
        """
        Get the dominant eigenmode based on oscillation.
        
        Returns:
            The dominant KoopmanEigenMode
        """
        if not self.eigenmodes:
            raise ValueError("No eigenmodes computed. Call fit() first.")
            
        # Prefer oscillatory modes with higher confidence
        oscillatory_modes = [
            mode for mode in self.eigenmodes 
            if mode.frequency > self.frequency_threshold
        ]
        
        if oscillatory_modes:
            # Sort by confidence and variance explained
            sorted_modes = sorted(
                oscillatory_modes,
                key=lambda m: (m.confidence, m.variance_explained),
                reverse=True
            )
            return sorted_modes[0]
        else:
            # If no oscillatory modes, return mode with highest confidence
            return max(self.eigenmodes, key=lambda m: m.confidence)
    
    def get_mode_by_frequency(self, target_freq: float, tolerance: float = 0.05) -> Optional[KoopmanEigenMode]:
        """
        Get eigenmode with frequency closest to target.
        
        Args:
            target_freq: Target frequency to match
            tolerance: Acceptable frequency deviation
            
        Returns:
            KoopmanEigenMode with matching frequency or None
        """
        if not self.eigenmodes:
            raise ValueError("No eigenmodes computed. Call fit() first.")
            
        # Find modes within tolerance of target frequency
        candidates = [
            mode for mode in self.eigenmodes
            if abs(mode.frequency - target_freq) <= tolerance
        ]
        
        if not candidates:
            return None
            
        # Return the one with highest confidence
        return max(candidates, key=lambda m: m.confidence)
            
    def compute_phase_field(self, X: np.ndarray, mode_index: int = 0) -> np.ndarray:
        """
        Compute phase field for a specific mode at given states.
        
        Args:
            X: States with shape (n_samples, n_features)
            mode_index: Index of eigenmode to use
            
        Returns:
            Complex phase values at each state
        """
        if mode_index >= len(self.eigenmodes):
            raise ValueError(f"Mode index {mode_index} out of range (max {len(self.eigenmodes)-1})")
            
        # Get eigenfunction
        mode = self.eigenmodes[mode_index]
        eigenfunction = mode.eigenfunction
        
        # Lift states
        X_lifted = self.basis_function(X)
        
        # Project states onto eigenfunction
        return X_lifted @ eigenfunction
        
    def estimate_phase_difference(
        self, 
        X1: np.ndarray, 
        X2: np.ndarray, 
        mode_index: int = 0
    ) -> Tuple[float, float]:
        """
        Estimate phase difference between two states or state clusters.
        
        Args:
            X1: First state/cluster with shape (n_samples1, n_features)
            X2: Second state/cluster with shape (n_samples2, n_features)
            mode_index: Index of eigenmode to use
            
        Returns:
            Tuple of (phase_difference, confidence)
        """
        # Ensure X1 and X2 are 2D
        if X1.ndim == 1:
            X1 = X1.reshape(1, -1)
        if X2.ndim == 1:
            X2 = X2.reshape(1, -1)
            
        # Compute phase fields
        phase_field1 = self.compute_phase_field(X1, mode_index)
        phase_field2 = self.compute_phase_field(X2, mode_index)
        
        # Average phase for each cluster
        mean_phase1 = np.angle(np.mean(phase_field1))
        mean_phase2 = np.angle(np.mean(phase_field2))
        
        # Phase difference
        phase_diff = (mean_phase2 - mean_phase1 + np.pi) % (2 * np.pi) - np.pi
        
        # Compute confidence
        # Based on phase variance within clusters
        var1 = np.var(np.angle(phase_field1))
        var2 = np.var(np.angle(phase_field2))
        
        # Higher variance → lower confidence
        confidence = 1.0 / (1.0 + np.sqrt(var1 + var2))
        
        return phase_diff, confidence
        
    def estimate_lyapunov_exponent(self, X: np.ndarray, perturbation_size: float = 1e-6, n_steps: int = 10) -> float:
        """
        Estimate maximum Lyapunov exponent using the fitted model.
        
        Args:
            X: Reference state trajectory with shape (n_samples, n_features)
            perturbation_size: Size of initial perturbation
            n_steps: Number of steps for divergence calculation
            
        Returns:
            Estimated maximum Lyapunov exponent
        """
        if X.ndim == 1:
            X = X.reshape(1, -1)
            
        n_samples, n_features = X.shape
        
        # Generate random perturbation
        perturbation = np.random.normal(0, perturbation_size, (1, n_features))
        
        # Initial states: reference and perturbed
        X_ref = X[0:1]
        X_pert = X_ref + perturbation
        
        # Normalize initial separation
        initial_dist = np.linalg.norm(perturbation)
        
        # Evolve both states
        dists = [initial_dist]
        
        for t in range(1, n_steps+1):
            # Predict next states
            X_ref_next = self.predict(X_ref)
            X_pert_next = self.predict(X_pert)
            
            # Measure separation
            separation = X_pert_next - X_ref_next
            dist = np.linalg.norm(separation)
            dists.append(dist)
            
            # Update states
            X_ref = X_ref_next
            X_pert = X_pert_next
            
        # Compute Lyapunov exponent from exponential growth rate
        # λ = (1/T) * ln(d_T/d_0)
        lyapunov = np.log(dists[-1] / dists[0]) / (n_steps * self.dt)
        
        return lyapunov
        
    def estimate_psi_robust(
        self, 
        X: np.ndarray, 
        window: int = 5,
        basis: str = "Fourier"
    ) -> Tuple[np.ndarray, float]:
        """
        Compute robust Koopman eigenfunction estimate using Takata's approach.
        
        Args:
            X: Time series data with shape (n_samples, n_features)
            window: Window size for local fits
            basis: Basis function type ("Fourier", "Polynomial", "Radial")
            
        Returns:
            Tuple of (psi_estimate, confidence_score)
        """
        # Initialize with default basis parameters based on type
        if basis.lower() == "fourier":
            self.basis_type = "fourier"
            self.basis_params = {"n_harmonics": 3}
        elif basis.lower() == "polynomial":
            self.basis_type = "polynomial"
            self.basis_params = {"degree": 2}
        elif basis.lower() == "radial":
            # For radial basis, we need to determine centers from data
            self.basis_type = "radial"
            # Simple strategy: K-means centers or random subsample of data
            n_centers = min(10, X.shape[0])
            
            # Random subsample as centers for simplicity
            if X.shape[0] > n_centers:
                centers_idx = np.random.choice(X.shape[0], n_centers, replace=False)
                centers = X[centers_idx]
            else:
                centers = X.copy()
                
            self.basis_params = {"centers": centers, "sigma": 1.0}
        else:
            raise ValueError(f"Unknown basis type: {basis}")
            
        # Update basis function
        self.basis_function = self._get_basis_function()
        
        # Fit model to full data
        self.fit(X)
        
        # Get dominant mode
        dominant_mode = self.get_dominant_mode()
        psi_full = dominant_mode.eigenfunction
        confidence_full = dominant_mode.confidence
        
        # If window size permits, perform windowed analysis for robustness
        windowed_estimates = []
        
        if X.shape[0] >= 2 * window:
            # Create overlapping windows
            n_windows = X.shape[0] - window + 1
            
            # Subsample windows to avoid excessive computation
            max_windows = 10
            window_indices = np.linspace(0, n_windows-1, min(max_windows, n_windows), dtype=int)
            
            for start_idx in window_indices:
                window_data = X[start_idx:start_idx+window]
                
                try:
                    # Fit to window
                    window_estimator = KoopmanEstimator(
                        basis_type=self.basis_type,
                        basis_params=self.basis_params,
                        dt=self.dt
                    )
                    window_estimator.fit(window_data)
                    
                    # Get dominant mode from window
                    window_mode = window_estimator.get_dominant_mode()
                    
                    # Align phase with full estimate for consistency
                    alignment = np.inner(window_mode.eigenfunction, psi_full)
                    phase_correction = np.angle(alignment)
                    aligned_eigenfunction = window_mode.eigenfunction * np.exp(-1j * phase_correction)
                    
                    windowed_estimates.append((aligned_eigenfunction, window_mode.confidence))
                    
                except Exception:
                    # Skip failed windows
                    continue
        
        # If we have windowed estimates, compute weighted average
        if windowed_estimates:
            # Weight by confidence
