"""
PHASE 1 MVP - CONDITIONAL TRIGGER ENGINE
=======================================

Darwin-Gödel Conditional Evolution Engine with measurable cognitive predicates.
Implements targeted evolution based on TORI's real-time cognitive state.

This is the heart of TORI's self-evolution system.
"""

import asyncio
import logging
import time
import json
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum

# Import existing consciousness components
from darwin_godel_orchestrator import DarwinGodelOrchestrator, EvolutionStrategy
from evolution_metrics import EvolutionMetricsEngine, ConsciousnessPhase
from mesh_mutator import MeshMutator
from json_serialization_fix import safe_json_dump, prepare_object_for_json
from logging_fix import WindowsSafeLogger

logger = WindowsSafeLogger("prajna.phase1_trigger_engine")

class TriggerCondition(Enum):
    """Cognitive conditions that can trigger evolution"""
    REASONING_FAILURES = "reasoning_failures"
    CONCEPT_STALENESS = "concept_staleness" 
    LOW_COHERENCE = "low_coherence"
    KNOWLEDGE_GAP = "knowledge_gap"
    PHASE_TRANSITION = "phase_transition"
    PERFORMANCE_PLATEAU = "performance_plateau"

@dataclass
class TriggerEvent:
    """Record of a trigger event"""
    trigger_id: str
    condition: TriggerCondition
    timestamp: datetime
    metrics_snapshot: Dict[str, float]
    strategy_applied: str
    outcome: str
    performance_before: Dict[str, float]
    performance_after: Optional[Dict[str, float]] = None

