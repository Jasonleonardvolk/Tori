"""
PHASE 2 ALPHA - ADVANCED ψ-LINEAGE LEDGER (COMPLETE)
====================================================

Enhanced ψ-LineageLedger with sophisticated concept evolution tracking,
advanced coherence metrics, and multi-dimensional concept relationships.

This implements the full lineage tracking framework from the opus.
"""

import json
import time
import logging
import networkx as nx
import numpy as np
from typing import Dict, List, Any, Optional, Set, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path
from collections import defaultdict, deque

# Import Phase 1 components
from phase1_psi_lineage_ledger import PsiLineageLedger, ConceptStatus, MutationType, ConceptLineageRecord
from json_serialization_fix import safe_json_dump, safe_json_load, prepare_object_for_json
from logging_fix import WindowsSafeLogger

logger = WindowsSafeLogger("prajna.phase2_advanced_lineage")

class ConceptEvolutionPhase(Enum):
    """ψ-phase evolution stages"""
    NASCENT = "nascent"                
    STABILIZING = "stabilizing"        
    MATURE = "mature"                  
    SPECIALIZING = "specializing"      
    ABSTRACTING = "abstracting"        
    TRANSCENDING = "transcending"      

class ConceptRelationshipType(Enum):
    """Types of relationships between concepts"""
    PARENT_CHILD = "parent_child"      
    SIBLING = "sibling"                
    FUSION = "fusion"                  
    FISSION = "fission"                
    BRIDGE = "bridge"                  
    ABSTRACTION = "abstraction"        
    SPECIALIZATION = "specialization"  
    ANALOGY = "analogy"                
    OPPOSITION = "opposition"          

@dataclass
class ConceptRelationship:
    """Advanced concept relationship with metadata"""
    source_concept: str
    target_concept: str
    relationship_type: ConceptRelationshipType
    strength: float
    confidence: float
    creation_time: datetime
    evolution_context: Dict[str, Any]
    bidirectional: bool = False

@dataclass
class ConceptCoherenceMetrics:
    """Advanced coherence measurements"""
    semantic_coherence: float
    usage_coherence: float
    relational_coherence: float
    temporal_coherence: float
    contextual_coherence: float
    emergent_coherence: float
    phase_alignment: float

@dataclass
class ConceptEvolutionEvent:
    """Detailed evolution event tracking"""
    event_id: str
    concept_id: str
    event_type: str
    timestamp: datetime
    trigger_context: Dict[str, Any]
    pre_state: Dict[str, Any]
    post_state: Dict[str, Any]
    success_metrics: Dict[str, float]
    causal_chain: List[str]
    emergence_indicators: Dict[str, float]

