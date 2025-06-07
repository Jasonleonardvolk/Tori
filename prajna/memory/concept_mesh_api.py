"""
Concept Mesh API for Prajna - ENHANCED COGNITIVE VERSION
========================================================

Real interface to TORI's Concept Mesh for relationship mapping and knowledge graphs.
NOW WITH LIVE CONCEPT EVOLUTION AND MUTATION SUPPORT!
"""

import logging
import json
import networkx as nx
from typing import Optional, Dict, List, Any, Tuple
from pathlib import Path
import hashlib
from datetime import datetime

logger = logging.getLogger("prajna.memory.concept_mesh")

class ConceptMeshAPI:
    """Enhanced Concept Mesh with live evolution capabilities"""
    
    def __init__(self, in_memory_graph: bool = True, 
                 snapshot_path: str = "concept_mesh_snapshot.json",
                 concepts_file: str = "prajna_pdf_concepts.json", **kwargs):
        self.in_memory_graph = in_memory_graph
        self.snapshot_path = snapshot_path
        self.concepts_file = concepts_file
        self.initialized = False
        
        # Live concept graph for evolution
        self.mesh = nx.Graph()
        self.concept_registry = {}
        self.usage_stats = {}
        self.evolution_history = []
        
        logger.info(f"🕸️ Initializing ENHANCED Concept Mesh API: in_memory={in_memory_graph}")
    
    async def initialize(self):
        """Initialize Concept Mesh with existing concept data"""
        try:
            logger.info("🔗 Loading existing concepts into live mesh...")
            
            # Load existing concepts if available
            await self._load_existing_concepts()
            
            # Build initial graph
            await self._build_concept_graph()
            
            self.initialized = True
            logger.info(f"✅ Enhanced Concept Mesh initialized with {len(self.mesh.nodes)} concepts")
            
        except Exception as e:
            logger.warning(f"⚠️ Concept Mesh initialization failed: {e}")
            self.initialized = False
    
    async def _load_existing_concepts(self):
        """Load concepts from JSON files"""
        concepts_path = Path(self.concepts_file)
        if concepts_path.exists():
            try:
                with open(concepts_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    concepts = data.get('concepts', {})
                    
                for concept_name, concept_data in concepts.items():
                    self.concept_registry[concept_name] = {
                        'canonical_name': concept_name,
                        'document_frequency': concept_data.get('count', 1),
                        'documents': concept_data.get('documents', []),
                        'concept_hash': hashlib.md5(concept_name.encode()).hexdigest()[:16],
                        'synthetic': False,
                        'epoch': 0
                    }
                    
                logger.info(f"📚 Loaded {len(self.concept_registry)} existing concepts")
                
            except Exception as e:
                logger.warning(f"⚠️ Failed to load existing concepts: {e}")
    
    async def _build_concept_graph(self):
        """Build NetworkX graph from concept relationships"""
        # Load relationship graph if available
        graph_path = Path("concept_relationship_graph.json")
        if graph_path.exists():
            try:
                with open(graph_path, 'r', encoding='utf-8') as f:
                    graph_data = json.load(f)
                    
                # Add nodes
                for node in graph_data.get('nodes', []):
                    self.mesh.add_node(node['id'], 
                                     weight=node.get('weight', 0.0),
                                     cluster=node.get('cluster', -1))
                
                # Add edges
                for edge in graph_data.get('edges', []):
                    self.mesh.add_edge(edge['source'], edge['target'], 
                                     weight=edge.get('weight', 1.0))
                
                logger.info(f"🌐 Built concept graph: {len(self.mesh.nodes)} nodes, {len(self.mesh.edges)} edges")
                
            except Exception as e:
                logger.warning(f"⚠️ Failed to load concept graph: {e}")
    
    async def ingest_evolved_concepts(self, concepts: List[Dict]) -> bool:
        """
        Add evolved concepts (from mesh_mutator.py or concept_synthesizer) into the live mesh.
        """
        try:
            logger.info(f"🧬 Ingesting {len(concepts)} evolved concepts...")
            
            for concept in concepts:
                canonical_name = concept['canonical_name']
                
                # Add to registry
                self.concept_registry[canonical_name] = concept
                
                # Add to graph
                self.mesh.add_node(canonical_name, 
                                 synthetic=concept.get('synthetic', True),
                                 epoch=concept.get('epoch', 0),
                                 concept_hash=concept.get('concept_hash', ''))
                
                # Connect to parent concepts
                for parent in concept.get('parents', []):
                    if parent in self.mesh:
                        self.mesh.add_edge(canonical_name, parent, 
                                         weight=1.0, 
                                         relationship='evolution')
                
                logger.info(f"🧬 Added evolved concept: {canonical_name}")
            
            # Save updated state
            await self._save_mesh_state()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to ingest evolved concepts: {e}")
            return False
    
    async def update_concept_relationships(self, graph_data: Dict) -> bool:
        """
        Replace or augment the in-memory relationship graph with new edges/weights.
        """
        try:
            logger.info("🔄 Updating concept relationships...")
            
            # Add new edges from graph data
            for edge in graph_data.get('edges', []):
                source = edge['source']
                target = edge['target']
                weight = edge.get('weight', 1.0)
                
                if source in self.mesh and target in self.mesh:
                    self.mesh.add_edge(source, target, weight=weight)
            
            # Recalculate centrality
            centrality = nx.pagerank(self.mesh, weight='weight')
            
            # Update node weights
            for node, score in centrality.items():
                if self.mesh.has_node(node):
                    self.mesh.nodes[node]['centrality'] = score
            
            logger.info(f"✅ Updated relationships for {len(graph_data.get('edges', []))} edges")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to update relationships: {e}")
            return False
    
    async def get_concept_neighbors(self, concept_id: str, depth: int = 2) -> List[Dict]:
        """Get neighboring concepts with relationship weights"""
        try:
            if concept_id not in self.mesh:
                return []
            
            neighbors = []
            
            # Get direct neighbors
            for neighbor in self.mesh.neighbors(concept_id):
                edge_data = self.mesh.get_edge_data(concept_id, neighbor)
                neighbors.append({
                    'concept': neighbor,
                    'weight': edge_data.get('weight', 1.0),
                    'relationship': edge_data.get('relationship', 'co-occurrence'),
                    'distance': 1
                })
            
            # Get second-degree neighbors if requested
            if depth > 1:
                for neighbor in list(self.mesh.neighbors(concept_id)):
                    for second_neighbor in self.mesh.neighbors(neighbor):
                        if second_neighbor != concept_id and second_neighbor not in [n['concept'] for n in neighbors]:
                            edge_data = self.mesh.get_edge_data(neighbor, second_neighbor)
                            neighbors.append({
                                'concept': second_neighbor,
                                'weight': edge_data.get('weight', 1.0) * 0.5,  # Decay for distance
                                'relationship': 'indirect',
                                'distance': 2
                            })
            
            return sorted(neighbors, key=lambda x: -x['weight'])[:20]  # Top 20
            
        except Exception as e:
            logger.error(f"❌ Failed to get neighbors for {concept_id}: {e}")
            return []
    
    async def get_usage_stats(self) -> Dict[str, Any]:
        """Get concept usage statistics for evolution feedback"""
        try:
            # Calculate graph metrics
            centrality = nx.pagerank(self.mesh, weight='weight')
            clustering = nx.clustering(self.mesh, weight='weight')
            
            # Find weak concepts (low centrality)
            weak_concepts = [node for node, score in centrality.items() if score < 0.001]
            
            # Find hub concepts (high centrality)
            hub_concepts = sorted(centrality.items(), key=lambda x: -x[1])[:10]
            
            # Count synthetic vs natural concepts
            synthetic_count = len([n for n, d in self.mesh.nodes(data=True) if d.get('synthetic', False)])
            natural_count = len(self.mesh.nodes) - synthetic_count
            
            return {
                'total_concepts': len(self.mesh.nodes),
                'total_relationships': len(self.mesh.edges),
                'weak_concepts': weak_concepts,
                'hub_concepts': [{'concept': c, 'centrality': s} for c, s in hub_concepts],
                'synthetic_concepts': synthetic_count,
                'natural_concepts': natural_count,
                'average_clustering': sum(clustering.values()) / len(clustering) if clustering else 0.0,
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get usage stats: {e}")
            return {}
    
    async def _save_mesh_state(self):
        """Save current mesh state to disk"""
        try:
            # Save concept registry
            registry_path = Path("concept_registry_enhanced.json")
            with open(registry_path, 'w', encoding='utf-8') as f:
                json.dump(self.concept_registry, f, indent=2, ensure_ascii=False)
            
            # Save graph structure
            graph_data = {
                'nodes': [
                    {
                        'id': node,
                        'weight': data.get('centrality', 0.0),
                        'synthetic': data.get('synthetic', False),
                        'epoch': data.get('epoch', 0)
                    } for node, data in self.mesh.nodes(data=True)
                ],
                'edges': [
                    {
                        'source': u,
                        'target': v,
                        'weight': d.get('weight', 1.0),
                        'relationship': d.get('relationship', 'co-occurrence')
                    } for u, v, d in self.mesh.edges(data=True)
                ]
            }
            
            graph_path = Path("concept_relationship_graph_enhanced.json")
            with open(graph_path, 'w', encoding='utf-8') as f:
                json.dump(graph_data, f, indent=2)
            
            logger.info("💾 Saved enhanced mesh state to disk")
            
        except Exception as e:
            logger.error(f"❌ Failed to save mesh state: {e}")
    
    async def health_check(self) -> bool:
        """Check Concept Mesh health"""
        return self.initialized and len(self.mesh.nodes) > 0
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive Concept Mesh statistics"""
        if not self.initialized:
            return {"error": "Mesh not initialized"}
        
        stats = await self.get_usage_stats()
        stats.update({
            "in_memory": self.in_memory_graph,
            "snapshot_path": self.snapshot_path,
            "initialized": self.initialized,
            "evolution_cycles": len(self.evolution_history)
        })
        
        return stats
    
    async def cleanup(self):
        """Cleanup Concept Mesh resources"""
        if self.initialized:
            logger.info("🧹 Cleaning up Enhanced Concept Mesh API")
            await self._save_mesh_state()
            self.initialized = False

if __name__ == "__main__":
    # Test Enhanced Concept Mesh API
    import asyncio
    
    async def test_enhanced_concept_mesh():
        mesh = ConceptMeshAPI()
        await mesh.initialize()
        
        # Test evolved concept ingestion
        evolved_concepts = [
            {
                'canonical_name': 'adaptive-synchrony-model',
                'parents': ['phase synchrony', 'adaptive model'],
                'concept_hash': 'abc123def456',
                'epoch': 1,
                'synthetic': True
            }
        ]
        
        success = await mesh.ingest_evolved_concepts(evolved_concepts)
        print(f"🧬 Evolved concept ingestion: {success}")
        
        # Test neighbor discovery
        neighbors = await mesh.get_concept_neighbors('model')
        print(f"🔗 Neighbors of 'model': {len(neighbors)}")
        
        # Test usage stats
        stats = await mesh.get_usage_stats()
        print(f"📊 Usage stats: {stats}")
        
        await mesh.cleanup()
    
    asyncio.run(test_enhanced_concept_mesh())
