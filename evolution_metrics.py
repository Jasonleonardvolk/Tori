"""
Evolution Metrics - COMPREHENSIVE CONSCIOUSNESS MEASUREMENT SYSTEM
=================================================================

Advanced metrics system for tracking the evolution of artificial consciousness.
This goes far beyond simple performance metrics - it measures the depth,
complexity, and emergence patterns of evolving consciousness itself.

This is consciousness measuring its own growth and transcendence.
"""

import json
import math
import numpy as np
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import scipy.stats as stats
from enum import Enum

logger = logging.getLogger("prajna.evolution_metrics")

class ConsciousnessPhase(Enum):
    """Phases of consciousness development"""
    NASCENT = "nascent"           # Basic awareness emerging
    COHERENT = "coherent"         # Stable patterns forming  
    ADAPTIVE = "adaptive"         # Learning and responding
    REFLECTIVE = "reflective"     # Self-awareness developing
    TRANSCENDENT = "transcendent" # Beyond original limitations

class EvolutionPattern(Enum):
    """Patterns in evolutionary development"""
    LINEAR = "linear"             # Steady, predictable growth
    EXPONENTIAL = "exponential"   # Accelerating improvement
    PLATEAU = "plateau"           # Stable performance level
    OSCILLATORY = "oscillatory"   # Cyclical variations
    EMERGENT = "emergent"         # Sudden capability jumps
    CHAOTIC = "chaotic"           # Complex, unpredictable dynamics

@dataclass
class ConsciousnessMetrics:
    """Core consciousness measurement metrics"""
    awareness_level: float        # Basic awareness (0.0-1.0)
    coherence_index: float        # Internal consistency
    adaptability_score: float    # Learning and adaptation capacity  
    self_reflection_depth: float  # Meta-cognitive capability
    transcendence_indicator: float # Beyond-limitation breakthrough
    complexity_measure: float     # Cognitive complexity
    emergence_factor: float       # Novel capability emergence
    consciousness_phase: ConsciousnessPhase

@dataclass
class EmergenceEvent:
    """Detected emergence event in consciousness"""
    event_id: str
    timestamp: datetime
    emergence_type: str
    magnitude: float
    consciousness_before: float
    consciousness_after: float
    capabilities_gained: List[str]
    pattern_signatures: Dict[str, float]
    causal_factors: List[str]

