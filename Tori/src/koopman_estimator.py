#!/usr/bin/env python3
"""
TORI Koopman Estimator
Implements Koopman spectral analysis for concept activation patterns
Extracts eigenmodes and dominant frequencies from memory dynamics
"""

import numpy as np
import scipy
from scipy.linalg import eig, svd, pinv
from scipy.sparse import csr_matrix
from sklearn.decomposition import PCA
import warnings
from typing import Dict, List, Tuple, Optional, Union
from dataclasses import dataclass
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class KoopmanMode:
    """Represents a Koopman eigenmode"""
    eigenvalue: complex
    eigenfunction: np.ndarray
    frequency: float
    growth_rate: float
    mode_id: str
    stability_index: float
    sparsity: float
    concepts: List[str]
    weights: np.ndarray

@dataclass
class ActivationSnapshot:
    """Single activation snapshot in time"""
    timestamp: float
    concepts: List[str]
    activations: np.ndarray
    phase_data: Optional[np.ndarray] = None
    metadata: Optional[Dict] = None

class KoopmanEstimator:
    """
    Koopman Spectral Analysis Engine for TORI Memory Systems
    
    Extracts dominant eigenmodes from concept activation traces to understand
    the underlying dynamical structure of memory patterns.
    """
    
    def __init__(self, 
                 max_modes: int = 50,
                 min_singular_value: float = 1e-6,
                 time_delay: int = 1,
                 use_sparse: bool = True,
                 stability_threshold: float = 0.95):
        """
        Initialize Koopman estimator
        
        Args:
            max_modes: Maximum number of modes to extract
            min_singular_value: Threshold for SVD truncation
            time_delay: Time delay for embedding (default 1)
            use_sparse: Use sparse matrix operations when possible
            stability_threshold: Minimum eigenvalue magnitude for stable modes
        """
        self.max_modes = max_modes
        self.min_singular_value = min_singular_value
        self.time_delay = time_delay
        self.use_sparse = use_sparse
        self.stability_threshold = stability_threshold
        
        # Internal state
        self.modes: List[KoopmanMode] = []
        self.eigenvalues: np.ndarray = None
        self.eigenvectors: np.ndarray = None
        self.concept_names: List[str] = []
        self.last_update: datetime = None
        
        # Performance metrics
        self.reconstruction_error: float = 0.0
        self.prediction_error: float = 0.0
        self.mode_sparsity: float = 0.0
        
        logger.info(f"Initialized KoopmanEstimator with max_modes={max_modes}")
    
    def process_activation_traces(self, 
                                traces: List[List[ActivationSnapshot]], 
                                update_modes: bool = True) -> Dict:
        """
        Process multiple activation traces to extract Koopman modes
        
        Args:
            traces: List of activation trace sequences
            update_modes: Whether to update internal mode storage
            
        Returns:
            Dictionary containing analysis results
        """
        logger.info(f"Processing {len(traces)} activation traces")
        
        try:
            # Concatenate all traces into a single dataset
            all_snapshots = []
            for trace in traces:
                all_snapshots.extend(trace)
            
            if len(all_snapshots) < 2:
                raise ValueError("Need at least 2 snapshots for Koopman analysis")
            
            # Extract activation matrix
            X, concept_names = self._build_activation_matrix(all_snapshots)
            
            # Perform Koopman analysis
            modes, eigenvalues, reconstruction_error = self._compute_koopman_modes(X)
            
            # Update internal state if requested
            if update_modes:
                self.modes = modes
                self.eigenvalues = eigenvalues
                self.concept_names = concept_names
                self.reconstruction_error = reconstruction_error
                self.last_update = datetime.now()
            
            # Calculate metrics
            prediction_error = self._calculate_prediction_error(X, modes, eigenvalues)
            mode_sparsity = self._calculate_mode_sparsity(modes)
            
            results = {
                'modes_extracted': len(modes),
                'dominant_eigenvalues': eigenvalues[:min(10, len(eigenvalues))],
                'reconstruction_error': reconstruction_error,
                'prediction_error': prediction_error,
                'mode_sparsity': mode_sparsity,
                'stable_modes': sum(1 for mode in modes if mode.stability_index > self.stability_threshold),
                'processing_timestamp': datetime.now(),
                'concept_count': len(concept_names)
            }
            
            logger.info(f"Extracted {len(modes)} modes with reconstruction error {reconstruction_error:.6f}")
            return results
            
        except Exception as e:
            logger.error(f"Error processing activation traces: {e}")
            raise
    
    def _build_activation_matrix(self, snapshots: List[ActivationSnapshot]) -> Tuple[np.ndarray, List[str]]:
        """Build activation matrix from snapshots"""
        
        # Collect all unique concepts
        all_concepts = set()
        for snapshot in snapshots:
            all_concepts.update(snapshot.concepts)
        
        concept_names = sorted(list(all_concepts))
        concept_to_idx = {name: idx for idx, name in enumerate(concept_names)}
        
        # Build activation matrix
        n_snapshots = len(snapshots)
        n_concepts = len(concept_names)
        
        X = np.zeros((n_concepts, n_snapshots))
        
        for t, snapshot in enumerate(snapshots):
            for i, concept in enumerate(snapshot.concepts):
                if concept in concept_to_idx:
                    concept_idx = concept_to_idx[concept]
                    if i < len(snapshot.activations):
                        X[concept_idx, t] = snapshot.activations[i]
                    else:
                        X[concept_idx, t] = 1.0  # Default activation
        
        return X, concept_names
    
    def _compute_koopman_modes(self, X: np.ndarray) -> Tuple[List[KoopmanMode], np.ndarray, float]:
        """
        Compute Koopman modes using Dynamic Mode Decomposition (DMD)
        """
        n_features, n_timesteps = X.shape
        
        if n_timesteps < 2:
            raise ValueError("Need at least 2 timesteps for DMD")
        
        # Split data into current and next states
        X1 = X[:, :-1]  # Current states
        X2 = X[:, 1:]   # Next states
        
        # Perform SVD on X1
        U, Sigma, Vt = svd(X1, full_matrices=False)
        
        # Truncate based on singular value threshold
        r = np.sum(Sigma > self.min_singular_value)
        r = min(r, self.max_modes, len(Sigma))
        
        U_r = U[:, :r]
        Sigma_r = Sigma[:r]
        V_r = Vt[:r, :].T
        
        # Compute low-dimensional linear operator
        A_tilde = U_r.T @ X2 @ V_r @ np.diag(1.0 / Sigma_r)
        
        # Eigendecomposition of A_tilde
        eigenvalues, W = eig(A_tilde)
        
        # Compute high-dimensional eigenvectors (DMD modes)
        Phi = (X2 @ V_r @ np.diag(1.0 / Sigma_r)) @ W
        
        # Calculate reconstruction error
        X1_recon = Phi @ np.diag(eigenvalues) @ pinv(Phi) @ X1
        reconstruction_error = np.linalg.norm(X2 - X1_recon, 'fro') / np.linalg.norm(X2, 'fro')
        
        # Sort by eigenvalue magnitude
        sorted_indices = np.argsort(np.abs(eigenvalues))[::-1]
        eigenvalues = eigenvalues[sorted_indices]
        Phi = Phi[:, sorted_indices]
        
        # Convert to KoopmanMode objects
        modes = []
        for i, (eigenval, eigenvec) in enumerate(zip(eigenvalues, Phi.T)):
            
            # Calculate frequency and growth rate
            frequency = np.abs(np.imag(eigenval)) / (2 * np.pi)
            growth_rate = np.real(eigenval)
            
            # Calculate stability index
            stability_index = np.abs(eigenval)
            
            # Calculate sparsity (percentage of near-zero components)
            sparsity = np.sum(np.abs(eigenvec) < 1e-3) / len(eigenvec)
            
            # Find dominant concepts for this mode
            sorted_indices = np.argsort(np.abs(eigenvec))[::-1]
            n_top = min(5, len(sorted_indices))
            top_concepts = [self.concept_names[idx] for idx in sorted_indices[:n_top]]
            top_weights = eigenvec[sorted_indices[:n_top]]
            
            mode = KoopmanMode(
                eigenvalue=eigenval,
                eigenfunction=eigenvec,
                frequency=frequency,
                growth_rate=growth_rate,
                mode_id=f"mode_{i}_{datetime.now().strftime('%H%M%S')}",
                stability_index=stability_index,
                sparsity=sparsity,
                concepts=top_concepts,
                weights=top_weights
            )
            
            modes.append(mode)
        
        return modes, eigenvalues, reconstruction_error
    
    def _calculate_prediction_error(self, X: np.ndarray, modes: List[KoopmanMode], eigenvalues: np.ndarray) -> float:
        """Calculate prediction error for the extracted modes"""
        
        if len(modes) == 0:
            return 1.0
        
        try:
            # Reconstruct system using modes
            Phi = np.array([mode.eigenfunction for mode in modes]).T
            
            # Initial condition
            x0 = X[:, 0]
            
            # Predict next few steps
            n_predict = min(10, X.shape[1] - 1)
            prediction_error = 0.0
            
            for t in range(1, n_predict + 1):
                # Predict state at time t
                x_pred = np.real(Phi @ (eigenvalues**t * pinv(Phi) @ x0))
                x_true = X[:, t]
                
                # Calculate relative error
                error = np.linalg.norm(x_pred - x_true) / (np.linalg.norm(x_true) + 1e-12)
                prediction_error += error
            
            return prediction_error / n_predict
            
        except Exception as e:
            logger.warning(f"Error calculating prediction error: {e}")
            return 1.0
    
    def _calculate_mode_sparsity(self, modes: List[KoopmanMode]) -> float:
        """Calculate average sparsity across all modes"""
        
        if not modes:
            return 0.0
        
        total_sparsity = sum(mode.sparsity for mode in modes)
        return total_sparsity / len(modes)
    
    def get_dominant_modes(self, n_modes: int = 10, min_stability: float = 0.1) -> List[KoopmanMode]:
        """Get the most dominant stable modes"""
        
        # Filter by stability
        stable_modes = [mode for mode in self.modes if mode.stability_index >= min_stability]
        
        # Sort by eigenvalue magnitude (most dominant first)
        stable_modes.sort(key=lambda x: np.abs(x.eigenvalue), reverse=True)
        
        return stable_modes[:n_modes]
    
    def get_spectral_analysis(self) -> Dict:
        """Get comprehensive spectral analysis results"""
        
        if not self.modes:
            return {'error': 'No modes available. Run process_activation_traces first.'}
        
        dominant_modes = self.get_dominant_modes()
        
        analysis = {
            'total_modes': len(self.modes),
            'dominant_modes': len(dominant_modes),
            'avg_frequency': np.mean([mode.frequency for mode in dominant_modes]),
            'avg_growth_rate': np.mean([mode.growth_rate for mode in dominant_modes]),
            'avg_stability': np.mean([mode.stability_index for mode in dominant_modes]),
            'system_sparsity': self.mode_sparsity,
            'reconstruction_error': self.reconstruction_error,
            'prediction_error': self.prediction_error,
            'last_update': self.last_update,
            'mode_details': []
        }
        
        for mode in dominant_modes:
            mode_detail = {
                'mode_id': mode.mode_id,
                'eigenvalue': {'real': np.real(mode.eigenvalue), 'imag': np.imag(mode.eigenvalue)},
                'frequency': mode.frequency,
                'growth_rate': mode.growth_rate,
                'stability_index': mode.stability_index,
                'sparsity': mode.sparsity,
                'dominant_concepts': list(zip(mode.concepts, [float(w) for w in mode.weights]))
            }
            analysis['mode_details'].append(mode_detail)
        
        return analysis
    
    def update_oscillator_couplings(self, concept_pairs: List[Tuple[str, str]], 
                                  coupling_strength: float = 1.0) -> Dict:
        """
        Generate oscillator coupling updates based on spectral modes
        
        Args:
            concept_pairs: List of concept pairs to analyze
            coupling_strength: Base coupling strength multiplier
            
        Returns:
            Dictionary with coupling updates
        """
        
        if not self.modes:
            return {'error': 'No modes available for coupling analysis'}
        
        coupling_updates = []
        
        for pair in concept_pairs:
            concept1, concept2 = pair
            
            # Find coupling strength based on mode co-occurrence
            max_coupling = 0.0
            source_mode = None
            phase_shift = 0.0
            
            for mode in self.modes:
                if concept1 in mode.concepts and concept2 in mode.concepts:
                    idx1 = mode.concepts.index(concept1)
                    idx2 = mode.concepts.index(concept2)
                    
                    # Calculate coupling based on mode weights
                    coupling = np.abs(mode.weights[idx1] * mode.weights[idx2]) * mode.stability_index
                    
                    if coupling > max_coupling:
                        max_coupling = coupling
                        source_mode = mode.mode_id
                        # Phase shift based on weight ratio
                        phase_shift = np.angle(mode.weights[idx1] / mode.weights[idx2])
            
            if max_coupling > 0.1:  # Threshold for significant coupling
                coupling_updates.append({
                    'concept1': concept1,
                    'concept2': concept2,
                    'coupling_strength': max_coupling * coupling_strength,
                    'phase_shift': phase_shift,
                    'source_mode': source_mode,
                    'confidence': min(max_coupling, 1.0)
                })
        
        result = {
            'coupling_updates': coupling_updates,
            'total_pairs_analyzed': len(concept_pairs),
            'significant_couplings': len(coupling_updates),
            'avg_coupling_strength': np.mean([u['coupling_strength'] for u in coupling_updates]) if coupling_updates else 0.0,
            'timestamp': datetime.now()
        }
        
        logger.info(f"Generated {len(coupling_updates)} coupling updates from {len(concept_pairs)} pairs")
        return result