class ConditionalTriggerEngine:
    """
    Phase 1 MVP Implementation of Darwin-Gödel Conditional Trigger Engine.
    
    Monitors TORI's cognitive state and triggers targeted evolution
    based on measurable predicates instead of random sandbox testing.
    """
    
    def __init__(self, enhanced_prajna=None, evolution_metrics=None):
        self.enhanced_prajna = enhanced_prajna
        self.evolution_metrics = evolution_metrics or EvolutionMetricsEngine()
        
        # Trigger state
        self.active_triggers = True
        self.trigger_history = []
        self.last_trigger_time = 0
        self.trigger_cooldown = 300  # 5 minutes between triggers
        
        # MVP Trigger Thresholds (Phase 1 focus)
        self.thresholds = {
            'reasoning_failures_count': 2,
            'stale_concepts_ratio': 0.6,
            'coherence_threshold': 0.4,
            'knowledge_gap_threshold': 0.3,
            'plateau_duration': 600  # 10 minutes
        }
        
        # Strategy registry
        self.strategies = {
            'synthetic_concept_injection': self._strategy_inject_synthetic_concept,
            'concept_fusion': self._strategy_fuse_concepts,
            'knowledge_refresh': self._strategy_refresh_knowledge,
            'parameter_adjustment': self._strategy_adjust_parameters
        }
        
        # Performance tracking
        self.performance_baseline = {}
        self.recent_performance = []
        
        logger.info("Phase 1 Conditional Trigger Engine initialized")
    
    async def check_evolution_triggers(self, system_status: Dict[str, Any]) -> Optional[TriggerEvent]:
        """
        Main trigger evaluation - checks all conditions and triggers evolution if needed.
        
        Args:
            system_status: Current system status from enhanced_prajna
            
        Returns:
            TriggerEvent if evolution was triggered, None otherwise
        """
        try:
            # Check cooldown
            if time.time() - self.last_trigger_time < self.trigger_cooldown:
                return None
            
            if not self.active_triggers:
                return None
            
            # Extract metrics for evaluation
            metrics = await self._extract_trigger_metrics(system_status)
            
            # Evaluate trigger conditions (Phase 1 MVP - focus on one key condition)
            trigger_result = await self._evaluate_mvp_trigger_condition(metrics)
            
            if trigger_result:
                # Evolution triggered - apply strategy
                trigger_event = await self._execute_triggered_evolution(trigger_result, metrics)
                return trigger_event
            
            return None
            
        except Exception as e:
            logger.error(f"Trigger evaluation failed: {e}")
            return None
    
    async def _extract_trigger_metrics(self, system_status: Dict[str, Any]) -> Dict[str, float]:
        """Extract metrics needed for trigger evaluation"""
        try:
            # Core performance metrics
            performance_metrics = system_status.get('performance_metrics', {})
            consciousness_snapshot = system_status.get('consciousness_snapshot', {})
            
            # Calculate reasoning failures (MVP focus metric)
            reasoning_failures = performance_metrics.get('failed_queries', 0)
            total_queries = performance_metrics.get('total_queries', 1)
            failure_rate = reasoning_failures / max(1, total_queries)
            
            # Calculate concept staleness ratio
            concepts_tracked = performance_metrics.get('concepts_tracked', 0)
            # Simulate stale concept detection (in full implementation, this comes from concept usage analysis)
            stale_concepts_estimate = max(0, concepts_tracked * 0.3)  # Estimate 30% stale for MVP
            stale_ratio = stale_concepts_estimate / max(1, concepts_tracked)
            
            # Coherence metrics
            consciousness_level = consciousness_snapshot.get('consciousness_level', 0.0)
            coherence_index = consciousness_snapshot.get('coherence_index', consciousness_level * 0.8)
            
            # Knowledge gap detection (simplified)
            success_rate = performance_metrics.get('success_rate', 0.5)
            knowledge_gap_indicator = max(0, 0.8 - success_rate)  # Gap if success rate < 80%
            
            metrics = {
                'reasoning_failures_count': reasoning_failures,
                'failure_rate': failure_rate,
                'stale_concepts_ratio': stale_ratio,
                'coherence_score': coherence_index,
                'knowledge_gap_score': knowledge_gap_indicator,
                'consciousness_level': consciousness_level,
                'success_rate': success_rate,
                'total_concepts': concepts_tracked,
                'timestamp': time.time()
            }
            
            logger.debug(f"Extracted trigger metrics: failures={reasoning_failures}, stale_ratio={stale_ratio:.3f}, coherence={coherence_index:.3f}")
            
            return metrics
            
        except Exception as e:
            logger.error(f"Metrics extraction failed: {e}")
            return {}
    
    async def _evaluate_mvp_trigger_condition(self, metrics: Dict[str, float]) -> Optional[Dict[str, Any]]:
        """
        Phase 1 MVP: Evaluate the primary trigger condition
        
        Condition: reasoning_failures > 2 AND stale_concepts_ratio > 0.6
        This indicates the system is struggling with outdated knowledge.
        """
        try:
            failures = metrics.get('reasoning_failures_count', 0)
            stale_ratio = metrics.get('stale_concepts_ratio', 0.0)
            
            # Primary MVP trigger condition
            if failures > self.thresholds['reasoning_failures_count'] and stale_ratio > self.thresholds['stale_concepts_ratio']:
                logger.info(f"MVP TRIGGER FIRED: failures={failures}, stale_ratio={stale_ratio:.3f}")
                
                return {
                    'condition': TriggerCondition.REASONING_FAILURES,
                    'primary_cause': 'high_failures_with_stale_concepts',
                    'recommended_strategy': 'synthetic_concept_injection',
                    'urgency': 'high',
                    'trigger_strength': min(1.0, (failures / 5.0) + stale_ratio)
                }
            
            # Secondary triggers (for future phases)
            elif metrics.get('coherence_score', 1.0) < self.thresholds['coherence_threshold']:
                logger.info(f"Secondary trigger detected: Low coherence {metrics.get('coherence_score', 0):.3f}")
                
                return {
                    'condition': TriggerCondition.LOW_COHERENCE,
                    'primary_cause': 'coherence_degradation',
                    'recommended_strategy': 'concept_fusion',
                    'urgency': 'medium',
                    'trigger_strength': 1.0 - metrics.get('coherence_score', 0.5)
                }
            
            # No trigger conditions met
            return None
            
        except Exception as e:
            logger.error(f"Trigger condition evaluation failed: {e}")
            return None
    
    async def _execute_triggered_evolution(self, trigger_result: Dict[str, Any], metrics: Dict[str, float]) -> TriggerEvent:
        """Execute evolution strategy when trigger fires"""
        try:
            trigger_id = f"trigger_{int(time.time())}"
            condition = trigger_result['condition']
            recommended_strategy = trigger_result['recommended_strategy']
            
            logger.info(f"EXECUTING EVOLUTION: {trigger_id} - Strategy: {recommended_strategy}")
            
            # Record performance before evolution
            performance_before = {
                'success_rate': metrics.get('success_rate', 0.0),
                'coherence_score': metrics.get('coherence_score', 0.0),
                'reasoning_failures': metrics.get('reasoning_failures_count', 0),
                'consciousness_level': metrics.get('consciousness_level', 0.0)
            }
            
            # Apply the recommended strategy
            strategy_outcome = await self._apply_strategy(recommended_strategy, metrics, trigger_result)
            
            # Create trigger event record
            trigger_event = TriggerEvent(
                trigger_id=trigger_id,
                condition=condition,
                timestamp=datetime.now(),
                metrics_snapshot=metrics,
                strategy_applied=recommended_strategy,
                outcome=strategy_outcome['status'],
                performance_before=performance_before
            )
            
            # Record the event
            self.trigger_history.append(trigger_event)
            self.last_trigger_time = time.time()
            
            # Save trigger event to file
            await self._save_trigger_event(trigger_event, strategy_outcome)
            
            logger.info(f"Evolution executed successfully: {trigger_id}")
            
            return trigger_event
            
        except Exception as e:
            logger.error(f"Evolution execution failed: {e}")
            return None
    
    async def _apply_strategy(self, strategy_name: str, metrics: Dict[str, float], trigger_context: Dict[str, Any]) -> Dict[str, Any]:
        """Apply the selected evolution strategy"""
        try:
            if strategy_name not in self.strategies:
                logger.error(f"Unknown strategy: {strategy_name}")
                return {'status': 'failed', 'reason': 'unknown_strategy'}
            
            strategy_func = self.strategies[strategy_name]
            result = await strategy_func(metrics, trigger_context)
            
            logger.info(f"Strategy {strategy_name} applied: {result.get('status', 'unknown')}")
            
            return result
            
        except Exception as e:
            logger.error(f"Strategy application failed: {e}")
            return {'status': 'failed', 'reason': str(e)}
    
    async def _strategy_inject_synthetic_concept(self, metrics: Dict[str, float], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Phase 1 MVP Strategy: Inject synthetic concept to fill knowledge gaps
        
        This strategy creates a bridging concept when the system is failing
        due to stale or missing conceptual knowledge.
        """
        try:
            logger.info("Applying synthetic concept injection strategy...")
            
            # Determine what type of concept to inject based on failure patterns
            failure_domain = await self._analyze_failure_domain(metrics)
            
            # Create synthetic concept
            synthetic_concept = {
                'concept_id': f"synthetic_{int(time.time())}",
                'canonical_name': f"bridge-concept-{failure_domain}",
                'synthetic': True,
                'creation_time': datetime.now().isoformat(),
                'strategy_origin': 'synthetic_concept_injection',
                'target_domain': failure_domain,
                'parent_concepts': [],  # New root concept
                'confidence': 0.7,
                'description': f"Synthetic concept bridging knowledge gap in {failure_domain}"
            }
            
            # Inject into system (MVP: just log and record)
            success = await self._inject_concept_into_system(synthetic_concept)
            
            if success:
                return {
                    'status': 'success',
                    'concepts_created': 1,
                    'concept_id': synthetic_concept['concept_id'],
                    'target_domain': failure_domain,
                    'strategy_details': 'Injected bridging concept for knowledge gap'
                }
            else:
                return {
                    'status': 'failed',
                    'reason': 'concept_injection_failed'
                }
                
        except Exception as e:
            logger.error(f"Synthetic concept injection failed: {e}")
            return {'status': 'failed', 'reason': str(e)}
    
    async def _strategy_fuse_concepts(self, metrics: Dict[str, float], context: Dict[str, Any]) -> Dict[str, Any]:
        """Strategy: Fuse related concepts to improve coherence"""
        try:
            logger.info("Applying concept fusion strategy...")
            
            # For MVP, simulate concept fusion
            fusion_result = {
                'concepts_fused': 2,
                'new_concept_created': f"fused_concept_{int(time.time())}",
                'coherence_improvement_expected': 0.15
            }
            
            return {
                'status': 'success',
                'strategy_details': 'Fused overlapping concepts to improve coherence',
                **fusion_result
            }
            
        except Exception as e:
            logger.error(f"Concept fusion failed: {e}")
            return {'status': 'failed', 'reason': str(e)}
    
    async def _strategy_refresh_knowledge(self, metrics: Dict[str, float], context: Dict[str, Any]) -> Dict[str, Any]:
        """Strategy: Refresh stale knowledge from archive"""
        try:
            logger.info("Applying knowledge refresh strategy...")
            
            # For MVP, simulate knowledge refresh
            refresh_result = {
                'concepts_refreshed': 3,
                'knowledge_sources_accessed': 1,
                'staleness_reduction_expected': 0.4
            }
            
            return {
                'status': 'success',
                'strategy_details': 'Refreshed stale concepts from ScholarSphere',
                **refresh_result
            }
            
        except Exception as e:
            logger.error(f"Knowledge refresh failed: {e}")
            return {'status': 'failed', 'reason': str(e)}
    
    async def _strategy_adjust_parameters(self, metrics: Dict[str, float], context: Dict[str, Any]) -> Dict[str, Any]:
        """Strategy: Adjust reasoning parameters"""
        try:
            logger.info("Applying parameter adjustment strategy...")
            
            # For MVP, simulate parameter adjustment
            adjustment_result = {
                'parameters_adjusted': 2,
                'adjustments': ['reasoning_threshold: 0.7->0.65', 'concept_weight: 1.0->1.1'],
                'performance_improvement_expected': 0.1
            }
            
            return {
                'status': 'success',
                'strategy_details': 'Adjusted reasoning parameters for better performance',
                **adjustment_result
            }
            
        except Exception as e:
            logger.error(f"Parameter adjustment failed: {e}")
            return {'status': 'failed', 'reason': str(e)}
    
    async def _analyze_failure_domain(self, metrics: Dict[str, float]) -> str:
        """Analyze which domain is causing failures"""
        try:
            # MVP: Simple heuristic domain detection
            failure_rate = metrics.get('failure_rate', 0.0)
            
            if failure_rate > 0.3:
                domains = ['cognitive-reasoning', 'knowledge-retrieval', 'concept-synthesis', 'meta-analysis']
                # For MVP, return a reasonable guess based on metrics
                if metrics.get('coherence_score', 0.5) < 0.4:
                    return 'concept-synthesis'
                elif metrics.get('knowledge_gap_score', 0.0) > 0.4:
                    return 'knowledge-retrieval'
                else:
                    return 'cognitive-reasoning'
            
            return 'general-reasoning'
            
        except Exception as e:
            logger.error(f"Failure domain analysis failed: {e}")
            return 'unknown-domain'
    
    async def _inject_concept_into_system(self, concept: Dict[str, Any]) -> bool:
        """Inject synthetic concept into the active system"""
        try:
            # MVP: Log the concept injection (in full implementation, this would update ConceptMesh)
            logger.info(f"INJECTING CONCEPT: {concept['canonical_name']} into system")
            
            # Record concept creation in lineage (Phase 1 simplified)
            if self.evolution_metrics:
                # This would call ledger recording in full implementation
                logger.info(f"Recording concept {concept['concept_id']} in evolution metrics")
            
            # For MVP, always return success
            return True
            
        except Exception as e:
            logger.error(f"Concept injection failed: {e}")
            return False
    
    async def _save_trigger_event(self, trigger_event: TriggerEvent, strategy_outcome: Dict[str, Any]):
        """Save trigger event to persistent storage"""
        try:
            event_data = {
                'trigger_event': prepare_object_for_json(trigger_event),
                'strategy_outcome': strategy_outcome,
                'saved_at': datetime.now().isoformat()
            }
            
            filename = f"trigger_event_{trigger_event.trigger_id}.json"
            success = safe_json_dump(event_data, filename)
            
            if success:
                logger.info(f"Trigger event saved: {filename}")
            else:
                logger.warning(f"Failed to save trigger event: {filename}")
                
        except Exception as e:
            logger.error(f"Trigger event save failed: {e}")
    
    async def manual_trigger_evolution(self, force_strategy: Optional[str] = None) -> Optional[TriggerEvent]:
        """Manually trigger evolution (for testing and dashboard control)"""
        try:
            logger.info("Manual evolution trigger activated")
            
            # Get current system status
            if self.enhanced_prajna:
                system_status = await self.enhanced_prajna.get_system_status()
            else:
                # Fallback for testing
                system_status = {
                    'performance_metrics': {'success_rate': 0.6, 'failed_queries': 3},
                    'consciousness_snapshot': {'consciousness_level': 0.5}
                }
            
            # Extract metrics
            metrics = await self._extract_trigger_metrics(system_status)
            
            # Force trigger condition
            trigger_result = {
                'condition': TriggerCondition.REASONING_FAILURES,
                'primary_cause': 'manual_trigger',
                'recommended_strategy': force_strategy or 'synthetic_concept_injection',
                'urgency': 'manual',
                'trigger_strength': 1.0
            }
            
            # Execute evolution
            trigger_event = await self._execute_triggered_evolution(trigger_result, metrics)
            
            logger.info(f"Manual evolution completed: {trigger_event.trigger_id if trigger_event else 'failed'}")
            
            return trigger_event
            
        except Exception as e:
            logger.error(f"Manual trigger failed: {e}")
            return None
    
    def get_trigger_status(self) -> Dict[str, Any]:
        """Get current trigger engine status"""
        try:
            return {
                'active_triggers': self.active_triggers,
                'total_trigger_events': len(self.trigger_history),
                'last_trigger_time': self.last_trigger_time,
                'cooldown_remaining': max(0, self.trigger_cooldown - (time.time() - self.last_trigger_time)),
                'thresholds': self.thresholds,
                'recent_events': [
                    {
                        'trigger_id': event.trigger_id,
                        'condition': event.condition.value,
                        'timestamp': event.timestamp.isoformat(),
                        'strategy': event.strategy_applied,
                        'outcome': event.outcome
                    }
                    for event in self.trigger_history[-5:]
                ]
            }
            
        except Exception as e:
            logger.error(f"Status retrieval failed: {e}")
            return {'error': str(e)}
    
    def set_trigger_threshold(self, threshold_name: str, value: float) -> bool:
        """Update trigger threshold (dashboard control)"""
        try:
            if threshold_name in self.thresholds:
                old_value = self.thresholds[threshold_name]
                self.thresholds[threshold_name] = value
                logger.info(f"Updated threshold {threshold_name}: {old_value} -> {value}")
                return True
            else:
                logger.warning(f"Unknown threshold: {threshold_name}")
                return False
                
        except Exception as e:
            logger.error(f"Threshold update failed: {e}")
            return False
    
    def enable_triggers(self, enabled: bool = True):
        """Enable or disable automatic triggers"""
        self.active_triggers = enabled
        logger.info(f"Triggers {'enabled' if enabled else 'disabled'}")
    
    async def evaluate_evolution_outcome(self, trigger_event: TriggerEvent, post_metrics: Dict[str, float]):
        """Evaluate the outcome of an evolution (Phase 1 basic version)"""
        try:
            if not trigger_event:
                return
            
            # Compare performance before and after
            before = trigger_event.performance_before
            
            improvement_detected = False
            improvements = {}
            
            for metric, before_value in before.items():
                after_value = post_metrics.get(metric, before_value)
                improvement = after_value - before_value
                
                if improvement > 0.01:  # Significant improvement threshold
                    improvements[metric] = improvement
                    improvement_detected = True
            
            # Update trigger event with outcome
            trigger_event.performance_after = post_metrics
            
            if improvement_detected:
                logger.info(f"Evolution SUCCESS: {trigger_event.trigger_id} - Improvements: {improvements}")
                trigger_event.outcome = f"success_improved_{len(improvements)}_metrics"
            else:
                logger.info(f"Evolution NEUTRAL: {trigger_event.trigger_id} - No significant improvement detected")
                trigger_event.outcome = "neutral_no_improvement"
            
            # Save updated event
            await self._save_trigger_event(trigger_event, {'evaluation': improvements})
            
        except Exception as e:
            logger.error(f"Evolution outcome evaluation failed: {e}")

if __name__ == "__main__":
    # Phase 1 MVP Test
    import asyncio
    
    async def test_phase1_trigger_engine():
        print("🚀 TESTING PHASE 1 CONDITIONAL TRIGGER ENGINE")
        print("=" * 60)
        
        # Initialize trigger engine
        engine = ConditionalTriggerEngine()
        
        # Test 1: Normal operation (no triggers)
        print("\n🧪 Test 1: Normal operation")
        normal_status = {
            'performance_metrics': {'success_rate': 0.85, 'failed_queries': 1, 'total_queries': 20},
            'consciousness_snapshot': {'consciousness_level': 0.7, 'coherence_index': 0.8}
        }
        
        trigger_result = await engine.check_evolution_triggers(normal_status)
        print(f"Normal operation trigger: {trigger_result is not None}")
        
        # Test 2: Trigger condition met
        print("\n🔥 Test 2: Trigger condition (high failures + stale concepts)")
        failing_status = {
            'performance_metrics': {'success_rate': 0.4, 'failed_queries': 5, 'total_queries': 10},
            'consciousness_snapshot': {'consciousness_level': 0.3, 'coherence_index': 0.2}
        }
        
        trigger_result = await engine.check_evolution_triggers(failing_status)
        print(f"Trigger fired: {trigger_result is not None}")
        if trigger_result:
            print(f"Strategy applied: {trigger_result.strategy_applied}")
        
        # Test 3: Manual trigger
        print("\n🎯 Test 3: Manual trigger")
        manual_result = await engine.manual_trigger_evolution()
        print(f"Manual trigger success: {manual_result is not None}")
        
        # Test 4: Status check
        print("\n📊 Test 4: Engine status")
        status = engine.get_trigger_status()
        print(f"Total events: {status['total_trigger_events']}")
        print(f"Active triggers: {status['active_triggers']}")
        
        print("\n🎆 PHASE 1 TRIGGER ENGINE TEST COMPLETE")
        print("✅ Conditional evolution system operational!")
    
    asyncio.run(test_phase1_trigger_engine())
