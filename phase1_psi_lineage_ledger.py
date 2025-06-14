"""
PHASE 1 MVP - ENHANCED ψ-LINEAGE LEDGER
======================================

Enhanced lineage tracking system for TORI's concept evolution.
Tracks concept lifecycle, mutations, usage, and family trees.

This forms the foundation of TORI's evolutionary memory.
"""

import json
import time
import logging
from typing import Dict, List, Any, Optional, Set
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path

from json_serialization_fix import safe_json_dump, safe_json_load, prepare_object_for_json
from logging_fix import WindowsSafeLogger

logger = WindowsSafeLogger("prajna.psi_lineage_ledger")

class ConceptStatus(Enum):
    """Status of a concept in the system"""
    ACTIVE = "active"                # Currently used in Prajna
    ARCHIVED = "archived"            # Stored in ScholarSphere
    STALE = "stale"                  # Not used recently
    DEPRECATED = "deprecated"        # Marked for removal
    SYNTHETIC = "synthetic"          # Generated by evolution

class MutationType(Enum):
    """Types of concept mutations"""
    FISSION = "fission"              # Split into multiple concepts
    FUSION = "fusion"                # Merged from multiple concepts
    MUTATION = "mutation"            # Modified/evolved
    SYNTHESIS = "synthesis"          # Created from combination
    INJECTION = "injection"          # Injected by strategy
    EXTRACTION = "extraction"        # Extracted from content

@dataclass
class ConceptLineageRecord:
    """Complete lineage record for a concept"""
    concept_id: str
    canonical_name: str
    creation_time: datetime
    status: ConceptStatus
    origin_type: MutationType
    parent_concepts: List[str]
    child_concepts: List[str]
    usage_count: int
    coherence_score: float
    psi_phase: float                 # ψ-phase coherence measure
    last_used: Optional[datetime]
    failure_count: int
    metadata: Dict[str, Any]
    lifecycle_events: List[Dict[str, Any]]

