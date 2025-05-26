#!/usr/bin/env python3
"""
TORI Memory Sculptor
Autonomous memory pruning and consolidation based on phase stability analysis
Implements memory gardening algorithms for maintaining optimal memory topology
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Set, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict, deque
import logging
import threading
import time
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ConceptNode:
    """Represents a concept in the memory network"""
    concept_id: str
    phase: float
    amplitude: float
    frequency: float
    stability_score: float
    last_accessed: datetime
    access_count: int
    connections: Set[str] = field(default_factory=set)
    metadata: Dict = field(default_factory=dict)

@dataclass
class ConnectionEdge:
    """Represents a connection between concepts"""
    source_id: str
    target_id: str
    strength: float
    phase_coherence: float
    last_reinforced: datetime
    creation_time: datetime
    usage_count: int
    decay_rate: float = 0.01

@dataclass
class PruningAction:
    """Represents a memory pruning action taken"""
    action_type: str  # "prune_concept", "prune_connection", "merge_concepts", "strengthen"
    timestamp: datetime
    target_concepts: List[str]
    target_connections: List[Tuple[str, str]]
    reason: str
    stability_impact: float
    reversible: bool = True

@dataclass
class ConsolidationCluster:
    """Represents a cluster of related concepts for consolidation"""
    cluster_id: str
    concept_ids: List[str]
    centroid_phase: float
    coherence_score: float
    stability_score: float
    formation_time: datetime
    last_access: datetime

class MemorySculptor:
    """
    Autonomous Memory Sculpting System for TORI
    
    Implements intelligent memory management through:
    - Pruning desynchronized or unstable concepts
    - Strengthening coherent memory clusters  
    - Consolidating related memories
    - Maintaining optimal memory topology
    - Preventing catastrophic forgetting
    """
    
    def __init__(self,
                 stability_threshold: float = 0.3,
                 coherence_threshold: float = 0.5,
                 pruning_interval: float = 300.0,  # 5 minutes
                 max_memory_size: int = 10000,
                 decay_rate: float = 0.001):
        """
        Initialize Memory Sculptor
        
        Args:
            stability_threshold: Minimum stability for concept retention
            coherence_threshold: Minimum coherence for connection retention
            pruning_interval: Time between pruning cycles (seconds)
            max_memory_size: Maximum number of concepts to maintain
            decay_rate: Base decay rate for unused memories
        """
        self.stability_threshold = stability_threshold
        self.coherence_threshold = coherence_threshold
        self.pruning_interval = pruning_interval
        self.max_memory_size = max_memory_size
        self.decay_rate = decay_rate
        
        # Memory network state
        self.concepts: Dict[str, ConceptNode] = {}
        self.connections: Dict[Tuple[str, str], ConnectionEdge] = {}
        self.clusters: Dict[str, ConsolidationCluster] = {}
        
        # Pruning history and metrics
        self.pruning_history: List[PruningAction] = []
        self.sculpting_metrics = {
            'total_pruning_cycles': 0,
            'concepts_pruned': 0,
            'connections_pruned': 0,
            'concepts_strengthened': 0,
            'clusters_formed': 0,
            'average_stability': 0.0,
            'memory_efficiency': 0.0
        }
        
        # Background processing
        self.is_sculpting: bool = False
        self.sculpting_thread: Optional[threading.Thread] = None
        self.lock = threading.RLock()
        
        # Configuration
        self.enable_aggressive_pruning = False
        self.preserve_recent_threshold = timedelta(hours=1)
        self.cluster_formation_threshold = 0.7
        
        logger.info(f"Initialized MemorySculptor with stability_threshold={stability_threshold}")
    
    def start_sculpting(self):
        """Start autonomous memory sculpting thread"""
        if self.is_sculpting:
            logger.warning("Memory sculpting already active")
            return
        
        self.is_sculpting = True
        self.sculpting_thread = threading.Thread(target=self._sculpting_loop, daemon=True)
        self.sculpting_thread.start()
        logger.info("Started autonomous memory sculpting")
    
    def stop_sculpting(self):
        """Stop autonomous memory sculpting"""
        self.is_sculpting = False
        if self.sculpting_thread:
            self.sculpting_thread.join(timeout=5.0)
        logger.info("Stopped memory sculpting")
    
    def _sculpting_loop(self):
        """Main sculpting loop (runs in background thread)"""
        while self.is_sculpting:
            try:
                self._perform_sculpting_cycle()
                time.sleep(self.pruning_interval)
            except Exception as e:
                logger.error(f"Error in sculpting loop: {e}")
                time.sleep(60.0)  # Wait longer on error
    
    def add_concept(self, concept_id: str, phase: float, amplitude: float = 1.0, 
                   frequency: float = 1.0, metadata: Optional[Dict] = None):
        """Add or update a concept in the memory network"""
        
        with self.lock:
            current_time = datetime.now()
            
            if concept_id in self.concepts:
                # Update existing concept
                concept = self.concepts[concept_id]
                concept.phase = phase
                concept.amplitude = amplitude
                concept.frequency = frequency
                concept.last_accessed = current_time
                concept.access_count += 1
                
                if metadata:
                    concept.metadata.update(metadata)
            else:
                # Create new concept
                concept = ConceptNode(
                    concept_id=concept_id,
                    phase=phase,
                    amplitude=amplitude,
                    frequency=frequency,
                    stability_score=0.5,  # Initial neutral stability
                    last_accessed=current_time,
                    access_count=1,
                    metadata=metadata or {}
                )
                self.concepts[concept_id] = concept
                
                # Check if we need to prune to make room
                if len(self.concepts) > self.max_memory_size:
                    self._emergency_pruning()
    
    def add_connection(self, source_id: str, target_id: str, strength: float,
                      phase_coherence: float = 1.0):
        """Add or strengthen a connection between concepts"""
        
        with self.lock:
            current_time = datetime.now()
            connection_key = (source_id, target_id)
            
            if connection_key in self.connections:
                # Strengthen existing connection
                connection = self.connections[connection_key]
                connection.strength = min(connection.strength + strength * 0.1, 2.0)  # Cap at 2.0
                connection.phase_coherence = phase_coherence
                connection.last_reinforced = current_time
                connection.usage_count += 1
            else:
                # Create new connection
                connection = ConnectionEdge(
                    source_id=source_id,
                    target_id=target_id,
                    strength=strength,
                    phase_coherence=phase_coherence,
                    last_reinforced=current_time,
                    creation_time=current_time,
                    usage_count=1
                )
                self.connections[connection_key] = connection
            
            # Update concept connections
            if source_id in self.concepts:
                self.concepts[source_id].connections.add(target_id)
            if target_id in self.concepts:
                self.concepts[target_id].connections.add(source_id)
    
    def update_concept_stability(self, concept_id: str, stability_score: float):
        """Update stability score for a concept"""
        with self.lock:
            if concept_id in self.concepts:
                self.concepts[concept_id].stability_score = stability_score
    
    def _perform_sculpting_cycle(self):
        """Perform one complete memory sculpting cycle"""
        
        with self.lock:
            logger.info("Starting memory sculpting cycle")
            cycle_start = datetime.now()
            
            # Update all stability scores
            self._update_stability_scores()
            
            # Perform different sculpting operations
            actions_taken = []
            
            # 1. Prune unstable concepts and connections
            prune_actions = self._prune_unstable_elements()
            actions_taken.extend(prune_actions)
            
            # 2. Strengthen coherent clusters
            strengthen_actions = self._strengthen_coherent_clusters()
            actions_taken.extend(strengthen_actions)
            
            # 3. Form new consolidation clusters
            cluster_actions = self._form_consolidation_clusters()
            actions_taken.extend(cluster_actions)
            
            # 4. Merge similar concepts
            merge_actions = self._merge_similar_concepts()
            actions_taken.extend(merge_actions)
            
            # 5. Apply natural decay
            decay_actions = self._apply_natural_decay()
            actions_taken.extend(decay_actions)
            
            # Update metrics
            self._update_sculpting_metrics(actions_taken)
            
            cycle_duration = (datetime.now() - cycle_start).total_seconds()
            logger.info(f"Sculpting cycle completed in {cycle_duration:.2f}s, "
                       f"{len(actions_taken)} actions taken")
    
    def _update_stability_scores(self):
        """Update stability scores for all concepts based on usage and coherence"""
        
        current_time = datetime.now()
        
        for concept_id, concept in self.concepts.items():
            # Factors affecting stability
            
            # 1. Recency of access (recent = more stable)
            time_since_access = (current_time - concept.last_accessed).total_seconds()
            recency_factor = np.exp(-time_since_access / (24 * 3600))  # 24 hour decay
            
            # 2. Access frequency (more accessed = more stable)
            frequency_factor = min(concept.access_count / 100.0, 1.0)
            
            # 3. Connection coherence (well-connected = more stable)
            coherence_factor = self._calculate_concept_coherence(concept_id)
            
            # 4. Phase stability (stable phase = more stable)
            phase_stability = 1.0 / (1.0 + abs(concept.phase % (2 * np.pi) - np.pi))
            
            # 5. Amplitude factor (moderate amplitude is most stable)
            amplitude_factor = 1.0 - abs(concept.amplitude - 1.0)
            amplitude_factor = max(amplitude_factor, 0.1)
            
            # Combine factors
            stability_components = [
                recency_factor * 0.3,
                frequency_factor * 0.2,
                coherence_factor * 0.25,
                phase_stability * 0.15,
                amplitude_factor * 0.1
            ]
            
            new_stability = sum(stability_components)
            
            # Smooth update (don't change too rapidly)
            concept.stability_score = 0.7 * concept.stability_score + 0.3 * new_stability
    
    def _calculate_concept_coherence(self, concept_id: str) -> float:
        """Calculate coherence of a concept based on its connections"""
        
        if concept_id not in self.concepts:
            return 0.0
        
        concept = self.concepts[concept_id]
        
        if not concept.connections:
            return 0.1  # Isolated concepts have low coherence
        
        # Calculate average phase coherence with connected concepts
        total_coherence = 0.0
        valid_connections = 0
        
        for connected_id in concept.connections:
            # Check both directions for connections
            conn1 = self.connections.get((concept_id, connected_id))
            conn2 = self.connections.get((connected_id, concept_id))
            
            connection = conn1 or conn2
            if connection:
                total_coherence += connection.phase_coherence
                valid_connections += 1
        
        if valid_connections == 0:
            return 0.1
        
        avg_coherence = total_coherence / valid_connections
        
        # Bonus for having multiple connections
        connection_bonus = min(len(concept.connections) / 10.0, 0.3)
        
        return min(avg_coherence + connection_bonus, 1.0)
    
    def _prune_unstable_elements(self) -> List[PruningAction]:
        """Prune concepts and connections below stability/coherence thresholds"""
        
        actions = []
        current_time = datetime.now()
        
        # Identify concepts to prune
        concepts_to_prune = []
        for concept_id, concept in self.concepts.items():
            
            # Don't prune very recent concepts unless emergency
            if (current_time - concept.last_accessed) < self.preserve_recent_threshold:
                if not self.enable_aggressive_pruning:
                    continue
            
            # Prune if below stability threshold
            if concept.stability_score < self.stability_threshold:
                # Additional check: don't prune if it's a hub (many connections)
                if len(concept.connections) < 3:
                    concepts_to_prune.append(concept_id)
        
        # Prune concepts
        for concept_id in concepts_to_prune:
            self._prune_concept(concept_id, "low_stability")
            actions.append(PruningAction(
                action_type="prune_concept",
                timestamp=current_time,
                target_concepts=[concept_id],
                target_connections=[],
                reason=f"stability_score={self.concepts[concept_id].stability_score:.3f} < {self.stability_threshold}",
                stability_impact=-0.1,
                reversible=True
            ))
        
        # Identify connections to prune
        connections_to_prune = []
        for conn_key, connection in self.connections.items():
            
            # Prune if phase coherence too low
            if connection.phase_coherence < self.coherence_threshold:
                # Don't prune very recent connections
                age = (current_time - connection.creation_time).total_seconds()
                if age > 3600:  # 1 hour minimum age
                    connections_to_prune.append(conn_key)
            
            # Prune if unused for long time
            time_since_use = (current_time - connection.last_reinforced).total_seconds()
            if time_since_use > 7 * 24 * 3600:  # 1 week
                if connection.usage_count < 5:  # Low usage
                    connections_to_prune.append(conn_key)
        
        # Prune connections
        for conn_key in connections_to_prune:
            connection = self.connections[conn_key]
            self._prune_connection(conn_key[0], conn_key[1], "low_coherence_or_disuse")
            actions.append(PruningAction(
                action_type="prune_connection",
                timestamp=current_time,
                target_concepts=[],
                target_connections=[conn_key],
                reason=f"coherence={connection.phase_coherence:.3f} < {self.coherence_threshold}",
                stability_impact=-0.05,
                reversible=True
            ))
        
        if actions:
            logger.info(f"Pruned {len(concepts_to_prune)} concepts and {len(connections_to_prune)} connections")
        
        return actions
    
    def _prune_concept(self, concept_id: str, reason: str):
        """Remove a concept and all its connections"""
        
        if concept_id not in self.concepts:
            return
        
        concept = self.concepts[concept_id]
        
        # Remove all connections involving this concept
        connections_to_remove = []
        for conn_key in self.connections:
            if concept_id in conn_key:
                connections_to_remove.append(conn_key)
        
        for conn_key in connections_to_remove:
            del self.connections[conn_key]
        
        # Update connected concepts
        for connected_id in concept.connections:
            if connected_id in self.concepts:
                self.concepts[connected_id].connections.discard(concept_id)
        
        # Remove from clusters
        clusters_to_update = []
        for cluster_id, cluster in self.clusters.items():
            if concept_id in cluster.concept_ids:
                cluster.concept_ids.remove(concept_id)
                clusters_to_update.append(cluster_id)
        
        # Remove empty clusters
        for cluster_id in clusters_to_update:
            if len(self.clusters[cluster_id].concept_ids) <= 1:
                del self.clusters[cluster_id]
        
        # Finally remove the concept
        del self.concepts[concept_id]
        
        logger.debug(f"Pruned concept {concept_id} (reason: {reason})")
    
    def _prune_connection(self, source_id: str, target_id: str, reason: str):
        """Remove a connection between concepts"""
        
        conn_key = (source_id, target_id)
        if conn_key in self.connections:
            del self.connections[conn_key]
        
        # Also check reverse direction
        reverse_key = (target_id, source_id)
        if reverse_key in self.connections:
            del self.connections[reverse_key]
        
        # Update concept connection sets
        if source_id in self.concepts:
            self.concepts[source_id].connections.discard(target_id)
        if target_id in self.concepts:
            self.concepts[target_id].connections.discard(source_id)
        
        logger.debug(f"Pruned connection {source_id} -> {target_id} (reason: {reason})")
    
    def _strengthen_coherent_clusters(self) -> List[PruningAction]:
        """Strengthen connections within coherent concept clusters"""
        
        actions = []
        current_time = datetime.now()
        
        # Find coherent groups of concepts
        coherent_groups = self._find_coherent_groups()
        
        for group in coherent_groups:
            if len(group) < 2:
                continue
            
            # Strengthen connections within this group
            strengthened_connections = 0
            
            for i, concept1 in enumerate(group):
                for concept2 in group[i+1:]:
                    
                    # Check if connection exists
                    conn_key1 = (concept1, concept2)
                    conn_key2 = (concept2, concept1)
                    
                    connection = self.connections.get(conn_key1) or self.connections.get(conn_key2)
                    
                    if connection:
                        # Strengthen existing connection
                        old_strength = connection.strength
                        connection.strength = min(connection.strength * 1.1, 2.0)
                        strengthened_connections += 1
                        
                        logger.debug(f"Strengthened connection {concept1} <-> {concept2}: "
                                   f"{old_strength:.3f} -> {connection.strength:.3f}")
            
            if strengthened_connections > 0:
                actions.append(PruningAction(
                    action_type="strengthen",
                    timestamp=current_time,
                    target_concepts=group,
                    target_connections=[],
                    reason=f"coherent_cluster_{len(group)}_concepts",
                    stability_impact=0.1 * strengthened_connections,
                    reversible=False
                ))
        
        return actions
    
    def _find_coherent_groups(self) -> List[List[str]]:
        """Find groups of concepts with high mutual coherence"""
        
        groups = []
        visited = set()
        
        for concept_id in self.concepts:
            if concept_id in visited:
                continue
            
            # Find all concepts coherent with this one
            coherent_group = self._find_coherent_neighbors(concept_id, visited)
            
            if len(coherent_group) >= 2:
                groups.append(coherent_group)
                visited.update(coherent_group)
        
        return groups
    
    def _find_coherent_neighbors(self, start_concept: str, visited: Set[str]) -> List[str]:
        """Find all concepts coherently connected to start_concept"""
        
        group = [start_concept]
        to_explore = [start_concept]
        local_visited = {start_concept}
        
        while to_explore:
            current_concept = to_explore.pop(0)
            
            if current_concept not in self.concepts:
                continue
            
            # Check all connections from current concept
            for connected_id in self.concepts[current_concept].connections:
                if connected_id in local_visited or connected_id in visited:
                    continue
                
                # Check coherence of this connection
                conn1 = self.connections.get((current_concept, connected_id))
                conn2 = self.connections.get((connected_id, current_concept))
                connection = conn1 or conn2
                
                if connection and connection.phase_coherence > self.cluster_formation_threshold:
                    group.append(connected_id)
                    to_explore.append(connected_id)
                    local_visited.add(connected_id)
        
        return group
    
    def _form_consolidation_clusters(self) -> List[PruningAction]:
        """Form new consolidation clusters from related concepts"""
        
        actions = []
        current_time = datetime.now()
        
        # Find concepts that should be clustered together
        potential_clusters = self._identify_clustering_candidates()
        
        for candidate_concepts in potential_clusters:
            if len(candidate_concepts) < 3:
                continue
            
            # Calculate cluster properties
            phases = [self.concepts[cid].phase for cid in candidate_concepts if cid in self.concepts]
            
            if not phases:
                continue
            
            centroid_phase = np.mean(phases)
            coherence_score = self._calculate_cluster_coherence(candidate_concepts)
            stability_score = np.mean([self.concepts[cid].stability_score 
                                     for cid in candidate_concepts if cid in self.concepts])
            
            # Create cluster if coherent enough
            if coherence_score > self.cluster_formation_threshold:
                cluster_id = f"cluster_{int(current_time.timestamp())}_{len(self.clusters)}"
                
                cluster = ConsolidationCluster(
                    cluster_id=cluster_id,
                    concept_ids=candidate_concepts,
                    centroid_phase=centroid_phase,
                    coherence_score=coherence_score,
                    stability_score=stability_score,
                    formation_time=current_time,
                    last_access=current_time
                )
                
                self.clusters[cluster_id] = cluster
                
                actions.append(PruningAction(
                    action_type="form_cluster",
                    timestamp=current_time,
                    target_concepts=candidate_concepts,
                    target_connections=[],
                    reason=f"coherence={coherence_score:.3f} > {self.cluster_formation_threshold}",
                    stability_impact=0.05,
                    reversible=True
                ))
                
                logger.info(f"Formed cluster {cluster_id} with {len(candidate_concepts)} concepts")
        
        return actions
    
    def _identify_clustering_candidates(self) -> List[List[str]]:
        """Identify groups of concepts that should be clustered together"""
        
        candidates = []
        
        # Method 1: Phase similarity clustering
        phase_groups = self._group_by_phase_similarity()
        candidates.extend(phase_groups)
        
        # Method 2: Frequency similarity clustering
        frequency_groups = self._group_by_frequency_similarity()
        candidates.extend(frequency_groups)
        
        # Method 3: Co-activation clustering
        coactivation_groups = self._group_by_coactivation()
        candidates.extend(coactivation_groups)
        
        return candidates
    
    def _group_by_phase_similarity(self) -> List[List[str]]:
        """Group concepts by phase similarity"""
        
        groups = []
        concept_phases = [(cid, concept.phase) for cid, concept in self.concepts.items()]
        
        # Sort by phase
        concept_phases.sort(key=lambda x: x[1])
        
        current_group = []
        last_phase = None
        phase_tolerance = np.pi / 4  # 45 degrees
        
        for concept_id, phase in concept_phases:
            if last_phase is None or abs(phase - last_phase) < phase_tolerance:
                current_group.append(concept_id)
            else:
                if len(current_group) >= 3:
                    groups.append(current_group)
                current_group = [concept_id]
            
            last_phase = phase
        
        # Add final group
        if len(current_group) >= 3:
            groups.append(current_group)
        
        return groups
    
    def _group_by_frequency_similarity(self) -> List[List[str]]:
        """Group concepts by frequency similarity"""
        
        groups = []
        frequency_map = defaultdict(list)
        
        # Group by frequency (binned)
        for concept_id, concept in self.concepts.items():
            freq_bin = round(concept.frequency * 10) / 10  # 0.1 Hz bins
            frequency_map[freq_bin].append(concept_id)
        
        # Return groups with 3+ concepts
        for freq_bin, concept_list in frequency_map.items():
            if len(concept_list) >= 3:
                groups.append(concept_list)
        
        return groups
    
    def _group_by_coactivation(self) -> List[List[str]]:
        """Group concepts that are frequently co-activated"""
        
        groups = []
        
        # Find concepts that share many connections
        for concept_id, concept in self.concepts.items():
            if len(concept.connections) < 2:
                continue
            
            # Find concepts that share connections with this one
            shared_connection_counts = defaultdict(int)
            
            for connected_id in concept.connections:
                if connected_id in self.concepts:
                    for second_level_id in self.concepts[connected_id].connections:
                        if second_level_id != concept_id:
                            shared_connection_counts[second_level_id] += 1
            
            # Group concepts with high shared connection counts
            coactivated = [concept_id]
            for other_id, shared_count in shared_connection_counts.items():
                if shared_count >= 2:  # At least 2 shared connections
                    coactivated.append(other_id)
            
            if len(coactivated) >= 3:
                groups.append(coactivated)
        
        return groups
    
    def _calculate_cluster_coherence(self, concept_ids: List[str]) -> float:
        """Calculate coherence score for a group of concepts"""
        
        if len(concept_ids) < 2:
            return 0.0
        
        total_coherence = 0.0
        pair_count = 0
        
        for i, concept1 in enumerate(concept_ids):
            for concept2 in concept_ids[i+1:]:
                
                # Check for connection between these concepts
                conn1 = self.connections.get((concept1, concept2))
                conn2 = self.connections.get((concept2, concept1))
                connection = conn1 or conn2
                
                if connection:
                    total_coherence += connection.phase_coherence
                    pair_count += 1
                else:
                    # No direct connection - calculate phase coherence
                    if concept1 in self.concepts and concept2 in self.concepts:
                        phase1 = self.concepts[concept1].phase
                        phase2 = self.concepts[concept2].phase
                        phase_diff = abs(phase1 - phase2) % (2 * np.pi)
                        phase_coherence = 1.0 - min(phase_diff, 2 * np.pi - phase_diff) / np.pi
                        total_coherence += phase_coherence * 0.5  # Lower weight for indirect
                        pair_count += 1
        
        return total_coherence / pair_count if pair_count > 0 else 0.0
    
    def _merge_similar_concepts(self) -> List[PruningAction]:
        """Merge concepts that are very similar"""
        
        actions = []
        current_time = datetime.now()
        
        # Find pairs of very similar concepts
        merge_candidates = self._find_merge_candidates()
        
        for concept1, concept2, similarity in merge_candidates:
            
            # Merge concept2 into concept1
            self._merge_concepts(concept1, concept2)
            
            actions.append(PruningAction(
                action_type="merge_concepts",
                timestamp=current_time,
                target_concepts=[concept1, concept2],
                target_connections=[],
                reason=f"similarity={similarity:.3f} > 0.9",
                stability_impact=0.02,
                reversible=False
            ))
            
            logger.info(f"Merged concept {concept2} into {concept1} (similarity={similarity:.3f})")
        
        return actions
    
    def _find_merge_candidates(self) -> List[Tuple[str, str, float]]:
        """Find pairs of concepts that should be merged"""
        
        candidates = []
        concept_list = list(self.concepts.keys())
        
        for i, concept1 in enumerate(concept_list):
            for concept2 in concept_list[i+1:]:
                
                similarity = self._calculate_concept_similarity(concept1, concept2)
                
                # Merge if very similar
                if similarity > 0.9:
                    candidates.append((concept1, concept2, similarity))
        
        # Sort by similarity (highest first)
        candidates.sort(key=lambda x: x[2], reverse=True)
        
        return candidates[:5]  # Limit to 5 merges per cycle
    
    def _calculate_concept_similarity(self, concept1: str, concept2: str) -> float:
        """Calculate similarity between two concepts"""
        
        if concept1 not in self.concepts or concept2 not in self.concepts:
            return 0.0
        
        c1 = self.concepts[concept1]
        c2 = self.concepts[concept2]
        
        # Phase similarity
        phase_diff = abs(c1.phase - c2.phase) % (2 * np.pi)
        phase_similarity = 1.0 - min(phase_diff, 2 * np.pi - phase_diff) / np.pi
        
        # Frequency similarity
        freq_diff = abs(c1.frequency - c2.frequency)
        freq_similarity = 1.0 / (1.0 + freq_diff)
        
        # Amplitude similarity
        amp_diff = abs(c1.amplitude - c2.amplitude)
        amp_similarity = 1.0 / (1.0 + amp_diff)
        
        # Connection overlap
        connection_overlap = len(c1.connections & c2.connections) / max(len(c1.connections | c2.connections), 1)
        
        # Combine similarities
        overall_similarity = (
            phase_similarity * 0.3 +
            freq_similarity * 0.2 +
            amp_similarity * 0.2 +
            connection_overlap * 0.3
        )
        
        return overall_similarity
    
    def _merge_concepts(self, target_id: str, source_id: str):
        """Merge source concept into target concept"""
        
        if source_id not in self.concepts or target_id not in self.concepts:
            return
        
        source = self.concepts[source_id]
        target = self.concepts[target_id]
        
        # Merge properties (weighted average)
        total_access = target.access_count + source.access_count
        weight_target = target.access_count / total_access
        weight_source = source.access_count / total_access
        
        target.phase = target.phase * weight_target + source.phase * weight_source
        target.amplitude = target.amplitude * weight_target + source.amplitude * weight_source
        target.frequency = target.frequency * weight_target + source.frequency * weight_source
        target.stability_score = max(target.stability_score, source.stability_score)
        target.access_count = total_access
        target.last_accessed = max(target.last_accessed, source.last_accessed)
        
        # Merge connections
        target.connections.update(source.connections)
        target.connections.discard(target_id)  # Remove self-connection
        
        # Update metadata
        target.metadata.update(source.metadata)
        
        # Redirect connections pointing to source
        connections_to_update = []
        for conn_key, connection in self.connections.items():
            if source_id in conn_key:
                connections_to_update.append((conn_key, connection))
        
        for old_key, connection in connections_to_update:
            del self.connections[old_key]
            
            # Create new connection key
            if old_key[0] == source_id:
                new_key = (target_id, old_key[1])
            else:
                new_key = (old_key[0], target_id)
            
            # Avoid duplicate connections
            if new_key not in self.connections:
                connection.source_id = new_key[0]
                connection.target_id = new_key[1]
                self.connections[new_key] = connection
        
        # Remove source concept
        del self.concepts[source_id]
    
    def _apply_natural_decay(self) -> List[PruningAction]:
        """Apply natural decay to connection strengths"""
        
        actions = []
        current_time = datetime.now()
        decayed_connections = 0
        
        for connection in self.connections.values():
            time_since_use = (current_time - connection.last_reinforced).total_seconds()
            
            # Apply decay based on time since last use
            decay_factor = np.exp(-time_since_use * connection.decay_rate / (24 * 3600))
            
            old_strength = connection.strength
            connection.strength *= decay_factor
            
            # Remove very weak connections
            if connection.strength < 0.1:
                # Will be removed in next pruning cycle
                pass
            
            if old_strength - connection.strength > 0.01:
                decayed_connections += 1
        
        if decayed_connections > 0:
            actions.append(PruningAction(
                action_type="natural_decay",
                timestamp=current_time,
                target_concepts=[],
                target_connections=[],
                reason=f"applied_decay_to_{decayed_connections}_connections",
                stability_impact=-0.01,
                reversible=False
            ))
        
        return actions
    
    def _emergency_pruning(self):
        """Emergency pruning when memory limit exceeded"""
        
        logger.warning("Emergency pruning triggered - memory limit exceeded")
        
        # Temporarily enable aggressive pruning
        old_aggressive = self.enable_aggressive_pruning
        self.enable_aggressive_pruning = True
        
        # Find least stable concepts
        concepts_by_stability = sorted(
            self.concepts.items(),
            key=lambda x: x[1].stability_score
        )
        
        # Remove bottom 10% of concepts
        num_to_remove = max(1, len(self.concepts) // 10)
        
        for concept_id, concept in concepts_by_stability[:num_to_remove]:
            self._prune_concept(concept_id, "emergency_pruning")
        
        # Restore aggressive pruning setting
        self.enable_aggressive_pruning = old_aggressive
        
        logger.warning(f"Emergency pruning removed {num_to_remove} concepts")
    
    def _update_sculpting_metrics(self, actions: List[PruningAction]):
        """Update sculpting performance metrics"""
        
        self.sculpting_metrics['total_pruning_cycles'] += 1
        
        for action in actions:
            if action.action_type == "prune_concept":
                self.sculpting_metrics['concepts_pruned'] += len(action.target_concepts)
            elif action.action_type == "prune_connection":
                self.sculpting_metrics['connections_pruned'] += len(action.target_connections)
            elif action.action_type == "strengthen":
                self.sculpting_metrics['concepts_strengthened'] += len(action.target_concepts)
            elif action.action_type == "form_cluster":
                self.sculpting_metrics['clusters_formed'] += 1
        
        # Calculate average stability
        if self.concepts:
            self.sculpting_metrics['average_stability'] = np.mean([
                concept.stability_score for concept in self.concepts.values()
            ])
        
        # Calculate memory efficiency (concepts per connection)
        if self.connections:
            self.sculpting_metrics['memory_efficiency'] = len(self.concepts) / len(self.connections)
        else:
            self.sculpting_metrics['memory_efficiency'] = len(self.concepts)
    
    def get_sculpting_report(self) -> Dict:
        """Generate comprehensive sculpting report"""
        
        current_time = datetime.now()
        
        # Calculate current statistics
        total_concepts = len(self.concepts)
        total_connections = len(self.connections)
        total_clusters = len(self.clusters)
        
        # Stability distribution
        if self.concepts:
            stabilities = [concept.stability_score for concept in self.concepts.values()]
            stability_stats = {
                'mean': np.mean(stabilities),
                'std': np.std(stabilities),
                'min': np.min(stabilities),
                'max': np.max(stabilities),
                'below_threshold': sum(1 for s in stabilities if s < self.stability_threshold)
            }
        else:
            stability_stats = {'mean': 0, 'std': 0, 'min': 0, 'max': 0, 'below_threshold': 0}
        
        # Recent actions
        recent_actions = [action for action in self.pruning_history[-20:]]
        
        report = {
            'timestamp': current_time,
            'sculpting_active': self.is_sculpting,
            
            'memory_state': {
                'total_concepts': total_concepts,
                'total_connections': total_connections,
                'total_clusters': total_clusters,
                'memory_usage_percent': (total_concepts / self.max_memory_size) * 100,
                'stability_stats': stability_stats
            },
            
            'sculpting_metrics': self.sculpting_metrics.copy(),
            
            'recent_actions': [
                {
                    'action_type': action.action_type,
                    'timestamp': action.timestamp.isoformat(),
                    'target_count': len(action.target_concepts) + len(action.target_connections),
                    'reason': action.reason,
                    'stability_impact': action.stability_impact
                }
                for action in recent_actions
            ],
            
            'recommendations': self._generate_sculpting_recommendations()
        }
        
        return report
    
    def _generate_sculpting_recommendations(self) -> List[str]:
        """Generate actionable sculpting recommendations"""
        
        recommendations = []
        
        # Memory usage recommendations
        usage_percent = (len(self.concepts) / self.max_memory_size) * 100
        if usage_percent > 90:
            recommendations.append("Memory usage critical - consider more aggressive pruning")
        elif usage_percent > 75:
            recommendations.append("Memory usage high - monitor for stability impacts")
        
        # Stability recommendations
        if self.sculpting_metrics['average_stability'] < 0.5:
            recommendations.append("Low average stability - review pruning thresholds")
        
        # Efficiency recommendations
        if self.sculpting_metrics['memory_efficiency'] < 2.0:
            recommendations.append("Memory network too dense - consider pruning weak connections")
        elif self.sculpting_metrics['memory_efficiency'] > 10.0:
            recommendations.append("Memory network too sparse - consider strengthening clusters")
        
        # Activity recommendations
        if not self.is_sculpting:
            recommendations.append("Memory sculpting inactive - consider starting background processing")
        
        if not recommendations:
            recommendations.append("Memory sculpting operating optimally")
        
        return recommendations

# Example usage and testing
if __name__ == "__main__":
    
    # Create memory sculptor
    sculptor = MemorySculptor(
        stability_threshold=0.3,
        coherence_threshold=0.5,
        pruning_interval=10.0,  # Fast for testing
        max_memory_size=100
    )
    
    # Start sculpting
    sculptor.start_sculpting()
    
    try:
        print("Simulating memory operations...")
        
        # Add many concepts
        for i in range(50):
            concept_id = f"concept_{i}"
            phase = np.random.rand() * 2 * np.pi
            amplitude = 0.5 + np.random.rand()
            frequency = 0.5 + np.random.rand()
            
            sculptor.add_concept(concept_id, phase, amplitude, frequency)
            
            # Add some random connections
            if i > 0:
                for j in range(np.random.randint(0, 3)):
                    target_idx = np.random.randint(0, i)
                    target_id = f"concept_{target_idx}"
                    strength = np.random.rand()
                    coherence = np.random.rand()
                    
                    sculptor.add_connection(concept_id, target_id, strength, coherence)
        
        # Let it run for a while
        print("Letting sculptor run for 30 seconds...")
        time.sleep(30)
        
        # Get final report
        report = sculptor.get_sculpting_report()
        
        print(f"\nSculpting Report:")
        print(f"Total concepts: {report['memory_state']['total_concepts']}")
        print(f"Total connections: {report['memory_state']['total_connections']}")
        print(f"Average stability: {report['memory_state']['stability_stats']['mean']:.3f}")
        print(f"Concepts pruned: {report['sculpting_metrics']['concepts_pruned']}")
        print(f"Connections pruned: {report['sculpting_metrics']['connections_pruned']}")
        print(f"Clusters formed: {report['sculpting_metrics']['clusters_formed']}")
        
        print("\nRecommendations:")
        for rec in report['recommendations']:
            print(f"  - {rec}")
        
    finally:
        sculptor.stop_sculpting()
    
    print("\n✅ MemorySculptor test completed successfully!")
