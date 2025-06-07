"""
Mesh Mutator - COMPLETE DARWIN GÖDEL EVOLUTION ENGINE
====================================================

Self-evolving ConceptMesh with feedback-driven mutation and synthesis.
Implements Darwin Gödel Machine principles for open-ended concept evolution.
"""

import networkx as nx
import hashlib
import json
import random
import re
import math
from collections import defaultdict
from typing import List, Dict, Tuple, Optional, Set
from datetime import datetime
import asyncio
import logging

logger = logging.getLogger("prajna.evolution.mesh_mutator")

class MeshMutator:
    """
    Darwin Gödel-inspired concept evolution engine.
    Mutates, fuses, and evolves concepts based on usage feedback.
    """
    
    def __init__(self, concept_graph: nx.Graph, concept_mesh_api=None, soliton_memory=None):
        self.graph = concept_graph.copy()  # Work on copy
        self.concept_mesh_api = concept_mesh_api
        self.soliton_memory = soliton_memory
        
        # Evolution state
        self.synthetic_concepts = []
        self.epoch = 0
        self.mutation_history = []
        self.fitness_scores = {}
        
        # Evolution parameters (Gödel-inspired)
        self.mutation_rate = 0.1
        self.fusion_probability = 0.3
        self.selection_pressure = 0.7
        self.diversity_threshold = 0.5
        
        logger.info("🧬 Initialized Darwin Gödel Mesh Mutator")
    
    def normalize(self, text: str) -> str:
        """Normalize concept text for canonical representation"""
        text = text.lower().strip()
        # Remove special characters but keep meaningful separators
        text = re.sub(r'[^\w\s-]', '', text)
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        return text
    
    def generate_hash(self, name: str) -> str:
        """Generate stable hash for concept identification"""
        return hashlib.md5(name.encode()).hexdigest()[:16]
    
    async def collect_usage_metrics(self) -> Dict[str, List[str]]:
        """
        Collect usage metrics from ConceptMeshAPI for evolution targeting.
        """
        try:
            if self.concept_mesh_api:
                stats = await self.concept_mesh_api.get_usage_stats()
                
                return {
                    'weak_concepts': stats.get('weak_concepts', []),
                    'hub_concepts': [h['concept'] for h in stats.get('hub_concepts', [])],
                    'isolated_concepts': self._find_isolated_concepts(),
                    'redundant_concepts': self._find_redundant_concepts()
                }
            else:
                # Fallback analysis
                return {
                    'weak_concepts': self.detect_weak_nodes(),
                    'hub_concepts': self._find_hub_concepts(),
                    'isolated_concepts': self._find_isolated_concepts(),
                    'redundant_concepts': self._find_redundant_concepts()
                }
                
        except Exception as e:
            logger.error(f"❌ Failed to collect usage metrics: {e}")
            return {}
    
    def detect_weak_nodes(self, centrality_threshold: float = 0.001, fallback_count: int = 5) -> List[str]:
        """Detect concepts with low centrality (candidates for evolution)"""
        try:
            pagerank = nx.pagerank(self.graph, weight='weight')
            weak_nodes = [node for node, score in pagerank.items() if score < centrality_threshold]
            
            # FALLBACK: If no weak nodes found, use random sampling
            if not weak_nodes:
                logger.warning("⚠️ No weak concepts found - using random fallback strategy")
                all_nodes = list(self.graph.nodes())
                if all_nodes:
                    weak_nodes = random.sample(all_nodes, min(fallback_count, len(all_nodes)))
                else:
                    # Emergency fallback: create synthetic seed concepts
                    weak_nodes = self._create_emergency_seed_concepts()
            
            logger.info(f"🔍 Found {len(weak_nodes)} concepts for evolution (weak + fallback)")
            return weak_nodes
            
        except Exception as e:
            logger.error(f"❌ Failed to detect weak nodes: {e}")
            return self._create_emergency_seed_concepts()
    
    def _find_hub_concepts(self, top_k: int = 10) -> List[str]:
        """Find highly connected hub concepts"""
        try:
            centrality = nx.pagerank(self.graph, weight='weight')
            hub_concepts = sorted(centrality.items(), key=lambda x: -x[1])[:top_k]
            return [concept for concept, _ in hub_concepts]
            
        except Exception as e:
            logger.error(f"❌ Failed to find hub concepts: {e}")
            return []
    
    def _create_emergency_seed_concepts(self) -> List[str]:
        """Create emergency seed concepts if graph is empty or has no weak nodes"""
        seed_concepts = [
            'neural-network-concept',
            'cognitive-reasoning-model', 
            'adaptive-learning-system',
            'consciousness-emergence-pattern',
            'evolution-strategy-framework'
        ]
        
        # Add to graph with special attributes
        for concept in seed_concepts:
            if not self.graph.has_node(concept):
                self.graph.add_node(concept, 
                                  synthetic=True, 
                                  emergency_seed=True,
                                  creation_time=datetime.now().isoformat(),
                                  seed_generation=1)
        
        logger.info(f"🌱 Created {len(seed_concepts)} emergency seed concepts")
        return seed_concepts
    
    def _find_isolated_concepts(self) -> List[str]:
        """Find concepts with very few connections"""
        isolated = []
        for node in self.graph.nodes():
            if self.graph.degree(node) <= 1:
                isolated.append(node)
        
        logger.info(f"🏝️ Found {len(isolated)} isolated concepts")
        return isolated
    
    def _find_redundant_concepts(self) -> List[str]:
        """Find concepts that are semantically similar (potential duplicates)"""
        redundant = []
        concepts = list(self.graph.nodes())
        
        for i, concept1 in enumerate(concepts):
            for concept2 in concepts[i+1:]:
                if self._semantic_similarity(concept1, concept2) > 0.8:
                    redundant.extend([concept1, concept2])
        
        return list(set(redundant))
    
    def _semantic_similarity(self, concept1: str, concept2: str) -> float:
        """Calculate semantic similarity between concepts"""
        # Simple token-based similarity (can be enhanced with embeddings)
        tokens1 = set(self.normalize(concept1).split())
        tokens2 = set(self.normalize(concept2).split())
        
        if not tokens1 or not tokens2:
            return 0.0
        
        intersection = len(tokens1 & tokens2)
        union = len(tokens1 | tokens2)
        
        return intersection / union if union > 0 else 0.0
    
    async def fuse_concepts(self, candidates: List[str], top_k: int = 5, strategy: str = "semantic") -> List[Dict]:
        """
        Fuse concepts using various strategies to create evolved concepts.
        """
        try:
            logger.info(f"🧬 Fusing {len(candidates)} concepts using {strategy} strategy...")
            
            fused = []
            
            if strategy == "semantic":
                fused = await self._semantic_fusion(candidates, top_k)
            elif strategy == "hub_bridge":
                fused = await self._hub_bridge_fusion(candidates, top_k)
            elif strategy == "random_exploration":
                fused = await self._random_exploration_fusion(candidates, top_k)
            elif strategy == "abstraction":
                fused = await self._abstraction_fusion(candidates, top_k)
            
            # Add metadata to fused concepts
            for concept in fused:
                concept.update({
                    'epoch': self.epoch,
                    'synthetic': True,
                    'creation_time': datetime.now().isoformat(),
                    'strategy': strategy
                })
            
            logger.info(f"✅ Generated {len(fused)} fused concepts")
            return fused
            
        except Exception as e:
            logger.error(f"❌ Failed to fuse concepts: {e}")
            return []
    
    async def _semantic_fusion(self, candidates: List[str], top_k: int) -> List[Dict]:
        """Fuse concepts based on semantic relationships"""
        fused = []
        
        # Group semantically similar concepts
        semantic_groups = self._group_by_semantic_similarity(candidates)
        
        for group in semantic_groups[:top_k]:
            if len(group) >= 2:
                # Create fusion name
                fusion_name = self._create_fusion_name(group, "semantic")
                canonical = self.normalize(fusion_name)
                
                fused.append({
                    'canonical_name': canonical,
                    'fusion_name': fusion_name,
                    'parents': group,
                    'concept_hash': self.generate_hash(canonical),
                    'fusion_type': 'semantic',
                    'confidence': self._calculate_fusion_confidence(group)
                })
        
        return fused
    
    async def _hub_bridge_fusion(self, candidates: List[str], top_k: int) -> List[Dict]:
        """Create bridge concepts between high-centrality hubs"""
        fused = []
        hubs = self._find_hub_concepts(20)  # Get more hubs for bridging
        
        for i in range(min(top_k, len(hubs) // 2)):
            hub1, hub2 = random.sample(hubs, 2)
            
            # Create bridge concept
            bridge_name = f"{hub1}-{hub2}-bridge"
            canonical = self.normalize(bridge_name)
            
            fused.append({
                'canonical_name': canonical,
                'fusion_name': bridge_name,
                'parents': [hub1, hub2],
                'concept_hash': self.generate_hash(canonical),
                'fusion_type': 'hub_bridge',
                'confidence': 0.8  # High confidence for hub bridges
            })
        
        return fused
    
    async def _random_exploration_fusion(self, candidates: List[str], top_k: int) -> List[Dict]:
        """Random fusion for exploration of concept space"""
        fused = []
        
        for _ in range(top_k):
            if len(candidates) >= 2:
                parents = random.sample(candidates, min(random.randint(2, 3), len(candidates)))
                fusion_name = self._create_fusion_name(parents, "exploration")
                canonical = self.normalize(fusion_name)
                
                fused.append({
                    'canonical_name': canonical,
                    'fusion_name': fusion_name,
                    'parents': parents,
                    'concept_hash': self.generate_hash(canonical),
                    'fusion_type': 'exploration',
                    'confidence': 0.5  # Medium confidence for exploration
                })
        
        return fused
    
    async def _abstraction_fusion(self, candidates: List[str], top_k: int) -> List[Dict]:
        """Create higher-level abstractions from concrete concepts"""
        fused = []
        
        # Group concepts by potential abstraction levels
        abstraction_groups = self._group_by_abstraction_potential(candidates)
        
        for group in abstraction_groups[:top_k]:
            abstraction_name = self._create_abstraction_name(group)
            canonical = self.normalize(abstraction_name)
            
            fused.append({
                'canonical_name': canonical,
                'fusion_name': abstraction_name,
                'parents': group,
                'concept_hash': self.generate_hash(canonical),
                'fusion_type': 'abstraction',
                'confidence': self._calculate_abstraction_confidence(group)
            })
        
        return fused
    
    def _group_by_semantic_similarity(self, concepts: List[str]) -> List[List[str]]:
        """Group concepts by semantic similarity"""
        groups = []
        used = set()
        
        for concept in concepts:
            if concept in used:
                continue
                
            group = [concept]
            used.add(concept)
            
            for other in concepts:
                if other not in used and self._semantic_similarity(concept, other) > 0.3:
                    group.append(other)
                    used.add(other)
            
            if len(group) > 1:
                groups.append(group)
        
        return groups
    
    def _group_by_abstraction_potential(self, concepts: List[str]) -> List[List[str]]:
        """Group concepts that could form meaningful abstractions"""
        # Look for concepts that share common terms or patterns
        term_groups = defaultdict(list)
        
        for concept in concepts:
            tokens = self.normalize(concept).split()
            for token in tokens:
                if len(token) > 3:  # Skip short words
                    term_groups[token].append(concept)
        
        # Return groups with multiple concepts
        return [group for group in term_groups.values() if len(group) > 1]
    
    def _create_fusion_name(self, parents: List[str], fusion_type: str) -> str:
        """Create meaningful name for fused concept"""
        if fusion_type == "semantic":
            # Extract key terms from parents
            all_tokens = []
            for parent in parents:
                all_tokens.extend(self.normalize(parent).split())
            
            # Find most common meaningful tokens
            token_freq = defaultdict(int)
            for token in all_tokens:
                if len(token) > 3:  # Skip short words
                    token_freq[token] += 1
            
            # Use top tokens for name
            top_tokens = sorted(token_freq.items(), key=lambda x: -x[1])[:3]
            return "-".join([token for token, _ in top_tokens])
        
        elif fusion_type == "exploration":
            # Random creative combination
            return "-".join(random.sample(parents, min(2, len(parents))))
        
        else:
            # Default: simple concatenation
            return "-".join(parents[:2])
    
    def _create_abstraction_name(self, group: List[str]) -> str:
        """Create abstraction name from concept group"""
        # Find common terms
        common_terms = set(self.normalize(group[0]).split())
        for concept in group[1:]:
            common_terms &= set(self.normalize(concept).split())
        
        if common_terms:
            base = list(common_terms)[0]
            return f"{base}-system"
        else:
            return f"{self.normalize(group[0]).split()[0]}-abstraction"
    
    def _calculate_fusion_confidence(self, parents: List[str]) -> float:
        """Calculate confidence score for fusion"""
        # Base confidence on semantic similarity and graph connectivity
        similarities = []
        for i, p1 in enumerate(parents):
            for p2 in parents[i+1:]:
                similarities.append(self._semantic_similarity(p1, p2))
        
        avg_similarity = sum(similarities) / len(similarities) if similarities else 0.0
        
        # Factor in graph connectivity
        connectivity_bonus = 0.0
        for parent in parents:
            if parent in self.graph:
                connectivity_bonus += self.graph.degree(parent) / len(self.graph.nodes())
        
        return min(1.0, avg_similarity + connectivity_bonus / len(parents))
    
    def _calculate_abstraction_confidence(self, group: List[str]) -> float:
        """Calculate confidence for abstraction"""
        # Higher confidence for groups with more concepts
        size_factor = min(1.0, len(group) / 5.0)
        
        # Check for meaningful common terms
        common_terms = set(self.normalize(group[0]).split())
        for concept in group[1:]:
            common_terms &= set(self.normalize(concept).split())
        
        term_factor = len(common_terms) / 3.0  # Normalize by expected terms
        
        return min(1.0, (size_factor + term_factor) / 2.0)
    
    async def mutate(self, feedback: Optional[Dict] = None) -> List[Dict]:
        """
        Main mutation function - orchestrates evolution cycle.
        """
        logger.info(f"🧬 Starting mutation cycle {self.epoch}...")
        
        # Collect usage metrics
        metrics = await self.collect_usage_metrics()
        
        # Determine mutation targets based on feedback
        targets = self._select_mutation_targets(metrics, feedback)
        
        # Execute different mutation strategies
        all_mutations = []
        
        # 1. Semantic fusion of weak concepts
        if targets.get('weak_concepts'):
            semantic_fusions = await self.fuse_concepts(
                targets['weak_concepts'], 
                top_k=3, 
                strategy="semantic"
            )
            all_mutations.extend(semantic_fusions)
        
        # 2. Bridge hub concepts
        if targets.get('hub_concepts'):
            bridge_fusions = await self.fuse_concepts(
                targets['hub_concepts'], 
                top_k=2, 
                strategy="hub_bridge"
            )
            all_mutations.extend(bridge_fusions)
        
        # 3. Abstract isolated concepts
        if targets.get('isolated_concepts'):
            abstraction_fusions = await self.fuse_concepts(
                targets['isolated_concepts'], 
                top_k=2, 
                strategy="abstraction"
            )
            all_mutations.extend(abstraction_fusions)
        
        # 4. Random exploration
        all_concepts = list(self.graph.nodes())
        if all_concepts:
            exploration_fusions = await self.fuse_concepts(
                random.sample(all_concepts, min(10, len(all_concepts))), 
                top_k=1, 
                strategy="random_exploration"
            )
            all_mutations.extend(exploration_fusions)
        
        # Record mutation history
        mutation_record = {
            'epoch': self.epoch,
            'timestamp': datetime.now().isoformat(),
            'targets': targets,
            'mutations_generated': len(all_mutations),
            'strategies_used': list(set([m.get('fusion_type') for m in all_mutations])),
            'feedback': feedback
        }
        self.mutation_history.append(mutation_record)
        
        # Update synthetic concepts
        self.synthetic_concepts.extend(all_mutations)
        
        logger.info(f"✅ Mutation cycle {self.epoch} complete: {len(all_mutations)} new concepts")
        
        return all_mutations
    
    def _select_mutation_targets(self, metrics: Dict, feedback: Optional[Dict]) -> Dict:
        """Select specific concepts for mutation based on metrics and feedback"""
        targets = {}
        
        # Default targets from metrics
        targets['weak_concepts'] = metrics.get('weak_concepts', [])[:10]
        targets['hub_concepts'] = metrics.get('hub_concepts', [])[:5]
        targets['isolated_concepts'] = metrics.get('isolated_concepts', [])[:5]
        
        # Incorporate feedback if available
        if feedback:
            # Prioritize concepts mentioned in feedback
            priority_concepts = feedback.get('low_coherence', [])
            targets['weak_concepts'] = priority_concepts + targets['weak_concepts']
            
            # Remove concepts that are working well
            successful_concepts = feedback.get('high_utility', [])
            for key in targets:
                targets[key] = [c for c in targets[key] if c not in successful_concepts]
        
        return targets
    
    async def inject_into_graph(self) -> bool:
        """Inject synthetic concepts into the concept graph"""
        try:
            logger.info(f"💉 Injecting {len(self.synthetic_concepts)} synthetic concepts...")
            
            injected_count = 0
            
            for concept in self.synthetic_concepts:
                canonical_name = concept['canonical_name']
                
                # Add to graph
                self.graph.add_node(canonical_name, 
                                  synthetic=True, 
                                  epoch=concept['epoch'],
                                  confidence=concept.get('confidence', 0.5))
                
                # Connect to parent concepts
                for parent in concept.get('parents', []):
                    if self.graph.has_node(parent):
                        self.graph.add_edge(canonical_name, parent, 
                                          weight=1.0, 
                                          relationship='evolution')
                
                injected_count += 1
            
            logger.info(f"✅ Injected {injected_count} concepts into graph")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to inject concepts: {e}")
            return False
    
    async def trigger_evolution_cycle(self, feedback: Optional[Dict] = None) -> Dict:
        """
        Trigger complete evolution cycle with optional feedback.
        Returns evolution results and metrics.
        """
        try:
            logger.info(f"🚀 Triggering evolution cycle {self.epoch}...")
            
            # Execute mutation
            new_concepts = await self.mutate(feedback)
            
            # Inject into local graph
            await self.inject_into_graph()
            
            # Store in Soliton Memory if available
            if self.soliton_memory and new_concepts:
                await self.soliton_memory.store_concept_evolution(self.epoch, new_concepts)
            
            # Update ConceptMesh if available
            if self.concept_mesh_api and new_concepts:
                await self.concept_mesh_api.ingest_evolved_concepts(new_concepts)
            
            # Increment epoch
            self.epoch += 1
            
            # Return evolution results
            results = {
                'epoch': self.epoch - 1,
                'concepts_generated': len(new_concepts),
                'new_concepts': new_concepts,
                'graph_size': len(self.graph.nodes()),
                'evolution_success': True,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"🎉 Evolution cycle complete! Generated {len(new_concepts)} concepts")
            return results
            
        except Exception as e:
            logger.error(f"❌ Evolution cycle failed: {e}")
            return {
                'evolution_success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def validate_evolved_concepts(self, concepts: List[Dict]) -> Dict:
        """
        Validate evolved concepts for coherence and utility.
        """
        validation_results = {
            'total_concepts': len(concepts),
            'valid_concepts': 0,
            'invalid_concepts': 0,
            'validation_errors': [],
            'quality_scores': {}
        }
        
        for concept in concepts:
            try:
                # Check required fields
                required_fields = ['canonical_name', 'concept_hash', 'parents']
                if not all(field in concept for field in required_fields):
                    validation_results['invalid_concepts'] += 1
                    validation_results['validation_errors'].append({
                        'concept': concept.get('canonical_name', 'unknown'),
                        'error': 'Missing required fields'
                    })
                    continue
                
                # Calculate quality score
                quality_score = self._calculate_concept_quality(concept)
                validation_results['quality_scores'][concept['canonical_name']] = quality_score
                
                if quality_score > 0.5:  # Threshold for validity
                    validation_results['valid_concepts'] += 1
                else:
                    validation_results['invalid_concepts'] += 1
                
            except Exception as e:
                validation_results['invalid_concepts'] += 1
                validation_results['validation_errors'].append({
                    'concept': concept.get('canonical_name', 'unknown'),
                    'error': str(e)
                })
        
        logger.info(f"✅ Validation complete: {validation_results['valid_concepts']}/{validation_results['total_concepts']} valid")
        return validation_results
    
    def _calculate_concept_quality(self, concept: Dict) -> float:
        """Calculate quality score for evolved concept"""
        score = 0.0
        
        # Factor 1: Confidence score
        score += concept.get('confidence', 0.5) * 0.4
        
        # Factor 2: Number of meaningful parents
        parents = concept.get('parents', [])
        if parents:
            score += min(1.0, len(parents) / 3.0) * 0.3
        
        # Factor 3: Name meaningfulness (simple heuristic)
        name = concept.get('canonical_name', '')
        if name and len(name) > 3 and '-' in name:
            score += 0.3
        
        return min(1.0, score)
    
    def get_evolution_stats(self) -> Dict:
        """Get comprehensive evolution statistics"""
        return {
            'current_epoch': self.epoch,
            'total_synthetic_concepts': len(self.synthetic_concepts),
            'mutation_cycles': len(self.mutation_history),
            'graph_size': len(self.graph.nodes()),
            'graph_edges': len(self.graph.edges()),
            'last_mutation': self.mutation_history[-1] if self.mutation_history else None,
            'fitness_tracked': len(self.fitness_scores),
            'evolution_parameters': {
                'mutation_rate': self.mutation_rate,
                'fusion_probability': self.fusion_probability,
                'selection_pressure': self.selection_pressure,
                'diversity_threshold': self.diversity_threshold
            }
        }

if __name__ == "__main__":
    # Test Mesh Mutator
    import asyncio
    
    async def test_mesh_mutator():
        # Create test graph
        G = nx.Graph()
        G.add_edges_from([
            ('neural network', 'machine learning'),
            ('deep learning', 'neural network'),
            ('cognitive model', 'artificial intelligence'),
            ('phase synchrony', 'neural oscillation'),
            ('soliton memory', 'wave dynamics')
        ])
        
        # Initialize mutator
        mutator = MeshMutator(G)
        
        # Test evolution cycle
        results = await mutator.trigger_evolution_cycle()
        print(f"🧬 Evolution results: {results}")
        
        # Test validation
        if results.get('new_concepts'):
            validation = await mutator.validate_evolved_concepts(results['new_concepts'])
            print(f"✅ Validation results: {validation}")
        
        # Get stats
        stats = mutator.get_evolution_stats()
        print(f"📊 Evolution stats: {stats}")
    
    asyncio.run(test_mesh_mutator())
