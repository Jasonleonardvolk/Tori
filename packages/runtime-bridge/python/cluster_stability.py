"""
Concept Cluster Stability Analysis Module

This module performs spectral clustering on concept graphs and analyzes 
the stability of identified concept clusters. It detects when clusters are 
at risk of becoming unstable before it happens, providing early warnings.
"""

from __future__ import annotations
import os
import time
import json
import logging
import networkx as nx
import numpy as np
from dataclasses import dataclass, asdict
from typing import Dict, List, Tuple, Callable, Optional, Any, Set

# Configure logger
logger = logging.getLogger("cluster_stability")

@dataclass(slots=True)
class ClusterAlert:
    """Alert generated when a concept cluster is at risk of instability."""
    cluster_id: int
    eta_sec: int          # Time until expected instability (seconds)
    stab_now: float       # Current stability score
    stab_forecast: float  # Forecast stability score
    concepts: List[str]   # Concept IDs in the cluster
    root_cause: str = ''  # Optional description of likely cause
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)

# ---------- Configuration ----------------------------------------------------------

# Default thresholds - can be overridden via environment variables
DEFAULT_CHI_THRESHOLD = 0.45   # Coherence threshold
DEFAULT_STAB_THRESHOLD = 0.15  # Stability threshold

# ---------- Helper Functions -------------------------------------------------------

def spectral_gap(G: nx.Graph) -> float:
    """
    Calculate the normalized spectral gap of a graph.
    
    The spectral gap is λ₂(Laplacian), normalized to 0-1 range.
    A small spectral gap indicates the graph is close to being disconnected.
    
    Args:
        G: NetworkX graph
        
    Returns:
        Normalized spectral gap (0-1)
    """
    # Handle edge cases
    if G.number_of_nodes() < 3:          # Trivial cluster
        return 1.0
    
    if G.number_of_edges() == 0:         # No edges
        return 0.0
        
    # Calculate normalized Laplacian matrix
    L = nx.normalized_laplacian_matrix(G).todense()
    
    # Calculate eigenvalues
    evals = np.linalg.eigvals(L)
    
    # Sort and get the second smallest eigenvalue (λ₂)
    gap = sorted(np.real(evals))[1]
    
    return float(gap)

def modularity_score(G: nx.Graph, communities: List[Set[str]]) -> float:
    """
    Calculate the modularity score for a given community structure.
    
    Args:
        G: NetworkX graph
        communities: List of sets of nodes, each set representing a community
        
    Returns:
        Modularity score (higher is better)
    """
    return nx.algorithms.community.modularity(G, communities)

def find_communities(G: nx.Graph) -> List[Set[str]]:
    """
    Find communities in the concept graph using modularity-based clustering.
    
    Args:
        G: NetworkX graph where nodes are concepts
        
    Returns:
        List of sets, each set containing concept IDs in a community
    """
    # Use Louvain method for community detection (greedy modularity optimization)
    try:
        communities = list(nx.algorithms.community.greedy_modularity_communities(G))
        return communities
    except Exception as e:
        logger.error(f"Community detection failed: {e}")
        # Fallback: each connected component is a community
        return list(nx.connected_components(G))

# ---------- Main Functions ---------------------------------------------------------