class PsiLineageLedger:
    """
    Phase 1 MVP ψ-LineageLedger Implementation
    
    Tracks the complete lifecycle and lineage of concepts in TORI's evolution.
    Provides the foundation for concept genealogy tracking and evolution analysis.
    """
    
    def __init__(self, ledger_path: str = "psi_lineage_ledger.json"):
        self.ledger_path = Path(ledger_path)
        self.concepts = {}  # concept_id -> ConceptLineageRecord
        self.mutation_events = []
        self.usage_stats = {}
        
        # Load existing ledger
        self._load_ledger()
        
        # Phase coherence tracking
        self.phase_coherence_history = []
        self.last_coherence_update = 0
        
        logger.info(f"ψ-LineageLedger initialized with {len(self.concepts)} concepts")
    
    def _load_ledger(self):
        """Load existing ledger from disk"""
        try:
            if self.ledger_path.exists():
                data = safe_json_load(str(self.ledger_path))
                if data:
                    # Convert loaded data back to concept records
                    raw_concepts = data.get('concepts', {})
                    for concept_id, record_data in raw_concepts.items():
                        try:
                            # Convert strings back to enums and datetime objects
                            record_data['status'] = ConceptStatus(record_data.get('status', 'active'))
                            record_data['origin_type'] = MutationType(record_data.get('origin_type', 'extraction'))
                            
                            # Handle datetime fields
                            if 'creation_time' in record_data:
                                record_data['creation_time'] = datetime.fromisoformat(record_data['creation_time'])
                            else:
                                record_data['creation_time'] = datetime.now()
                            
                            if record_data.get('last_used'):
                                record_data['last_used'] = datetime.fromisoformat(record_data['last_used'])
                            
                            # Ensure all required fields exist
                            record_data.setdefault('parent_concepts', [])
                            record_data.setdefault('child_concepts', [])
                            record_data.setdefault('usage_count', 0)
                            record_data.setdefault('coherence_score', 0.5)
                            record_data.setdefault('psi_phase', 0.5)
                            record_data.setdefault('failure_count', 0)
                            record_data.setdefault('metadata', {})
                            record_data.setdefault('lifecycle_events', [])
                            
                            self.concepts[concept_id] = ConceptLineageRecord(**record_data)
                            
                        except Exception as e:
                            logger.warning(f"Failed to load concept {concept_id}: {e}")
                    
                    self.mutation_events = data.get('mutation_events', [])
                    self.usage_stats = data.get('usage_stats', {})
                    
                    logger.info(f"Loaded {len(self.concepts)} concepts from ledger")
                    
        except Exception as e:
            logger.warning(f"Failed to load ledger: {e} - Starting with empty ledger")
            self.concepts = {}
            self.mutation_events = []
            self.usage_stats = {}
    
    def _save_ledger(self):
        """Save ledger to disk"""
        try:
            # Prepare data for JSON serialization
            concepts_data = {}
            for concept_id, record in self.concepts.items():
                concepts_data[concept_id] = prepare_object_for_json(record)
            
            ledger_data = {
                'metadata': {
                    'version': '1.0',
                    'last_updated': datetime.now().isoformat(),
                    'total_concepts': len(self.concepts),
                    'total_mutations': len(self.mutation_events)
                },
                'concepts': concepts_data,
                'mutation_events': self.mutation_events,
                'usage_stats': self.usage_stats,
                'phase_coherence_history': self.phase_coherence_history
            }
            
            success = safe_json_dump(ledger_data, str(self.ledger_path))
            
            if success:
                logger.debug(f"Ledger saved with {len(self.concepts)} concepts")
            else:
                logger.error("Failed to save ledger")
                
        except Exception as e:
            logger.error(f"Ledger save failed: {e}")
    
    def add_concept(self, concept_id: str, canonical_name: str, 
                   origin_type: MutationType = MutationType.EXTRACTION,
                   parent_concepts: List[str] = None,
                   metadata: Dict[str, Any] = None) -> bool:
        """Add a new concept to the ledger"""
        try:
            if concept_id in self.concepts:
                logger.warning(f"Concept {concept_id} already exists in ledger")
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
                coherence_score=0.5,  # Start with neutral coherence
                psi_phase=0.5,        # Start with neutral ψ-phase
                last_used=None,
                failure_count=0,
                metadata=metadata or {},
                lifecycle_events=[]
            )
            
            # Add creation event
            record.lifecycle_events.append({
                'event_type': 'creation',
                'timestamp': datetime.now().isoformat(),
                'origin_type': origin_type.value,
                'parent_concepts': parent_concepts or []
            })
            
            # Update parent concepts' child lists
            for parent_id in (parent_concepts or []):
                if parent_id in self.concepts:
                    self.concepts[parent_id].child_concepts.append(concept_id)
                    
                    # Add mutation event to parent
                    self.concepts[parent_id].lifecycle_events.append({
                        'event_type': 'child_created',
                        'timestamp': datetime.now().isoformat(),
                        'child_concept': concept_id,
                        'mutation_type': origin_type.value
                    })
            
            self.concepts[concept_id] = record
            
            # Record mutation event
            self.mutation_events.append({
                'event_id': f"mutation_{len(self.mutation_events)}",
                'timestamp': datetime.now().isoformat(),
                'mutation_type': origin_type.value,
                'concept_created': concept_id,
                'parent_concepts': parent_concepts or [],
                'metadata': metadata or {}
            })
            
            self._save_ledger()
            
            logger.info(f"Added concept {concept_id} ({canonical_name}) to ledger")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add concept {concept_id}: {e}")
            return False
    
    def update_usage(self, concept_id: str, success: bool = True) -> bool:
        """Update concept usage statistics"""
        try:
            if concept_id not in self.concepts:
                logger.warning(f"Concept {concept_id} not found in ledger")
                return False
            
            record = self.concepts[concept_id]
            record.usage_count += 1
            record.last_used = datetime.now()
            
            if not success:
                record.failure_count += 1
                
                # Add failure event
                record.lifecycle_events.append({
                    'event_type': 'usage_failure',
                    'timestamp': datetime.now().isoformat(),
                    'failure_count': record.failure_count
                })
            else:
                # Add success event (only log occasionally to avoid spam)
                if record.usage_count % 10 == 0:  # Log every 10th usage
                    record.lifecycle_events.append({
                        'event_type': 'usage_milestone',
                        'timestamp': datetime.now().isoformat(),
                        'usage_count': record.usage_count
                    })
            
            # Update coherence based on success/failure pattern
            self._update_concept_coherence(concept_id, success)
            
            # Update global usage stats
            if concept_id not in self.usage_stats:
                self.usage_stats[concept_id] = {'total_usage': 0, 'success_usage': 0}
            
            self.usage_stats[concept_id]['total_usage'] += 1
            if success:
                self.usage_stats[concept_id]['success_usage'] += 1
            
            # Save periodically (every 10 updates to avoid constant disk writes)
            if record.usage_count % 10 == 0:
                self._save_ledger()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update usage for {concept_id}: {e}")
            return False
    
    def _update_concept_coherence(self, concept_id: str, success: bool):
        """Update concept coherence score based on usage patterns"""
        try:
            record = self.concepts[concept_id]
            
            # Simple coherence update: increase on success, decrease on failure
            if success:
                record.coherence_score = min(1.0, record.coherence_score + 0.01)
            else:
                record.coherence_score = max(0.0, record.coherence_score - 0.05)
            
            # Update ψ-phase based on coherence and usage
            usage_factor = min(1.0, record.usage_count / 100.0)  # Normalize usage
            record.psi_phase = (record.coherence_score * 0.7) + (usage_factor * 0.3)
            
        except Exception as e:
            logger.error(f"Coherence update failed for {concept_id}: {e}")
    
    def mark_concept_stale(self, concept_id: str, stale_threshold_hours: int = 24) -> bool:
        """Mark concept as stale if not used recently"""
        try:
            if concept_id not in self.concepts:
                return False
            
            record = self.concepts[concept_id]
            
            if record.last_used:
                hours_since_use = (datetime.now() - record.last_used).total_seconds() / 3600
                
                if hours_since_use > stale_threshold_hours and record.status == ConceptStatus.ACTIVE:
                    record.status = ConceptStatus.STALE
                    
                    record.lifecycle_events.append({
                        'event_type': 'marked_stale',
                        'timestamp': datetime.now().isoformat(),
                        'hours_since_use': hours_since_use
                    })
                    
                    logger.info(f"Marked concept {concept_id} as stale ({hours_since_use:.1f} hours since use)")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to mark concept {concept_id} as stale: {e}")
            return False
    
    def get_concept_lineage(self, concept_id: str, depth: int = 3) -> Dict[str, Any]:
        """Get complete lineage for a concept (ancestors and descendants)"""
        try:
            if concept_id not in self.concepts:
                return {}
            
            def get_ancestors(cid: str, current_depth: int = 0) -> Dict[str, Any]:
                if current_depth >= depth or cid not in self.concepts:
                    return {}
                
                record = self.concepts[cid]
                ancestors = {}
                
                for parent_id in record.parent_concepts:
                    if parent_id in self.concepts:
                        ancestors[parent_id] = {
                            'name': self.concepts[parent_id].canonical_name,
                            'creation_time': self.concepts[parent_id].creation_time.isoformat(),
                            'mutation_type': self.concepts[parent_id].origin_type.value,
                            'ancestors': get_ancestors(parent_id, current_depth + 1)
                        }
                
                return ancestors
            
            def get_descendants(cid: str, current_depth: int = 0) -> Dict[str, Any]:
                if current_depth >= depth or cid not in self.concepts:
                    return {}
                
                record = self.concepts[cid]
                descendants = {}
                
                for child_id in record.child_concepts:
                    if child_id in self.concepts:
                        descendants[child_id] = {
                            'name': self.concepts[child_id].canonical_name,
                            'creation_time': self.concepts[child_id].creation_time.isoformat(),
                            'mutation_type': self.concepts[child_id].origin_type.value,
                            'descendants': get_descendants(child_id, current_depth + 1)
                        }
                
                return descendants
            
            record = self.concepts[concept_id]
            
            return {
                'concept_id': concept_id,
                'canonical_name': record.canonical_name,
                'creation_time': record.creation_time.isoformat(),
                'status': record.status.value,
                'usage_count': record.usage_count,
                'coherence_score': record.coherence_score,
                'psi_phase': record.psi_phase,
                'ancestors': get_ancestors(concept_id),
                'descendants': get_descendants(concept_id)
            }
            
        except Exception as e:
            logger.error(f"Failed to get lineage for {concept_id}: {e}")
            return {}
    
    def find_stale_concepts(self, threshold_hours: int = 24) -> List[str]:
        """Find concepts that haven't been used recently"""
        try:
            stale_concepts = []
            current_time = datetime.now()
            
            for concept_id, record in self.concepts.items():
                if record.status == ConceptStatus.ACTIVE and record.last_used:
                    hours_since_use = (current_time - record.last_used).total_seconds() / 3600
                    
                    if hours_since_use > threshold_hours:
                        stale_concepts.append(concept_id)
            
            return stale_concepts
            
        except Exception as e:
            logger.error(f"Failed to find stale concepts: {e}")
            return []
    
    def find_failing_concepts(self, failure_threshold: float = 0.3) -> List[str]:
        """Find concepts with high failure rates"""
        try:
            failing_concepts = []
            
            for concept_id, record in self.concepts.items():
                if record.usage_count > 0:
                    failure_rate = record.failure_count / record.usage_count
                    
                    if failure_rate > failure_threshold:
                        failing_concepts.append(concept_id)
            
            return failing_concepts
            
        except Exception as e:
            logger.error(f"Failed to find failing concepts: {e}")
            return []
    
    def get_top_concepts(self, by: str = "usage", limit: int = 10) -> List[Dict[str, Any]]:
        """Get top concepts by various metrics"""
        try:
            concepts_list = []
            
            for concept_id, record in self.concepts.items():
                concept_data = {
                    'concept_id': concept_id,
                    'canonical_name': record.canonical_name,
                    'usage_count': record.usage_count,
                    'coherence_score': record.coherence_score,
                    'psi_phase': record.psi_phase,
                    'status': record.status.value,
                    'creation_time': record.creation_time.isoformat()
                }
                concepts_list.append(concept_data)
            
            # Sort by requested metric
            if by == "usage":
                concepts_list.sort(key=lambda x: x['usage_count'], reverse=True)
            elif by == "coherence":
                concepts_list.sort(key=lambda x: x['coherence_score'], reverse=True)
            elif by == "psi_phase":
                concepts_list.sort(key=lambda x: x['psi_phase'], reverse=True)
            elif by == "recent":
                concepts_list.sort(key=lambda x: x['creation_time'], reverse=True)
            
            return concepts_list[:limit]
            
        except Exception as e:
            logger.error(f"Failed to get top concepts: {e}")
            return []
    
    def calculate_phase_coherence(self) -> Dict[str, float]:
        """Calculate overall ψ-phase coherence metrics"""
        try:
            if not self.concepts:
                return {}
            
            active_concepts = [r for r in self.concepts.values() if r.status == ConceptStatus.ACTIVE]
            
            if not active_concepts:
                return {}
            
            # Calculate various coherence metrics
            avg_coherence = sum(r.coherence_score for r in active_concepts) / len(active_concepts)
            avg_psi_phase = sum(r.psi_phase for r in active_concepts) / len(active_concepts)
            
            # Calculate phase variance (low variance = high harmony)
            psi_phases = [r.psi_phase for r in active_concepts]
            phase_variance = sum((p - avg_psi_phase) ** 2 for p in psi_phases) / len(psi_phases)
            phase_harmony = max(0.0, 1.0 - phase_variance)
            
            # Stale concept ratio
            stale_count = len([r for r in self.concepts.values() if r.status == ConceptStatus.STALE])
            stale_ratio = stale_count / len(self.concepts)
            
            coherence_metrics = {
                'avg_coherence': avg_coherence,
                'avg_psi_phase': avg_psi_phase,
                'phase_harmony': phase_harmony,
                'phase_variance': phase_variance,
                'stale_ratio': stale_ratio,
                'active_concepts': len(active_concepts),
                'total_concepts': len(self.concepts)
            }
            
            # Store in history
            self.phase_coherence_history.append({
                'timestamp': datetime.now().isoformat(),
                'metrics': coherence_metrics
            })
            
            # Keep only recent history
            if len(self.phase_coherence_history) > 100:
                self.phase_coherence_history = self.phase_coherence_history[-100:]
            
            return coherence_metrics
            
        except Exception as e:
            logger.error(f"Phase coherence calculation failed: {e}")
            return {}
    
    def export_lineage_tree(self, format: str = "json") -> str:
        """Export complete concept lineage as tree structure"""
        try:
            # Build tree structure
            tree_data = {
                'metadata': {
                    'export_time': datetime.now().isoformat(),
                    'total_concepts': len(self.concepts),
                    'format_version': '1.0'
                },
                'concepts': {},
                'mutation_events': self.mutation_events,
                'phase_coherence': self.phase_coherence_history[-10:] if self.phase_coherence_history else []
            }
            
            # Add all concepts with their relationships
            for concept_id, record in self.concepts.items():
                tree_data['concepts'][concept_id] = {
                    'canonical_name': record.canonical_name,
                    'status': record.status.value,
                    'origin_type': record.origin_type.value,
                    'parent_concepts': record.parent_concepts,
                    'child_concepts': record.child_concepts,
                    'usage_count': record.usage_count,
                    'coherence_score': record.coherence_score,
                    'psi_phase': record.psi_phase,
                    'creation_time': record.creation_time.isoformat(),
                    'last_used': record.last_used.isoformat() if record.last_used else None,
                    'lifecycle_events': record.lifecycle_events[-5:]  # Recent events only
                }
            
            # Save to file
            filename = f"lineage_tree_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            success = safe_json_dump(tree_data, filename)
            
            if success:
                logger.info(f"Lineage tree exported to {filename}")
                return filename
            else:
                logger.error("Failed to export lineage tree")
                return ""
                
        except Exception as e:
            logger.error(f"Lineage tree export failed: {e}")
            return ""
    
    def get_ledger_stats(self) -> Dict[str, Any]:
        """Get comprehensive ledger statistics"""
        try:
            stats = {
                'total_concepts': len(self.concepts),
                'active_concepts': len([r for r in self.concepts.values() if r.status == ConceptStatus.ACTIVE]),
                'stale_concepts': len([r for r in self.concepts.values() if r.status == ConceptStatus.STALE]),
                'synthetic_concepts': len([r for r in self.concepts.values() if r.status == ConceptStatus.SYNTHETIC]),
                'archived_concepts': len([r for r in self.concepts.values() if r.status == ConceptStatus.ARCHIVED]),
                'total_mutations': len(self.mutation_events),
                'total_usage_events': sum(r.usage_count for r in self.concepts.values()),
                'avg_coherence': 0.0,
                'avg_psi_phase': 0.0
            }
            
            if self.concepts:
                stats['avg_coherence'] = sum(r.coherence_score for r in self.concepts.values()) / len(self.concepts)
                stats['avg_psi_phase'] = sum(r.psi_phase for r in self.concepts.values()) / len(self.concepts)
            
            # Recent activity
            recent_mutations = [e for e in self.mutation_events if 
                              (datetime.now() - datetime.fromisoformat(e['timestamp'])).total_seconds() < 3600]
            stats['recent_mutations'] = len(recent_mutations)
            
            # Top concepts by usage
            stats['top_concepts'] = self.get_top_concepts(by="usage", limit=5)
            
            return stats
            
        except Exception as e:
            logger.error(f"Stats calculation failed: {e}")
            return {}

