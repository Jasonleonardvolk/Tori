"""
TORI MultiScaleHierarchy - Python Analysis Component
Mathematical clustering and scaling algorithms for concept organization

This module provides the mathematical foundation for determining optimal
concept hierarchies using various clustering algorithms and scale-space
analysis techniques.
"""

import numpy as np
import json
import logging
from typing import List, Dict, Tuple, Optional, Set, Any
from dataclasses import dataclass, asdict
from sklearn.cluster import AgglomerativeClustering, DBSCAN, KMeans
from sklearn.metrics.pairwise import cosine_similarity, euclidean_distances
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
import networkx as nx
from scipy.cluster.hierarchy import dendrogram, linkage, fcluster
from scipy.spatial.distance import pdist, squareform
from scipy import stats

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ConceptVector:
    """Represents a concept with its vector embedding and metadata"""
    concept_id: int
    name: str
    embedding: List[float]
    domain: Optional[str] = None
    scale_hint: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class ClusteringResult:
    """Result of a clustering operation"""
    cluster_assignments: List[int]
    cluster_centers: Optional[List[List[float]]]
    cluster_quality: float
    method_used: str
    parameters: Dict[str, Any]
    hierarchy_levels: Optional[List[List[int]]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class HierarchyGrouping:
    """Suggested grouping for hierarchy construction"""
    parent_concept_id: Optional[int]
    child_concept_ids: List[int]
    suggested_scale: int
    confidence: float
    reasoning: str
    cluster_center: Optional[List[float]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class ScaleSpaceAnalyzer:
    """
    Implements scale-space analysis for multi-resolution concept organization.
    
    This class provides mathematical tools for determining optimal scales
    and hierarchical organization of concepts based on their semantic
    embeddings and relationships.
    """
    
    def __init__(self, min_cluster_size: int = 2, max_scale_levels: int = 5):
        self.min_cluster_size = min_cluster_size
        self.max_scale_levels = max_scale_levels
        self.distance_metrics = {
            'cosine': self._cosine_distance,
            'euclidean': self._euclidean_distance,
            'manhattan': self._manhattan_distance
        }
        
    def _cosine_distance(self, vectors: np.ndarray) -> np.ndarray:
        """Compute cosine distance matrix"""
        similarities = cosine_similarity(vectors)
        return 1.0 - similarities
    
    def _euclidean_distance(self, vectors: np.ndarray) -> np.ndarray:
        """Compute Euclidean distance matrix"""
        return euclidean_distances(vectors)
    
    def _manhattan_distance(self, vectors: np.ndarray) -> np.ndarray:
        """Compute Manhattan distance matrix"""
        return np.abs(vectors[:, np.newaxis] - vectors).sum(axis=2)
    
    def analyze_concept_scales(
        self,
        concept_vectors: List[ConceptVector],
        method: str = 'hierarchical',
        distance_metric: str = 'cosine'
    ) -> List[HierarchyGrouping]:
        """
        Analyze concept vectors and suggest hierarchical groupings.
        
        Args:
            concept_vectors: List of concept vectors to analyze
            method: Clustering method ('hierarchical', 'dbscan', 'kmeans')
            distance_metric: Distance metric to use
            
        Returns:
            List of suggested hierarchy groupings
        """
        if len(concept_vectors) < 2:
            logger.warning("Need at least 2 concepts for hierarchy analysis")
            return []
        
        # Convert to numpy arrays
        embeddings = np.array([cv.embedding for cv in concept_vectors])
        concept_ids = [cv.concept_id for cv in concept_vectors]
        
        logger.info(f"Analyzing {len(concept_vectors)} concepts using {method} clustering")
        
        if method == 'hierarchical':
            return self._hierarchical_clustering(embeddings, concept_ids, concept_vectors, distance_metric)
        elif method == 'dbscan':
            return self._dbscan_clustering(embeddings, concept_ids, concept_vectors, distance_metric)
        elif method == 'kmeans':
            return self._kmeans_clustering(embeddings, concept_ids, concept_vectors)
        else:
            raise ValueError(f"Unknown clustering method: {method}")
    
    def _hierarchical_clustering(
        self,
        embeddings: np.ndarray,
        concept_ids: List[int],
        concept_vectors: List[ConceptVector],
        distance_metric: str
    ) -> List[HierarchyGrouping]:
        """Perform hierarchical clustering and suggest groupings"""
        
        # Compute distance matrix
        if distance_metric in self.distance_metrics:
            distance_matrix = self.distance_metrics[distance_metric](embeddings)
        else:
            raise ValueError(f"Unknown distance metric: {distance_metric}")
        
        # Convert to condensed distance matrix for scipy
        condensed_distances = squareform(distance_matrix, checks=False)
        
        # Perform hierarchical clustering
        linkage_matrix = linkage(condensed_distances, method='ward')
        
        groupings = []
        
        # Generate clusters at different levels
        for scale_level in range(1, min(self.max_scale_levels, len(concept_ids)) + 1):
            n_clusters = max(1, len(concept_ids) // (2 ** scale_level))
            if n_clusters < 1:
                continue
                
            cluster_labels = fcluster(linkage_matrix, n_clusters, criterion='maxclust')
            
            # Group concepts by cluster
            clusters = {}
            for i, label in enumerate(cluster_labels):
                if label not in clusters:
                    clusters[label] = []
                clusters[label].append(i)
            
            # Create groupings for clusters with multiple members
            for cluster_id, member_indices in clusters.items():
                if len(member_indices) >= self.min_cluster_size:
                    child_ids = [concept_ids[i] for i in member_indices]
                    cluster_embeddings = embeddings[member_indices]
                    cluster_center = np.mean(cluster_embeddings, axis=0)
                    
                    # Calculate cluster quality (silhouette-like measure)
                    intra_distances = []
                    for i in member_indices:
                        for j in member_indices:
                            if i != j:
                                intra_distances.append(distance_matrix[i, j])
                    
                    avg_intra_distance = np.mean(intra_distances) if intra_distances else 0.0
                    confidence = max(0.0, 1.0 - (avg_intra_distance / np.max(distance_matrix)))
                    
                    # Determine parent concept (most central)
                    center_distances = [np.linalg.norm(embeddings[i] - cluster_center) for i in member_indices]
                    most_central_idx = member_indices[np.argmin(center_distances)]
                    parent_id = concept_ids[most_central_idx]
                    child_ids_filtered = [cid for cid in child_ids if cid != parent_id]
                    
                    if child_ids_filtered:  # Only create grouping if there are children
                        grouping = HierarchyGrouping(
                            parent_concept_id=parent_id,
                            child_concept_ids=child_ids_filtered,
                            suggested_scale=scale_level,
                            confidence=confidence,
                            reasoning=f"Hierarchical clustering (n_clusters={n_clusters}, "
                                     f"method=ward, metric={distance_metric})",
                            cluster_center=cluster_center.tolist()
                        )
                        groupings.append(grouping)
        
        return groupings
    
    def _dbscan_clustering(
        self,
        embeddings: np.ndarray,
        concept_ids: List[int],
        concept_vectors: List[ConceptVector],
        distance_metric: str
    ) -> List[HierarchyGrouping]:
        """Perform DBSCAN clustering"""
        
        # Determine optimal eps using k-distance graph
        if distance_metric == 'cosine':
            # For cosine distance, use precomputed distance matrix
            distance_matrix = self.distance_metrics[distance_metric](embeddings)
            clustering = DBSCAN(eps=0.3, min_samples=self.min_cluster_size, metric='precomputed')
            cluster_labels = clustering.fit_predict(distance_matrix)
        else:
            # For other metrics, use embeddings directly
            clustering = DBSCAN(eps=0.5, min_samples=self.min_cluster_size, metric=distance_metric)
            cluster_labels = clustering.fit_predict(embeddings)
        
        groupings = []
        
        # Group concepts by cluster (excluding noise points labeled as -1)
        clusters = {}
        for i, label in enumerate(cluster_labels):
            if label != -1:  # Exclude noise
                if label not in clusters:
                    clusters[label] = []
                clusters[label].append(i)
        
        for cluster_id, member_indices in clusters.items():
            if len(member_indices) >= self.min_cluster_size:
                child_ids = [concept_ids[i] for i in member_indices]
                cluster_embeddings = embeddings[member_indices]
                cluster_center = np.mean(cluster_embeddings, axis=0)
                
                # Calculate cluster quality
                if distance_metric == 'cosine':
                    similarities = cosine_similarity(cluster_embeddings)
                    avg_similarity = np.mean(similarities[np.triu_indices_from(similarities, k=1)])
                    confidence = max(0.0, avg_similarity)
                else:
                    distances = euclidean_distances(cluster_embeddings)
                    avg_distance = np.mean(distances[np.triu_indices_from(distances, k=1)])
                    max_possible_distance = np.max(euclidean_distances(embeddings))
                    confidence = max(0.0, 1.0 - (avg_distance / max_possible_distance))
                
                # Choose most central concept as parent
                center_distances = [np.linalg.norm(embeddings[i] - cluster_center) for i in member_indices]
                most_central_idx = member_indices[np.argmin(center_distances)]
                parent_id = concept_ids[most_central_idx]
                child_ids_filtered = [cid for cid in child_ids if cid != parent_id]
                
                if child_ids_filtered:
                    grouping = HierarchyGrouping(
                        parent_concept_id=parent_id,
                        child_concept_ids=child_ids_filtered,
                        suggested_scale=1,  # DBSCAN produces single-level clusters
                        confidence=confidence,
                        reasoning=f"DBSCAN clustering (eps=auto, min_samples={self.min_cluster_size}, "
                                 f"metric={distance_metric})",
                        cluster_center=cluster_center.tolist()
                    )
                    groupings.append(grouping)
        
        return groupings
    
    def _kmeans_clustering(
        self,
        embeddings: np.ndarray,
        concept_ids: List[int],
        concept_vectors: List[ConceptVector]
    ) -> List[HierarchyGrouping]:
        """Perform K-means clustering with optimal k selection"""
        
        # Determine optimal number of clusters using elbow method
        max_k = min(len(concept_ids) // 2, 10)
        if max_k < 2:
            return []
        
        inertias = []
        k_range = range(2, max_k + 1)
        
        for k in k_range:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            kmeans.fit(embeddings)
            inertias.append(kmeans.inertia_)
        
        # Find elbow point
        if len(inertias) < 2:
            optimal_k = 2
        else:
            # Simple elbow detection using second derivative
            diffs = np.diff(inertias)
            second_diffs = np.diff(diffs)
            if len(second_diffs) > 0:
                elbow_idx = np.argmax(second_diffs) + 2
                optimal_k = k_range[min(elbow_idx, len(k_range) - 1)]
            else:
                optimal_k = k_range[0]
        
        # Perform clustering with optimal k
        kmeans = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(embeddings)
        cluster_centers = kmeans.cluster_centers_
        
        groupings = []
        
        # Group concepts by cluster
        clusters = {}
        for i, label in enumerate(cluster_labels):
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(i)
        
        for cluster_id, member_indices in clusters.items():
            if len(member_indices) >= self.min_cluster_size:
                child_ids = [concept_ids[i] for i in member_indices]
                cluster_center = cluster_centers[cluster_id]
                
                # Calculate cluster quality using silhouette-like measure
                cluster_embeddings = embeddings[member_indices]
                intra_distances = euclidean_distances(cluster_embeddings)
                avg_intra_distance = np.mean(intra_distances[np.triu_indices_from(intra_distances, k=1)])
                
                # Calculate distance to nearest other cluster center
                other_centers = np.delete(cluster_centers, cluster_id, axis=0)
                if len(other_centers) > 0:
                    distances_to_others = euclidean_distances([cluster_center], other_centers)[0]
                    min_inter_distance = np.min(distances_to_others)
                    confidence = min_inter_distance / (min_inter_distance + avg_intra_distance)
                else:
                    confidence = 0.8  # Default confidence for single cluster
                
                # Choose concept closest to cluster center as parent
                center_distances = euclidean_distances([cluster_center], cluster_embeddings)[0]
                most_central_idx = member_indices[np.argmin(center_distances)]
                parent_id = concept_ids[most_central_idx]
                child_ids_filtered = [cid for cid in child_ids if cid != parent_id]
                
                if child_ids_filtered:
                    grouping = HierarchyGrouping(
                        parent_concept_id=parent_id,
                        child_concept_ids=child_ids_filtered,
                        suggested_scale=1,
                        confidence=confidence,
                        reasoning=f"K-means clustering (k={optimal_k}, method=elbow)",
                        cluster_center=cluster_center.tolist()
                    )
                    groupings.append(grouping)
        
        return groupings

class TransseriesAnalyzer:
    """
    Implements transseries analysis for detecting conceptual growth patterns
    and alien semantic jumps in concept sequences.
    
    This provides the mathematical foundation for AlienCalculus module
    by analyzing concept introduction patterns for unexpected terms.
    """
    
    def __init__(self, series_window: int = 10, alien_threshold: float = 2.0):
        self.series_window = series_window
        self.alien_threshold = alien_threshold  # Standard deviations for alien detection
    
    def analyze_concept_series(
        self,
        concept_sequence: List[ConceptVector],
        context_name: str = "default"
    ) -> Dict[str, Any]:
        """
        Analyze a sequence of concepts for transseries patterns and alien terms.
        
        Args:
            concept_sequence: Ordered list of concepts
            context_name: Name of the context (e.g., thread or domain)
            
        Returns:
            Analysis results including detected alien terms
        """
        if len(concept_sequence) < 3:
            return {
                'context': context_name,
                'series_length': len(concept_sequence),
                'alien_terms': [],
                'series_coefficients': [],
                'analysis_quality': 0.0
            }
        
        # Compute novelty/surprise metrics for each concept
        novelty_series = self._compute_novelty_series(concept_sequence)
        
        # Fit transseries expansion
        coefficients, residuals = self._fit_transseries(novelty_series)
        
        # Detect alien terms (outliers in residuals)
        alien_indices = self._detect_alien_terms(residuals, novelty_series)
        
        # Compute analysis quality
        quality = self._compute_analysis_quality(novelty_series, residuals, coefficients)
        
        # Create alien term descriptions
        alien_terms = []
        for idx in alien_indices:
            if idx < len(concept_sequence):
                alien_terms.append({
                    'concept_id': concept_sequence[idx].concept_id,
                    'concept_name': concept_sequence[idx].name,
                    'position': idx,
                    'novelty_score': novelty_series[idx],
                    'residual': residuals[idx],
                    'significance': abs(residuals[idx]) / np.std(residuals) if np.std(residuals) > 0 else 0.0
                })
        
        return {
            'context': context_name,
            'series_length': len(concept_sequence),
            'alien_terms': alien_terms,
            'series_coefficients': coefficients.tolist() if coefficients is not None else [],
            'residuals': residuals.tolist(),
            'novelty_series': novelty_series.tolist(),
            'analysis_quality': quality,
            'alien_count': len(alien_terms)
        }
    
    def _compute_novelty_series(self, concept_sequence: List[ConceptVector]) -> np.ndarray:
        """Compute novelty/surprise for each concept in sequence"""
        novelty_scores = []
        
        for i, concept in enumerate(concept_sequence):
            if i == 0:
                # First concept has baseline novelty
                novelty_scores.append(0.5)
            else:
                # Compute semantic distance to previous concepts
                current_embedding = np.array(concept.embedding)
                previous_embeddings = np.array([c.embedding for c in concept_sequence[:i]])
                
                # Calculate minimum distance to any previous concept
                distances = euclidean_distances([current_embedding], previous_embeddings)[0]
                min_distance = np.min(distances)
                
                # Calculate average distance to recent concepts
                recent_window = min(5, i)
                recent_embeddings = previous_embeddings[-recent_window:]
                recent_distances = euclidean_distances([current_embedding], recent_embeddings)[0]
                avg_recent_distance = np.mean(recent_distances)
                
                # Novelty is combination of minimum distance and recent context distance
                novelty = 0.7 * min_distance + 0.3 * avg_recent_distance
                novelty_scores.append(novelty)
        
        return np.array(novelty_scores)
    
    def _fit_transseries(self, novelty_series: np.ndarray) -> Tuple[Optional[np.ndarray], np.ndarray]:
        """Fit a polynomial transseries to the novelty series"""
        if len(novelty_series) < 3:
            return None, novelty_series
        
        # Create time indices
        t = np.arange(len(novelty_series))
        
        # Fit polynomial (degree determined by series length)
        max_degree = min(3, len(novelty_series) - 1)
        
        try:
            # Fit polynomial and compute residuals
            coefficients = np.polyfit(t, novelty_series, max_degree)
            fitted_values = np.polyval(coefficients, t)
            residuals = novelty_series - fitted_values
            
            return coefficients, residuals
        except np.linalg.LinAlgError:
            # Fallback to linear fit
            try:
                coefficients = np.polyfit(t, novelty_series, 1)
                fitted_values = np.polyval(coefficients, t)
                residuals = novelty_series - fitted_values
                return coefficients, residuals
            except:
                return None, novelty_series
    
    def _detect_alien_terms(self, residuals: np.ndarray, novelty_series: np.ndarray) -> List[int]:
        """Detect alien terms based on residual analysis"""
        if len(residuals) < 3:
            return []
        
        # Calculate z-scores for residuals
        residual_std = np.std(residuals)
        if residual_std == 0:
            return []
        
        z_scores = np.abs(residuals) / residual_std
        
        # Detect outliers using threshold
        alien_indices = []
        for i, z_score in enumerate(z_scores):
            if z_score > self.alien_threshold:
                # Additional check: must also have high novelty
                if novelty_series[i] > np.mean(novelty_series) + np.std(novelty_series):
                    alien_indices.append(i)
        
        return alien_indices
    
    def _compute_analysis_quality(
        self,
        novelty_series: np.ndarray,
        residuals: np.ndarray,
        coefficients: Optional[np.ndarray]
    ) -> float:
        """Compute quality measure for the transseries analysis"""
        if coefficients is None or len(novelty_series) < 3:
            return 0.0
        
        # Calculate R-squared equivalent
        ss_res = np.sum(residuals ** 2)
        ss_tot = np.sum((novelty_series - np.mean(novelty_series)) ** 2)
        
        if ss_tot == 0:
            return 0.0
        
        r_squared = 1 - (ss_res / ss_tot)
        
        # Adjust for series length and complexity
        length_factor = min(1.0, len(novelty_series) / 10.0)
        complexity_penalty = 0.1 * len(coefficients)
        
        quality = max(0.0, r_squared * length_factor - complexity_penalty)
        return min(1.0, quality)

# ===================================================================
# API FUNCTIONS FOR RUST INTEGRATION
# ===================================================================

def suggest_hierarchy_group(
    concept_vectors_json: str,
    method: str = 'hierarchical',
    distance_metric: str = 'cosine',
    min_cluster_size: int = 2
) -> str:
    """
    Main API function for Rust integration.
    
    Args:
        concept_vectors_json: JSON string containing concept vectors
        method: Clustering method to use
        distance_metric: Distance metric
        min_cluster_size: Minimum cluster size
        
    Returns:
        JSON string containing grouping suggestions
    """
    try:
        # Parse input
        data = json.loads(concept_vectors_json)
        concept_vectors = []
        
        for item in data:
            cv = ConceptVector(
                concept_id=item['concept_id'],
                name=item['name'],
                embedding=item['embedding'],
                domain=item.get('domain'),
                scale_hint=item.get('scale_hint'),
                metadata=item.get('metadata')
            )
            concept_vectors.append(cv)
        
        # Create analyzer
        analyzer = ScaleSpaceAnalyzer(min_cluster_size=min_cluster_size)
        
        # Perform analysis
        groupings = analyzer.analyze_concept_scales(
            concept_vectors=concept_vectors,
            method=method,
            distance_metric=distance_metric
        )
        
        # Convert to JSON-serializable format
        result = {
            'groupings': [grouping.to_dict() for grouping in groupings],
            'method_used': method,
            'distance_metric': distance_metric,
            'total_concepts': len(concept_vectors),
            'total_groupings': len(groupings)
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error in suggest_hierarchy_group: {e}")
        error_result = {
            'error': str(e),
            'groupings': [],
            'method_used': method,
            'total_concepts': 0,
            'total_groupings': 0
        }
        return json.dumps(error_result, indent=2)

# ===================================================================
# COMMAND LINE INTERFACE FOR TESTING
# ===================================================================

if __name__ == "__main__":
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(description="TORI MultiScale Hierarchy Analysis")
    parser.add_argument('command', choices=['cluster'], 
                       help='Analysis command to run')
    parser.add_argument('--input', required=True, help='Input JSON file')
    parser.add_argument('--output', help='Output JSON file (default: stdout)')
    parser.add_argument('--method', default='hierarchical', help='Method for clustering')
    parser.add_argument('--metric', default='cosine', help='Distance metric')
    parser.add_argument('--min-size', type=int, default=2, help='Minimum cluster size')
    
    args = parser.parse_args()
    
    try:
        with open(args.input, 'r') as f:
            input_data = f.read()
        
        if args.command == 'cluster':
            result = suggest_hierarchy_group(
                concept_vectors_json=input_data,
                method=args.method,
                distance_metric=args.metric,
                min_cluster_size=args.min_size
            )
        
        if args.output:
            with open(args.output, 'w') as f:
                f.write(result)
            print(f"Results written to {args.output}")
        else:
            print(result)
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
