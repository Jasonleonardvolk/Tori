#!/usr/bin/env python3
"""
TORI WormholeEngine - Python Semantic Bridge Analysis

This module provides advanced semantic analysis capabilities for the TORI
WormholeEngine, including vector embeddings, similarity computation, and
machine learning-based semantic bridging between distant concepts.

Features:
- High-dimensional vector embedding management
- Advanced similarity metrics beyond cosine similarity
- Contextual semantic analysis using transformer models
- Analogical reasoning and structural similarity detection
- Real-time semantic bridge suggestion API
- Integration with external knowledge bases and ontologies
"""

import asyncio
import argparse
import json
import logging
import numpy as np
import time
from typing import Dict, List, Tuple, Optional, Any, Set
from dataclasses import dataclass, asdict
from abc import ABC, abstractmethod
import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity, euclidean_distances
from sklearn.cluster import DBSCAN
from sklearn.decomposition import PCA
import networkx as nx
import threading
import queue
import pickle
import hashlib
from pathlib import Path
import requests
import warnings
warnings.filterwarnings("ignore")

# ===================================================================
# CONFIGURATION AND SETUP
# ===================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class SemanticBridgeConfig:
    """Configuration for semantic bridge analysis"""
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimensions: int = 384
    similarity_threshold: float = 0.7
    analogical_threshold: float = 0.6
    cache_size: int = 10000
    batch_size: int = 32
    max_concept_length: int = 512
    use_gpu: bool = True
    knowledge_graph_path: Optional[str] = None
    external_apis: Dict[str, str] = None
    clustering_eps: float = 0.3
    clustering_min_samples: int = 3
    conceptnet_api_url: str = "http://api.conceptnet.io"
    enable_external_knowledge: bool = True
    cache_directory: str = "./semantic_cache"
    model_cache_directory: str = "./model_cache"

# ===================================================================
# DATA MODELS AND TYPES
# ===================================================================

class ConceptEmbeddingRequest(BaseModel):
    concept_id: int
    text: str
    context: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SimilarityRequest(BaseModel):
    concept_a: int
    concept_b: int
    similarity_types: List[str] = Field(default=["cosine", "semantic", "analogical"])
    context: Optional[str] = None

class SemanticBridgeRequest(BaseModel):
    source_concept: int
    target_concepts: List[int]
    max_bridges: int = 10
    bridge_types: List[str] = Field(default=["semantic", "analogical", "causal"])
    context_filter: Optional[str] = None

class ConceptAnalysisRequest(BaseModel):
    concept_ids: List[int]
    analysis_types: List[str] = Field(default=["clustering", "centrality", "bridges"])

@dataclass
class SemanticBridge:
    source_concept: int
    target_concept: int
    bridge_type: str
    strength: float
    confidence: float
    explanation: str
    intermediate_concepts: List[int]
    metadata: Dict[str, Any]

@dataclass
class ConceptEmbedding:
    concept_id: int
    embedding: np.ndarray
    text: str
    context: Optional[str]
    model_version: str
    created_at: float
    metadata: Dict[str, Any]

@dataclass
class SimilarityResult:
    concept_a: int
    concept_b: int
    similarity_scores: Dict[str, float]
    explanations: Dict[str, str]
    confidence: float

# ===================================================================
# EMBEDDING AND SIMILARITY ENGINES
# ===================================================================

