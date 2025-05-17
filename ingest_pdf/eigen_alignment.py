"""eigen_alignment.py - Implements eigenfunction alignment analysis for inference validation.

This module provides tools for assessing alignment between concept eigenfunctions
in the Koopman eigenspace. It enables:

1. Projection of concepts into eigenfunction space
2. Measurement of alignment between premise clusters and candidate conclusions
3. Modal testing for inference validation
4. Visualization of eigenmode alignment patterns

The core principle is that valid inferences emerge when conclusion concepts align 
with premise clusters in eigenfunction space without causing phase disruptions.
"""

import numpy as np
import logging
from typing import List, Dict, Tuple, Optional, Union, Any, Set
from dataclasses import dataclass, field
import math
import time
from scipy import stats
import matplotlib.pyplot as plt
from matplotlib import cm

# Import Koopman components
from .koopman_estimator import KoopmanEstimator, KoopmanEigenMode

# Configure logger
logger = logging.getLogger("eigen_alignment")

@dataclass
class AlignmentResult:
    """
    Results of eigenfunction alignment analysis between concepts.
    
    Attributes:
        alignment_score: Cosine similarity between eigenfunctions (0.0-1.0)
        disruption_score: How much the candidate disrupts eigenspace (0.0-1.0)
        confidence: Confidence in the alignment assessment (0.0-1.0)
        modal_status: Modal status of inference ("necessary", "possible", "contingent")
        eigenmode_overlap: Overlap of ψ-modes between premise and conclusion
        premise_coherence: Internal coherence of premise cluster
        resilience: Stability of alignment under perturbation
        premise_dimensions: Principal dimensions of premise cluster in eigenspace
    """
    
    alignment_score: float = 0.0
    disruption_score: float = 0.0
    confidence: float = 0.0
    modal_status: str = "unknown"
    eigenmode_overlap: float = 0.0
    premise_coherence: float = 0.0
    resilience: float = 0.0
    premise_dimensions: Optional[np.ndarray] = None
    
    # Detailed eigenmode alignments
    mode_alignments: Dict[int, float] = field(default_factory=dict)
    
    # Direct eigenfunction projections
    premise_projection: Optional[np.ndarray] = None
    conclusion_projection: Optional[np.ndarray] = None
    
    # Confidence intervals
    confidence_intervals: Optional[Dict[str, Tuple[float, float]]] = None

    def __post_init__(self):
        """Initialize confidence intervals if not provided."""
        if self.confidence_intervals is None:
            self.confidence_intervals = {}
    
    def is_aligned(self, threshold: float = 0.7) -> bool:
        """
        Determine if alignment is sufficient to support inference.
        
        Args:
            threshold: Minimum alignment score to consider aligned
            
        Returns:
            True if alignment supports inference
        """
        return (self.alignment_score >= threshold and 
                self.disruption_score <= (1.0 - threshold))
                
    def get_summary(self) -> Dict[str, Any]:
        """
        Get a summary of alignment results.
        
        Returns:
            Dictionary with key alignment metrics
        """
        return {
            "alignment": self.alignment_score,
            "disruption": self.disruption_score,
            "confidence": self.confidence,
            "modal_status": self.modal_status,
            "is_aligned": self.is_aligned(),
            "premise_coherence": self.premise_coherence,
            "resilience": self.resilience
        }

