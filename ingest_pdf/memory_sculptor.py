"""memory_sculptor.py - Implements autonomous memory sculpting for ALAN.

This module provides the core mechanisms for dynamic concept lifecycle management,
enabling ALAN to actively shape its conceptual space rather than merely storing
information. It implements functions for:

1. Pruning low-stability concepts based on spectral decay
2. Stabilizing coherent concept clusters
3. Spawning new concepts from emergent patterns
4. Managing latent concepts that may be reactivated

These capabilities give ALAN semantic sovereignty - allowing its concepts to evolve
organically based on resonance patterns, phase coherence, and recurring structure.

References:
- Spectral stability analysis
- Phase-locked oscillator dynamics
- Information-theoretic concept evaluation
"""

import os
import numpy as np
import logging
import time
from typing import List, Dict, Tuple, Set, Optional, Union, Any, Callable
from dataclasses import dataclass, field
from datetime import datetime
import math
from collections import defaultdict
import uuid

from .models import ConceptTuple
from .koopman_phase_graph import get_koopman_phase_graph, ConceptNode, KoopmanMode
from .spectral_monitor import get_cognitive_spectral_monitor

# Configure logger
logger = logging.getLogger("alan_memory_sculptor")

@dataclass
class ConceptState:
    """Tracks the state and stability metrics of a concept over time."""
    psi_id: str  # Eigenfunction ID of the concept
    stability_score: float = 0.0  # Current stability score
    phase_desyncs: int = 0  # Count of phase desynchronization events
    resonance_count: int = 0  # Number of times concept has resonated with others
    recurrence_count: int = 0  # Number of times concept has been reactivated
    is_active: bool = True  # Whether the concept is active or latent
    birth_ts: float = field(default_factory=time.time)  # Creation timestamp
    last_active_ts: float = field(default_factory=time.time)  # Last activation time
    cluster_membership: List[str] = field(default_factory=list)  # IDs of clusters this concept belongs to
    desync_history: List[Tuple[float, float]] = field(default_factory=list)  # [(timestamp, magnitude), ...]
    resonance_history: List[Tuple[float, str, float]] = field(default_factory=list)  # [(timestamp, concept_id, strength), ...]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "psi_id": self.psi_id,
            "stability_score": float(self.stability_score),
            "phase_desyncs": self.phase_desyncs,
            "resonance_count": self.resonance_count,
            "recurrence_count": self.recurrence_count,
            "is_active": self.is_active,
            "birth_ts": self.birth_ts,
            "last_active_ts": self.last_active_ts,
            "cluster_membership": self.cluster_membership,
            "age_days": (time.time() - self.birth_ts) / (60 * 60 * 24),
            "desync_rate": self.phase_desyncs / max(1, (time.time() - self.birth_ts) / (60 * 60 * 24)),
            "resonance_rate": self.resonance_count / max(1, (time.time() - self.birth_ts) / (60 * 60 * 24))
        }