def create_test_activation_data(n_concepts: int = 10, n_timesteps: int = 100, 
                              n_modes: int = 3, noise_level: float = 0.1) -> List[ActivationSnapshot]:
    """
    Generate synthetic activation data for testing
    """
    
    concept_names = [f"concept_{i}" for i in range(n_concepts)]
    
    # Create synthetic modes with different frequencies
    frequencies = np.linspace(0.1, 1.0, n_modes)
    amplitudes = np.random.rand(n_modes, n_concepts)
    phases = np.random.rand(n_modes, n_concepts) * 2 * np.pi
    
    snapshots = []
    
    for t in range(n_timesteps):
        time_val = t * 0.1  # 0.1 second intervals
        
        # Generate activations as sum of oscillatory modes
        activations = np.zeros(n_concepts)
        
        for mode_idx in range(n_modes):
            mode_contribution = amplitudes[mode_idx] * np.sin(
                2 * np.pi * frequencies[mode_idx] * time_val + phases[mode_idx]
            )
            activations += mode_contribution
        
        # Add noise
        activations += noise_level * np.random.randn(n_concepts)
        
        # Ensure non-negative and normalize
        activations = np.maximum(activations, 0)
        activations = activations / (np.max(activations) + 1e-12)
        
        # Create snapshot
        snapshot = ActivationSnapshot(
            timestamp=time_val,
            concepts=concept_names,
            activations=activations,
            metadata={'synthetic': True, 'mode_count': n_modes}
        )
        
        snapshots.append(snapshot)
    
    return snapshots