class EmbeddingEngine(ABC):
    """Abstract base class for embedding generation"""
    
    @abstractmethod
    def encode(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        pass
    
    @abstractmethod
    def get_dimensions(self) -> int:
        pass

class TransformerEmbeddingEngine(EmbeddingEngine):
    """Transformer-based embedding engine using sentence-transformers"""
    
    def __init__(self, model_name: str, cache_dir: str, use_gpu: bool = True):
        self.model_name = model_name
        self.device = "cuda" if use_gpu and torch.cuda.is_available() else "cpu"
        
        logger.info(f"Loading embedding model: {model_name} on {self.device}")
        
        self.model = SentenceTransformer(
            model_name, 
            cache_folder=cache_dir,
            device=self.device
        )
        self.dimensions = self.model.get_sentence_embedding_dimension()
        
        logger.info(f"Embedding model loaded. Dimensions: {self.dimensions}")
    
    def encode(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """Generate embeddings for a list of texts"""
        if not texts:
            return np.array([])
        
        # Clean and truncate texts
        cleaned_texts = [self._clean_text(text) for text in texts]
        
        # Generate embeddings
        embeddings = self.model.encode(
            cleaned_texts,
            batch_size=batch_size,
            show_progress_bar=len(texts) > 100,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        
        return embeddings
    
    def encode_single(self, text: str) -> np.ndarray:
        """Generate embedding for a single text"""
        return self.encode([text])[0]
    
    def get_dimensions(self) -> int:
        return self.dimensions
    
    def _clean_text(self, text: str) -> str:
        """Clean and preprocess text for embedding"""
        # Remove excessive whitespace
        text = " ".join(text.split())
        
        # Truncate if too long
        if len(text) > 512:
            text = text[:512]
        
        return text

class SimilarityEngine:
    """Advanced similarity computation engine"""
    
    def __init__(self, config: SemanticBridgeConfig):
        self.config = config
    
    def compute_cosine_similarity(self, emb_a: np.ndarray, emb_b: np.ndarray) -> float:
        """Compute cosine similarity between two embeddings"""
        if emb_a.ndim == 1:
            emb_a = emb_a.reshape(1, -1)
        if emb_b.ndim == 1:
            emb_b = emb_b.reshape(1, -1)
        
        similarity = cosine_similarity(emb_a, emb_b)[0, 0]
        return float(similarity)
    
    def compute_euclidean_similarity(self, emb_a: np.ndarray, emb_b: np.ndarray) -> float:
        """Compute similarity based on Euclidean distance"""
        if emb_a.ndim == 1:
            emb_a = emb_a.reshape(1, -1)
        if emb_b.ndim == 1:
            emb_b = emb_b.reshape(1, -1)
        
        distance = euclidean_distances(emb_a, emb_b)[0, 0]
        # Convert distance to similarity (0-1 range)
        similarity = 1.0 / (1.0 + distance)
        return float(similarity)
    
    def compute_dot_product_similarity(self, emb_a: np.ndarray, emb_b: np.ndarray) -> float:
        """Compute dot product similarity"""
        similarity = np.dot(emb_a, emb_b)
        return float(similarity)
    
    def compute_semantic_similarity(self, 
                                   emb_a: np.ndarray, 
                                   emb_b: np.ndarray,
                                   context_a: Optional[str] = None,
                                   context_b: Optional[str] = None) -> Tuple[float, str]:
        """Compute contextual semantic similarity with explanation"""
        
        # Base cosine similarity
        cosine_sim = self.compute_cosine_similarity(emb_a, emb_b)
        
        # Context boost if available
        context_boost = 0.0
        if context_a and context_b:
            context_boost = self._compute_context_similarity(context_a, context_b)
        
        # Combined semantic similarity
        semantic_sim = (cosine_sim * 0.8) + (context_boost * 0.2)
        
        explanation = f"Cosine: {cosine_sim:.3f}"
        if context_boost > 0:
            explanation += f", Context boost: {context_boost:.3f}"
        
        return semantic_sim, explanation
    
    def compute_analogical_similarity(self,
                                    emb_a: np.ndarray,
                                    emb_b: np.ndarray,
                                    relationship_vectors: Optional[Dict[str, np.ndarray]] = None) -> Tuple[float, str]:
        """Compute analogical similarity based on relationship vectors"""
        
        # For now, use a simplified analogical similarity
        # In a full implementation, this would use learned relationship vectors
        
        # Compute vector difference (relationship)
        diff_vector = emb_b - emb_a
        diff_magnitude = np.linalg.norm(diff_vector)
        
        # Normalize the difference to get relationship direction
        if diff_magnitude > 0:
            relationship_direction = diff_vector / diff_magnitude
        else:
            relationship_direction = np.zeros_like(diff_vector)
        
        # Analogical similarity based on relationship consistency
        # This is a placeholder - would be enhanced with learned analogies
        analogical_sim = 1.0 / (1.0 + diff_magnitude)
        
        explanation = f"Relationship magnitude: {diff_magnitude:.3f}"
        
        return analogical_sim, explanation
    
    def _compute_context_similarity(self, context_a: str, context_b: str) -> float:
        """Compute similarity between context strings"""
        # Simple word overlap for now - could be enhanced with embeddings
        words_a = set(context_a.lower().split())
        words_b = set(context_b.lower().split())
        
        if not words_a or not words_b:
            return 0.0
        
        intersection = words_a.intersection(words_b)
        union = words_a.union(words_b)
        
        return len(intersection) / len(union) if union else 0.0

# ===================================================================
# KNOWLEDGE GRAPH INTEGRATION
# ===================================================================

class KnowledgeGraphEngine:
    """Integration with external knowledge graphs like ConceptNet"""
    
    def __init__(self, config: SemanticBridgeConfig):
        self.config = config
        self.session = requests.Session()
        self.cache = {}
    
    def get_concept_relations(self, concept: str) -> List[Dict[str, Any]]:
        """Get relations for a concept from ConceptNet"""
        if not self.config.enable_external_knowledge:
            return []
        
        # Check cache first
        cache_key = f"relations_{concept}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            url = f"{self.config.conceptnet_api_url}/c/en/{concept.lower().replace(' ', '_')}"
            response = self.session.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                relations = []
                
                for edge in data.get("edges", []):
                    relations.append({
                        "relation": edge.get("rel", {}).get("label", ""),
                        "start": edge.get("start", {}).get("label", ""),
                        "end": edge.get("end", {}).get("label", ""),
                        "weight": edge.get("weight", 0.0)
                    })
                
                # Cache results
                self.cache[cache_key] = relations
                return relations
            
        except Exception as e:
            logger.warning(f"Failed to fetch ConceptNet relations for {concept}: {e}")
        
        return []
    
    def find_semantic_path(self, concept_a: str, concept_b: str, max_depth: int = 3) -> List[str]:
        """Find semantic path between two concepts using knowledge graph"""
        
        # Get relations for both concepts
        relations_a = self.get_concept_relations(concept_a)
        relations_b = self.get_concept_relations(concept_b)
        
        # Build a simple graph and find shortest path
        graph = nx.Graph()
        
        # Add edges from concept A
        for rel in relations_a:
            if rel["weight"] > 0.5:  # Filter weak relations
                graph.add_edge(concept_a, rel["end"], weight=rel["weight"])
        
        # Add edges from concept B
        for rel in relations_b:
            if rel["weight"] > 0.5:
                graph.add_edge(concept_b, rel["end"], weight=rel["weight"])
        
        # Find shortest path
        try:
            if graph.has_node(concept_a) and graph.has_node(concept_b):
                path = nx.shortest_path(graph, concept_a, concept_b)
                return path
        except nx.NetworkXNoPath:
            pass
        
        return []

# ===================================================================
# MAIN SEMANTIC BRIDGE ANALYZER
# ===================================================================

class SemanticBridgeAnalyzer:
    """Main analyzer for semantic bridges and concept relationships"""
    
    def __init__(self, config: SemanticBridgeConfig):
        self.config = config
        self.embedding_engine = TransformerEmbeddingEngine(
            config.embedding_model,
            config.model_cache_directory,
            config.use_gpu
        )
        self.similarity_engine = SimilarityEngine(config)
        self.knowledge_graph = KnowledgeGraphEngine(config)
        
        # In-memory storage
        self.embeddings: Dict[int, ConceptEmbedding] = {}
        self.concept_texts: Dict[int, str] = {}
        self.similarity_cache: Dict[Tuple[int, int], SimilarityResult] = {}
        
        # Threading for background operations
        self.background_queue = queue.Queue()
        self.background_thread = threading.Thread(target=self._background_worker, daemon=True)
        self.background_thread.start()
        
        # Ensure cache directory exists
        Path(config.cache_directory).mkdir(parents=True, exist_ok=True)
        
        logger.info("SemanticBridgeAnalyzer initialized successfully")
    
    def add_concept_embedding(self, 
                            concept_id: int, 
                            text: str, 
                            context: Optional[str] = None,
                            metadata: Optional[Dict[str, Any]] = None) -> ConceptEmbedding:
        """Add or update a concept embedding"""
        
        # Generate embedding
        embedding = self.embedding_engine.encode_single(text)
        
        # Create embedding object
        concept_embedding = ConceptEmbedding(
            concept_id=concept_id,
            embedding=embedding,
            text=text,
            context=context,
            model_version=self.config.embedding_model,
            created_at=time.time(),
            metadata=metadata or {}
        )
        
        # Store in memory
        self.embeddings[concept_id] = concept_embedding
        self.concept_texts[concept_id] = text
        
        # Invalidate similarity cache for this concept
        self._invalidate_similarity_cache(concept_id)
        
        logger.debug(f"Added embedding for concept {concept_id}: {text[:50]}...")
        
        return concept_embedding
    
    def compute_similarity(self, 
                          concept_a: int, 
                          concept_b: int,
                          similarity_types: List[str] = None) -> SimilarityResult:
        """Compute similarity between two concepts"""
        
        if similarity_types is None:
            similarity_types = ["cosine", "semantic", "analogical"]
        
        # Check cache first
        cache_key = (min(concept_a, concept_b), max(concept_a, concept_b))
        if cache_key in self.similarity_cache:
            cached_result = self.similarity_cache[cache_key]
            # Filter to requested similarity types
            filtered_scores = {k: v for k, v in cached_result.similarity_scores.items() 
                             if k in similarity_types}
            filtered_explanations = {k: v for k, v in cached_result.explanations.items() 
                                   if k in similarity_types}
            
            if filtered_scores:
                return SimilarityResult(
                    concept_a=concept_a,
                    concept_b=concept_b,
                    similarity_scores=filtered_scores,
                    explanations=filtered_explanations,
                    confidence=cached_result.confidence
                )
        
        # Get embeddings
        emb_a = self.embeddings.get(concept_a)
        emb_b = self.embeddings.get(concept_b)
        
        if not emb_a or not emb_b:
            raise ValueError(f"Missing embeddings for concepts {concept_a} or {concept_b}")
        
        # Compute requested similarities
        similarity_scores = {}
        explanations = {}
        
        if "cosine" in similarity_types:
            cosine_sim = self.similarity_engine.compute_cosine_similarity(
                emb_a.embedding, emb_b.embedding
            )
            similarity_scores["cosine"] = cosine_sim
            explanations["cosine"] = f"Cosine similarity: {cosine_sim:.3f}"
        
        if "semantic" in similarity_types:
            semantic_sim, semantic_exp = self.similarity_engine.compute_semantic_similarity(
                emb_a.embedding, emb_b.embedding, emb_a.context, emb_b.context
            )
            similarity_scores["semantic"] = semantic_sim
            explanations["semantic"] = semantic_exp
        
        if "analogical" in similarity_types:
            analogical_sim, analogical_exp = self.similarity_engine.compute_analogical_similarity(
                emb_a.embedding, emb_b.embedding
            )
            similarity_scores["analogical"] = analogical_sim
            explanations["analogical"] = analogical_exp
        
        if "euclidean" in similarity_types:
            euclidean_sim = self.similarity_engine.compute_euclidean_similarity(
                emb_a.embedding, emb_b.embedding
            )
            similarity_scores["euclidean"] = euclidean_sim
            explanations["euclidean"] = f"Euclidean similarity: {euclidean_sim:.3f}"
        
        # Calculate confidence based on consistency of scores
        scores_list = list(similarity_scores.values())
        confidence = 1.0 - (np.std(scores_list) if len(scores_list) > 1 else 0.0)
        
        # Create result
        result = SimilarityResult(
            concept_a=concept_a,
            concept_b=concept_b,
            similarity_scores=similarity_scores,
            explanations=explanations,
            confidence=confidence
        )
        
        # Cache result
        self.similarity_cache[cache_key] = result
        
        return result
    
    def find_semantic_bridges(self, 
                            source_concept: int,
                            target_concepts: List[int],
                            max_bridges: int = 10,
                            bridge_types: List[str] = None) -> List[SemanticBridge]:
        """Find semantic bridges from source to target concepts"""
        
        if bridge_types is None:
            bridge_types = ["semantic", "analogical", "causal"]
        
        bridges = []
        
        for target_concept in target_concepts:
            if source_concept == target_concept:
                continue
            
            # Compute similarities
            similarity_result = self.compute_similarity(
                source_concept, target_concept, bridge_types
            )
            
            # Create bridges for each type that meets threshold
            for bridge_type, score in similarity_result.similarity_scores.items():
                if bridge_type in bridge_types and score >= self.config.similarity_threshold:
                    
                    # Find intermediate concepts if possible
                    intermediate_concepts = self._find_intermediate_concepts(
                        source_concept, target_concept, bridge_type
                    )
                    
                    bridge = SemanticBridge(
                        source_concept=source_concept,
                        target_concept=target_concept,
                        bridge_type=bridge_type,
                        strength=score,
                        confidence=similarity_result.confidence,
                        explanation=similarity_result.explanations.get(bridge_type, ""),
                        intermediate_concepts=intermediate_concepts,
                        metadata={
                            "computed_at": time.time(),
                            "model_version": self.config.embedding_model
                        }
                    )
                    
                    bridges.append(bridge)
        
        # Sort by strength and return top bridges
        bridges.sort(key=lambda b: b.strength, reverse=True)
        return bridges[:max_bridges]
    
    def analyze_concept_cluster(self, concept_ids: List[int]) -> Dict[str, Any]:
        """Analyze a cluster of concepts for relationships and structure"""
        
        if len(concept_ids) < 2:
            return {"error": "Need at least 2 concepts for cluster analysis"}
        
        # Get embeddings
        embeddings = []
        valid_concept_ids = []
        
        for concept_id in concept_ids:
            if concept_id in self.embeddings:
                embeddings.append(self.embeddings[concept_id].embedding)
                valid_concept_ids.append(concept_id)
        
        if len(embeddings) < 2:
            return {"error": "Not enough valid embeddings for analysis"}
        
        embeddings_matrix = np.array(embeddings)
        
        # Compute pairwise similarities
        similarity_matrix = cosine_similarity(embeddings_matrix)
        
        # Clustering analysis
        clustering = DBSCAN(
            eps=self.config.clustering_eps,
            min_samples=self.config.clustering_min_samples,
            metric='cosine'
        ).fit(embeddings_matrix)
        
        # Network analysis
        graph = nx.Graph()
        for i, concept_a in enumerate(valid_concept_ids):
            for j, concept_b in enumerate(valid_concept_ids):
                if i < j and similarity_matrix[i, j] > self.config.similarity_threshold:
                    graph.add_edge(concept_a, concept_b, weight=similarity_matrix[i, j])
        
        # Centrality measures
        centrality = {}
        if graph.number_of_nodes() > 0:
            centrality = {
                "betweenness": nx.betweenness_centrality(graph),
                "closeness": nx.closeness_centrality(graph),
                "degree": nx.degree_centrality(graph)
            }
        
        # Principal component analysis
        pca = PCA(n_components=min(3, len(embeddings)))
        pca_result = pca.fit_transform(embeddings_matrix)
        
        return {
            "concept_ids": valid_concept_ids,
            "cluster_labels": clustering.labels_.tolist(),
            "n_clusters": len(set(clustering.labels_)) - (1 if -1 in clustering.labels_ else 0),
            "similarity_matrix": similarity_matrix.tolist(),
            "centrality_measures": centrality,
            "pca_components": pca_result.tolist(),
            "pca_explained_variance": pca.explained_variance_ratio_.tolist(),
            "average_similarity": float(np.mean(similarity_matrix[np.triu_indices_from(similarity_matrix, k=1)])),
            "connectivity": graph.number_of_edges() / (len(valid_concept_ids) * (len(valid_concept_ids) - 1) / 2) if len(valid_concept_ids) > 1 else 0.0
        }
    
    def suggest_wormhole_candidates(self, 
                                  concept_id: int,
                                  max_candidates: int = 10,
                                  min_similarity: float = None) -> List[Tuple[int, float, str]]:
        """Suggest candidate concepts for wormhole creation"""
        
        if min_similarity is None:
            min_similarity = self.config.similarity_threshold
        
        if concept_id not in self.embeddings:
            return []
        
        query_embedding = self.embeddings[concept_id].embedding
        candidates = []
        
        # Compare with all other concepts
        for other_id, other_embedding in self.embeddings.items():
            if other_id == concept_id:
                continue
            
            # Compute similarity
            similarity = self.similarity_engine.compute_cosine_similarity(
                query_embedding, other_embedding.embedding
            )
            
            if similarity >= min_similarity:
                explanation = f"Cosine similarity: {similarity:.3f}"
                
                # Add knowledge graph enhancement if available
                if self.config.enable_external_knowledge:
                    kg_path = self.knowledge_graph.find_semantic_path(
                        self.concept_texts[concept_id],
                        self.concept_texts[other_id]
                    )
                    if kg_path:
                        explanation += f", KG path: {' -> '.join(kg_path[:3])}"
                
                candidates.append((other_id, similarity, explanation))
        
        # Sort by similarity and return top candidates
        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[:max_candidates]
    
    def get_concept_neighbors(self, concept_id: int, radius: int = 2) -> Set[int]:
        """Get concepts within a certain similarity radius"""
        
        if concept_id not in self.embeddings:
            return set()
        
        neighbors = {concept_id}
        current_level = {concept_id}
        
        for _ in range(radius):
            next_level = set()
            
            for current_concept in current_level:
                candidates = self.suggest_wormhole_candidates(
                    current_concept, 
                    max_candidates=5,
                    min_similarity=self.config.similarity_threshold
                )
                
                for candidate_id, _, _ in candidates:
                    if candidate_id not in neighbors:
                        next_level.add(candidate_id)
            
            neighbors.update(next_level)
            current_level = next_level
            
            if not current_level:
                break
        
        return neighbors
    
    def save_embeddings(self, filepath: str = None):
        """Save embeddings to disk"""
        if filepath is None:
            filepath = Path(self.config.cache_directory) / "embeddings.pkl"
        
        data = {
            "embeddings": self.embeddings,
            "concept_texts": self.concept_texts,
            "config": self.config,
            "saved_at": time.time()
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(data, f)
        
        logger.info(f"Saved {len(self.embeddings)} embeddings to {filepath}")
    
    def load_embeddings(self, filepath: str = None):
        """Load embeddings from disk"""
        if filepath is None:
            filepath = Path(self.config.cache_directory) / "embeddings.pkl"
        
        if not Path(filepath).exists():
            logger.warning(f"Embeddings file not found: {filepath}")
            return
        
        try:
            with open(filepath, 'rb') as f:
                data = pickle.load(f)
            
            self.embeddings = data.get("embeddings", {})
            self.concept_texts = data.get("concept_texts", {})
            
            logger.info(f"Loaded {len(self.embeddings)} embeddings from {filepath}")
            
        except Exception as e:
            logger.error(f"Failed to load embeddings: {e}")
    
    def _find_intermediate_concepts(self, 
                                  source_concept: int, 
                                  target_concept: int,
                                  bridge_type: str) -> List[int]:
        """Find intermediate concepts that help bridge source and target"""
        
        # For now, return empty list
        # In a full implementation, this would use more sophisticated pathfinding
        return []
    
    def _invalidate_similarity_cache(self, concept_id: int):
        """Invalidate cached similarities involving a specific concept"""
        keys_to_remove = []
        
        for cache_key in self.similarity_cache.keys():
            if concept_id in cache_key:
                keys_to_remove.append(cache_key)
        
        for key in keys_to_remove:
            del self.similarity_cache[key]
    
    def _background_worker(self):
        """Background worker for maintenance tasks"""
        while True:
            try:
                task = self.background_queue.get(timeout=1)
                
                if task["type"] == "save_embeddings":
                    self.save_embeddings()
                elif task["type"] == "cleanup_cache":
                    self._cleanup_similarity_cache()
                
                self.background_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Background worker error: {e}")
    
    def _cleanup_similarity_cache(self):
        """Clean up old entries from similarity cache"""
        if len(self.similarity_cache) > self.config.cache_size:
            # Remove oldest 10% of cache entries
            items_to_remove = len(self.similarity_cache) // 10
            keys_to_remove = list(self.similarity_cache.keys())[:items_to_remove]
            
            for key in keys_to_remove:
                del self.similarity_cache[key]
            
            logger.info(f"Cleaned up {items_to_remove} cache entries")

# ===================================================================
# FASTAPI SERVER
# ===================================================================

# Global analyzer instance
analyzer: Optional[SemanticBridgeAnalyzer] = None

app = FastAPI(
    title="TORI Semantic Bridge API",
    description="Advanced semantic analysis for wormhole detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    global analyzer
    config = SemanticBridgeConfig()
    analyzer = SemanticBridgeAnalyzer(config)
    
    # Try to load existing embeddings
    analyzer.load_embeddings()
    
    logger.info("Semantic Bridge API server started")

@app.on_event("shutdown")
async def shutdown_event():
    global analyzer
    if analyzer:
        analyzer.save_embeddings()
    logger.info("Semantic Bridge API server stopped")

@app.post("/embeddings/add")
async def add_embedding(request: ConceptEmbeddingRequest):
    """Add a new concept embedding"""
    try:
        embedding = analyzer.add_concept_embedding(
            concept_id=request.concept_id,
            text=request.text,
            context=request.context,
            metadata=request.metadata
        )
        
        return {
            "concept_id": embedding.concept_id,
            "dimensions": len(embedding.embedding),
            "created_at": embedding.created_at,
            "success": True
        }
    
    except Exception as e:
        logger.error(f"Error adding embedding: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/similarity/compute")
async def compute_similarity(request: SimilarityRequest):
    """Compute similarity between two concepts"""
    try:
        result = analyzer.compute_similarity(
            concept_a=request.concept_a,
            concept_b=request.concept_b,
            similarity_types=request.similarity_types
        )
        
        return {
            "concept_a": result.concept_a,
            "concept_b": result.concept_b,
            "similarity_scores": result.similarity_scores,
            "explanations": result.explanations,
            "confidence": result.confidence,
            "success": True
        }
    
    except Exception as e:
        logger.error(f"Error computing similarity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/bridges/find")
async def find_bridges(request: SemanticBridgeRequest):
    """Find semantic bridges between concepts"""
    try:
        bridges = analyzer.find_semantic_bridges(
            source_concept=request.source_concept,
            target_concepts=request.target_concepts,
            max_bridges=request.max_bridges,
            bridge_types=request.bridge_types
        )
        
        bridges_data = [asdict(bridge) for bridge in bridges]
        
        # Convert numpy arrays to lists for JSON serialization
        for bridge_data in bridges_data:
            if "metadata" in bridge_data:
                for key, value in bridge_data["metadata"].items():
                    if isinstance(value, np.ndarray):
                        bridge_data["metadata"][key] = value.tolist()
        
        return {
            "source_concept": request.source_concept,
            "bridges": bridges_data,
            "count": len(bridges),
            "success": True
        }
    
    except Exception as e:
        logger.error(f"Error finding bridges: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analysis/cluster")
async def analyze_cluster(request: ConceptAnalysisRequest):
    """Analyze a cluster of concepts"""
    try:
        result = analyzer.analyze_concept_cluster(request.concept_ids)
        
        return {
            "analysis": result,
            "success": True
        }
    
    except Exception as e:
        logger.error(f"Error analyzing cluster: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/candidates/{concept_id}")
async def get_wormhole_candidates(
    concept_id: int,
    max_candidates: int = 10,
    min_similarity: float = 0.7
):
    """Get wormhole candidates for a concept"""
    try:
        candidates = analyzer.suggest_wormhole_candidates(
            concept_id=concept_id,
            max_candidates=max_candidates,
            min_similarity=min_similarity
        )
        
        return {
            "concept_id": concept_id,
            "candidates": [
                {
                    "concept_id": cid,
                    "similarity": sim,
                    "explanation": exp
                }
                for cid, sim, exp in candidates
            ],
            "count": len(candidates),
            "success": True
        }
    
    except Exception as e:
        logger.error(f"Error getting candidates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "embeddings_count": len(analyzer.embeddings) if analyzer else 0,
        "cache_size": len(analyzer.similarity_cache) if analyzer else 0,
        "timestamp": time.time()
    }

@app.post("/maintenance/save")
async def save_embeddings_endpoint(background_tasks: BackgroundTasks):
    """Save embeddings to disk"""
    background_tasks.add_task(analyzer.save_embeddings)
    return {"message": "Save task queued", "success": True}

@app.post("/maintenance/cleanup")
async def cleanup_cache_endpoint(background_tasks: BackgroundTasks):
    """Clean up similarity cache"""
    background_tasks.add_task(analyzer._cleanup_similarity_cache)
    return {"message": "Cleanup task queued", "success": True}

# ===================================================================
# COMMAND LINE INTERFACE
# ===================================================================

def main():
    parser = argparse.ArgumentParser(description="TORI Semantic Bridge Analysis Server")
    parser.add_argument("--host", default="localhost", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8003, help="Port to bind to")
    parser.add_argument("--workers", type=int, default=1, help="Number of workers")
    parser.add_argument("--log-level", default="info", help="Log level")
    parser.add_argument("--model", default="all-MiniLM-L6-v2", help="Embedding model")
    parser.add_argument("--cache-dir", default="./semantic_cache", help="Cache directory")
    
    args = parser.parse_args()
    
    # Update global config
    config = SemanticBridgeConfig(
        embedding_model=args.model,
        cache_directory=args.cache_dir
    )
    
    logger.info(f"Starting Semantic Bridge API server on {args.host}:{args.port}")
    logger.info(f"Using embedding model: {args.model}")
    logger.info(f"Cache directory: {args.cache_dir}")
    
    uvicorn.run(
        "semantic_bridge:app",
        host=args.host,
        port=args.port,
        workers=args.workers,
        log_level=args.log_level,
        reload=False
    )

if __name__ == "__main__":
    main()