if __name__ == "__main__":
    # Phase 1 MVP Test
    def test_psi_lineage_ledger():
        print("🧪 TESTING ψ-LINEAGE LEDGER PHASE 1 MVP")
        print("=" * 50)
        
        # Initialize ledger
        ledger = PsiLineageLedger("test_psi_ledger.json")
        
        # Test 1: Add concepts
        print("\n📝 Test 1: Adding concepts")
        success1 = ledger.add_concept("concept_1", "neural-network-base", MutationType.EXTRACTION)
        success2 = ledger.add_concept("concept_2", "cognitive-reasoning", MutationType.EXTRACTION)
        print(f"Added base concepts: {success1 and success2}")
        
        # Test 2: Add synthetic concept with parents
        print("\n🧬 Test 2: Adding synthetic concept")
        success3 = ledger.add_concept("synthetic_1", "neural-cognitive-bridge", 
                                    MutationType.SYNTHESIS, 
                                    parent_concepts=["concept_1", "concept_2"])
        print(f"Added synthetic concept: {success3}")
        
        # Test 3: Update usage
        print("\n📊 Test 3: Usage tracking")
        ledger.update_usage("concept_1", success=True)
        ledger.update_usage("concept_1", success=True)
        ledger.update_usage("concept_2", success=False)
        ledger.update_usage("synthetic_1", success=True)
        print("Updated usage for all concepts")
        
        # Test 4: Get lineage
        print("\n🌳 Test 4: Concept lineage")
        lineage = ledger.get_concept_lineage("synthetic_1")
        print(f"Synthetic concept has {len(lineage.get('ancestors', {}))} ancestors")
        
        # Test 5: Statistics
        print("\n📈 Test 5: Ledger statistics")
        stats = ledger.get_ledger_stats()
        print(f"Total concepts: {stats['total_concepts']}")
        print(f"Average coherence: {stats['avg_coherence']:.3f}")
        print(f"Average ψ-phase: {stats['avg_psi_phase']:.3f}")
        
        # Test 6: Phase coherence
        print("\n🌊 Test 6: Phase coherence calculation")
        coherence = ledger.calculate_phase_coherence()
        print(f"Phase harmony: {coherence.get('phase_harmony', 0):.3f}")
        
        print("\n🎆 ψ-LINEAGE LEDGER TEST COMPLETE")
        print("✅ Concept evolution tracking operational!")
    
    test_psi_lineage_ledger()