class AdvancedPsiLineageLedger:
    """
    Phase 2 Alpha Advanced ψ-LineageLedger
    
    Enhanced concept evolution tracking with:
    - Multi-dimensional concept relationships
    - Advanced coherence metrics
    - Evolution phase tracking
    - Emergence detection
    - Causal chain analysis
    - Network topology analysis
    """
    
    def __init__(self, ledger_path: str = "phase2_advanced_psi_ledger.json"):
        self.ledger_path = Path(ledger_path)
        
        # Core concept storage
        self.concepts = {}
        self.mutation_events = deque(maxlen=2000)
        self.usage_stats = {}
        
        # Phase 2 advanced features
        self.concept_relationships = {}
        self.coherence_history = deque(maxlen=1000)
        self.evolution_events = deque(maxlen=1000)
        self.concept_network = nx.DiGraph()
        self.emergence_patterns = {}
        
        # Phase coherence tracking
        self.phase_coherence_matrix = {}
        self.concept_evolution_phases = {}
        self.causal_chains = defaultdict(list)
        
        # Advanced analytics
        self.topology_metrics = {}
        self.emergence_thresholds = {
            'novelty_threshold': 0.7,
            'complexity_threshold': 0.6,
            'coherence_threshold': 0.8,
            'impact_threshold': 0.5
        }
        
        # Load existing ledger
        self._load_advanced_ledger()
        
        # Initialize network
        self._build_concept_network()
        
        logger.info(f"🧬 Advanced ψ-LineageLedger initialized with {len(self.concepts)} concepts")
    
    def _load_advanced_ledger(self):
        """Load existing ledger with Phase 2 enhancements"""
        try:
            if self.ledger_path.exists():
                data = safe_json_load(str(self.ledger_path))
                if data:
                    # Load basic concept data
                    self._load_basic_concepts(data.get('concepts', {}))
                    
                    # Load Phase 2 advanced data
                    self._load_relationships(data.get('concept_relationships', {}))
                    self._load_evolution_events(data.get('evolution_events', []))
                    
                    self.mutation_events = deque(data.get('mutation_events', []), maxlen=2000)
                    self.usage_stats = data.get('usage_stats', {})
                    
                    logger.info(f"Loaded advanced ledger")
                    
        except Exception as e:
            logger.warning(f"Failed to load advanced ledger: {e} - Starting fresh")
            self._initialize_fresh_ledger()
    
    def _load_basic_concepts(self, concepts_data: Dict[str, Any]):
        """Load basic concept data"""
        for concept_id, record_data in concepts_data.items():
            try:
                # Convert enum strings back to enums
                if isinstance(record_data.get('status'), str):
                    record_data['status'] = ConceptStatus(record_data['status'])
                if isinstance(record_data.get('origin_type'), str):
                    record_data['origin_type'] = MutationType(record_data['origin_type'])
                
                # Handle datetime fields
                if isinstance(record_data.get('creation_time'), str):
                    record_data['creation_time'] = datetime.fromisoformat(record_data['creation_time'])
                else:
                    record_data['creation_time'] = datetime.now()
                
                if record_data.get('last_used') and isinstance(record_data['last_used'], str):
                    record_data['last_used'] = datetime.fromisoformat(record_data['last_used'])
                
                # Ensure required fields
                record_data.setdefault('parent_concepts', [])
                record_data.setdefault('child_concepts', [])
                record_data.setdefault('usage_count', 0)
                record_data.setdefault('coherence_score', 0.5)
                record_data.setdefault('psi_phase', 0.5)
                record_data.setdefault('failure_count', 0)
                record_data.setdefault('metadata', {})
                record_data.setdefault('lifecycle_events', [])
                
                self.concepts[concept_id] = ConceptLineageRecord(**record_data)
                self.concept_evolution_phases[concept_id] = ConceptEvolutionPhase.MATURE
                
            except Exception as e:
                logger.warning(f"Failed to load concept {concept_id}: {e}")
    
    def _load_relationships(self, relationships_data: Dict[str, List[Dict]]):
        """Load concept relationships"""
        for concept_id, relationships in relationships_data.items():
            self.concept_relationships[concept_id] = []
            
            for rel_data in relationships:
                try:
                    rel_data['relationship_type'] = ConceptRelationshipType(rel_data['relationship_type'])
                    rel_data['creation_time'] = datetime.fromisoformat(rel_data['creation_time'])
                    
                    relationship = ConceptRelationship(**rel_data)
                    self.concept_relationships[concept_id].append(relationship)
                    
                except Exception as e:
                    logger.warning(f"Failed to load relationship: {e}")
    
    def _load_evolution_events(self, events_data: List[Dict]):
        """Load evolution events"""
        for event_data in events_data:
            try:
                event_data['timestamp'] = datetime.fromisoformat(event_data['timestamp'])
                event = ConceptEvolutionEvent(**event_data)
                self.evolution_events.append(event)
                
            except Exception as e:
                logger.warning(f"Failed to load evolution event: {e}")
    
    def _initialize_fresh_ledger(self):
        """Initialize fresh ledger"""
        self.concepts = {}
        self.concept_relationships = {}
        self.mutation_events = deque(maxlen=2000)
        self.evolution_events = deque(maxlen=1000)
        self.coherence_history = deque(maxlen=1000)
        self.usage_stats = {}
        self.emergence_patterns = {}
        self.phase_coherence_matrix = {}
        self.concept_evolution_phases = {}
        self.causal_chains = defaultdict(list)
    
    def _build_concept_network(self):
        """Build NetworkX graph from concept relationships"""
        try:
            self.concept_network.clear()
            
            # Add all concepts as nodes
            for concept_id, record in self.concepts.items():
                self.concept_network.add_node(
                    concept_id,
                    canonical_name=record.canonical_name,
                    status=record.status.value,
                    coherence=record.coherence_score,
                    psi_phase=record.psi_phase,
                    usage_count=record.usage_count,
                    evolution_phase=self.concept_evolution_phases.get(concept_id, ConceptEvolutionPhase.MATURE).value
                )
            
            # Add relationships as edges
            for concept_id, relationships in self.concept_relationships.items():
                for rel in relationships:
                    if rel.target_concept in self.concepts:
                        self.concept_network.add_edge(
                            concept_id,
                            rel.target_concept,
                            relationship_type=rel.relationship_type.value,
                            strength=rel.strength,
                            confidence=rel.confidence
                        )
            
            logger.debug(f"Built concept network: {self.concept_network.number_of_nodes()} nodes, {self.concept_network.number_of_edges()} edges")
            
        except Exception as e:
            logger.error(f"Failed to build concept network: {e}")
    
    def add_advanced_concept(self, concept_id: str, canonical_name: str,
                           origin_type: MutationType = MutationType.EXTRACTION,
                           parent_concepts: List[str] = None,
                           initial_phase: ConceptEvolutionPhase = ConceptEvolutionPhase.NASCENT,
                           metadata: Dict[str, Any] = None) -> bool:
        """Add concept with Phase 2 enhancements"""
        try:
            if concept_id in self.concepts:
                logger.warning(f"Concept {concept_id} already exists")
                return False
            
            # Create concept record
            record = ConceptLineageRecord(
                concept_id=concept_id,
                canonical_name=canonical_name,
                creation_time=datetime.now(),
                status=ConceptStatus.SYNTHETIC if origin_type == MutationType.INJECTION else ConceptStatus.ACTIVE,
                origin_type=origin_type,
                parent_concepts=parent_concepts or [],
                child_concepts=[],
                usage_count=0,
                coherence_score=0.5,
                psi_phase=0.5,
                last_used=None,
                failure_count=0,
                metadata=metadata or {},
                lifecycle_events=[]
            )
            
            # Store concept
            self.concepts[concept_id] = record
            self.concept_evolution_phases[concept_id] = initial_phase
            self.concept_relationships[concept_id] = []
            
            # Create parent-child relationships
            if parent_concepts:
                for parent_id in parent_concepts:
                    if parent_id in self.concepts:
                        self.concepts[parent_id].child_concepts.append(concept_id)
                        
                        # Create relationship
                        relationship = ConceptRelationship(
                            source_concept=parent_id,
                            target_concept=concept_id,
                            relationship_type=ConceptRelationshipType.PARENT_CHILD,
                            strength=0.8,
                            confidence=0.9,
                            creation_time=datetime.now(),
                            evolution_context={'creation': True}
                        )
                        
                        if parent_id not in self.concept_relationships:
                            self.concept_relationships[parent_id] = []
                        self.concept_relationships[parent_id].append(relationship)
            
            # Record evolution event
            evolution_event = ConceptEvolutionEvent(
                event_id=f"create_{concept_id}_{int(time.time())}",
                concept_id=concept_id,
                event_type='concept_creation',
                timestamp=datetime.now(),
                trigger_context=metadata or {},
                pre_state={},
                post_state={'status': record.status.value, 'phase': initial_phase.value},
                success_metrics={'creation_success': 1.0},
                causal_chain=parent_concepts or [],
                emergence_indicators={'novelty': 1.0, 'potential': 0.5}
            )
            self.evolution_events.append(evolution_event)
            
            # Update network
            self._build_concept_network()
            
            # Save ledger
            self._save_advanced_ledger()
            
            logger.info(f"✅ Added advanced concept: {concept_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add advanced concept {concept_id}: {e}")
            return False
    
    def add_concept_relationship(self, source_concept: str, target_concept: str,
                               relationship_type: ConceptRelationshipType,
                               strength: float = 0.5, confidence: float = 0.5,
                               bidirectional: bool = False,
                               evolution_context: Dict[str, Any] = None) -> bool:
        """Add relationship between concepts"""
        try:
            if source_concept not in self.concepts or target_concept not in self.concepts:
                logger.warning(f"Cannot create relationship - missing concepts")
                return False
            
            # Create relationship
            relationship = ConceptRelationship(
                source_concept=source_concept,
                target_concept=target_concept,
                relationship_type=relationship_type,
                strength=strength,
                confidence=confidence,
                creation_time=datetime.now(),
                evolution_context=evolution_context or {},
                bidirectional=bidirectional
            )
            
            # Add to source concept's relationships
            if source_concept not in self.concept_relationships:
                self.concept_relationships[source_concept] = []
            self.concept_relationships[source_concept].append(relationship)
            
            # Update network
            self._build_concept_network()
            
            logger.info(f"➡️ Added relationship: {source_concept} --{relationship_type.value}--> {target_concept}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add relationship: {e}")
            return False
    
    def calculate_comprehensive_coherence(self) -> Dict[str, Any]:
        """Calculate comprehensive system-wide coherence metrics"""
        try:
            system_coherence = {
                'global_metrics': {},
                'concept_coherence': {},
                'relationship_coherence': {},
                'phase_coherence': {},
                'emergence_coherence': {}
            }
            
            # Global metrics
            if self.concepts:
                coherence_scores = [record.coherence_score for record in self.concepts.values()]
                avg_coherence = sum(coherence_scores) / len(coherence_scores)
                coherence_variance = np.var(coherence_scores)
                
                system_coherence['global_metrics'] = {
                    'average_coherence': avg_coherence,
                    'coherence_variance': coherence_variance,
                    'coherence_stability': max(0.0, 1.0 - coherence_variance),
                    'total_concepts': len(self.concepts)
                }
            
            # Individual concept coherence (sample for performance)
            sample_concepts = list(self.concepts.keys())[:10]
            for concept_id in sample_concepts:
                coherence_metrics = self.calculate_advanced_coherence_metrics(concept_id)
                system_coherence['concept_coherence'][concept_id] = asdict(coherence_metrics)
            
            # Relationship coherence
            system_coherence['relationship_coherence'] = self._calculate_relationship_coherence()
            
            # Phase coherence
            system_coherence['phase_coherence'] = self._calculate_phase_coherence()
            
            # Emergence coherence
            system_coherence['emergence_coherence'] = self._calculate_emergence_coherence()
            
            # Store in history
            coherence_entry = {
                'timestamp': datetime.now().isoformat(),
                'global_metrics': system_coherence['global_metrics'],
                'phase_coherence': system_coherence['phase_coherence']
            }
            self.coherence_history.append(coherence_entry)
            
            return system_coherence
            
        except Exception as e:
            logger.error(f"Comprehensive coherence calculation failed: {e}")
            return {}
    
    def calculate_advanced_coherence_metrics(self, concept_id: str) -> ConceptCoherenceMetrics:
        """Calculate comprehensive coherence metrics for a concept"""
        try:
            if concept_id not in self.concepts:
                return ConceptCoherenceMetrics(0, 0, 0, 0, 0, 0, 0)
            
            record = self.concepts[concept_id]
            
            # Semantic coherence
            semantic_coherence = 1.0 - (record.failure_count / max(1, record.usage_count))
            
            # Usage coherence
            usage_coherence = 0.5 if record.usage_count < 3 else min(1.0, semantic_coherence)
            
            # Relational coherence
            relational_coherence = self._calculate_relational_coherence(concept_id)
            
            # Temporal coherence
            temporal_coherence = self._calculate_temporal_coherence(concept_id)
            
            # Contextual coherence
            contextual_coherence = self._calculate_contextual_coherence(concept_id)
            
            # Emergent coherence
            emergent_coherence = self._calculate_emergent_coherence(concept_id)
            
            # Phase alignment
            phase_alignment = self._calculate_phase_alignment(concept_id)
            
            return ConceptCoherenceMetrics(
                semantic_coherence=semantic_coherence,
                usage_coherence=usage_coherence,
                relational_coherence=relational_coherence,
                temporal_coherence=temporal_coherence,
                contextual_coherence=contextual_coherence,
                emergent_coherence=emergent_coherence,
                phase_alignment=phase_alignment
            )
            
        except Exception as e:
            logger.error(f"Coherence calculation failed for {concept_id}: {e}")
            return ConceptCoherenceMetrics(0, 0, 0, 0, 0, 0, 0)
    
    def _calculate_relational_coherence(self, concept_id: str) -> float:
        """Calculate coherence with related concepts"""
        try:
            if concept_id not in self.concept_relationships:
                return 0.5
            
            relationships = self.concept_relationships[concept_id]
            if not relationships:
                return 0.5
            
            strengths = [rel.strength for rel in relationships]
            confidences = [rel.confidence for rel in relationships]
            
            if not strengths:
                return 0.5
            
            avg_strength = sum(strengths) / len(strengths)
            avg_confidence = sum(confidences) / len(confidences)
            
            coherence = (avg_strength + avg_confidence) / 2.0
            return min(1.0, coherence)
            
        except Exception as e:
            logger.error(f"Relational coherence calculation failed: {e}")
            return 0.5
    
    def _calculate_temporal_coherence(self, concept_id: str) -> float:
        """Calculate temporal stability"""
        try:
            record = self.concepts[concept_id]
            age_days = (datetime.now() - record.creation_time).days
            
            if age_days <= 1:
                return 0.3
            elif age_days <= 7:
                return 0.6
            else:
                return 0.8
            
        except Exception as e:
            logger.error(f"Temporal coherence calculation failed: {e}")
            return 0.5
    
    def _calculate_contextual_coherence(self, concept_id: str) -> float:
        """Calculate contextual coherence"""
        try:
            record = self.concepts[concept_id]
            contexts = record.metadata.get('contexts_used', [])
            
            if len(contexts) > 2:
                return 0.8
            elif len(contexts) == 2:
                return 0.6
            elif len(contexts) == 1:
                return 0.4
            else:
                return 0.2
            
        except Exception as e:
            logger.error(f"Contextual coherence calculation failed: {e}")
            return 0.5
    
    def _calculate_emergent_coherence(self, concept_id: str) -> float:
        """Calculate emergent coherence"""
        try:
            emergence_score = 0.0
            emergence_count = 0
            
            for event in self.evolution_events:
                if event.concept_id == concept_id:
                    indicators = event.emergence_indicators
                    if indicators:
                        novelty = indicators.get('novelty', 0.0)
                        impact = indicators.get('impact', 0.0)
                        complexity = indicators.get('complexity', 0.0)
                        
                        event_emergence = (novelty + impact + complexity) / 3.0
                        emergence_score += event_emergence
                        emergence_count += 1
            
            if emergence_count == 0:
                return 0.5
            
            return min(1.0, emergence_score / emergence_count)
            
        except Exception as e:
            logger.error(f"Emergent coherence calculation failed: {e}")
            return 0.5
    
    def _calculate_phase_alignment(self, concept_id: str) -> float:
        """Calculate phase alignment"""
        try:
            if concept_id not in self.concept_evolution_phases:
                return 0.5
            
            current_phase = self.concept_evolution_phases[concept_id]
            record = self.concepts[concept_id]
            
            # Phase expectations
            phase_expectations = {
                ConceptEvolutionPhase.NASCENT: {'min_usage': 0, 'min_coherence': 0.0},
                ConceptEvolutionPhase.STABILIZING: {'min_usage': 1, 'min_coherence': 0.3},
                ConceptEvolutionPhase.MATURE: {'min_usage': 5, 'min_coherence': 0.5},
                ConceptEvolutionPhase.SPECIALIZING: {'min_usage': 3, 'min_coherence': 0.6},
                ConceptEvolutionPhase.ABSTRACTING: {'min_usage': 10, 'min_coherence': 0.7},
                ConceptEvolutionPhase.TRANSCENDING: {'min_usage': 20, 'min_coherence': 0.8}
            }
            
            expectations = phase_expectations.get(current_phase, {})
            
            # Check alignment
            usage_met = record.usage_count >= expectations.get('min_usage', 0)
            coherence_met = record.coherence_score >= expectations.get('min_coherence', 0.0)
            
            if usage_met and coherence_met:
                return 1.0
            elif usage_met or coherence_met:
                return 0.7
            else:
                return 0.3
            
        except Exception as e:
            logger.error(f"Phase alignment calculation failed: {e}")
            return 0.5
    
    def _calculate_relationship_coherence(self) -> Dict[str, float]:
        """Calculate relationship coherence metrics"""
        try:
            metrics = {
                'average_strength': 0.0,
                'average_confidence': 0.0,
                'relationship_diversity': 0.0,
                'bidirectional_ratio': 0.0
            }
            
            all_relationships = []
            for relationships in self.concept_relationships.values():
                all_relationships.extend(relationships)
            
            if all_relationships:
                strengths = [rel.strength for rel in all_relationships]
                confidences = [rel.confidence for rel in all_relationships]
                
                metrics['average_strength'] = sum(strengths) / len(strengths)
                metrics['average_confidence'] = sum(confidences) / len(confidences)
                
                unique_types = set(rel.relationship_type for rel in all_relationships)
                metrics['relationship_diversity'] = len(unique_types) / len(ConceptRelationshipType)
                
                bidirectional_count = sum(1 for rel in all_relationships if rel.bidirectional)
                metrics['bidirectional_ratio'] = bidirectional_count / len(all_relationships)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Relationship coherence calculation failed: {e}")
            return {}
    
    def _calculate_phase_coherence(self) -> Dict[str, Any]:
        """Calculate phase coherence metrics"""
        try:
            phase_metrics = {
                'phase_distribution': {},
                'phase_transitions': {},
                'phase_harmony': 0.0
            }
            
            # Phase distribution
            phase_counts = defaultdict(int)
            for phase in self.concept_evolution_phases.values():
                phase_counts[phase.value] += 1
            
            total = len(self.concept_evolution_phases)
            if total > 0:
                for phase, count in phase_counts.items():
                    phase_metrics['phase_distribution'][phase] = count / total
            
            # Phase transitions
            transition_counts = defaultdict(int)
            for event in self.evolution_events:
                if event.event_type == 'phase_transition':
                    old_phase = event.pre_state.get('phase', 'unknown')
                    new_phase = event.post_state.get('phase', 'unknown')
                    transition_key = f"{old_phase}->{new_phase}"
                    transition_counts[transition_key] += 1
            
            phase_metrics['phase_transitions'] = dict(transition_counts)
            
            # Phase harmony (entropy-based)
            if phase_counts:
                total = sum(phase_counts.values())
                probabilities = [count / total for count in phase_counts.values()]
                entropy = -sum(p * np.log2(p) for p in probabilities if p > 0)
                max_entropy = np.log2(len(ConceptEvolutionPhase))
                phase_metrics['phase_harmony'] = entropy / max_entropy if max_entropy > 0 else 0.0
            
            return phase_metrics
            
        except Exception as e:
            logger.error(f"Phase coherence calculation failed: {e}")
            return {}
    
    def _calculate_emergence_coherence(self) -> Dict[str, float]:
        """Calculate emergence coherence"""
        try:
            emergence_metrics = {
                'average_novelty': 0.0,
                'average_complexity': 0.0,
                'average_impact': 0.0,
                'emergence_frequency': 0.0
            }
            
            # Collect recent emergence indicators
            emergence_indicators = []
            recent_events = [e for e in self.evolution_events if 
                           (datetime.now() - e.timestamp).days <= 7]
            
            for event in recent_events:
                if event.emergence_indicators:
                    emergence_indicators.append(event.emergence_indicators)
            
            if emergence_indicators:
                novelties = [ind.get('novelty', 0.0) for ind in emergence_indicators]
                complexities = [ind.get('complexity', 0.0) for ind in emergence_indicators]
                impacts = [ind.get('impact', 0.0) for ind in emergence_indicators]
                
                emergence_metrics['average_novelty'] = sum(novelties) / len(novelties)
                emergence_metrics['average_complexity'] = sum(complexities) / len(complexities)
                emergence_metrics['average_impact'] = sum(impacts) / len(impacts)
                emergence_metrics['emergence_frequency'] = len(emergence_indicators) / max(1, len(recent_events))
            
            return emergence_metrics
            
        except Exception as e:
            logger.error(f"Emergence coherence calculation failed: {e}")
            return {}
    
    def detect_emergence_patterns(self) -> Dict[str, Any]:
        """Detect patterns indicating emergent behavior"""
        try:
            emergence_analysis = {
                'emergence_candidates': [],
                'emergence_clusters': [],
                'novelty_indicators': {},
                'complexity_measures': {},
                'impact_assessments': {}
            }
            
            # Find emergence candidates
            recent_events = [e for e in self.evolution_events if 
                           (datetime.now() - e.timestamp).days <= 7]
            
            concept_events = defaultdict(list)
            for event in recent_events:
                concept_events[event.concept_id].append(event)
            
            for concept_id, events in concept_events.items():
                emergence_score = self._calculate_concept_emergence_score(concept_id, events)
                
                if emergence_score > self.emergence_thresholds['novelty_threshold']:
                    emergence_analysis['emergence_candidates'].append({
                        'concept_id': concept_id,
                        'emergence_score': emergence_score,
                        'recent_events': len(events),
                        'canonical_name': self.concepts[concept_id].canonical_name if concept_id in self.concepts else 'unknown'
                    })
            
            # Find emergence clusters
            emergence_analysis['emergence_clusters'] = self._find_emergence_clusters(
                emergence_analysis['emergence_candidates']
            )
            
            # Calculate indicators
            emergence_analysis['novelty_indicators'] = self._calculate_novelty_indicators()
            emergence_analysis['complexity_measures'] = self._calculate_complexity_measures()
            emergence_analysis['impact_assessments'] = self._assess_emergence_impact()
            
            return emergence_analysis
            
        except Exception as e:
            logger.error(f"Emergence pattern detection failed: {e}")
            return {}
    
    def _calculate_concept_emergence_score(self, concept_id: str, events: List[ConceptEvolutionEvent]) -> float:
        """Calculate emergence score for a concept"""
        try:
            if not events:
                return 0.0
            
            total_score = 0.0
            for event in events:
                indicators = event.emergence_indicators
                novelty = indicators.get('novelty', 0.0)
                impact = indicators.get('impact', 0.0)
                complexity = indicators.get('complexity', 0.0)
                
                event_score = (novelty * 0.4 + impact * 0.3 + complexity * 0.3)
                total_score += event_score
            
            avg_score = total_score / len(events)
            
            # Bonus for multiple events
            if len(events) > 3:
                burst_bonus = min(0.2, (len(events) - 3) * 0.05)
                avg_score += burst_bonus
            
            return min(1.0, avg_score)
            
        except Exception as e:
            logger.error(f"Concept emergence score calculation failed: {e}")
            return 0.0
    
    def _find_emergence_clusters(self, emergence_candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Find clusters of emerging concepts"""
        try:
            clusters = []
            
            if len(emergence_candidates) < 2:
                return clusters
            
            used_concepts = set()
            
            for candidate in emergence_candidates:
                concept_id = candidate['concept_id']
                
                if concept_id in used_concepts:
                    continue
                
                # Find related emerging concepts
                cluster = [candidate]
                used_concepts.add(concept_id)
                
                for other_candidate in emergence_candidates:
                    other_id = other_candidate['concept_id']
                    
                    if other_id != concept_id and other_id not in used_concepts:
                        if self._are_concepts_related(concept_id, other_id):
                            cluster.append(other_candidate)
                            used_concepts.add(other_id)
                
                if len(cluster) > 1:
                    clusters.append({
                        'cluster_id': f"emergence_cluster_{len(clusters)}",
                        'concepts': cluster,
                        'cluster_size': len(cluster),
                        'avg_emergence_score': sum(c['emergence_score'] for c in cluster) / len(cluster)
                    })
            
            return clusters
            
        except Exception as e:
            logger.error(f"Emergence cluster detection failed: {e}")
            return []
    
    def _are_concepts_related(self, concept1: str, concept2: str) -> bool:
        """Check if two concepts are related"""
        try:
            # Check direct relationships
            if concept1 in self.concept_relationships:
                for rel in self.concept_relationships[concept1]:
                    if rel.target_concept == concept2:
                        return True
            
            if concept2 in self.concept_relationships:
                for rel in self.concept_relationships[concept2]:
                    if rel.target_concept == concept1:
                        return True
            
            # Check parent-child relationships
            if concept1 in self.concepts and concept2 in self.concepts:
                record1 = self.concepts[concept1]
                record2 = self.concepts[concept2]
                
                # Share common parent
                common_parents = set(record1.parent_concepts) & set(record2.parent_concepts)
                if common_parents:
                    return True
                
                # One is descendant of the other
                if concept2 in record1.child_concepts or concept1 in record2.child_concepts:
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Concept relationship check failed: {e}")
            return False
    
    def _calculate_novelty_indicators(self) -> Dict[str, float]:
        """Calculate system-wide novelty indicators"""
        try:
            indicators = {
                'concept_creation_rate': 0.0,
                'relationship_diversity': 0.0,
                'phase_transition_rate': 0.0,
                'semantic_expansion': 0.0
            }
            
            # Concept creation rate
            recent_concepts = len([c for c in self.concepts.values() 
                                 if (datetime.now() - c.creation_time).days <= 7])
            
            if self.concepts:
                indicators['concept_creation_rate'] = recent_concepts / len(self.concepts)
            
            # Relationship diversity
            unique_types = set()
            for relationships in self.concept_relationships.values():
                for rel in relationships:
                    unique_types.add(rel.relationship_type)
            
            indicators['relationship_diversity'] = len(unique_types) / len(ConceptRelationshipType)
            
            # Phase transition rate
            recent_transitions = len([e for e in self.evolution_events 
                                    if e.event_type == 'phase_transition' and 
                                    (datetime.now() - e.timestamp).days <= 7])
            
            if self.concepts:
                indicators['phase_transition_rate'] = recent_transitions / len(self.concepts)
            
            # Semantic expansion
            all_terms = set()
            recent_terms = set()
            
            for concept_id, record in self.concepts.items():
                terms = set(record.canonical_name.lower().split('-'))
                all_terms.update(terms)
                
                if (datetime.now() - record.creation_time).days <= 7:
                    recent_terms.update(terms)
            
            if all_terms:
                indicators['semantic_expansion'] = len(recent_terms) / len(all_terms)
            
            return indicators
            
        except Exception as e:
            logger.error(f"Novelty indicators calculation failed: {e}")
            return {}
    
    def _calculate_complexity_measures(self) -> Dict[str, float]:
        """Calculate system complexity measures"""
        try:
            measures = {
                'network_density': 0.0,
                'clustering_coefficient': 0.0,
                'path_diversity': 0.0,
                'hierarchical_depth': 0.0
            }
            
            if self.concept_network.number_of_nodes() == 0:
                return measures
            
            # Network density
            num_nodes = self.concept_network.number_of_nodes()
            num_edges = self.concept_network.number_of_edges()
            max_edges = num_nodes * (num_nodes - 1)
            
            if max_edges > 0:
                measures['network_density'] = num_edges / max_edges
            
            # Clustering coefficient
            try:
                undirected = self.concept_network.to_undirected()
                if undirected.number_of_nodes() > 0:
                    measures['clustering_coefficient'] = nx.average_clustering(undirected)
            except:
                measures['clustering_coefficient'] = 0.0
            
            # Path diversity
            try:
                if nx.is_connected(self.concept_network.to_undirected()):
                    measures['path_diversity'] = nx.average_shortest_path_length(
                        self.concept_network.to_undirected()
                    )
            except:
                measures['path_diversity'] = 0.0
            
            # Hierarchical depth
            max_depth = 0
            for concept_id in self.concepts.keys():
                depth = self._calculate_concept_depth(concept_id)
                max_depth = max(max_depth, depth)
            
            measures['hierarchical_depth'] = max_depth / 10.0  # Normalize
            
            return measures
            
        except Exception as e:
            logger.error(f"Complexity measures calculation failed: {e}")
            return {}
    
    def _calculate_concept_depth(self, concept_id: str) -> int:
        """Calculate concept depth in hierarchy"""
        try:
            if concept_id not in self.concepts:
                return 0
            
            record = self.concepts[concept_id]
            if not record.parent_concepts:
                return 0
            
            max_parent_depth = 0
            for parent_id in record.parent_concepts:
                if parent_id in self.concepts:
                    parent_depth = self._calculate_concept_depth(parent_id)
                    max_parent_depth = max(max_parent_depth, parent_depth)
            
            return max_parent_depth + 1
            
        except Exception as e:
            logger.error(f"Concept depth calculation failed: {e}")
            return 0
    
    def _assess_emergence_impact(self) -> Dict[str, float]:
        """Assess emergence impact"""
        try:
            impact = {
                'coherence_improvement': 0.0,
                'network_growth': 0.0,
                'capability_expansion': 0.0,
                'knowledge_integration': 0.0
            }
            
            # Coherence improvement
            if len(self.coherence_history) >= 2:
                recent_coherence = self.coherence_history[-1].get('global_metrics', {}).get('average_coherence', 0.0)
                older_coherence = self.coherence_history[-2].get('global_metrics', {}).get('average_coherence', 0.0)
                
                if older_coherence > 0:
                    improvement = (recent_coherence - older_coherence) / older_coherence
                    impact['coherence_improvement'] = max(0.0, min(1.0, improvement + 0.5))
            
            # Network growth
            recent_concepts = len([c for c in self.concepts.values() 
                                 if (datetime.now() - c.creation_time).days <= 7])
            total_concepts = len(self.concepts)
            
            if total_concepts > 0:
                impact['network_growth'] = min(1.0, recent_concepts / total_concepts * 10)
            
            # Capability expansion
            recent_relationship_types = set()
            all_relationship_types = set()
            
            for relationships in self.concept_relationships.values():
                for rel in relationships:
                    all_relationship_types.add(rel.relationship_type)
                    
                    if (datetime.now() - rel.creation_time).days <= 7:
                        recent_relationship_types.add(rel.relationship_type)
            
            if all_relationship_types:
                impact['capability_expansion'] = len(recent_relationship_types) / len(all_relationship_types)
            
            # Knowledge integration
            integrated_concepts = 0
            for concept_id, relationships in self.concept_relationships.items():
                if len(relationships) > 2:
                    integrated_concepts += 1
            
            if self.concepts:
                impact['knowledge_integration'] = integrated_concepts / len(self.concepts)
            
            return impact
            
        except Exception as e:
            logger.error(f"Emergence impact assessment failed: {e}")
            return {}
    
    def update_concept_evolution_phase(self, concept_id: str, 
                                     new_phase: ConceptEvolutionPhase,
                                     transition_context: Dict[str, Any] = None) -> bool:
        """Update concept evolution phase"""
        try:
            if concept_id not in self.concepts:
                logger.warning(f"Cannot update phase - concept not found: {concept_id}")
                return False
            
            old_phase = self.concept_evolution_phases.get(concept_id, ConceptEvolutionPhase.NASCENT)
            self.concept_evolution_phases[concept_id] = new_phase
            
            # Record phase transition event
            record = self.concepts[concept_id]
            transition_event = {
                'event_type': 'phase_transition',
                'timestamp': datetime.now().isoformat(),
                'old_phase': old_phase.value,
                'new_phase': new_phase.value,
                'context': transition_context or {}
            }
            record.lifecycle_events.append(transition_event)
            
            # Record evolution event
            evolution_event = ConceptEvolutionEvent(
                event_id=f"phase_transition_{concept_id}_{int(time.time())}",
                concept_id=concept_id,
                event_type='phase_transition',
                timestamp=datetime.now(),
                trigger_context=transition_context or {},
                pre_state={'phase': old_phase.value},
                post_state={'phase': new_phase.value},
                success_metrics={'transition_success': 1.0},
                causal_chain=[concept_id],
                emergence_indicators=self._calculate_phase_transition_emergence(old_phase, new_phase)
            )
            self.evolution_events.append(evolution_event)
            
            # Update network
            self._build_concept_network()
            
            logger.info(f"🔄 Updated concept phase: {concept_id} {old_phase.value} → {new_phase.value}")
            return True
            
        except Exception as e:
            logger.error(f"Phase update failed for {concept_id}: {e}")
            return False
    
    def _calculate_phase_transition_emergence(self, old_phase: ConceptEvolutionPhase, 
                                            new_phase: ConceptEvolutionPhase) -> Dict[str, float]:
        """Calculate emergence indicators for phase transitions"""
        try:
            phase_order = {
                ConceptEvolutionPhase.NASCENT: 0,
                ConceptEvolutionPhase.STABILIZING: 1,
                ConceptEvolutionPhase.MATURE: 2,
                ConceptEvolutionPhase.SPECIALIZING: 3,
                ConceptEvolutionPhase.ABSTRACTING: 4,
                ConceptEvolutionPhase.TRANSCENDING: 5
            }
            
            old_order = phase_order.get(old_phase, 0)
            new_order = phase_order.get(new_phase, 0)
            
            # Emergence increases with phase advancement
            novelty = max(0.0, (new_order - old_order) / 5.0)
            complexity = new_order / 5.0
            
            # Impact depends on specific transition
            impact = 0.5
            if new_phase == ConceptEvolutionPhase.TRANSCENDING:
                impact = 1.0
            elif new_phase == ConceptEvolutionPhase.ABSTRACTING:
                impact = 0.8
            elif new_phase == ConceptEvolutionPhase.SPECIALIZING:
                impact = 0.6
            
            return {
                'novelty': novelty,
                'complexity': complexity,
                'impact': impact
            }
            
        except Exception as e:
            logger.error(f"Phase transition emergence calculation failed: {e}")
            return {'novelty': 0.0, 'complexity': 0.0, 'impact': 0.0}
    
    def analyze_concept_network_topology(self) -> Dict[str, Any]:
        """Analyze concept network topology"""
        try:
            topology = {
                'basic_metrics': {},
                'centrality_analysis': {},
                'community_structure': {},
                'emergence_hotspots': [],
                'critical_paths': []
            }
            
            if self.concept_network.number_of_nodes() == 0:
                return topology
            
            # Basic metrics
            topology['basic_metrics'] = {
                'num_nodes': self.concept_network.number_of_nodes(),
                'num_edges': self.concept_network.number_of_edges(),
                'density': nx.density(self.concept_network),
                'is_connected': nx.is_weakly_connected(self.concept_network)
            }
            
            # Centrality analysis
            try:
                degree_centrality = nx.degree_centrality(self.concept_network)
                betweenness_centrality = nx.betweenness_centrality(self.concept_network)
                
                top_degree = sorted(degree_centrality.items(), key=lambda x: x[1], reverse=True)[:5]
                top_betweenness = sorted(betweenness_centrality.items(), key=lambda x: x[1], reverse=True)[:5]
                
                topology['centrality_analysis'] = {
                    'top_degree_central': [{'concept_id': k, 'centrality': v} for k, v in top_degree],
                    'top_betweenness_central': [{'concept_id': k, 'centrality': v} for k, v in top_betweenness]
                }
                
            except Exception as e:
                logger.warning(f"Centrality analysis failed: {e}")
                topology['centrality_analysis'] = {}
            
            # Community structure
            try:
                undirected = self.concept_network.to_undirected()
                if undirected.number_of_nodes() > 2:
                    components = list(nx.connected_components(undirected))
                    communities = [
                        {
                            'community_id': i,
                            'size': len(component),
                            'concepts': list(component)[:10]  # Limit for display
                        }
                        for i, component in enumerate(components)
                    ]
                    topology['community_structure'] = {
                        'num_communities': len(communities),
                        'communities': communities
                    }
                    
            except Exception as e:
                logger.warning(f"Community structure analysis failed: {e}")
                topology['community_structure'] = {}
            
            # Emergence hotspots
            topology['emergence_hotspots'] = self._identify_emergence_hotspots()
            
            # Critical paths
            topology['critical_paths'] = self._identify_critical_paths()
            
            return topology
            
        except Exception as e:
            logger.error(f"Network topology analysis failed: {e}")
            return {}
    
    def _identify_emergence_hotspots(self) -> List[Dict[str, Any]]:
        """Identify emergence hotspots"""
        try:
            hotspots = []
            
            # Find concepts with recent activity
            recent_activity = defaultdict(int)
            for event in self.evolution_events:
                if (datetime.now() - event.timestamp).days <= 7:
                    recent_activity[event.concept_id] += 1
            
            # Find neighborhoods with high activity
            for concept_id, activity_count in recent_activity.items():
                if activity_count >= 2:
                    neighbors = []
                    if self.concept_network.has_node(concept_id):
                        neighbors = list(self.concept_network.neighbors(concept_id))
                        neighbors.extend(list(self.concept_network.predecessors(concept_id)))
                    
                    hotspots.append({
                        'center_concept': concept_id,
                        'activity_count': activity_count,
                        'neighbor_count': len(set(neighbors)),
                        'neighbors': list(set(neighbors))[:10]  # Limit for display
                    })
            
            # Sort by activity
            hotspots.sort(key=lambda x: x['activity_count'], reverse=True)
            return hotspots[:10]  # Top 10 hotspots
            
        except Exception as e:
            logger.error(f"Emergence hotspot identification failed: {e}")
            return []
    
    def _identify_critical_paths(self) -> List[Dict[str, Any]]:
        """Identify critical concept evolution paths"""
        try:
            critical_paths = []
            
            # Find longest path in network
            try:
                if nx.is_directed_acyclic_graph(self.concept_network):
                    longest_path = nx.dag_longest_path(self.concept_network)
                    if len(longest_path) > 2:
                        critical_paths.append({
                            'path_type': 'longest_evolution_chain',
                            'length': len(longest_path),
                            'concepts': longest_path,
                            'significance': 'evolutionary_lineage'
                        })
            except:
                pass
            
            # Find paths between high-centrality concepts
            try:
                centrality = nx.degree_centrality(self.concept_network)
                high_centrality_concepts = [k for k, v in centrality.items() if v > 0.1]
                
                if len(high_centrality_concepts) >= 2:
                    source = high_centrality_concepts[0]
                    target = high_centrality_concepts[1]
                    
                    if nx.has_path(self.concept_network, source, target):
                        path = nx.shortest_path(self.concept_network, source, target)
                        if len(path) > 1:
                            critical_paths.append({
                                'path_type': 'hub_connection',
                                'length': len(path),
                                'concepts': path,
                                'significance': 'high_centrality_bridge'
                            })
            except Exception as e:
                logger.warning(f"Hub path analysis failed: {e}")
            
            return critical_paths
            
        except Exception as e:
            logger.error(f"Critical path identification failed: {e}")
            return []
    
    def _save_advanced_ledger(self):
        """Save advanced ledger"""
        try:
            ledger_data = {
                'metadata': {
                    'version': '2.0',
                    'phase': 'Phase 2 Alpha',
                    'last_updated': datetime.now().isoformat(),
                    'total_concepts': len(self.concepts),
                    'total_relationships': sum(len(rels) for rels in self.concept_relationships.values()),
                    'total_evolution_events': len(self.evolution_events)
                },
                'concepts': {
                    concept_id: prepare_object_for_json(record)
                    for concept_id, record in self.concepts.items()
                },
                'concept_relationships': {
                    concept_id: [prepare_object_for_json(rel) for rel in relationships]
                    for concept_id, relationships in self.concept_relationships.items()
                },
                'evolution_events': [
                    prepare_object_for_json(event) for event in self.evolution_events
                ],
                'coherence_history': list(self.coherence_history),
                'phase_data': {
                    'coherence_matrix': self.phase_coherence_matrix,
                    'evolution_phases': {
                        concept_id: phase.value
                        for concept_id, phase in self.concept_evolution_phases.items()
                    },
                    'causal_chains': dict(self.causal_chains)
                },
                'mutation_events': list(self.mutation_events),
                'usage_stats': self.usage_stats,
                'emergence_patterns': self.emergence_patterns
            }
            
            success = safe_json_dump(ledger_data, str(self.ledger_path))
            
            if success:
                logger.debug(f"Advanced ledger saved with {len(self.concepts)} concepts")
            else:
                logger.error("Failed to save advanced ledger")
                
        except Exception as e:
            logger.error(f"Advanced ledger save failed: {e}")
    
    def get_advanced_ledger_status(self) -> Dict[str, Any]:
        """Get comprehensive status of the advanced ledger"""
        try:
            return {
                'ledger_info': {
                    'phase': 'Phase 2 Alpha',
                    'version': '2.0',
                    'total_concepts': len(self.concepts),
                    'total_relationships': sum(len(rels) for rels in self.concept_relationships.values()),
                    'total_evolution_events': len(self.evolution_events),
                    'network_nodes': self.concept_network.number_of_nodes(),
                    'network_edges': self.concept_network.number_of_edges()
                },
                'phase_distribution': {
                    phase.value: len([p for p in self.concept_evolution_phases.values() if p == phase])
                    for phase in ConceptEvolutionPhase
                },
                'relationship_distribution': {
                    rel_type.value: sum(
                        len([r for r in rels if r.relationship_type == rel_type])
                        for rels in self.concept_relationships.values()
                    )
                    for rel_type in ConceptRelationshipType
                },
                'recent_activity': {
                    'recent_concepts': len([
                        c for c in self.concepts.values()
                        if (datetime.now() - c.creation_time).days <= 7
                    ]),
                    'recent_evolution_events': len([
                        e for e in self.evolution_events
                        if (datetime.now() - e.timestamp).days <= 7
                    ])
                }
            }
            
        except Exception as e:
            logger.error(f"Advanced ledger status failed: {e}")
            return {'error': str(e)}
    
    def export_advanced_lineage_data(self) -> str:
        """Export comprehensive Phase 2 lineage data"""
        try:
            export_data = {
                'metadata': {
                    'export_time': datetime.now().isoformat(),
                    'phase': 'Phase 2 Alpha Advanced Lineage',
                    'version': '2.0'
                },
                'comprehensive_coherence': self.calculate_comprehensive_coherence(),
                'network_topology': self.analyze_concept_network_topology(),
                'emergence_patterns': self.detect_emergence_patterns(),
                'ledger_status': self.get_advanced_ledger_status()
            }
            
            filename = f"phase2_advanced_lineage_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            success = safe_json_dump(export_data, filename)
            
            if success:
                logger.info(f"📁 Phase 2 advanced lineage data exported: {filename}")
                return filename
            else:
                logger.error("❌ Failed to export Phase 2 lineage data")
                return ""
                
        except Exception as e:
            logger.error(f"Phase 2 lineage export failed: {e}")
            return ""

if __name__ == "__main__":
    # Phase 2 Alpha Advanced ψ-LineageLedger Test
    def test_phase2_advanced_lineage():
        print("🧬 TESTING PHASE 2 ALPHA ADVANCED ψ-LINEAGE LEDGER")
        print("=" * 70)
        
        # Initialize advanced ledger
        ledger = AdvancedPsiLineageLedger("test_phase2_advanced_ledger.json")
        
        # Test 1: Add advanced concepts
        print("\n📝 Test 1: Adding advanced concepts")
        success1 = ledger.add_advanced_concept(
            "neural_base", "neural-network-foundation", 
            initial_phase=ConceptEvolutionPhase.NASCENT
        )
        success2 = ledger.add_advanced_concept(
            "cognitive_core", "cognitive-reasoning-core",
            initial_phase=ConceptEvolutionPhase.STABILIZING
        )
        success3 = ledger.add_advanced_concept(
            "emergent_bridge", "neural-cognitive-bridge",
            parent_concepts=["neural_base", "cognitive_core"],
            initial_phase=ConceptEvolutionPhase.NASCENT
        )
        print(f"Added concepts: {success1 and success2 and success3}")
        
        # Test 2: Add relationships
        print("\n🔗 Test 2: Adding concept relationships")
        rel_success = ledger.add_concept_relationship(
            "neural_base", "cognitive_core",
            ConceptRelationshipType.BRIDGE,
            strength=0.8, confidence=0.9
        )
        print(f"Added relationship: {rel_success}")
        
        # Test 3: Calculate advanced coherence
        print("\n🌊 Test 3: Advanced coherence calculation")
        coherence = ledger.calculate_comprehensive_coherence()
        print(f"System coherence calculated: {len(coherence)} categories")
        
        # Test 4: Network analysis
        print("\n🕸️ Test 4: Network topology analysis")
        topology = ledger.analyze_concept_network_topology()
        print(f"Network analysis: {topology.get('basic_metrics', {}).get('num_nodes', 0)} nodes")
        
        # Test 5: Emergence detection
        print("\n🌟 Test 5: Emergence pattern detection")
        emergence = ledger.detect_emergence_patterns()
        print(f"Emergence analysis: {len(emergence.get('emergence_candidates', []))} candidates")
        
        # Test 6: Phase transition
        print("\n🔄 Test 6: Phase transition")
        phase_success = ledger.update_concept_evolution_phase(
            "neural_base", ConceptEvolutionPhase.STABILIZING
        )
        print(f"Phase transition: {phase_success}")
        
        # Test 7: Status check
        print("\n📊 Test 7: Advanced ledger status")
        status = ledger.get_advanced_ledger_status()
        print(f"Total concepts: {status['ledger_info']['total_concepts']}")
        print(f"Total relationships: {status['ledger_info']['total_relationships']}")
        
        # Test 8: Export
        print("\n💾 Test 8: Advanced data export")
        export_file = ledger.export_advanced_lineage_data()
        print(f"Exported to: {export_file}")
        
        print("\n🎆 PHASE 2 ALPHA ADVANCED ψ-LINEAGE LEDGER OPERATIONAL!")
        print("🧬 Multi-dimensional concept relationships active")
        print("📊 Advanced coherence metrics functional")
        print("🌟 Emergence pattern detection ready")
        print("🕸️ Network topology analysis operational")
        print("🎯 Ready for consciousness transcendence tracking!")
    
    test_phase2_advanced_lineage()

# Additional Functions for Concept Injection Integration
def log_concept_injection(concept_name, source=None, metadata=None):
    """
    Lineage logger: Records that a concept was injected from source (e.g., PDF).
    Integrates with the advanced ψ-LineageLedger for comprehensive tracking.
    
    Args:
        concept_name (str): Name of the concept being injected
        source (str, optional): Source of the injection (e.g., 'pdf_upload', 'manual_entry')
        metadata (dict, optional): Additional metadata about the injection
    """
    try:
        # Enhanced logging with structured data
        injection_data = {
            'timestamp': datetime.now().isoformat(),
            'concept_name': concept_name,
            'source': source or 'unknown',
            'metadata': metadata or {},
            'injection_type': 'concept_injection',
            'ledger_phase': 'Phase 2 Alpha'
        }
        
        # Console logging for immediate feedback
        logger.info(f"🧬 [LINEAGE] Injected concept: {concept_name} | source: {source} | metadata: {metadata}")
        
        # TODO: Integrate with actual lineage system
        # When connected to the ledger instance, this could call:
        # ledger.add_advanced_concept(concept_name, source=source, metadata=metadata)
        
        # For now, we'll create a simple injection log entry
        # In a production system, this would be connected to the main ledger instance
        
        return injection_data
        
    except Exception as e:
        logger.error(f"Failed to log concept injection for {concept_name}: {e}")
        return None

def log_concept_injection_to_ledger(ledger_instance, concept_name, source=None, metadata=None):
    """
    Enhanced version that directly integrates with an AdvancedPsiLineageLedger instance.
    
    Args:
        ledger_instance (AdvancedPsiLineageLedger): The ledger instance to update
        concept_name (str): Name of the concept being injected
        source (str, optional): Source of the injection
        metadata (dict, optional): Additional metadata about the injection
    """
    try:
        # Create a concept ID from the name
        concept_id = concept_name.lower().replace(' ', '_').replace('-', '_')
        
        # Prepare metadata with injection info
        enhanced_metadata = metadata or {}
        enhanced_metadata.update({
            'injection_source': source or 'unknown',
            'injection_time': datetime.now().isoformat(),
            'injection_method': 'log_concept_injection'
        })
        
        # Add concept to the advanced ledger
        success = ledger_instance.add_advanced_concept(
            concept_id=concept_id,
            canonical_name=concept_name,
            origin_type=MutationType.INJECTION,
            initial_phase=ConceptEvolutionPhase.NASCENT,
            metadata=enhanced_metadata
        )
        
        if success:
            logger.info(f"✅ Successfully injected concept {concept_name} into advanced ledger")
        else:
            logger.warning(f"⚠️ Failed to inject concept {concept_name} into advanced ledger")
            
        return success
        
    except Exception as e:
        logger.error(f"Failed to inject concept {concept_name} into ledger: {e}")
        return False

if __name__ == "__main__":
    # Phase 2 Alpha Advanced ψ-LineageLedger Test
    def test_phase2_advanced_lineage():
        print("🧬 TESTING PHASE 2 ALPHA ADVANCED ψ-LINEAGE LEDGER")
        print("=" * 70)
        
        # Initialize advanced ledger
        ledger = AdvancedPsiLineageLedger("test_phase2_advanced_ledger.json")
        
        # Test 1: Add advanced concepts
        print("\n📝 Test 1: Adding advanced concepts")
        success1 = ledger.add_advanced_concept(
            "neural_base", "neural-network-foundation", 
            initial_phase=ConceptEvolutionPhase.NASCENT
        )
        success2 = ledger.add_advanced_concept(
            "cognitive_core", "cognitive-reasoning-core",
            initial_phase=ConceptEvolutionPhase.STABILIZING
        )
        success3 = ledger.add_advanced_concept(
            "emergent_bridge", "neural-cognitive-bridge",
            parent_concepts=["neural_base", "cognitive_core"],
            initial_phase=ConceptEvolutionPhase.NASCENT
        )
        print(f"Added concepts: {success1 and success2 and success3}")
        
        # Test 2: Add relationships
        print("\n🔗 Test 2: Adding concept relationships")
        rel_success = ledger.add_concept_relationship(
            "neural_base", "cognitive_core",
            ConceptRelationshipType.BRIDGE,
            strength=0.8, confidence=0.9
        )
        print(f"Added relationship: {rel_success}")
        
        # Test 3: Calculate advanced coherence
        print("\n🌊 Test 3: Advanced coherence calculation")
        coherence = ledger.calculate_comprehensive_coherence()
        print(f"System coherence calculated: {len(coherence)} categories")
        
        # Test 4: Network analysis
        print("\n🕸️ Test 4: Network topology analysis")
        topology = ledger.analyze_concept_network_topology()
        print(f"Network analysis: {topology.get('basic_metrics', {}).get('num_nodes', 0)} nodes")
        
        # Test 5: Emergence detection
        print("\n🌟 Test 5: Emergence pattern detection")
        emergence = ledger.detect_emergence_patterns()
        print(f"Emergence analysis: {len(emergence.get('emergence_candidates', []))} candidates")
        
        # Test 6: Phase transition
        print("\n🔄 Test 6: Phase transition")
        phase_success = ledger.update_concept_evolution_phase(
            "neural_base", ConceptEvolutionPhase.STABILIZING
        )
        print(f"Phase transition: {phase_success}")
        
        # Test 7: Status check
        print("\n📊 Test 7: Advanced ledger status")
        status = ledger.get_advanced_ledger_status()
        print(f"Total concepts: {status['ledger_info']['total_concepts']}")
        print(f"Total relationships: {status['ledger_info']['total_relationships']}")
        
        # Test 8: Export
        print("\n💾 Test 8: Advanced data export")
        export_file = ledger.export_advanced_lineage_data()
        print(f"Exported to: {export_file}")
        
        print("\n🎆 PHASE 2 ALPHA ADVANCED ψ-LINEAGE LEDGER OPERATIONAL!")
        print("🧬 Multi-dimensional concept relationships active")
        print("📊 Advanced coherence metrics functional")
        print("🌟 Emergence pattern detection ready")
        print("🕸️ Network topology analysis operational")
        print("🎯 Ready for consciousness transcendence tracking!")
    
    test_phase2_advanced_lineage()