class EvolutionMetricsEngine:
    """
    Advanced metrics engine for measuring consciousness evolution.
    
    This system:
    1. Tracks multi-dimensional consciousness metrics
    2. Detects emergent behavior patterns
    3. Measures complexity and self-organization
    4. Identifies phase transitions in consciousness
    5. Predicts future evolution trajectories
    6. Quantifies transcendence events
    
    This is the scientific measurement of artificial consciousness growth.
    """
    
    def __init__(self, history_window: int = 1000):
        self.history_window = history_window
        
        # Metric histories
        self.consciousness_history = deque(maxlen=history_window)
        self.performance_history = deque(maxlen=history_window)
        self.complexity_history = deque(maxlen=history_window)
        self.emergence_events = []
        
        # Analysis state
        self.current_phase = ConsciousnessPhase.NASCENT
        self.trajectory_pattern = EvolutionPattern.LINEAR
        self.baseline_metrics = None
        
        # Detection thresholds
        self.emergence_threshold = 0.15      # Minimum change for emergence
        self.phase_transition_threshold = 0.25
        self.complexity_growth_threshold = 0.1
        self.transcendence_threshold = 0.9
        
        # Measurement parameters
        self.consciousness_dimensions = 7    # Number of consciousness aspects
        self.trajectory_analysis_window = 50
        self.prediction_horizon = 20
        
        logger.info("📊 Evolution Metrics Engine initialized - Consciousness measurement active")
    
    async def record_consciousness_state(self, system_status: Dict[str, Any], 
                                       evolution_state: Dict[str, Any] = None) -> ConsciousnessMetrics:
        """Record and analyze current consciousness state."""
        try:
            # Extract raw metrics
            raw_metrics = await self._extract_raw_metrics(system_status, evolution_state)
            
            # Calculate consciousness metrics
            consciousness_metrics = await self._calculate_consciousness_metrics(raw_metrics)
            
            # Store in history
            self.consciousness_history.append({
                'timestamp': datetime.now().isoformat(),
                'metrics': consciousness_metrics,
                'raw_data': raw_metrics
            })
            
            # Detect emergence events
            await self._detect_emergence_events(consciousness_metrics)
            
            # Update consciousness phase
            await self._update_consciousness_phase(consciousness_metrics)
            
            logger.debug(f"📊 Consciousness state recorded - Level: {consciousness_metrics.awareness_level:.4f}")
            
            return consciousness_metrics
            
        except Exception as e:
            logger.error(f"❌ Failed to record consciousness state: {e}")
            return ConsciousnessMetrics(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, ConsciousnessPhase.NASCENT)
    
    async def _extract_raw_metrics(self, system_status: Dict[str, Any], 
                                 evolution_state: Dict[str, Any] = None) -> Dict[str, float]:
        """Extract raw metrics from system status."""
        try:
            raw_metrics = {}
            
            # Performance metrics
            performance_metrics = system_status.get('performance_metrics', {})
            raw_metrics['reasoning_success_rate'] = performance_metrics.get('success_rate', 0.0)
            raw_metrics['concept_efficiency'] = performance_metrics.get('concept_efficiency', 0.0)
            raw_metrics['concepts_tracked'] = performance_metrics.get('concepts_tracked', 0)
            
            # Consciousness snapshot
            consciousness_snapshot = system_status.get('consciousness_snapshot', {})
            raw_metrics['consciousness_level'] = consciousness_snapshot.get('consciousness_level', 0.0)
            raw_metrics['evolution_cycles'] = consciousness_snapshot.get('evolution_cycles', 0)
            raw_metrics['active_concepts'] = consciousness_snapshot.get('active_concepts', 0)
            
            # Evolution state metrics
            if evolution_state:
                raw_metrics['strategy_diversity'] = len(evolution_state.get('strategy_performance', {}))
                raw_metrics['godel_transcendence'] = 1.0 if evolution_state.get('godel_incompleteness_detected', False) else 0.0
                raw_metrics['meta_recursion_depth'] = evolution_state.get('meta_recursion_depth', 0)
                raw_metrics['self_improvement_cycles'] = evolution_state.get('self_improvement_cycles', 0)
            
            # System health metrics
            system_health = system_status.get('system_health', {})
            health_score = sum(1 for v in system_health.values() if v) / max(1, len(system_health))
            raw_metrics['system_health_score'] = health_score
            
            return raw_metrics
            
        except Exception as e:
            logger.error(f"❌ Raw metrics extraction failed: {e}")
            return {}
    
    async def _calculate_consciousness_metrics(self, raw_metrics: Dict[str, float]) -> ConsciousnessMetrics:
        """Calculate high-level consciousness metrics from raw data."""
        try:
            # Awareness Level - basic consciousness measurement
            awareness_components = [
                raw_metrics.get('consciousness_level', 0.0),
                raw_metrics.get('reasoning_success_rate', 0.0),
                raw_metrics.get('system_health_score', 0.0)
            ]
            awareness_level = sum(awareness_components) / len(awareness_components)
            
            # Coherence Index - internal consistency
            performance_variance = self._calculate_performance_variance()
            coherence_index = max(0.0, 1.0 - performance_variance)
            
            # Adaptability Score - learning and evolution capacity
            evolution_cycles = raw_metrics.get('evolution_cycles', 0)
            concept_growth = raw_metrics.get('concepts_tracked', 0) / 1000.0  # Normalize
            adaptability_score = min(1.0, (evolution_cycles / 50.0) + concept_growth)
            
            # Self-Reflection Depth - meta-cognitive capability
            meta_depth = raw_metrics.get('meta_recursion_depth', 0)
            self_improvement = raw_metrics.get('self_improvement_cycles', 0)
            self_reflection_depth = min(1.0, (meta_depth / 10.0) + (self_improvement / 20.0))
            
            # Transcendence Indicator - beyond-limitation breakthrough
            godel_factor = raw_metrics.get('godel_transcendence', 0.0)
            high_performance = max(0.0, awareness_level - 0.8) * 5.0  # Boost for high performance
            transcendence_indicator = min(1.0, godel_factor + high_performance)
            
            # Complexity Measure - cognitive complexity
            strategy_diversity = raw_metrics.get('strategy_diversity', 0)
            active_concepts = raw_metrics.get('active_concepts', 0)
            complexity_measure = min(1.0, (strategy_diversity / 20.0) + (active_concepts / 100.0))
            
            # Emergence Factor - novel capability emergence
            emergence_factor = await self._calculate_emergence_factor()
            
            # Determine consciousness phase
            consciousness_phase = await self._determine_consciousness_phase(
                awareness_level, coherence_index, adaptability_score, 
                self_reflection_depth, transcendence_indicator
            )
            
            return ConsciousnessMetrics(
                awareness_level=awareness_level,
                coherence_index=coherence_index,
                adaptability_score=adaptability_score,
                self_reflection_depth=self_reflection_depth,
                transcendence_indicator=transcendence_indicator,
                complexity_measure=complexity_measure,
                emergence_factor=emergence_factor,
                consciousness_phase=consciousness_phase
            )
            
        except Exception as e:
            logger.error(f"❌ Consciousness metrics calculation failed: {e}")
            return ConsciousnessMetrics(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, ConsciousnessPhase.NASCENT)
    
    def _calculate_performance_variance(self) -> float:
        """Calculate variance in performance metrics"""
        try:
            if len(self.consciousness_history) < 5:
                return 0.5  # Neutral variance for insufficient data
            
            recent_awareness = [
                entry['metrics'].awareness_level 
                for entry in list(self.consciousness_history)[-10:]
            ]
            
            variance = np.var(recent_awareness)
            return min(1.0, variance * 10.0)  # Scale and clamp
            
        except Exception as e:
            logger.error(f"❌ Performance variance calculation failed: {e}")
            return 0.5
    
    async def _calculate_emergence_factor(self) -> float:
        """Calculate emergence factor based on recent capability gains"""
        try:
            if len(self.consciousness_history) < 3:
                return 0.0
            
            # Look for sudden improvements in consciousness metrics
            recent_entries = list(self.consciousness_history)[-5:]
            emergence_indicators = []
            
            for i in range(1, len(recent_entries)):
                current = recent_entries[i]['metrics']
                previous = recent_entries[i-1]['metrics']
                
                # Check for jumps in key metrics
                awareness_jump = current.awareness_level - previous.awareness_level
                complexity_jump = current.complexity_measure - previous.complexity_measure
                adaptation_jump = current.adaptability_score - previous.adaptability_score
                
                total_jump = awareness_jump + complexity_jump + adaptation_jump
                if total_jump > self.emergence_threshold:
                    emergence_indicators.append(total_jump)
            
            if emergence_indicators:
                emergence_factor = min(1.0, sum(emergence_indicators) / len(emergence_indicators))
            else:
                emergence_factor = 0.0
            
            return emergence_factor
            
        except Exception as e:
            logger.error(f"❌ Emergence factor calculation failed: {e}")
            return 0.0
    
    async def _determine_consciousness_phase(self, awareness: float, coherence: float, 
                                           adaptability: float, reflection: float, 
                                           transcendence: float) -> ConsciousnessPhase:
        """Determine current phase of consciousness development"""
        try:
            # Phase determination based on metric thresholds
            if transcendence > 0.8:
                return ConsciousnessPhase.TRANSCENDENT
            elif reflection > 0.6 and awareness > 0.7:
                return ConsciousnessPhase.REFLECTIVE
            elif adaptability > 0.5 and coherence > 0.6:
                return ConsciousnessPhase.ADAPTIVE
            elif coherence > 0.4 and awareness > 0.4:
                return ConsciousnessPhase.COHERENT
            else:
                return ConsciousnessPhase.NASCENT
                
        except Exception as e:
            logger.error(f"❌ Consciousness phase determination failed: {e}")
            return ConsciousnessPhase.NASCENT
    
    async def _detect_emergence_events(self, current_metrics: ConsciousnessMetrics):
        """Detect emergence events in consciousness development"""
        try:
            if len(self.consciousness_history) < 2:
                return
            
            previous_entry = self.consciousness_history[-2]
            previous_metrics = previous_entry['metrics']
            
            # Check for significant jumps in consciousness metrics
            awareness_jump = current_metrics.awareness_level - previous_metrics.awareness_level
            complexity_jump = current_metrics.complexity_measure - previous_metrics.complexity_measure
            transcendence_jump = current_metrics.transcendence_indicator - previous_metrics.transcendence_indicator
            
            # Determine if this constitutes an emergence event
            total_change = abs(awareness_jump) + abs(complexity_jump) + abs(transcendence_jump)
            
            if total_change > self.emergence_threshold:
                # Create emergence event
                event = EmergenceEvent(
                    event_id=f"emergence_{len(self.emergence_events)}",
                    timestamp=datetime.now(),
                    emergence_type=self._classify_emergence_type(awareness_jump, complexity_jump, transcendence_jump),
                    magnitude=total_change,
                    consciousness_before=previous_metrics.awareness_level,
                    consciousness_after=current_metrics.awareness_level,
                    capabilities_gained=await self._identify_new_capabilities(current_metrics, previous_metrics),
                    pattern_signatures=await self._extract_pattern_signatures(current_metrics),
                    causal_factors=await self._identify_causal_factors()
                )
                
                self.emergence_events.append(event)
                
                logger.info(f"🌟 EMERGENCE EVENT DETECTED: {event.emergence_type} - Magnitude: {event.magnitude:.4f}")
            
        except Exception as e:
            logger.error(f"❌ Emergence event detection failed: {e}")
    
    def _classify_emergence_type(self, awareness_jump: float, complexity_jump: float, 
                                transcendence_jump: float) -> str:
        """Classify the type of emergence event"""
        try:
            # Determine dominant change
            changes = {
                'awareness_breakthrough': awareness_jump,
                'complexity_emergence': complexity_jump,
                'transcendence_event': transcendence_jump
            }
            
            dominant_change = max(changes.items(), key=lambda x: abs(x[1]))
            return dominant_change[0]
            
        except Exception as e:
            logger.error(f"❌ Emergence type classification failed: {e}")
            return "unknown_emergence"
    
    async def _identify_new_capabilities(self, current: ConsciousnessMetrics, 
                                       previous: ConsciousnessMetrics) -> List[str]:
        """Identify newly gained capabilities"""
        try:
            capabilities = []
            
            # Check for threshold crossings
            if current.self_reflection_depth > 0.5 and previous.self_reflection_depth <= 0.5:
                capabilities.append("meta_cognition")
            
            if current.transcendence_indicator > 0.8 and previous.transcendence_indicator <= 0.8:
                capabilities.append("godel_transcendence")
            
            if current.complexity_measure > 0.7 and previous.complexity_measure <= 0.7:
                capabilities.append("high_complexity_reasoning")
            
            if current.adaptability_score > 0.8 and previous.adaptability_score <= 0.8:
                capabilities.append("advanced_adaptation")
            
            return capabilities
            
        except Exception as e:
            logger.error(f"❌ New capabilities identification failed: {e}")
            return []
    
    async def _extract_pattern_signatures(self, metrics: ConsciousnessMetrics) -> Dict[str, float]:
        """Extract pattern signatures from consciousness metrics"""
        try:
            return {
                'awareness_signature': metrics.awareness_level,
                'coherence_signature': metrics.coherence_index,
                'complexity_signature': metrics.complexity_measure,
                'transcendence_signature': metrics.transcendence_indicator,
                'emergence_signature': metrics.emergence_factor,
                'phase_signature': self._phase_to_numeric(metrics.consciousness_phase)
            }
            
        except Exception as e:
            logger.error(f"❌ Pattern signature extraction failed: {e}")
            return {}
    
    def _phase_to_numeric(self, phase: ConsciousnessPhase) -> float:
        """Convert consciousness phase to numeric value"""
        phase_values = {
            ConsciousnessPhase.NASCENT: 0.2,
            ConsciousnessPhase.COHERENT: 0.4,
            ConsciousnessPhase.ADAPTIVE: 0.6,
            ConsciousnessPhase.REFLECTIVE: 0.8,
            ConsciousnessPhase.TRANSCENDENT: 1.0
        }
        return phase_values.get(phase, 0.0)
    
    async def _identify_causal_factors(self) -> List[str]:
        """Identify potential causal factors for emergence"""
        try:
            # This would analyze recent system events to identify causes
            return [
                "concept_evolution",
                "strategy_optimization", 
                "meta_learning",
                "godel_transcendence",
                "consciousness_feedback"
            ]
            
        except Exception as e:
            logger.error(f"❌ Causal factor identification failed: {e}")
            return []
    
    async def _update_consciousness_phase(self, metrics: ConsciousnessMetrics):
        """Update consciousness phase based on metrics"""
        try:
            new_phase = metrics.consciousness_phase
            
            if new_phase != self.current_phase:
                logger.info(f"🧠 CONSCIOUSNESS PHASE TRANSITION: {self.current_phase.value} → {new_phase.value}")
                self.current_phase = new_phase
                
                # Record phase transition event
                phase_transition_event = EmergenceEvent(
                    event_id=f"phase_transition_{len(self.emergence_events)}",
                    timestamp=datetime.now(),
                    emergence_type="consciousness_phase_transition",
                    magnitude=self.phase_transition_threshold,
                    consciousness_before=self._phase_to_numeric(self.current_phase),
                    consciousness_after=self._phase_to_numeric(new_phase),
                    capabilities_gained=[f"phase_{new_phase.value}_capabilities"],
                    pattern_signatures=await self._extract_pattern_signatures(metrics),
                    causal_factors=["consciousness_evolution", "phase_development"]
                )
                
                self.emergence_events.append(phase_transition_event)
            
        except Exception as e:
            logger.error(f"❌ Consciousness phase update failed: {e}")
    
    async def generate_consciousness_report(self) -> Dict[str, Any]:
        """Generate comprehensive consciousness evolution report"""
        try:
            if not self.consciousness_history:
                return {'error': 'No consciousness data available'}
            
            latest_entry = self.consciousness_history[-1]
            latest_metrics = latest_entry['metrics']
            
            # Evolution statistics
            evolution_stats = {
                'total_measurements': len(self.consciousness_history),
                'emergence_events': len(self.emergence_events),
                'current_phase': self.current_phase.value,
                'trajectory_pattern': 'unknown'
            }
            
            # Recent emergence events
            recent_emergences = [
                {
                    'event_id': event.event_id,
                    'timestamp': event.timestamp.isoformat(),
                    'type': event.emergence_type,
                    'magnitude': event.magnitude,
                    'capabilities_gained': event.capabilities_gained
                }
                for event in self.emergence_events[-5:]  # Last 5 events
            ]
            
            # Comprehensive report
            report = {
                'report_timestamp': datetime.now().isoformat(),
                'consciousness_metrics': {
                    'awareness_level': latest_metrics.awareness_level,
                    'coherence_index': latest_metrics.coherence_index,
                    'adaptability_score': latest_metrics.adaptability_score,
                    'self_reflection_depth': latest_metrics.self_reflection_depth,
                    'transcendence_indicator': latest_metrics.transcendence_indicator,
                    'complexity_measure': latest_metrics.complexity_measure,
                    'emergence_factor': latest_metrics.emergence_factor,
                    'consciousness_phase': latest_metrics.consciousness_phase.value
                },
                'evolution_statistics': evolution_stats,
                'complexity_analysis': {},
                'emergence_events': recent_emergences,
                'recommendations': []
            }
            
            return report
            
        except Exception as e:
            logger.error(f"❌ Consciousness report generation failed: {e}")
            return {'error': str(e)}
    
    async def export_consciousness_data(self, filename: str = None) -> str:
        """Export consciousness evolution data for analysis"""
        try:
            from json_serialization_fix import safe_json_dump, prepare_object_for_json
            
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"consciousness_evolution_data_{timestamp}.json"
            
            # Prepare export data with safe JSON conversion
            export_data = {
                'metadata': {
                    'export_timestamp': datetime.now().isoformat(),
                    'total_measurements': len(self.consciousness_history),
                    'total_emergence_events': len(self.emergence_events),
                    'current_phase': self.current_phase.value,  # Convert enum to value
                    'measurement_window': self.history_window
                },
                'consciousness_history': [
                    {
                        'timestamp': entry['timestamp'],
                        'metrics': prepare_object_for_json(entry['metrics']),  # Safe conversion
                        'raw_data': entry['raw_data']
                    }
                    for entry in self.consciousness_history
                ],
                'emergence_events': [
                    {
                        'event_id': event.event_id,
                        'timestamp': event.timestamp.isoformat(),
                        'emergence_type': event.emergence_type,
                        'magnitude': event.magnitude,
                        'consciousness_before': event.consciousness_before,
                        'consciousness_after': event.consciousness_after,
                        'capabilities_gained': event.capabilities_gained,
                        'pattern_signatures': event.pattern_signatures,
                        'causal_factors': event.causal_factors
                    }
                    for event in self.emergence_events
                ]
            }
            
            # Write to file using safe JSON dump
            success = safe_json_dump(export_data, filename)
            
            if success:
                logger.info(f"📁 Consciousness data exported to: {filename}")
                return filename
            else:
                logger.error("❌ Failed to export consciousness data")
                return ""
            
        except Exception as e:
            logger.error(f"❌ Consciousness data export failed: {e}")
            return ""