def analyze_clusters(
    G_full: nx.Graph,
    chi: Dict[str, float],           # Per-concept coherence χᵢ
    horizon_steps: int = 6,          # 6 × 5 min ≈ 30 min horizon
    forecast_fn: Optional[Callable[[float], float]] = None,  # PCA Level-1 ARIMA
    chi_thresh: float = DEFAULT_CHI_THRESHOLD,
    stab_thresh: float = DEFAULT_STAB_THRESHOLD,
) -> List[ClusterAlert]:
    """
    Analyze concept clusters and generate alerts for clusters at risk of instability.
    
    Args:
        G_full: NetworkX graph of concepts with edges weighted by semantic similarity
        chi: Dictionary mapping concept IDs to coherence scores
        horizon_steps: Number of steps to forecast ahead
        forecast_fn: Function to forecast a value into the future (if None, uses identity)
        chi_thresh: Threshold for coherence concern
        stab_thresh: Threshold for stability concern
        
    Returns:
        List of ClusterAlert objects for at-risk clusters
    """
    # Failsafe flag - allows emergency disabling of cluster alerts
    if os.getenv("DISABLE_CLUSTER_ALERTS") == "1":
        logger.info("Cluster alerts disabled by DISABLE_CLUSTER_ALERTS=1")
        return []
    if forecast_fn is None:
        # Identity function if no forecaster provided
        forecast_fn = lambda x: x
        
    # Detect communities in the concept graph
    communities = find_communities(G_full)
    modularity = modularity_score(G_full, communities)
    logger.info(f"Detected {len(communities)} communities with modularity {modularity:.4f}")
    
    # Analyze each community for stability
    alerts: List[ClusterAlert] = []
    
    for idx, comm in enumerate(communities):
        # Skip very small communities (less than 3 nodes)
        if len(comm) < 3:
            continue
            
        # Get subgraph for this community
        sub = G_full.subgraph(comm)
        
        # Calculate spectral gap (measure of how well-connected the community is)
        gap = spectral_gap(sub)
        
        # Find minimum coherence score within the community (weakest link)
        try:
            chi_c = min(chi.get(n, 1.0) for n in comm)
        except ValueError:
            # If no coherence scores available, assume neutral
            chi_c = 0.7
            
        # Calculate stability score as product of spectral gap and coherence
        stab_now = gap * chi_c
        
        # Forecast future stability
        chi_fore = forecast_fn(chi_c)
        gap_fore = forecast_fn(gap)
        stab_fore = gap_fore * chi_fore
        
        # Check if forecasted stability or coherence is concerning
        if chi_fore < chi_thresh or stab_fore < stab_thresh:
            # Determine potential root cause
            root_cause = ""
            if chi_fore < chi_thresh and gap_fore < 0.5:
                root_cause = "Weak coherence and poor connectivity"
            elif chi_fore < chi_thresh:
                root_cause = "Weak concept coherence"
            elif gap_fore < 0.5:
                root_cause = "Cluster approaching bifurcation"
                
            # Create alert
            alerts.append(
                ClusterAlert(
                    cluster_id=idx,
                    eta_sec=horizon_steps * 300,  # Convert steps to seconds (5min = 300s)
                    stab_now=stab_now,
                    stab_forecast=stab_fore,
                    concepts=list(comm),
                    root_cause=root_cause
                )
            )
            
            logger.warning(
                f"Cluster {idx} alert: stability {stab_now:.2f} → {stab_fore:.2f}, "
                f"ETA {horizon_steps * 5}min, {len(comm)} concepts"
            )
            
    return alerts

def build_concept_graph(
    concept_similarities: Dict[str, Dict[str, float]],
    similarity_threshold: float = 0.3
) -> nx.Graph:
    """
    Build a concept graph from similarity data.
    
    Args:
        concept_similarities: Nested dict mapping concept pairs to similarity scores
        similarity_threshold: Minimum similarity to create an edge
        
    Returns:
        NetworkX graph with concepts as nodes and similarities as edge weights
    """
    G = nx.Graph()
    
    # Add all concepts as nodes
    for concept_id in concept_similarities:
        G.add_node(concept_id)
        
    # Add edges based on similarities
    for concept_id, similarities in concept_similarities.items():
        for other_id, sim in similarities.items():
            if sim >= similarity_threshold and concept_id != other_id:
                G.add_edge(concept_id, other_id, weight=sim)
                
    logger.info(f"Built concept graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges")
    return G

def simulate_desync(G: nx.Graph, chi: Dict[str, float], community_idx: int = 0, factor: float = 0.7) -> Dict[str, float]:
    """
    Simulate desynchronization in a specific community for testing.
    
    Args:
        G: Concept graph
        chi: Dictionary of coherence values
        community_idx: Index of the community to desynchronize
        factor: Factor to multiply coherence by (lower = more desync)
        
    Returns:
        Updated chi dictionary with reduced values for the targeted community
    """
    communities = find_communities(G)
    if community_idx >= len(communities):
        raise ValueError(f"Community index {community_idx} out of range (0-{len(communities)-1})")
        
    target_community = list(communities)[community_idx]
    new_chi = chi.copy()
    
    for concept_id in target_community:
        if concept_id in new_chi:
            new_chi[concept_id] *= factor
            
    return new_chi

# ---------- For unit testing ------------------------------------------------------

def create_test_graph() -> Tuple[nx.Graph, Dict[str, float]]:
    """Create a test graph with clear community structure for unit testing."""
    # Create a barbell graph - two cliques connected by a bridge
    G = nx.barbell_graph(5, 1)
    
    # Convert to string node IDs
    mapping = {i: f"concept_{i}" for i in G.nodes()}
    G = nx.relabel_nodes(G, mapping)
    
    # Add weights
    for u, v in G.edges():
        G[u][v]['weight'] = 0.8
        
    # Decrease weight of bridge edge
    bridge_nodes = [f"concept_{4}", f"concept_{5}"]
    G[bridge_nodes[0]][bridge_nodes[1]]['weight'] = 0.3
    
    # Create chi scores - all healthy
    chi = {node: 0.8 for node in G.nodes()}
    
    return G, chi
