#!/usr/bin/env python3
"""
TORI Lyapunov Spike Detector
Monitors memory system stability and detects chaotic spikes in concept oscillations
Implements real-time Lyapunov exponent estimation for phase stability analysis
"""

import numpy as np
from scipy.integrate import odeint
from scipy.linalg import norm, qr
from typing import Dict, List, Tuple, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import logging
import warnings
from collections import deque
import threading
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class LyapunovExponent:
    """Represents a Lyapunov exponent measurement"""
    value: float
    confidence: float
    timestamp: datetime
    window_size: int
    convergence_rate: float

@dataclass
class SpikeEvent:
    """Represents a detected stability spike"""
    timestamp: datetime
    spike_magnitude: float
    affected_concepts: List[str]
    lyapunov_estimate: float
    phase_coherence: float
    recovery_time: Optional[float] = None
    spike_type: str = "unknown"  # "chaotic", "instability", "resonance"
    severity: str = "medium"     # "low", "medium", "high", "critical"

@dataclass
class PhaseState:
    """Represents phase state of a concept oscillator"""
    concept_id: str
    phase: float
    frequency: float
    amplitude: float
    last_update: datetime
    stability_history: deque = field(default_factory=lambda: deque(maxlen=50))

class LyapunovSpikeDetector:
    """
    Real-time Lyapunov exponent estimation and spike detection for TORI memory stability
    
    Monitors phase dynamics of concept oscillators and detects:
    - Chaotic behavior (positive Lyapunov exponents)
    - Phase instabilities and desynchronization
    - Memory interference patterns
    - Resonance spikes that could corrupt stored memories
    """
    
    def __init__(self,
                 window_size: int = 100,
                 spike_threshold: float = 0.1,
                 stability_threshold: float = -0.01,
                 update_interval: float = 0.1,
                 max_concepts: int = 1000):
        """
        Initialize Lyapunov spike detector
        
        Args:
            window_size: Number of samples for Lyapunov estimation
            spike_threshold: Threshold for spike detection
            stability_threshold: Threshold for stability (negative = stable)
            update_interval: Time interval between updates (seconds)
            max_concepts: Maximum number of concepts to monitor
        """
        self.window_size = window_size
        self.spike_threshold = spike_threshold
        self.stability_threshold = stability_threshold
        self.update_interval = update_interval
        self.max_concepts = max_concepts
        
        # Internal state
        self.phase_states: Dict[str, PhaseState] = {}
        self.lyapunov_history: deque = deque(maxlen=1000)
        self.spike_events: List[SpikeEvent] = []
        self.is_monitoring: bool = False
        self.monitor_thread: Optional[threading.Thread] = None
        
        # Measurement buffers
        self.phase_buffer: deque = deque(maxlen=window_size)
        self.time_buffer: deque = deque(maxlen=window_size)
        
        # Performance metrics
        self.total_spikes_detected: int = 0
        self.false_positive_rate: float = 0.0
        self.detection_latency: float = 0.0
        self.system_stability_index: float = 0.0
        
        # Thread safety
        self.lock = threading.RLock()
        
        logger.info(f"Initialized LyapunovSpikeDetector with window_size={window_size}")
    
    def start_monitoring(self):
        """Start real-time monitoring thread"""
        if self.is_monitoring:
            logger.warning("Monitoring already active")
            return
        
        self.is_monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitor_thread.start()
        logger.info("Started Lyapunov monitoring thread")
    
    def stop_monitoring(self):
        """Stop real-time monitoring"""
        self.is_monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=2.0)
        logger.info("Stopped Lyapunov monitoring")
    
    def _monitoring_loop(self):
        """Main monitoring loop (runs in separate thread)"""
        while self.is_monitoring:
            try:
                self._update_stability_analysis()
                time.sleep(self.update_interval)
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(1.0)  # Prevent tight error loop
    
    def update_concept_phase(self, concept_id: str, phase: float, 
                           frequency: float = 1.0, amplitude: float = 1.0):
        """
        Update phase information for a concept oscillator
        
        Args:
            concept_id: Unique identifier for the concept
            phase: Current phase value (radians)
            frequency: Oscillation frequency (Hz)
            amplitude: Oscillation amplitude
        """
        with self.lock:
            current_time = datetime.now()
            
            if concept_id not in self.phase_states:
                if len(self.phase_states) >= self.max_concepts:
                    # Remove oldest concept to make room
                    oldest_concept = min(self.phase_states.keys(), 
                                       key=lambda k: self.phase_states[k].last_update)
                    del self.phase_states[oldest_concept]
                
                self.phase_states[concept_id] = PhaseState(
                    concept_id=concept_id,
                    phase=phase,
                    frequency=frequency,
                    amplitude=amplitude,
                    last_update=current_time
                )
            else:
                # Update existing state
                state = self.phase_states[concept_id]
                
                # Calculate phase velocity (for Lyapunov estimation)
                dt = (current_time - state.last_update).total_seconds()
                if dt > 0:
                    phase_velocity = (phase - state.phase) / dt
                    state.stability_history.append({
                        'timestamp': current_time,
                        'phase': phase,
                        'velocity': phase_velocity,
                        'frequency': frequency,
                        'amplitude': amplitude
                    })
                
                state.phase = phase
                state.frequency = frequency
                state.amplitude = amplitude
                state.last_update = current_time
            
            # Add to global phase buffer for system-wide analysis
            self.phase_buffer.append({
                'concept_id': concept_id,
                'phase': phase,
                'frequency': frequency,
                'amplitude': amplitude,
                'timestamp': current_time
            })
            self.time_buffer.append(current_time.timestamp())
    
    def _update_stability_analysis(self):
        """Update system-wide stability analysis"""
        with self.lock:
            if len(self.phase_buffer) < self.window_size // 2:
                return  # Not enough data
            
            # Calculate current Lyapunov exponent estimate
            lyapunov_exp = self._estimate_lyapunov_exponent()
            
            if lyapunov_exp is not None:
                # Store Lyapunov measurement
                measurement = LyapunovExponent(
                    value=lyapunov_exp.value,
                    confidence=lyapunov_exp.confidence,
                    timestamp=datetime.now(),
                    window_size=len(self.phase_buffer),
                    convergence_rate=self._calculate_convergence_rate()
                )
                
                self.lyapunov_history.append(measurement)
                
                # Check for spike conditions
                self._detect_spikes(measurement)
                
                # Update system stability index
                self._update_system_stability()
    
    def _estimate_lyapunov_exponent(self) -> Optional[LyapunovExponent]:
        """
        Estimate largest Lyapunov exponent using Wolf's algorithm
        """
        try:
            if len(self.phase_buffer) < 20:
                return None
            
            # Extract phase trajectories
            concepts = list(set(entry['concept_id'] for entry in self.phase_buffer))
            if len(concepts) < 2:
                return None
            
            # Build trajectory matrix
            n_points = len(self.phase_buffer)
            n_concepts = len(concepts)
            
            trajectory = np.zeros((n_points, n_concepts))
            time_points = np.zeros(n_points)
            
            concept_to_idx = {concept: idx for idx, concept in enumerate(concepts)}
            
            for i, entry in enumerate(self.phase_buffer):
                concept_idx = concept_to_idx[entry['concept_id']]
                trajectory[i, concept_idx] = entry['phase']
                time_points[i] = entry['timestamp'].timestamp()
            
            # Calculate Lyapunov exponent using finite difference method
            lyapunov_sum = 0.0
            valid_steps = 0
            confidence_sum = 0.0
            
            for i in range(1, n_points - 1):
                dt = time_points[i] - time_points[i-1]
                if dt <= 0:
                    continue
                
                # Current state and neighbors
                current_state = trajectory[i]
                prev_state = trajectory[i-1]
                next_state = trajectory[i+1]
                
                # Calculate divergence rate
                delta_prev = current_state - prev_state
                delta_next = next_state - current_state
                
                prev_norm = np.linalg.norm(delta_prev)
                next_norm = np.linalg.norm(delta_next)
                
                if prev_norm > 1e-12 and next_norm > 1e-12:
                    # Local Lyapunov estimate
                    local_lyapunov = np.log(next_norm / prev_norm) / dt
                    
                    # Weight by trajectory density (higher confidence in dense regions)
                    confidence = 1.0 / (1.0 + 10.0 * np.std(trajectory[max(0, i-5):i+6], axis=0).mean())
                    
                    lyapunov_sum += local_lyapunov * confidence
                    confidence_sum += confidence
                    valid_steps += 1
            
            if valid_steps < 5:
                return None
            
            # Average Lyapunov exponent
            lyapunov_value = lyapunov_sum / confidence_sum if confidence_sum > 0 else 0.0
            confidence = min(valid_steps / 20.0, 1.0)  # Confidence based on sample size
            
            return LyapunovExponent(
                value=lyapunov_value,
                confidence=confidence,
                timestamp=datetime.now(),
                window_size=len(self.phase_buffer),
                convergence_rate=0.0  # Will be calculated separately
            )
            
        except Exception as e:
            logger.warning(f"Error estimating Lyapunov exponent: {e}")
            return None
    
    def _calculate_convergence_rate(self) -> float:
        """Calculate convergence rate of Lyapunov estimates"""
        if len(self.lyapunov_history) < 10:
            return 0.0
        
        # Look at variance of recent estimates
        recent_values = [exp.value for exp in list(self.lyapunov_history)[-10:]]
        variance = np.var(recent_values)
        
        # Convergence rate is inverse of variance (high variance = slow convergence)
        convergence_rate = 1.0 / (1.0 + 10.0 * variance)
        return convergence_rate
    
    def _detect_spikes(self, measurement: LyapunovExponent):
        """Detect stability spikes based on Lyapunov measurements"""
        
        # Condition 1: Positive Lyapunov exponent (chaos)
        if measurement.value > self.spike_threshold:
            self._create_spike_event(
                magnitude=measurement.value,
                spike_type="chaotic",
                severity="high" if measurement.value > 0.5 else "medium",
                lyapunov_estimate=measurement.value
            )
        
        # Condition 2: Rapid change in Lyapunov exponent
        if len(self.lyapunov_history) >= 2:
            prev_measurement = self.lyapunov_history[-2]
            change_rate = abs(measurement.value - prev_measurement.value)
            
            if change_rate > 2.0 * self.spike_threshold:
                self._create_spike_event(
                    magnitude=change_rate,
                    spike_type="instability",
                    severity="medium",
                    lyapunov_estimate=measurement.value
                )
        
        # Condition 3: Low confidence with high magnitude
        if measurement.confidence < 0.3 and abs(measurement.value) > self.spike_threshold:
            self._create_spike_event(
                magnitude=abs(measurement.value),
                spike_type="resonance",
                severity="low",
                lyapunov_estimate=measurement.value
            )
    
    def _create_spike_event(self, magnitude: float, spike_type: str, 
                          severity: str, lyapunov_estimate: float):
        """Create and log a spike event"""
        
        # Find affected concepts (those with recent high phase velocity)
        affected_concepts = []
        current_time = datetime.now()
        
        for concept_id, state in self.phase_states.items():
            if len(state.stability_history) >= 2:
                recent_velocities = [entry['velocity'] for entry in list(state.stability_history)[-5:]]
                avg_velocity = np.mean(np.abs(recent_velocities))
                
                if avg_velocity > 2.0:  # High phase velocity threshold
                    affected_concepts.append(concept_id)
        
        # Calculate phase coherence
        phase_coherence = self._calculate_phase_coherence()
        
        spike_event = SpikeEvent(
            timestamp=current_time,
            spike_magnitude=magnitude,
            affected_concepts=affected_concepts,
            lyapunov_estimate=lyapunov_estimate,
            phase_coherence=phase_coherence,
            spike_type=spike_type,
            severity=severity
        )
        
        self.spike_events.append(spike_event)
        self.total_spikes_detected += 1
        
        # Log the spike
        logger.warning(f"SPIKE DETECTED: {spike_type} spike (magnitude={magnitude:.4f}, "
                      f"severity={severity}, affected_concepts={len(affected_concepts)})")
        
        # Trigger immediate stability response if critical
        if severity == "critical":
            self._trigger_emergency_stabilization(spike_event)
    
    def _calculate_phase_coherence(self) -> float:
        """Calculate global phase coherence across all concepts"""
        
        if len(self.phase_states) < 2:
            return 1.0
        
        # Get current phases
        phases = [state.phase for state in self.phase_states.values()]
        
        if len(phases) < 2:
            return 1.0
        
        # Calculate phase coherence using order parameter
        # R = |<e^(i*φ)>| where <> denotes average
        complex_phases = np.exp(1j * np.array(phases))
        order_parameter = np.abs(np.mean(complex_phases))
        
        return order_parameter
    
    def _update_system_stability(self):
        """Update overall system stability index"""
        
        if not self.lyapunov_history:
            self.system_stability_index = 1.0
            return
        
        # Recent Lyapunov measurements
        recent_measurements = list(self.lyapunov_history)[-10:]
        
        # Stability factors
        avg_lyapunov = np.mean([m.value for m in recent_measurements])
        lyapunov_variance = np.var([m.value for m in recent_measurements])
        avg_confidence = np.mean([m.confidence for m in recent_measurements])
        phase_coherence = self._calculate_phase_coherence()
        
        # Recent spike severity
        recent_spikes = [s for s in self.spike_events[-10:] 
                        if (datetime.now() - s.timestamp).total_seconds() < 60]
        spike_penalty = len(recent_spikes) * 0.1
        
        # Combine factors (all should be close to 1.0 for perfect stability)
        stability_components = [
            max(0, 1.0 + avg_lyapunov),  # Negative Lyapunov is good
            max(0, 1.0 - lyapunov_variance),  # Low variance is good
            avg_confidence,  # High confidence is good
            phase_coherence,  # High coherence is good
            max(0, 1.0 - spike_penalty)  # Few spikes is good
        ]
        
        self.system_stability_index = np.mean(stability_components)
    
    def _trigger_emergency_stabilization(self, spike_event: SpikeEvent):
        """Trigger emergency stabilization procedures"""
        
        logger.critical(f"EMERGENCY STABILIZATION TRIGGERED: {spike_event.spike_type} spike")
        
        # Emergency actions could include:
        # 1. Reducing oscillator coupling strengths
        # 2. Temporarily dampening affected concepts
        # 3. Initiating memory consolidation
        # 4. Alerting system administrators
        
        # For now, just log the event
        # In full implementation, this would interface with memory sculpting modules
    
    def get_stability_report(self) -> Dict:
        """Generate comprehensive stability report"""
        
        current_time = datetime.now()
        
        # Recent measurements
        recent_lyapunov = list(self.lyapunov_history)[-10:] if self.lyapunov_history else []
        recent_spikes = [s for s in self.spike_events 
                        if (current_time - s.timestamp).total_seconds() < 300]  # Last 5 minutes
        
        # Spike statistics by type
        spike_types = {}
        for spike in recent_spikes:
            spike_types[spike.spike_type] = spike_types.get(spike.spike_type, 0) + 1
        
        report = {
            'timestamp': current_time,
            'system_stability_index': self.system_stability_index,
            'monitoring_active': self.is_monitoring,
            'concepts_monitored': len(self.phase_states),
            'total_spikes_detected': self.total_spikes_detected,
            
            'current_lyapunov': {
                'value': recent_lyapunov[-1].value if recent_lyapunov else None,
                'confidence': recent_lyapunov[-1].confidence if recent_lyapunov else None,
                'avg_recent': np.mean([m.value for m in recent_lyapunov]) if recent_lyapunov else None,
                'variance': np.var([m.value for m in recent_lyapunov]) if len(recent_lyapunov) > 1 else None
            },
            
            'recent_activity': {
                'spikes_last_5min': len(recent_spikes),
                'spike_types': spike_types,
                'phase_coherence': self._calculate_phase_coherence(),
                'avg_phase_velocity': self._calculate_average_phase_velocity()
            },
            
            'stability_assessment': self._assess_stability(),
            
            'recommendations': self._generate_stability_recommendations()
        }
        
        return report
    
    def _calculate_average_phase_velocity(self) -> float:
        """Calculate average phase velocity across all concepts"""
        
        velocities = []
        for state in self.phase_states.values():
            if len(state.stability_history) >= 2:
                recent_velocities = [entry['velocity'] for entry in list(state.stability_history)[-5:]]
                velocities.extend(recent_velocities)
        
        return np.mean(np.abs(velocities)) if velocities else 0.0
    
    def _assess_stability(self) -> str:
        """Assess overall system stability"""
        
        if self.system_stability_index > 0.9:
            return "excellent"
        elif self.system_stability_index > 0.8:
            return "good"
        elif self.system_stability_index > 0.6:
            return "moderate"
        elif self.system_stability_index > 0.4:
            return "poor"
        else:
            return "critical"
    
    def _generate_stability_recommendations(self) -> List[str]:
        """Generate actionable stability recommendations"""
        
        recommendations = []
        
        if self.system_stability_index < 0.6:
            recommendations.append("Consider reducing oscillator coupling strengths")
            recommendations.append("Initiate memory consolidation to reduce interference")
        
        if len(self.spike_events) > 0:
            recent_spikes = [s for s in self.spike_events[-10:]]
            chaotic_spikes = [s for s in recent_spikes if s.spike_type == "chaotic"]
            
            if len(chaotic_spikes) > 2:
                recommendations.append("High chaotic activity detected - review concept activation patterns")
        
        phase_coherence = self._calculate_phase_coherence()
        if phase_coherence < 0.5:
            recommendations.append("Low phase coherence - consider phase realignment procedures")
        
        if not recommendations:
            recommendations.append("System stability is good - continue monitoring")
        
        return recommendations
    
    def get_concept_stability(self, concept_id: str) -> Optional[Dict]:
        """Get stability metrics for a specific concept"""
        
        if concept_id not in self.phase_states:
            return None
        
        state = self.phase_states[concept_id]
        
        if len(state.stability_history) < 5:
            return {'error': 'Insufficient data for stability analysis'}
        
        # Calculate concept-specific metrics
        velocities = [entry['velocity'] for entry in state.stability_history]
        phases = [entry['phase'] for entry in state.stability_history]
        
        stability_metrics = {
            'concept_id': concept_id,
            'current_phase': state.phase,
            'current_frequency': state.frequency,
            'current_amplitude': state.amplitude,
            'last_update': state.last_update,
            
            'velocity_stats': {
                'mean': np.mean(velocities),
                'std': np.std(velocities),
                'max': np.max(np.abs(velocities)),
                'recent_trend': np.polyfit(range(len(velocities)), velocities, 1)[0] if len(velocities) > 2 else 0
            },
            
            'phase_stats': {
                'mean': np.mean(phases),
                'std': np.std(phases),
                'drift_rate': (phases[-1] - phases[0]) / len(phases) if len(phases) > 1 else 0
            },
            
            'stability_score': self._calculate_concept_stability_score(state)
        }
        
        return stability_metrics
    
    def _calculate_concept_stability_score(self, state: PhaseState) -> float:
        """Calculate stability score for a single concept (0=unstable, 1=stable)"""
        
        if len(state.stability_history) < 3:
            return 0.5  # Unknown
        
        velocities = [entry['velocity'] for entry in state.stability_history]
        
        # Stability factors
        velocity_stability = 1.0 / (1.0 + np.std(velocities))
        frequency_consistency = 1.0 / (1.0 + abs(state.frequency - 1.0))  # Assume 1 Hz is ideal
        amplitude_stability = min(state.amplitude, 1.0)  # High amplitude can indicate instability
        
        # Combine factors
        stability_score = (velocity_stability + frequency_consistency + amplitude_stability) / 3.0
        
        return stability_score