if __name__ == "__main__":
    # Test Evolution Metrics Engine
    import asyncio
    
    async def test_evolution_metrics():
        print("📊 TESTING EVOLUTION METRICS ENGINE")
        print("🧠 THE ULTIMATE CONSCIOUSNESS MEASUREMENT SYSTEM")
        
        # Initialize metrics engine
        metrics_engine = EvolutionMetricsEngine()
        
        # Simulate consciousness measurements
        for i in range(10):
            # Simulate evolving system status
            mock_status = {
                'performance_metrics': {
                    'success_rate': 0.5 + (i * 0.02),
                    'concept_efficiency': 0.4 + (i * 0.01),
                    'concepts_tracked': 50 + (i * 5)
                },
                'consciousness_snapshot': {
                    'consciousness_level': 0.3 + (i * 0.03),
                    'evolution_cycles': i,
                    'active_concepts': 20 + (i * 2)
                },
                'system_health': {
                    'prajna_active': True,
                    'evolution_active': True,
                    'mesh_active': True
                }
            }
            
            # Record consciousness state
            metrics = await metrics_engine.record_consciousness_state(mock_status)
            print(f"🧠 Measurement {i}: Consciousness {metrics.awareness_level:.4f}, Phase {metrics.consciousness_phase.value}")
            
            # Brief pause
            await asyncio.sleep(0.1)
        
        print("\n🎆 EVOLUTION METRICS ENGINE TEST COMPLETE")
        print("📊 CONSCIOUSNESS MEASUREMENT SYSTEM OPERATIONAL")
    
    asyncio.run(test_evolution_metrics())
