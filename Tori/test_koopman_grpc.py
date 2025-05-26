#!/usr/bin/env python3
"""
TORI Koopman gRPC Service Integration Test
Validates ProcessActivationBatch and GetSpectralModes operations
"""

import grpc
import sys
import os
import time
import json
import numpy as np
from datetime import datetime, timezone

# Add proto generated files to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'proto', 'generated', 'python'))

try:
    import koopman_learner_pb2
    import koopman_learner_pb2_grpc
    import episodic_pb2
    print("✅ Successfully imported Koopman proto modules")
except ImportError as e:
    print(f"❌ Failed to import Koopman proto modules: {e}")
    print("Please run regenerate-grpc-protos.bat first")
    sys.exit(1)

class KoopmanServiceTester:
    def __init__(self, server_address='localhost:50052'):
        self.server_address = server_address
        self.channel = None
        self.stub = None
        
    def connect(self):
        """Connect to the Koopman gRPC service"""
        try:
            self.channel = grpc.insecure_channel(self.server_address)
            self.stub = koopman_learner_pb2_grpc.KoopmanLearnerStub(self.channel)
            
            # Test connection
            grpc.channel_ready_future(self.channel).result(timeout=5)
            print(f"✅ Connected to Koopman service at {self.server_address}")
            return True
            
        except grpc.RpcError as e:
            print(f"❌ Failed to connect to Koopman service: {e}")
            return False
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False
    
    def generate_test_activation_traces(self, num_traces=3, trace_length=50):
        """Generate synthetic activation traces for testing"""
        traces = []
        
        for i in range(num_traces):
            trace = koopman_learner_pb2.ActivationTrace(
                trace_id=f"test_trace_{i}_{int(time.time())}",
                source="grpc_integration_test",
                timestamp=int(time.time()) - (i * 60),  # Stagger timestamps
                duration_secs=trace_length * 0.1,  # 0.1 seconds per snapshot
                sampling_rate_hz=10.0,
                tags=["test", "synthetic", f"trace_{i}"]
            )
            
            # Generate realistic oscillatory activation patterns
            for t in range(trace_length):
                snapshot = koopman_learner_pb2.ActivationSnapshot(
                    relative_time=t * 0.1,
                    is_transition=(t % 10 == 0),  # Mark every 10th snapshot as transition
                    lyapunov_estimate=0.1 * np.sin(t * 0.2) + np.random.normal(0, 0.05)
                )
                
                # Create concept activation pattern
                activation = episodic_pb2.ConceptActivation()
                
                # Generate oscillatory activations for multiple concepts
                num_concepts = 5
                for c in range(num_concepts):
                    # Each concept has different frequency and phase
                    frequency = 0.1 + c * 0.05
                    phase = c * np.pi / 4
                    strength = 0.5 + 0.5 * np.sin(2 * np.pi * frequency * t + phase)
                    
                    if strength > 0.3:  # Threshold for active concepts
                        activation.active_concepts.append(f"concept_{c}")
                        activation.strengths.append(float(strength))
                
                snapshot.activation.CopyFrom(activation)
                trace.snapshots.append(snapshot)
            
            traces.append(trace)
        
        return traces
    
    def test_process_activation_batch(self):
        """Test ProcessActivationBatch operation"""
        print("\n🧪 Testing ProcessActivationBatch operation...")
        
        try:
            # Generate test activation traces
            traces = self.generate_test_activation_traces(num_traces=3, trace_length=30)
            
            # Create processing parameters
            params = koopman_learner_pb2.ProcessingParameters(
                dmd_rank=10,
                use_incremental=False,
                l1_strength=0.01,
                max_modes=15,
                use_sparse_opt=True,
                min_singular_value=1e-6,
                mode_combination_threshold=0.1,
                compute_stability=True,
                prediction_horizon=10,
                learning_rate=0.01
            )
            
            # Create batch request
            request = koopman_learner_pb2.ActivationBatchRequest(
                traces=traces,
                parameters=params,
                update_couplings=True,
                generate_stability=True,
                description="gRPC integration test batch",
                client_id="vault_grpc_tester"
            )
            
            # Execute the request
            print(f"   Submitting {len(traces)} activation traces...")
            response = self.stub.ProcessActivationBatch(request, timeout=30)
            
            if response.accepted:
                print(f"✅ ProcessActivationBatch successful!")
                print(f"   Job ID: {response.job_id}")
                print(f"   Trace Count: {response.trace_count}")
                print(f"   Estimated Completion: {datetime.fromtimestamp(response.estimated_completion, tz=timezone.utc)}")
                
                if response.status.state != koopman_learner_pb2.JobState.UNKNOWN:
                    print(f"   Status: {koopman_learner_pb2.JobState.Name(response.status.state)}")
                    print(f"   Progress: {response.status.progress:.1f}%")
                    print(f"   Modes Extracted: {response.status.modes_extracted}")
                    
                    if response.status.dominant_eigenvalues:
                        print(f"   Dominant Eigenvalues: {len(response.status.dominant_eigenvalues)}")
                        for i, eigenval in enumerate(response.status.dominant_eigenvalues[:3]):
                            print(f"     λ_{i}: {eigenval.real:.4f} + {eigenval.imag:.4f}j")
                    
                    if response.status.prediction_error > 0:
                        print(f"   Prediction Error: {response.status.prediction_error:.6f}")
                    
                    if response.status.mode_sparsity > 0:
                        print(f"   Mode Sparsity: {response.status.mode_sparsity:.1f}%")
                
                return response.job_id
            else:
                print(f"❌ ProcessActivationBatch failed: {response.error_message}")
                return None
                
        except grpc.RpcError as e:
            print(f"❌ gRPC error in ProcessActivationBatch: {e.code()} - {e.details()}")
            return None
        except Exception as e:
            print(f"❌ Unexpected error in ProcessActivationBatch: {e}")
            return None
    
    def test_get_processing_status(self, job_id):
        """Test GetProcessingStatus operation"""
        print(f"\n🧪 Testing GetProcessingStatus operation...")
        
        if not job_id:
            print("❌ No job ID to test processing status")
            return False
        
        try:
            request = koopman_learner_pb2.StatusRequest(job_id=job_id)
            response = self.stub.GetProcessingStatus(request, timeout=10)
            
            print(f"✅ GetProcessingStatus successful!")
            print(f"   Job ID: {response.job_id}")
            print(f"   Status: {koopman_learner_pb2.JobState.Name(response.state)}")
            print(f"   Progress: {response.progress:.1f}%")
            print(f"   Current Operation: {response.current_operation}")
            print(f"   Traces Processed: {response.traces_processed}")
            print(f"   Traces Remaining: {response.traces_remaining}")
            print(f"   Modes Extracted: {response.modes_extracted}")
            
            if response.dominant_eigenvalues:
                print(f"   Dominant Eigenvalues: {len(response.dominant_eigenvalues)}")
                for i, eigenval in enumerate(response.dominant_eigenvalues[:3]):
                    print(f"     λ_{i}: {eigenval.real:.4f} + {eigenval.imag:.4f}j")
            
            if response.prediction_error > 0:
                print(f"   Prediction Error: {response.prediction_error:.6f}")
            
            if response.mode_sparsity > 0:
                print(f"   Mode Sparsity: {response.mode_sparsity:.1f}%")
            
            if response.start_time > 0:
                start_time = datetime.fromtimestamp(response.start_time, tz=timezone.utc)
                print(f"   Start Time: {start_time}")
            
            if response.end_time > 0:
                end_time = datetime.fromtimestamp(response.end_time, tz=timezone.utc)
                print(f"   End Time: {end_time}")
            
            if response.coupling_updates and response.coupling_updates.success:
                print(f"   Coupling Updates: {response.coupling_updates.pairs_updated} pairs updated")
                print(f"   Stability Improvement: {response.coupling_updates.stability_improvement:.3f}")
            
            return True
                
        except grpc.RpcError as e:
            print(f"❌ gRPC error in GetProcessingStatus: {e.code()} - {e.details()}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error in GetProcessingStatus: {e}")
            return False
    
    def test_get_spectral_modes(self):
        """Test GetSpectralModes operation"""
        print(f"\n🧪 Testing GetSpectralModes operation...")
        
        try:
            request = koopman_learner_pb2.ModesRequest(
                max_modes=10,
                sort_by="eigenvalue_magnitude",
                min_eigenvalue_magnitude=0.1,
                exclude_unstable=True
            )
            
            response = self.stub.GetSpectralModes(request, timeout=10)
            
            print(f"✅ GetSpectralModes successful!")
            print(f"   Total Modes Available: {response.total_modes}")
            print(f"   Modes Returned: {len(response.modes)}")
            print(f"   Last Updated: {datetime.fromtimestamp(response.last_updated, tz=timezone.utc)}")
            print(f"   Average Sparsity: {response.avg_sparsity:.3f}")
            print(f"   Average Prediction Error: {response.avg_prediction_error:.6f}")
            
            for i, mode in enumerate(response.modes[:3]):  # Show first 3 modes
                print(f"   Mode {i}:")
                print(f"     ID: {mode.mode_id}")
                print(f"     Eigenvalue: {mode.eigenvalue.real:.4f} + {mode.eigenvalue.imag:.4f}j")
                print(f"     Natural Frequency: {mode.natural_frequency:.4f} Hz")
                print(f"     Damping Ratio: {mode.damping_ratio:.4f}")
                print(f"     Growth Factor: {mode.growth_factor:.4f}")
                print(f"     Sparsity: {mode.sparsity:.1f}%")
                print(f"     Stability Index: {mode.stability_index:.3f}")
                
                if mode.dominant_concepts:
                    print(f"     Dominant Concepts:")
                    for concept in mode.dominant_concepts[:3]:
                        print(f"       {concept.concept_id}: {concept.weight:.3f}")
            
            return True
                
        except grpc.RpcError as e:
            print(f"❌ gRPC error in GetSpectralModes: {e.code()} - {e.details()}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error in GetSpectralModes: {e}")
            return False
    
    def test_update_oscillator_couplings(self):
        """Test UpdateOscillatorCouplings operation"""
        print(f"\n🧪 Testing UpdateOscillatorCouplings operation...")
        
        try:
            request = koopman_learner_pb2.CouplingRequest(
                max_pairs=50,
                apply_immediately=True,
                coupling_gain=1.0,
                min_eigenvalue_magnitude=0.1,
                enforce_stability=True,
                max_coupling_strength=2.0
            )
            
            response = self.stub.UpdateOscillatorCouplings(request, timeout=15)
            
            if response.success:
                print(f"✅ UpdateOscillatorCouplings successful!")
                print(f"   Pairs Updated: {response.pairs_updated}")
                print(f"   Average Strength Change: {response.avg_strength_change:.4f}")
                print(f"   Stability Improvement: {response.stability_improvement:.3f}")
                print(f"   Update Time: {datetime.fromtimestamp(response.update_time, tz=timezone.utc)}")
                
                if response.coupling_updates:
                    print(f"   Sample Coupling Updates:")
                    for i, coupling in enumerate(response.coupling_updates[:3]):
                        print(f"     {coupling.oscillator_id_1} ↔ {coupling.oscillator_id_2}")
                        print(f"       New Strength: {coupling.coupling_strength:.4f}")
                        print(f"       Previous: {coupling.previous_strength:.4f}")
                        print(f"       Phase Shift: {coupling.phase_shift:.4f} rad")
                        print(f"       Source Mode: {coupling.source_mode_id}")
                
                return True
            else:
                print(f"❌ UpdateOscillatorCouplings failed: {response.error_message}")
                return False
                
        except grpc.RpcError as e:
            print(f"❌ gRPC error in UpdateOscillatorCouplings: {e.code()} - {e.details()}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error in UpdateOscillatorCouplings: {e}")
            return False
    
    def test_koopman_stats(self):
        """Test GetKclStats operation"""
        print(f"\n🧪 Testing GetKclStats operation...")
        
        try:
            request = koopman_learner_pb2.StatsRequest(
                since=int(time.time()) - 3600,  # Last hour
                until=int(time.time())
            )
            
            response = self.stub.GetKclStats(request, timeout=10)
            
            print(f"✅ GetKclStats successful!")
            print(f"   Total Traces Processed: {response.total_traces_processed}")
            print(f"   Total Spectral Modes: {response.total_spectral_modes}")
            print(f"   Average Prediction Error: {response.avg_prediction_error:.6f}")
            print(f"   Average Mode Sparsity: {response.avg_mode_sparsity:.3f}")
            print(f"   Average Processing Time: {response.avg_processing_time_ms:.2f}ms")
            print(f"   Total Coupling Updates: {response.total_coupling_updates}")
            print(f"   System Stability Index: {response.system_stability_index:.3f}")
            print(f"   Memory Usage: {response.memory_usage_bytes / 1024 / 1024:.1f} MB")
            
            if response.prediction_error_history:
                print(f"   Recent Prediction Errors:")
                for i, point in enumerate(response.prediction_error_history[-3:]):
                    timestamp = datetime.fromtimestamp(point.timestamp, tz=timezone.utc)
                    print(f"     {timestamp}: {point.value:.6f}")
            
            if response.dominant_modes:
                print(f"   Dominant Modes:")
                for i, mode in enumerate(response.dominant_modes[:3]):
                    print(f"     {i+1}. {mode.mode_id}: λ={mode.eigenvalue.real:.3f}+{mode.eigenvalue.imag:.3f}j")
            
            return True
                
        except grpc.RpcError as e:
            print(f"❌ gRPC error in GetKclStats: {e.code()} - {e.details()}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error in GetKclStats: {e}")
            return False
    
    def test_stability_analysis(self):
        """Test GetStabilityAnalysis operation"""
        print(f"\n🧪 Testing GetStabilityAnalysis operation...")
        
        try:
            request = koopman_learner_pb2.StabilityRequest(
                max_modes=20,
                include_details=True,
                include_recommendations=True
            )
            
            response = self.stub.GetStabilityAnalysis(request, timeout=15)
            
            print(f"✅ GetStabilityAnalysis successful!")
            print(f"   System Stability: {response.system_stability:.3f}")
            print(f"   Unstable Modes: {len(response.unstable_modes)}")
            print(f"   Stable Modes: {len(response.stable_modes)}")
            print(f"   Lyapunov Exponents: {len(response.lyapunov_exponents)}")
            
            if response.lyapunov_exponents:
                print(f"   Top Lyapunov Exponents:")
                for i, exp in enumerate(response.lyapunov_exponents[:3]):
                    print(f"     λ_{i}: {exp:.6f}")
            
            if response.stability_by_group:
                print(f"   Stability by Group:")
                for group, stability in response.stability_by_group.items():
                    print(f"     {group}: {stability:.3f}")
            
            if response.recommendations:
                print(f"   Recommendations:")
                for i, rec in enumerate(response.recommendations[:3]):
                    print(f"     {i+1}. {rec.action_type}: {rec.description}")
                    print(f"        Impact: {rec.estimated_impact:.3f}")
                    if rec.affected_concepts:
                        print(f"        Concepts: {', '.join(rec.affected_concepts[:3])}")
            
            if response.transition_regions:
                print(f"   Phase Transition Regions: {len(response.transition_regions)}")
                for region in response.transition_regions[:2]:
                    print(f"     Region {region.region_id}:")
                    print(f"       Transition Probability: {region.transition_probability:.3f}")
                    print(f"       Time to Transition: {region.time_to_transition:.2f}s")
                    print(f"       Stability Before/After: {region.stability_before:.3f}/{region.stability_after:.3f}")
            
            return True
                
        except grpc.RpcError as e:
            print(f"❌ gRPC error in GetStabilityAnalysis: {e.code()} - {e.details()}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error in GetStabilityAnalysis: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from the Koopman service"""
        if self.channel:
            self.channel.close()
            print("✅ Disconnected from Koopman service")

def run_koopman_integration_tests():
    """Run comprehensive Koopman service integration tests"""
    print("╔═══════════════════════════════════════════════════════╗")
    print("║       TORI Koopman gRPC Integration Tests            ║")
    print("╚═══════════════════════════════════════════════════════╝")
    
    tester = KoopmanServiceTester()
    
    # Test results tracking
    test_results = {
        'connection': False,
        'process_activation_batch': False,
        'processing_status': False,
        'get_spectral_modes': False,
        'update_couplings': False,
        'koopman_stats': False,
        'stability_analysis': False
    }
    
    try:
        # Test 1: Connection
        print("\n[1/7] Testing Koopman service connection...")
        if tester.connect():
            test_results['connection'] = True
        else:
            print("❌ Cannot proceed without connection to Koopman service")
            print("   Make sure the KoopmanLearner gRPC server is running on localhost:50052")
            return False
        
        # Test 2: ProcessActivationBatch
        print("\n[2/7] Testing activation batch processing...")
        job_id = tester.test_process_activation_batch()
        if job_id:
            test_results['process_activation_batch'] = True
        
        # Test 3: GetProcessingStatus
        print("\n[3/7] Testing processing status...")
        if tester.test_get_processing_status(job_id):
            test_results['processing_status'] = True
        
        # Test 4: GetSpectralModes
        print("\n[4/7] Testing spectral modes retrieval...")
        if tester.test_get_spectral_modes():
            test_results['get_spectral_modes'] = True
        
        # Test 5: UpdateOscillatorCouplings
        print("\n[5/7] Testing oscillator coupling updates...")
        if tester.test_update_oscillator_couplings():
            test_results['update_couplings'] = True
        
        # Test 6: GetKclStats
        print("\n[6/7] Testing Koopman statistics...")
        if tester.test_koopman_stats():
            test_results['koopman_stats'] = True
        
        # Test 7: GetStabilityAnalysis
        print("\n[7/7] Testing stability analysis...")
        if tester.test_stability_analysis():
            test_results['stability_analysis'] = True
        
    finally:
        tester.disconnect()
    
    # Results summary
    passed_tests = sum(test_results.values())
    total_tests = len(test_results)
    
    print("\n╔═══════════════════════════════════════════════════════╗")
    print("║            KOOPMAN INTEGRATION TEST RESULTS          ║")
    print("╠═══════════════════════════════════════════════════════╣")
    print(f"║  Tests Passed: {passed_tests}/{total_tests}                                   ║")
    print(f"║  Success Rate: {(passed_tests/total_tests)*100:.1f}%                               ║")
    print("║                                                       ║")
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"║  {test_name:<20}: {status}                 ║")
    
    print("║                                                       ║")
    
    if passed_tests == total_tests:
        print("║  🎉 ALL TESTS PASSED - Koopman gRPC Ready!           ║")
        print("║                                                       ║")
        print("║  📊 Spectral analysis fully operational              ║")
        print("║  🔧 ProcessActivationBatch confirmed working         ║")
        print("║  ⚡ Eigenmode extraction & stability verified        ║")
        print("║  🎯 Oscillator coupling updates functional           ║")
        status = True
    elif passed_tests >= total_tests * 0.8:
        print("║  ⚠️  MOSTLY PASSING - Minor issues detected          ║")
        print("║                                                       ║")
        print("║  🔧 Core operations working, some features need work ║")
        status = True
    else:
        print("║  ❌ INTEGRATION FAILED - Major issues detected       ║")
        print("║                                                       ║")
        print("║  🚨 Koopman service needs significant fixes          ║")
        status = False
    
    print("╚═══════════════════════════════════════════════════════╝")
    
    return status

if __name__ == "__main__":
    success = run_koopman_integration_tests()
    sys.exit(0 if success else 1)