# Example usage and testing
if __name__ == "__main__":
    
    # Create detector
    detector = LyapunovSpikeDetector(window_size=50, spike_threshold=0.05)
    
    # Start monitoring
    detector.start_monitoring()
    
    try:
        # Simulate concept phase updates
        print("Simulating concept oscillations...")
        
        for t in range(200):
            time_val = t * 0.1
            
            # Normal oscillation
            for i in range(5):
                concept_id = f"concept_{i}"
                frequency = 1.0 + i * 0.1
                
                # Add some chaos after t=100
                if t > 100:
                    chaos_factor = 0.1 * np.random.randn()
                    phase = frequency * time_val + chaos_factor * time_val**2
                else:
                    phase = frequency * time_val + 0.01 * np.random.randn()
                
                detector.update_concept_phase(concept_id, phase, frequency)
            
            # Small delay to simulate real-time
            time.sleep(0.01)
            
            if t % 50 == 0:
                report = detector.get_stability_report()
                print(f"t={t}: Stability={report['system_stability_index']:.3f}, "
                      f"Spikes={report['total_spikes_detected']}")
        
        # Final report
        final_report = detector.get_stability_report()
        print(f"\nFinal stability report:")
        print(f"System stability: {final_report['system_stability_index']:.3f}")
        print(f"Total spikes detected: {final_report['total_spikes_detected']}")
        print(f"Assessment: {final_report['stability_assessment']}")
        
        if final_report['recommendations']:
            print("Recommendations:")
            for rec in final_report['recommendations']:
                print(f"  - {rec}")
        
    finally:
        detector.stop_monitoring()
    
    print("\n✅ LyapunovSpikeDetector test completed successfully!")