class MemorySculptor:
    """
    Main class for autonomously sculpting ALAN's conceptual memory.
    
    This class manages the lifecycle of concepts, including pruning unstable concepts,
    stabilizing coherent clusters, spawning new emergent concepts, and managing
    the activation/deactivation of latent concepts.
    """
    
    def __init__(
        self,
        stability_alpha: float = 0.4,  # Weight for coherence
        stability_beta: float = 0.4,   # Weight for recurrence
        stability_gamma: float = 0.2,  # Weight for desyncs (negative)
        prune_threshold: float = 0.3,  # Stability threshold for pruning
        stabilize_threshold: float = 0.7,  # Stability threshold for cluster stabilization
        spawn_threshold: float = 0.8,  # Coherence threshold for spawning new concepts
        max_latent_age: float = 30.0,  # Maximum age in days for latent concepts
        log_dir: str = "logs/memory"
    ):
        """
        Initialize the memory sculptor.
        
        Args:
            stability_alpha: Weight for coherence in stability calculation
            stability_beta: Weight for recurrence in stability calculation
            stability_gamma: Weight for desyncs in stability calculation (negative)
            prune_threshold: Stability threshold below which concepts are pruned
            stabilize_threshold: Stability threshold above which clusters are stabilized
            spawn_threshold: Coherence threshold for spawning new concepts
            max_latent_age: Maximum age in days for latent concepts
            log_dir: Directory for logging
        """
        self.stability_alpha = stability_alpha
        self.stability_beta = stability_beta
        self.stability_gamma = stability_gamma
        self.prune_threshold = prune_threshold
        self.stabilize_threshold = stabilize_threshold
        self.spawn_threshold = spawn_threshold
        self.max_latent_age = max_latent_age
        self.log_dir = log_dir
        
        # Ensure log directory exists
        os.makedirs(log_dir, exist_ok=True)
        
        # Get required components
        self.koopman_graph = get_koopman_phase_graph()
        self.spectral_monitor = get_cognitive_spectral_monitor()
        
        # Track concept states
        self.concept_states: Dict[str, ConceptState] = {}
        
        # Track sculptural operations
        self.pruned_concepts: List[Dict[str, Any]] = []
        self.spawned_concepts: List[Dict[str, Any]] = []
        self.latent_concepts: Dict[str, ConceptState] = {}
        self.stabilized_clusters: List[Dict[str, Any]] = []
        
        logger.info("Memory sculptor initialized")
        
    def calculate_concept_stability(
        self,
        concept_id: str,
        update_state: bool = True
    ) -> float:
        """
        Calculate the stability score for a concept.
        
        Stability = α * coherence + β * recurrence - γ * desyncs
        
        Args:
            concept_id: Concept ID to calculate stability for
            update_state: Whether to update the concept state
            
        Returns:
            Stability score (0-1)
        """
        # Get concept state or create new one
        if concept_id not in self.concept_states:
            self.concept_states[concept_id] = ConceptState(psi_id=concept_id)
            
        state = self.concept_states[concept_id]
        
        # Get concept from Koopman graph
        concept = self.koopman_graph.get_concept_by_id(concept_id)
        if concept is None:
            logger.warning(f"Concept {concept_id} not found in Koopman graph")
            return 0.0
            
        # Get coherence from spectral monitor
        coherence_data = self.spectral_monitor.get_concept_coherence(concept_id)
        coherence = coherence_data.get("coherence_score", 0.5) if isinstance(coherence_data, dict) else 0.5
        
        # Calculate normalized metrics
        max_age_seconds = self.max_latent_age * 24 * 60 * 60
        age_fraction = min(1.0, (time.time() - state.birth_ts) / max_age_seconds)
        
        # Normalize recurrence and desync rates by age
        if age_fraction > 0:
            norm_recurrence = min(1.0, state.recurrence_count / (10 * age_fraction))
            norm_desyncs = min(1.0, state.phase_desyncs / (20 * age_fraction))
        else:
            norm_recurrence = 0.0
            norm_desyncs = 0.0
            
        # Calculate stability score
        stability = (
            self.stability_alpha * coherence +
            self.stability_beta * norm_recurrence -
            self.stability_gamma * norm_desyncs
        )
        
        # Ensure score is in [0, 1]
        stability = max(0.0, min(1.0, stability))
        
        # Update state if requested
        if update_state:
            state.stability_score = stability
            
        return stability
        
    def update_concept_state(
        self,
        concept_id: str,
        detected_desync: bool = False,
        resonated_with: Optional[str] = None,
        resonance_strength: float = 0.0
    ) -> ConceptState:
        """
        Update the state of a concept based on recent activity.
        
        Args:
            concept_id: Concept ID to update
            detected_desync: Whether a phase desynchronization was detected
            resonated_with: ID of concept this concept resonated with (if any)
            resonance_strength: Strength of resonance (0-1)
            
        Returns:
            Updated ConceptState
        """
        # Get concept state or create new one
        if concept_id not in self.concept_states:
            self.concept_states[concept_id] = ConceptState(psi_id=concept_id)
            
        state = self.concept_states[concept_id]
        
        # Update based on activity
        if detected_desync:
            # Record desync event
            state.phase_desyncs += 1
            state.desync_history.append((time.time(), 1.0))
            
            # Keep desync history trimmed
            if len(state.desync_history) > 100:
                state.desync_history = state.desync_history[-100:]
                
        if resonated_with is not None and resonance_strength > 0.3:
            # Record resonance event
            state.resonance_count += 1
            state.resonance_history.append((time.time(), resonated_with, resonance_strength))
            
            # Keep resonance history trimmed
            if len(state.resonance_history) > 100:
                state.resonance_history = state.resonance_history[-100:]
                
        # Update last active timestamp
        state.last_active_ts = time.time()
        
        # Mark as active
        state.is_active = True
        
        # Calculate updated stability
        self.calculate_concept_stability(concept_id)
        
        return state
        
    def prune_concept(
        self,
        concept_id: str,
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Prune a concept if it's unstable.
        
        Args:
            concept_id: Concept ID to prune
            force: Whether to force pruning regardless of stability
            
        Returns:
            Dictionary with pruning results
        """
        # Check if concept exists
        if concept_id not in self.concept_states:
            return {
                "status": "error",
                "message": f"Concept {concept_id} not found in state tracking"
            }
            
        # Get concept state
        state = self.concept_states[concept_id]
        
        # Calculate stability if it hasn't been done recently
        if not force and time.time() - state.last_active_ts > 60 * 60:  # More than an hour
            self.calculate_concept_stability(concept_id)
            
        # Check if concept should be pruned
        should_prune = force or state.stability_score < self.prune_threshold
        
        if not should_prune:
            return {
                "status": "retained",
                "message": f"Concept {concept_id} is stable, not pruned",
                "stability": state.stability_score
            }
            
        # Get the concept from the Koopman graph
        concept = self.koopman_graph.get_concept_by_id(concept_id)
        
        if concept is None:
            # Concept already removed from graph
            # Just clean up our tracking
            if concept_id in self.concept_states:
                del self.concept_states[concept_id]
                
            return {
                "status": "already_pruned",
                "message": f"Concept {concept_id} was already removed from graph"
            }
            
        # Log pruning decision
        logger.info(f"Pruning unstable concept: {concept.name} (ID: {concept_id}, stability: {state.stability_score:.2f})")
        
        # Store concept data for history
        concept_data = {
            "id": concept_id,
            "name": concept.name,
            "stability": state.stability_score,
            "birth_ts": state.birth_ts,
            "age_days": (time.time() - state.birth_ts) / (60 * 60 * 24),
            "resonance_count": state.resonance_count,
            "phase_desyncs": state.phase_desyncs,
            "timestamp": time.time()
        }
        
        # Add to pruned concepts history
        self.pruned_concepts.append(concept_data)
        
        # Keep pruned history manageable
        if len(self.pruned_concepts) > 1000:
            self.pruned_concepts = self.pruned_concepts[-1000:]
            
        # Actually remove the concept from the graph
        # This would require adding a removal method to the Koopman graph class
        # For now, we'll just assume it exists
        try:
            if hasattr(self.koopman_graph, "remove_concept"):
                self.koopman_graph.remove_concept(concept_id)
            else:
                # Fallback if method doesn't exist
                if hasattr(self.koopman_graph, "concepts") and concept_id in self.koopman_graph.concepts:
                    del self.koopman_graph.concepts[concept_id]
        except Exception as e:
            logger.error(f"Error pruning concept {concept_id}: {e}")
            return {
                "status": "error",
                "message": f"Error pruning concept: {str(e)}",
                "concept_data": concept_data
            }
            
        # Clean up state tracking
        del self.concept_states[concept_id]
        
        return {
            "status": "pruned",
            "message": f"Concept {concept_id} pruned successfully",
            "concept_data": concept_data
        }
        
    def stabilize_cluster(
        self,
        cluster_id: str,
        concept_ids: List[str]
    ) -> Dict[str, Any]:
        """
        Stabilize a coherent cluster of concepts.
        
        Args:
            cluster_id: Identifier for the cluster
            concept_ids: List of concept IDs in the cluster
            
        Returns:
            Dictionary with stabilization results
        """
        # Check if cluster is large enough
        if len(concept_ids) < 2:
            return {
                "status": "too_small",
                "message": "Cluster too small to stabilize",
                "size": len(concept_ids)
            }
            
        # Check stability of concepts in cluster
        stability_scores = []
        for concept_id in concept_ids:
            if concept_id in self.concept_states:
                # Use existing state
                stability_scores.append(self.concept_states[concept_id].stability_score)
            else:
                # Calculate stability for concepts we don't track yet
                stability = self.calculate_concept_stability(concept_id)
                stability_scores.append(stability)
                
        # Calculate average stability
        avg_stability = sum(stability_scores) / len(stability_scores)
        
        # Check if cluster should be stabilized
        if avg_stability < self.stabilize_threshold:
            return {
                "status": "unstable",
                "message": "Cluster not stable enough to reinforce",
                "average_stability": avg_stability
            }
            
        # Get concepts from Koopman graph
        concepts = []
        for concept_id in concept_ids:
            concept = self.koopman_graph.get_concept_by_id(concept_id)
            if concept is not None:
                concepts.append(concept)
                
        if not concepts:
            return {
                "status": "error",
                "message": "No valid concepts found in cluster"
            }
            
        # Log stabilization
        logger.info(f"Stabilizing cluster with {len(concepts)} concepts (avg stability: {avg_stability:.2f})")
        
        # Strengthen connections between concepts in cluster
        strengthened_edges = 0
        
        try:
            # Update concept states to record cluster membership
            for concept_id in concept_ids:
                if concept_id in self.concept_states:
                    state = self.concept_states[concept_id]
                    
                    # Add to cluster membership if not already there
                    if cluster_id not in state.cluster_membership:
                        state.cluster_membership.append(cluster_id)
                        
                    # Mutual resonance with all other concepts in cluster
                    for other_id in concept_ids:
                        if other_id != concept_id:
                            # Record mutual resonance
                            state.resonance_count += 1
                            state.resonance_history.append((time.time(), other_id, 0.8))
                            
                            # Keep history trimmed
                            if len(state.resonance_history) > 100:
                                state.resonance_history = state.resonance_history[-100:]
                                
            # Strengthen edges in the Koopman graph
            # This would require adding methods to the Koopman graph
            # For now, we'll iterate through concepts and modify their edges
            for concept in concepts:
                for other in concepts:
                    if concept.id != other.id:
                        # Check if edge already exists
                        existing_edge = None
                        for edge_idx, (target_id, weight) in enumerate(concept.edges):
                            if target_id == other.id:
                                existing_edge = edge_idx
                                break
                                
                        if existing_edge is not None:
                            # Strengthen existing edge
                            edge_id, weight = concept.edges[existing_edge]
                            # Increase weight by 20%, but not above 1.0
                            new_weight = min(1.0, weight * 1.2)
                            concept.edges[existing_edge] = (edge_id, new_weight)
                            strengthened_edges += 1
                        else:
                            # Add new edge with moderate weight
                            concept.edges.append((other.id, 0.6))
                            strengthened_edges += 1
                            
            # Record stabilization in history
            stabilization_data = {
                "cluster_id": cluster_id,
                "concept_ids": concept_ids,
                "average_stability": avg_stability,
                "strengthened_edges": strengthened_edges,
                "timestamp": time.time()
            }
            
            self.stabilized_clusters.append(stabilization_data)
            
            # Keep history manageable
            if len(self.stabilized_clusters) > 1000:
                self.stabilized_clusters = self.stabilized_clusters[-1000:]
                
            return {
                "status": "stabilized",
                "message": f"Successfully stabilized cluster of {len(concepts)} concepts",
                "average_stability": avg_stability,
                "strengthened_edges": strengthened_edges,
                "concept_count": len(concepts)
            }
                
        except Exception as e:
            logger.error(f"Error stabilizing cluster: {e}")
            return {
                "status": "error",
                "message": f"Error stabilizing cluster: {str(e)}"
            }
            
    def spawn_new_concept(
        self,
        parent_concept_ids: List[str],
        name: Optional[str] = None,
        embedding: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """
        Spawn a new concept from existing concepts.
        
        Args:
            parent_concept_ids: List of concept IDs to spawn from
            name: Optional name for the new concept
            embedding: Optional embedding for the new concept
            
        Returns:
            Dictionary with spawn results
        """
        # Check if we have valid parents
        if not parent_concept_ids:
            return {
                "status": "error",
                "message": "No parent concepts provided"
            }
            
        # Get parent concepts from Koopman graph
        parent_concepts = []
        for concept_id in parent_concept_ids:
            concept = self.koopman_graph.get_concept_by_id(concept_id)
            if concept is not None:
                parent_concepts.append(concept)
                
        if not parent_concepts:
            return {
                "status": "error",
                "message": "No valid parent concepts found"
            }
            
        # If no embedding provided, create one by combining parent embeddings
        if embedding is None:
            # Weighted average of parent embeddings based on stability
            parent_weights = []
            for concept in parent_concepts:
                if concept.id in self.concept_states:
                    stability = self.concept_states[concept.id].stability_score
                    parent_weights.append(max(0.1, stability))
                else:
                    parent_weights.append(0.5)  # Default weight
                    
            # Normalize weights
            total_weight = sum(parent_weights)
            parent_weights = [w / total_weight for w in parent_weights]
            
            # Combine embeddings
            combined_embedding = np.zeros_like(parent_concepts[0].embedding)
            for i, concept in enumerate(parent_concepts):
                combined_embedding += concept.embedding * parent_weights[i]
                
            # Add some noise for uniqueness
            noise = np.random.normal(0, 0.05, size=combined_embedding.shape)
            combined_embedding += noise
            
            # Normalize
            combined_embedding = combined_embedding / np.linalg.norm(combined_embedding)
            embedding = combined_embedding
            
        # If no name provided, request one from ghost label synthesizer
        # For now, use a placeholder
        if name is None:
            parent_names = [concept.name for concept in parent_concepts]
            name = f"EmergentConcept({'+'.join(parent_names[:2])})"
            
        # Generate a unique ID for the new concept
        new_id = f"spawn_{uuid.uuid4().hex[:12]}"
        
        # Get source document and location from first parent
        source_doc_id = parent_concepts[0].source_document_id
        source_location = parent_concepts[0].source_location
        
        # Create the new concept in the Koopman graph
        try:
            new_concept = self.koopman_graph.create_concept_from_embedding(
                name=name,
                embedding=embedding,
                source_document_id=source_doc_id,
                source_location=source_location
            )
            
            # Create state for new concept
            self.concept_states[new_concept.id] = ConceptState(
                psi_id=new_concept.id,
                stability_score=0.6,  # Start with moderate stability
                birth_ts=time.time()
            )
            
            # Connect to parent concepts
            for parent in parent_concepts:
                # Add edges in both directions
                new_concept.edges.append((parent.id, 0.7))  # Strong connection to parents
                parent.edges.append((new_concept.id, 0.7))
                
                # Record resonance
                state = self.concept_states[new_concept.id]
                state.resonance_count += 1
                state.resonance_history.append((time.time(), parent.id, 0.7))
                
            # Record spawn in history
            spawn_data = {
                "id": new_concept.id,
                "name": new_concept.name,
                "parent_ids": parent_concept_ids,
                "timestamp": time.time()
            }
            
            self.spawned_concepts.append(spawn_data)
            
            # Keep history manageable
            if len(self.spawned_concepts) > 1000:
                self.spawned_concepts = self.spawned_concepts[-1000:]
                
            logger.info(f"Spawned new concept: '{name}' (ID: {new_concept.id}) from {len(parent_concepts)} parents")
            
            return {
                "status": "spawned",
                "message": f"Successfully spawned new concept: {name}",
                "concept_id": new_concept.id,
                "concept_name": name,
                "parent_count": len(parent_concepts)
            }
                
        except Exception as e:
            logger.error(f"Error spawning new concept: {e}")
            return {
                "status": "error",
                "message": f"Error spawning new concept: {str(e)}"
            }
            
    def mark_as_latent(
        self,
        concept_id: str
    ) -> Dict[str, Any]:
        """
        Mark a concept as latent (inactive but retained).
        
        Args:
            concept_id: Concept ID to mark as latent
            
        Returns:
            Dictionary with results
        """
        # Check if concept exists
        if concept_id not in self.concept_states:
            return {
                "status": "error",
                "message": f"Concept {concept_id} not found in state tracking"
            }
            
        # Get concept state
        state = self.concept_states[concept_id]
        
        # Already latent
        if not state.is_active:
            return {
                "status": "already_latent",
                "message": f"Concept {concept_id} is already latent"
            }
            
        # Mark as latent
        state.is_active = False
        
        # Add to latent concepts tracking
        self.latent_concepts[concept_id] = state
        
        logger.info(f"Marked concept {concept_id} as latent")
        
        return {
            "status": "success",
            "message": f"Concept {concept_id} marked as latent",
            "stability": state.stability_score,
            "age_days": (time.time() - state.birth_ts) / (60 * 60 * 24)
        }
        
    def reactivate_concept(
        self,
        concept_id: str
    ) -> Dict[str, Any]:
        """
        Reactivate a latent concept.
        
        Args:
            concept_id: Concept ID to reactivate
            
        Returns:
            Dictionary with results
        """
        # Check if concept exists
        if concept_id not in self.concept_states:
            return {
                "status": "error",
                "message": f"Concept {concept_id} not found in state tracking"
            }
            
        # Get concept state
        state = self.concept_states[concept_id]
        
        # Already active
        if state.is_active:
            return {
                "status": "already_active",
                "message": f"Concept {concept_id} is already active"
            }
            
        # Mark as active
        state.is_active = True
        state.last_active_ts = time.time()
        state.recurrence_count += 1
        
        # Remove from latent concepts tracking
        if concept_id in self.latent_concepts:
            del self.latent_concepts[concept_id]
            
        logger.info(f"Reactivated concept {concept_id}")
        
        return {
            "status": "success",
            "message": f"Concept {concept_id} reactivated",
            "stability": state.stability_score,
            "recurrence_count": state.recurrence_count
        }
        
    def run_maintenance_cycle(self) -> Dict[str, Any]:
        """
        Run a full maintenance cycle on the concept space.
        
        This function:
        1. Prunes unstable concepts
        2. Stabilizes coherent clusters
        3. Spawns new concepts from stable patterns
        4. Manages latent concepts
        
        Returns:
            Dictionary with maintenance results
        """
        start_time = time.time()
        
        if not hasattr(self.koopman_graph, "concepts"):
            return {
                "status": "error",
                "message": "Koopman graph has no concepts attribute"
            }
            
        # Get all concepts
        concept_ids = list(self.koopman_graph.concepts.keys())
        
        if not concept_ids:
            return {
                "status": "no_concepts",
                "message": "No concepts to maintain"
            }
            
        # 1. Update states for all concepts
        for concept_id in concept_ids:
            if concept_id not in self.concept_states:
                self.concept_states[concept_id] = ConceptState(psi_id=concept_id)
                
            # Calculate stability
            self.calculate_concept_stability(concept_id)
            
        # 2. Prune unstable concepts
        pruned_count = 0
        for concept_id in list(self.concept_states.keys()):
            state = self.concept_states[concept_id]
            
            # Skip latent concepts
            if not state.is_active:
                continue
                
            # Check if concept should be pruned
            if state.stability_score < self.prune_threshold:
                result = self.prune_concept(concept_id)
                if result.get("status") == "pruned":
                    pruned_count += 1
                    
        # 3. Get phase clusters from Koopman graph
        phase_clusters = []
        if hasattr(self.koopman_graph, "identify_phase_clusters"):
            phase_clusters = self.koopman_graph.identify_phase_clusters(phase_similarity_threshold=0.2)
            
        # 4. Stabilize coherent clusters
        stabilized_count = 0
        for cluster_idx, cluster in enumerate(phase_clusters):
            cluster_id = f"cluster_{time.time()}_{cluster_idx}"
            
            # Gather active concept IDs in this cluster
            active_ids = [
                cid for cid in cluster 
                if cid in self.concept_states and self.concept_states[cid].is_active
            ]
            
            if len(active_ids) >= 3:  # Only stabilize clusters with at least 3 concepts
                result = self.stabilize_cluster(cluster_id, active_ids)
                if result.get("status") == "stabilized":
                    stabilized_count += 1
                    
        # 5. Find potential new concepts to spawn
        # Identify highly coherent pairs or triplets of concepts
        spawn_candidates = []
        
        # Check pairs first
        all_concept_ids = [
            cid for cid in self.concept_states
            if self.concept_states[cid].is_active
        ]
        
        spawned_count = 0
        for i, concept_id1 in enumerate(all_concept_ids):
            state1 = self.concept_states[concept_id1]
            
            for concept_id2 in all_concept_ids[i+1:]:
                state2 = self.concept_states[concept_id2]
                
                # Check for resonance between these concepts
                resonance_count = 0
                for ts, other_id, strength in state1.resonance_history:
                    if other_id == concept_id2:
                        resonance_count += 1
                
                for ts, other_id, strength in state2.resonance_history:
                    if other_id == concept_id1:
                        resonance_count += 1
                
                # If these concepts have resonated multiple times, consider spawning a child
                if resonance_count >= 5:  # Threshold for spawning
                    # Calculate coherence between the two concepts
                    concept1 = self.koopman_graph.get_concept_by_id(concept_id1)
                    concept2 = self.koopman_graph.get_concept_by_id(concept_id2)
                    
                    if concept1 is None or concept2 is None:
                        continue
                    
                    # Calculate cosine similarity
                    similarity = np.dot(concept1.embedding, concept2.embedding) / (
                        np.linalg.norm(concept1.embedding) * np.linalg.norm(concept2.embedding)
                    )
                    
                    # If similarity above threshold, spawn a new concept
                    if similarity > self.spawn_threshold:
                        parent_ids = [concept_id1, concept_id2]
                        
                        # Check for a third concept that resonates with both
                        for concept_id3 in all_concept_ids:
                            if concept_id3 != concept_id1 and concept_id3 != concept_id2:
                                # Check if this concept resonates with both parents
                                resonates_with_1 = False
                                resonates_with_2 = False
                                
                                for ts, other_id, strength in self.concept_states[concept_id3].resonance_history:
                                    if other_id == concept_id1:
                                        resonates_with_1 = True
                                    if other_id == concept_id2:
                                        resonates_with_2 = True
                                        
                                if resonates_with_1 and resonates_with_2:
                                    parent_ids.append(concept_id3)
                                    break
                        
                        # Spawn new concept
                        result = self.spawn_new_concept(parent_ids)
                        if result.get("status") == "spawned":
                            spawned_count += 1
                            
                        # Limit spawning to avoid explosive growth
                        if spawned_count >= 3:  # Max 3 spawned concepts per cycle
                            break
            
            # Break outer loop if we've spawned enough
            if spawned_count >= 3:
                break
                
        # 6. Handle latent concepts
        # Expire old latent concepts
        max_age_seconds = self.max_latent_age * 24 * 60 * 60
        expired_count = 0
        
        for concept_id in list(self.latent_concepts.keys()):
            state = self.latent_concepts[concept_id]
            age_seconds = time.time() - state.birth_ts
            
            # If concept is too old, remove it completely
            if age_seconds > max_age_seconds:
                # Remove from latent tracking
                del self.latent_concepts[concept_id]
                # Remove from state tracking
                if concept_id in self.concept_states:
                    del self.concept_states[concept_id]
                # Remove from Koopman graph if it's still there
                try:
                    if hasattr(self.koopman_graph, "remove_concept"):
                        self.koopman_graph.remove_concept(concept_id)
                    elif hasattr(self.koopman_graph, "concepts") and concept_id in self.koopman_graph.concepts:
                        del self.koopman_graph.concepts[concept_id]
                except Exception as e:
                    logger.error(f"Error removing expired latent concept {concept_id}: {e}")
                    
                expired_count += 1
                
        # Calculate elapsed time
        elapsed_time = time.time() - start_time
        
        # Return maintenance results
        return {
            "status": "success",
            "elapsed_time": elapsed_time,
            "total_concepts": len(concept_ids),
            "active_concepts": len(all_concept_ids),
            "latent_concepts": len(self.latent_concepts),
            "pruned_count": pruned_count,
            "stabilized_clusters": stabilized_count,
            "spawned_count": spawned_count,
            "expired_count": expired_count,
            "timestamp": time.time()
        }
        
    def get_concept_states(self) -> Dict[str, Dict[str, Any]]:
        """
        Get the current state of all tracked concepts.
        
        Returns:
            Dictionary mapping concept IDs to state dictionaries
        """
        result = {}
        
        for concept_id, state in self.concept_states.items():
            result[concept_id] = state.to_dict()
            
        return result
        
    def get_sculptural_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about sculptural operations.
        
        Returns:
            Dictionary with sculptural statistics
        """
        # Count concepts by stability range
        stability_ranges = {
            "very_low": 0,   # 0.0 - 0.2
            "low": 0,        # 0.2 - 0.4
            "moderate": 0,   # 0.4 - 0.6
            "high": 0,       # 0.6 - 0.8
            "very_high": 0   # 0.8 - 1.0
        }
        
        for state in self.concept_states.values():
            if state.stability_score < 0.2:
                stability_ranges["very_low"] += 1
            elif state.stability_score < 0.4:
                stability_ranges["low"] += 1
            elif state.stability_score < 0.6:
                stability_ranges["moderate"] += 1
            elif state.stability_score < 0.8:
                stability_ranges["high"] += 1
            else:
                stability_ranges["very_high"] += 1
                
        # Get cluster membership stats
        cluster_counts = {}
        for state in self.concept_states.values():
            num_clusters = len(state.cluster_membership)
            if num_clusters not in cluster_counts:
                cluster_counts[num_clusters] = 0
            cluster_counts[num_clusters] += 1
            
        return {
            "concept_count": len(self.concept_states),
            "active_count": sum(1 for state in self.concept_states.values() if state.is_active),
            "latent_count": len(self.latent_concepts),
            "pruned_count": len(self.pruned_concepts),
            "spawned_count": len(self.spawned_concepts),
            "stabilized_clusters": len(self.stabilized_clusters),
            "stability_distribution": stability_ranges,
            "cluster_membership": cluster_counts,
            "recent_pruned": self.pruned_concepts[-10:] if self.pruned_concepts else [],
            "recent_spawned": self.spawned_concepts[-10:] if self.spawned_concepts else [],
            "timestamp": time.time()
        }


# Singleton instance
_memory_sculptor_instance = None

def get_memory_sculptor() -> MemorySculptor:
    """
    Get the singleton instance of the memory sculptor.
    
    Returns:
        MemorySculptor instance
    """
    global _memory_sculptor_instance
    
    if _memory_sculptor_instance is None:
        _memory_sculptor_instance = MemorySculptor()
        
    return _memory_sculptor_instance