class EigenAlignment:
    """
    Analyzes eigenfunction alignment between concepts to validate inferences.
    
    This class implements the core logic for validating inferences based on
    alignment in Koopman eigenspace, following Takata's approach.
    
    Attributes:
        koopman_estimator: Estimator for Koopman eigenfunctions
        alignment_threshold: Threshold for considering concepts aligned
        n_modes: Number of eigenmodes to consider in alignment
        perturbation_size: Size of perturbation for stability testing
    """
    
    def __init__(
        self,
        koopman_estimator: Optional[KoopmanEstimator] = None,
        alignment_threshold: float = 0.7,
        n_modes: int = 3,
        perturbation_size: float = 0.01
    ):
        """
        Initialize the EigenAlignment analyzer.
        
        Args:
            koopman_estimator: Koopman eigenfunction estimator
            alignment_threshold: Threshold for considering concepts aligned
            n_modes: Number of eigenmodes to consider in alignment
            perturbation_size: Size of perturbation for stability testing
        """
        # Create default estimator if not provided
        self.koopman_estimator = koopman_estimator or KoopmanEstimator()
        self.alignment_threshold = alignment_threshold
        self.n_modes = n_modes
        self.perturbation_size = perturbation_size
        
        # Cache for eigenfunction projections
        self._projection_cache: Dict[str, np.ndarray] = {}
        
    def compute_eigenfunction_projection(
        self,
        state_trajectory: np.ndarray,
        concept_id: str = None,
        force_recompute: bool = False
    ) -> np.ndarray:
        """
        Compute eigenfunction projection for a state trajectory.
        
        Args:
            state_trajectory: State trajectory with shape (n_samples, n_features)
            concept_id: Optional concept ID for caching
            force_recompute: Force recomputation even if cached
            
        Returns:
            Eigenfunction projection vector
        """
        # Check cache if concept_id provided
        if concept_id is not None and not force_recompute:
            if concept_id in self._projection_cache:
                return self._projection_cache[concept_id]
        
        # Fit Koopman model and get dominant eigenfunctions
        try:
            # Ensure proper shape
            if state_trajectory.ndim == 1:
                state_trajectory = state_trajectory.reshape(-1, 1)
                
            # Estimate psi using Takata's robust method
            psi_estimate, confidence = self.koopman_estimator.estimate_psi_robust(
                state_trajectory,
                window=min(5, state_trajectory.shape[0] // 2)
            )
            
            # Cache result if concept_id provided
            if concept_id is not None:
                self._projection_cache[concept_id] = psi_estimate
                
            return psi_estimate
            
        except Exception as e:
            logger.warning(f"Error computing eigenfunction projection: {e}")
            # Return zero vector as fallback
            return np.zeros(self.n_modes, dtype=complex)
            
    def compute_cluster_projection(
        self,
        trajectories: List[np.ndarray],
        concept_ids: Optional[List[str]] = None
    ) -> np.ndarray:
        """
        Compute average eigenfunction projection for a cluster of trajectories.
        
        Args:
            trajectories: List of state trajectories
            concept_ids: Optional list of concept IDs for caching
            
        Returns:
            Average eigenfunction projection vector
        """
        if not trajectories:
            raise ValueError("No trajectories provided")
            
        # Compute projections for each trajectory
        projections = []
        
        for i, trajectory in enumerate(trajectories):
            concept_id = concept_ids[i] if concept_ids and i < len(concept_ids) else None
            proj = self.compute_eigenfunction_projection(trajectory, concept_id)
            projections.append(proj)
            
        # Compute average projection
        avg_projection = np.mean(projections, axis=0)
        
        # Normalize
        norm = np.linalg.norm(avg_projection)
        if norm > 0:
            avg_projection = avg_projection / norm
            
        return avg_projection
        
    def check_psi_alignment(
        self,
        psi_cluster: np.ndarray,
        psi_candidate: np.ndarray
    ) -> float:
        """
        Check alignment between cluster and candidate eigenfunctions.
        
        Args:
            psi_cluster: Eigenfunction vector for premise cluster
            psi_candidate: Eigenfunction vector for candidate conclusion
            
        Returns:
            Alignment score (0.0-1.0)
        """
        # Ensure vectors are normalized
        psi_cluster_norm = np.linalg.norm(psi_cluster)
        psi_candidate_norm = np.linalg.norm(psi_candidate)
        
        if psi_cluster_norm > 0:
            psi_cluster = psi_cluster / psi_cluster_norm
            
        if psi_candidate_norm > 0:
            psi_candidate = psi_candidate / psi_candidate_norm
        
        # Compute alignment using cosine similarity
        alignment = np.abs(np.vdot(psi_cluster, psi_candidate))
        
        # Ensure result is in valid range
        return float(min(1.0, max(0.0, alignment)))
        
    def check_eigenspace_disruption(
        self,
        premise_trajectories: List[np.ndarray],
        candidate_trajectory: np.ndarray,
        premise_ids: Optional[List[str]] = None,
        candidate_id: Optional[str] = None
    ) -> float:
        """
        Check how much a candidate disrupts the premise eigenspace.
        
        Args:
            premise_trajectories: List of premise state trajectories
            candidate_trajectory: Candidate state trajectory
            premise_ids: Optional list of premise concept IDs
            candidate_id: Optional candidate concept ID
            
        Returns:
            Disruption score (0.0-1.0)
        """
        # Create augmented set including candidate
        augmented_trajectories = premise_trajectories + [candidate_trajectory]
        augmented_ids = None
        
        if premise_ids is not None and candidate_id is not None:
            augmented_ids = premise_ids + [candidate_id]
            
        # Compute eigenfunction projections for original premises
        try:
            # Create concatenated trajectory for original premises
            original_combined = np.vstack(premise_trajectories)
            
            # Fit Koopman model to original premises
            self.koopman_estimator.fit(original_combined)
            original_modes = self.koopman_estimator.eigenmodes[:self.n_modes]
            
            # Now fit to augmented set
            augmented_combined = np.vstack(augmented_trajectories)
            self.koopman_estimator.fit(augmented_combined)
            augmented_modes = self.koopman_estimator.eigenmodes[:self.n_modes]
            
            # Compute spectral distance between original and augmented
            spectral_distances = []
            
            for i, original_mode in enumerate(original_modes):
                if i < len(augmented_modes):
                    # Compute alignment between corresponding modes
                    alignment = np.abs(np.vdot(
                        original_mode.eigenfunction,
                        augmented_modes[i].eigenfunction
                    ))
                    
                    # Convert to distance (1.0 - alignment)
                    spectral_distances.append(1.0 - alignment)
                else:
                    # Missing mode, maximum distance
                    spectral_distances.append(1.0)
                    
            # Overall disruption is average spectral distance
            disruption = np.mean(spectral_distances)
            
            return float(min(1.0, max(0.0, disruption)))
            
        except Exception as e:
            logger.warning(f"Error computing eigenspace disruption: {e}")
            # Default to medium disruption on error
            return 0.5
            
    def compute_modal_status(
        self,
        psi_cluster: np.ndarray,
        psi_candidate: np.ndarray,
        alignment_score: float,
        alternative_contexts: Optional[List[np.ndarray]] = None
    ) -> Tuple[str, Dict[str, float]]:
        """
        Compute modal status of an inference.
        
        Args:
            psi_cluster: Eigenfunction vector for premise cluster
            psi_candidate: Eigenfunction vector for candidate conclusion
            alignment_score: Alignment score for the inference
            alternative_contexts: Optional list of alternative contexts
            
        Returns:
            Tuple of (modal_status, modal_metrics)
        """
        # Default status
        if alignment_score >= 0.9:
            status = "necessary"
            necessity_degree = alignment_score
            possibility_degree = 1.0
        elif alignment_score >= self.alignment_threshold:
            status = "possible"
            necessity_degree = alignment_score * 0.5
            possibility_degree = alignment_score
        else:
            status = "contingent"
            necessity_degree = 0.0
            possibility_degree = alignment_score
            
        # Refine with alternative contexts if available
        if alternative_contexts and len(alternative_contexts) > 0:
            alternative_alignments = []
            
            for alt_psi in alternative_contexts:
                alt_alignment = self.check_psi_alignment(alt_psi, psi_candidate)
                alternative_alignments.append(alt_alignment)
                
            # Compute average alignment across contexts
            avg_alignment = np.mean(alternative_alignments)
            
            # Compute alignment variability
            alignment_var = np.var(alternative_alignments)
            
            # Update status based on alternative contexts
            if avg_alignment >= 0.9 and alignment_var < 0.1:
                status = "necessary"
                necessity_degree = avg_alignment
            elif avg_alignment >= self.alignment_threshold:
                status = "possible"
                necessity_degree = avg_alignment * alignment_score
            else:
                status = "contingent"
                necessity_degree = 0.0
                
            possibility_degree = max(alternative_alignments)
                
        # Prepare modal metrics
        modal_metrics = {
            "necessity_degree": necessity_degree,
            "possibility_degree": possibility_degree,
            "alignment_score": alignment_score
        }
        
        return status, modal_metrics
        
    def estimate_resilience(
        self,
        psi_cluster: np.ndarray,
        psi_candidate: np.ndarray,
        n_perturbations: int = 10
    ) -> float:
        """
        Estimate resilience of alignment under perturbations.
        
        Args:
            psi_cluster: Eigenfunction vector for premise cluster
            psi_candidate: Eigenfunction vector for candidate conclusion
            n_perturbations: Number of perturbations to test
            
        Returns:
            Resilience score (0.0-1.0)
        """
        # Original alignment
        original_alignment = self.check_psi_alignment(psi_cluster, psi_candidate)
        
        # Generate perturbations
        perturbed_alignments = []
        
        for _ in range(n_perturbations):
            # Apply perturbation to premise
            perturbation = np.random.normal(0, self.perturbation_size, psi_cluster.shape)
            perturbed_psi = psi_cluster + perturbation
            
            # Normalize
            norm = np.linalg.norm(perturbed_psi)
            if norm > 0:
                perturbed_psi = perturbed_psi / norm
                
            # Compute new alignment
            perturbed_alignment = self.check_psi_alignment(perturbed_psi, psi_candidate)
            perturbed_alignments.append(perturbed_alignment)
            
        # Compute alignment stability under perturbation
        alignment_drop = original_alignment - min(perturbed_alignments)
        alignment_var = np.var(perturbed_alignments)
        
        # High resilience: alignment remains stable under perturbation
        resilience = 1.0 - (alignment_drop + np.sqrt(alignment_var))
        
        return float(min(1.0, max(0.0, resilience)))
        
    def analyze_alignment(
        self,
        premise_trajectories: List[np.ndarray],
        candidate_trajectory: np.ndarray,
        premise_ids: Optional[List[str]] = None,
        candidate_id: Optional[str] = None,
        alternative_contexts: Optional[List[List[np.ndarray]]] = None
    ) -> AlignmentResult:
        """
        Perform comprehensive alignment analysis between premises and candidate.
        
        Args:
            premise_trajectories: List of premise state trajectories
            candidate_trajectory: Candidate state trajectory
            premise_ids: Optional list of premise concept IDs
            candidate_id: Optional candidate concept ID
            alternative_contexts: Optional list of alternative contexts
            
        Returns:
            AlignmentResult with detailed analysis
        """
        # Compute premise cluster projection
        psi_cluster = self.compute_cluster_projection(
            premise_trajectories,
            premise_ids
        )
        
        # Compute candidate projection
        psi_candidate = self.compute_eigenfunction_projection(
            candidate_trajectory,
            candidate_id
        )
        
        # Compute core alignment metrics
        alignment_score = self.check_psi_alignment(psi_cluster, psi_candidate)
        disruption_score = self.check_eigenspace_disruption(
            premise_trajectories,
            candidate_trajectory,
            premise_ids,
            candidate_id
        )
        
        # Compute modal status
        alternative_psi = None
        
        if alternative_contexts:
            alternative_psi = [
                self.compute_cluster_projection(context)
                for context in alternative_contexts
            ]
            
        modal_status, modal_metrics = self.compute_modal_status(
            psi_cluster,
            psi_candidate,
            alignment_score,
            alternative_psi
        )
        
        # Compute premise coherence (internal alignment)
        premise_coherence = 0.0
        
        if len(premise_trajectories) > 1:
            # Compute pairwise alignments between premises
            premise_alignments = []
            
            for i in range(len(premise_trajectories)):
                psi_i = self.compute_eigenfunction_projection(
                    premise_trajectories[i],
                    premise_ids[i] if premise_ids else None
                )
                
                for j in range(i+1, len(premise_trajectories)):
                    psi_j = self.compute_eigenfunction_projection(
                        premise_trajectories[j],
                        premise_ids[j] if premise_ids else None
                    )
                    
                    alignment = self.check_psi_alignment(psi_i, psi_j)
                    premise_alignments.append(alignment)
                    
            # Average pairwise alignment
            premise_coherence = np.mean(premise_alignments) if premise_alignments else 0.0
        else:
            # Single premise, maximum coherence
            premise_coherence = 1.0
            
        # Compute resilience
        resilience = self.estimate_resilience(psi_cluster, psi_candidate)
        
        # Mode-specific alignments
        mode_alignments = {}
        
        try:
            for i in range(min(self.n_modes, len(self.koopman_estimator.eigenmodes))):
                mode = self.koopman_estimator.eigenmodes[i]
                mode_alignments[i] = alignment_score  # Placeholder for more detailed analysis
        except Exception:
            # Handle case when eigenmodes aren't available
            pass
        
        # Calculate confidence based on multiple factors
        # Higher premise coherence and resilience lead to higher confidence
        base_confidence = (premise_coherence + resilience) / 2
        
        # Adjust confidence based on alignment score
        confidence = base_confidence * (1.0 - abs(0.5 - alignment_score) * 0.5)
        
        # Confidence intervals
        confidence_intervals = {
            "alignment": (
                max(0.0, alignment_score - 0.1),
                min(1.0, alignment_score + 0.1)
            ),
            "disruption": (
                max(0.0, disruption_score - 0.1),
                min(1.0, disruption_score + 0.1)
            ),
            "premise_coherence": (
                max(0.0, premise_coherence - 0.1),
                min(1.0, premise_coherence + 0.1)
            )
        }
        
        # Create result
        result = AlignmentResult(
            alignment_score=alignment_score,
            disruption_score=disruption_score,
            confidence=confidence,
            modal_status=modal_status,
            eigenmode_overlap=1.0 - disruption_score,
            premise_coherence=premise_coherence,
            resilience=resilience,
            mode_alignments=mode_alignments,
            premise_projection=psi_cluster,
            conclusion_projection=psi_candidate,
            confidence_intervals=confidence_intervals
        )
        
        return result
        
    def visualize_alignment(
        self,
        result: AlignmentResult,
        title: str = "Eigenmode Alignment Analysis",
        show_plot: bool = True,
        save_path: Optional[str] = None
    ) -> Optional[plt.Figure]:
        """
        Visualize eigenfunction alignment analysis.
        
        Args:
            result: AlignmentResult from alignment analysis
            title: Plot title
            show_plot: Whether to display the plot
            save_path: Optional path to save the visualization
            
        Returns:
            Matplotlib figure object if show_plot=False, otherwise None
        """
        # Create figure
        fig = plt.figure(figsize=(12, 8))
        
        # Only continue if we have projections
        if result.premise_projection is None or result.conclusion_projection is None:
            plt.title(f"{title}\n(No projection data available)")
            
            if save_path:
                plt.savefig(save_path)
                
            if show_plot:
                plt.show()
                return None
                
            return fig
            
        # Extract data
        psi_premise = result.premise_projection
        psi_conclusion = result.conclusion_projection
        
        # Plot layout
        gs = plt.GridSpec(2, 2)
        
        # Plot 1: Phase portrait (2D projection of eigenfunction)
        ax1 = fig.add_subplot(gs[0, 0])
        
        # Use first two components for phase portrait
        ax1.scatter(
            psi_premise.real[0] if len(psi_premise) > 0 else 0,
            psi_premise.imag[0] if len(psi_premise) > 0 else 0,
            s=100, color='blue', label='Premise Cluster'
        )
        
        ax1.scatter(
            psi_conclusion.real[0] if len(psi_conclusion) > 0 else 0,
            psi_conclusion.imag[0] if len(psi_conclusion) > 0 else 0,
            s=100, color='red', label='Candidate'
        )
        
        # Draw alignment vector
        ax1.plot(
            [0, psi_premise.real[0] if len(psi_premise) > 0 else 0],
            [0, psi_premise.imag[0] if len(psi_premise) > 0 else 0],
            'b--', alpha=0.5
        )
        
        ax1.plot(
            [0, psi_conclusion.real[0] if len(psi_conclusion) > 0 else 0],
            [0, psi_conclusion.imag[0] if len(psi_conclusion) > 0 else 0],
            'r--', alpha=0.5
        )
        
        ax1.set_xlabel('Re(ψ)')
        ax1.set_ylabel('Im(ψ)')
        ax1.set_title('Eigenfunction Phase Portrait')
        ax1.grid(True, alpha=0.3)
        ax1.legend()
        
        # Plot 2: Alignment bar chart
        ax2 = fig.add_subplot(gs[0, 1])
        metrics = [
            ('Alignment', result.alignment_score),
            ('Coherence', result.premise_coherence),
            ('Resilience', result.resilience),
            ('Confidence', result.confidence)
        ]
        
        bars = ax2.bar(
            [m[0] for m in metrics],
            [m[1] for m in metrics],
            color=['green', 'blue', 'purple', 'orange']
        )
        
        # Add values on top of bars
        for bar in bars:
            height = bar.get_height()
            ax2.text(
                bar.get_x() + bar.get_width()/2.,
                height + 0.01,
                f'{height:.2f}',
                ha='center', va='bottom'
            )
            
        ax2.set_ylim(0, 1.1)
        ax2.set_title('Alignment Metrics')
        ax2.grid(True, alpha=0.3, axis='y')
        
        # Plot 3: Modal analysis
        ax3 = fig.add_subplot(gs[1, 0])
        
        modal_data = {
            'Necessary': 1 if result.modal_status == 'necessary' else 0,
            'Possible': 1 if result.modal_status == 'possible' else 0,
            'Contingent': 1 if result.modal_status == 'contingent' else 0
        }
        
        # Colors for different modal statuses
        colors = {
            'Necessary': 'darkgreen',
            'Possible': 'darkorange',
            'Contingent': 'darkred'
        }
        
        modal_bars = ax3.bar(
            modal_data.keys(),
            modal_data.values(),
            color=[colors[k] for k in modal_data.keys()]
        )
        
        ax3.set_ylim(0, 1.1)
        ax3.set_title(f'Modal Status: {result.modal_status.capitalize()}')
        ax3.grid(True, alpha=0.3, axis='y')
        
        # Plot 4: Confidence intervals
        ax4 = fig.add_subplot(gs[1, 1])
        
        if result.confidence_intervals:
            metrics = list(result.confidence_intervals.keys())
            values = [
                (result.confidence_intervals[m][0] + result.confidence_intervals[m][1]) / 2
                for m in metrics
            ]
            errors = [
                (result.confidence_intervals[m][1] - result.confidence_intervals[m][0]) / 2
                for m in metrics
            ]
            
            ax4.errorbar(
                metrics,
                values,
                yerr=errors,
                fmt='o',
                capsize=5,
                color='purple',
                markersize=8
            )
            
            ax4.set_ylim(0, 1.1)
            ax4.set_title('Confidence Intervals')
            ax4.grid(True, alpha=0.3, axis='y')
        else:
            ax4.text(
                0.5, 0.5,
                "No confidence intervals available",
                ha='center', va='center'
            )
        
        # Overall title
        plt.suptitle(f"{title}\nOverall Alignment: {result.alignment_score:.2f}", fontsize=16)
        plt.tight_layout(rect=[0, 0, 1, 0.95])
        
        # Save if requested
        if save_path:
            plt.savefig(save_path)
            
        # Show if requested
        if show_plot:
            plt.show()
            return None
            
        return fig
        
    def create_spectral_overlay(
        self,
        premise_trajectories: List[np.ndarray],
        conclusion_trajectories: List[np.ndarray],
        premise_names: Optional[List[str]] = None,
        conclusion_names: Optional[List[str]] = None,
        show_plot: bool = True,
        save_path: Optional[str] = None
    ) -> Optional[plt.Figure]:
        """
        Create spectral overlay visualization of premise and conclusion concepts.
        
        Args:
            premise_trajectories: List of premise state trajectories
            conclusion_trajectories: List of conclusion state trajectories
            premise_names: Optional list of premise names for labels
            conclusion_names: Optional list of conclusion names for labels
            show_plot: Whether to display the plot
            save_path: Optional path to save the visualization
            
        Returns:
            Matplotlib figure object if show_plot=False, otherwise None
        """
        # Create figure
        fig = plt.figure(figsize=(10, 8))
        ax = fig.add_subplot(111, projection='3d')
        
        # Combine all trajectories for Koopman analysis
        all_trajectories = premise_trajectories + conclusion_trajectories
        combined = np.vstack(all_trajectories)
        
        # Fit Koopman model
        self.koopman_estimator.fit(combined)
        
        # Compute projections for each premise
        premise_projections = []
        for trajectory in premise_trajectories:
            # Compute top 3 eigenfunction projections for 3D visualization
            proj = np.zeros(3, dtype=complex)
            
            for i in range(min(3, len(self.koopman_estimator.eigenmodes))):
                mode = self.koopman_estimator.eigenmodes[i]
                # Project trajectory onto this eigenfunction
                lifted = self.koopman_estimator.basis_function(trajectory)
                proj[i] = np.mean(lifted @ mode.eigenfunction)
                
            premise_projections.append(proj)
            
        # Compute projections for each conclusion
        conclusion_projections = []
        for trajectory in conclusion_trajectories:
            # Compute top 3 eigenfunction projections
            proj = np.zeros(3, dtype=complex)
            
            for i in range(min(3, len(self.koopman_estimator.eigenmodes))):
                mode = self.koopman_estimator.eigenmodes[i]
                # Project trajectory onto this eigenfunction
                lifted = self.koopman_estimator.basis_function(trajectory)
                proj[i] = np.mean(lifted @ mode.eigenfunction)
                
            conclusion_projections.append(proj)
            
        # Plot premises
        for i, proj in enumerate(premise_projections):
            label = premise_names[i] if premise_names and i < len(premise_names) else f"Premise {i+1}"
            ax.scatter(
                proj[0].real, proj[1].real, proj[2].real,
                s=80, c='blue', marker='o', alpha=0.7,
                label=label if i == 0 else ""
            )
            
        # Plot conclusions
        for i, proj in enumerate(conclusion_projections):
            label = conclusion_names[i] if conclusion_names and i < len(conclusion_names) else f"Conclusion {i+1}"
            ax.scatter(
                proj[0].real, proj[1].real, proj[2].real,
                s=80, c='red', marker='^', alpha=0.7,
                label=label if i == 0 else ""
            )
            
        # Calculate cluster centers
        if premise_projections:
            premise_center = np.mean([p.real for p in premise_projections], axis=0)
            ax.scatter(
                premise_center[0], premise_center[1], premise_center[2],
                s=120, c='darkblue',