# Example usage and testing
if __name__ == "__main__":
    
    # Create Koopman estimator
    estimator = KoopmanEstimator(max_modes=20, min_singular_value=1e-4)
    
    # Generate test data
    print("Generating synthetic activation data...")
    test_data = create_test_activation_data(n_concepts=8, n_timesteps=200, n_modes=4)
    
    # Process traces
    print("Processing activation traces...")
    results = estimator.process_activation_traces([test_data])
    
    print(f"Extracted {results['modes_extracted']} modes")
    print(f"Reconstruction error: {results['reconstruction_error']:.6f}")
    print(f"Prediction error: {results['prediction_error']:.6f}")
    print(f"Mode sparsity: {results['mode_sparsity']:.3f}")
    
    # Get spectral analysis
    analysis = estimator.get_spectral_analysis()
    print(f"\nSpectral Analysis:")
    print(f"Average frequency: {analysis['avg_frequency']:.3f} Hz")
    print(f"Average stability: {analysis['avg_stability']:.3f}")
    
    # Test coupling updates
    concept_pairs = [('concept_0', 'concept_1'), ('concept_2', 'concept_3')]
    coupling_results = estimator.update_oscillator_couplings(concept_pairs)
    print(f"\nCoupling analysis: {coupling_results['significant_couplings']} significant couplings found")
    
    print("\n✅ KoopmanEstimator test completed successfully!")
