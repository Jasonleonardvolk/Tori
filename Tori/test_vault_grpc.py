#!/usr/bin/env python3
"""
TORI Vault gRPC Service Integration Test
Validates PutEpisode, GetEpisode, and StartConsolidation operations
"""

import grpc
import sys
import os
import time
import json
from datetime import datetime, timezone

# Add proto generated files to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'proto', 'generated', 'python'))

try:
    import vault_pb2
    import vault_pb2_grpc
    import episodic_pb2
    print("✅ Successfully imported generated proto modules")
except ImportError as e:
    print(f"❌ Failed to import proto modules: {e}")
    print("Please run regenerate-grpc-protos.bat first")
    sys.exit(1)

class VaultServiceTester:
    def __init__(self, server_address='localhost:50051'):
        self.server_address = server_address
        self.channel = None
        self.stub = None
        
    def connect(self):
        """Connect to the vault gRPC service"""
        try:
            self.channel = grpc.insecure_channel(self.server_address)
            self.stub = vault_pb2_grpc.VaultServiceStub(self.channel)
            
            # Test connection with a simple call
            grpc.channel_ready_future(self.channel).result(timeout=5)
            print(f"✅ Connected to vault service at {self.server_address}")
            return True
            
        except grpc.RpcError as e:
            print(f"❌ Failed to connect to vault service: {e}")
            return False
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False
    
    def test_put_episode(self):
        """Test PutEpisode operation"""
        print("\n🧪 Testing PutEpisode operation...")
        
        try:
            # Create a test episode
            episode = episodic_pb2.Episode(
                id=f"test_episode_{int(time.time())}",
                timestamp=int(time.time()),
                ref_count=1,
                tags=["test", "grpc_test", "vault_test"],
                energy=0.75,
                metadata={"test_type": "grpc_integration", "created_by": "vault_tester"}
            )
            
            # Add source info
            episode.source.type = "test"
            episode.source.id = "grpc_test_source"
            episode.source.user_id = "test_user_123"
            episode.source.data["test_data"] = "vault_integration_test"
            
            # Add concept activation
            episode.activation.active_concepts.extend(["concept_1", "concept_2", "concept_3"])
            episode.activation.strengths.extend([0.8, 0.6, 0.4])
            
            # Create vault put request
            request = vault_pb2.VaultPutRequest(
                episode=episode,
                protection_level=vault_pb2.ProtectionLevel.UNPROTECTED,
                immediate_consolidation=False,
                ttl_hours=24
            )
            
            # Add phase signature
            request.phase_signature.primary_phase = 1.57  # π/2
            request.phase_signature.coherence = 0.85
            request.phase_signature.stability = 0.92
            request.phase_signature.amplitude = 1.0
            request.phase_signature.phase_timestamp = int(time.time())
            
            # Add access control
            request.access_control.owner_id = "test_user_123"
            request.access_control.require_consent = False
            request.access_control.enable_audit_trail = True
            
            # Execute the request
            response = self.stub.PutEpisode(request, timeout=10)
            
            if response.success:
                print(f"✅ PutEpisode successful!")
                print(f"   Vault ID: {response.vault_id}")
                print(f"   Episode ID: {response.episode_id}")
                print(f"   Vault Segment: {response.vault_segment}")
                
                if response.phase_alignment.success:
                    print(f"   Phase Alignment Score: {response.phase_alignment.alignment_score:.3f}")
                    print(f"   Final Coherence: {response.phase_alignment.final_coherence:.3f}")
                
                if response.storage_metrics.storage_time_ms > 0:
                    print(f"   Storage Time: {response.storage_metrics.storage_time_ms}ms")
                    print(f"   Compression Ratio: {response.storage_metrics.compression_ratio:.2f}")
                
                return response.vault_id, response.episode_id
            else:
                print(f"❌ PutEpisode failed: {response.error_message}")
                return None, None
                
        except grpc.RpcError as e:
            print(f"❌ gRPC error in PutEpisode: {e.code()} - {e.details()}")
            return None, None
        except Exception as e:
            print(f"❌ Unexpected error in PutEpisode: {e}")
            return None, None
    
    def test_get_episode(self, vault_id, episode_id):
        """Test GetEpisode operation"""
        print(f"\n🧪 Testing GetEpisode operation...")
        
        if not vault_id and not episode_id:
            print("❌ No valid ID to test GetEpisode")
            return False
        
        try:
            # Test retrieval by vault ID
            if vault_id:
                request = vault_pb2.VaultGetRequest(
                    id=vault_id,
                    id_type=vault_pb2.IdType.VAULT_ID,
                    update_access_time=True,
                    include_metadata=True
                )
                
                # Add access credentials
                request.credentials.user_id = "test_user_123"
                request.credentials.role = "tester"
                request.credentials.session_id = f"test_session_{int(time.time())}"
                
                response = self.stub.GetEpisode(request, timeout=10)
                
                if response.success:
                    print(f"✅ GetEpisode by vault ID successful!")
                    print(f"   Retrieved Episode ID: {response.episode.id}")
                    print(f"   Episode Tags: {', '.join(response.episode.tags)}")
                    print(f"   Episode Energy: {response.episode.energy:.3f}")
                    print(f"   Protection Level: {vault_pb2.ProtectionLevel.Name(response.protection_level)}")
                    print(f"   From Cache: {response.from_cache}")
                    
                    if response.access_metadata.access_granted:
                        print(f"   Access Granted: {response.access_metadata.access_granted}")
                        print(f"   Access Method: {response.access_metadata.access_method}")
                        print(f"   Audit Entry: {response.access_metadata.audit_entry_id}")
                    
                    if response.phase_verification.verified:
                        print(f"   Phase Verified: {response.phase_verification.verified}")
                        print(f"   Phase Drift: {response.phase_verification.phase_drift:.6f}")
                        print(f"   Verification Confidence: {response.phase_verification.confidence:.3f}")
                    
                    return True
                else:
                    print(f"❌ GetEpisode failed: {response.error_message}")
                    return False
            
        except grpc.RpcError as e:
            print(f"❌ gRPC error in GetEpisode: {e.code()} - {e.details()}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error in GetEpisode: {e}")
            return False
    
    def test_start_consolidation(self):
        """Test StartConsolidation operation"""
        print(f"\n🧪 Testing StartConsolidation operation...")
        
        try:
            # Create consolidation request
            request = vault_pb2.ConsolidationRequest(
                filter_user_id="test_user_123",
                async_mode=True,
                priority=5
            )
            
            # Set time range (last hour)
            current_time = int(time.time())
            request.time_range.start_time = current_time - 3600  # 1 hour ago
            request.time_range.end_time = current_time
            
            # Set consolidation parameters
            request.params.max_episodes_per_batch = 10
            request.params.energy_threshold = 0.5
            request.params.coherence_threshold = 0.7
            request.params.perform_lyapunov_analysis = True
            request.params.update_phase_signatures = True
            request.params.sleep_cycle_duration = 300  # 5 minutes
            request.params.memory_pressure_threshold = 0.8
            
            response = self.stub.StartConsolidation(request, timeout=10)
            
            if response.success:
                print(f"✅ StartConsolidation successful!")
                print(f"   Job ID: {response.job_id}")
                print(f"   Episodes to Consolidate: {response.episodes_to_consolidate}")
                print(f"   Estimated Completion: {datetime.fromtimestamp(response.estimated_completion, tz=timezone.utc)}")
                
                return response.job_id
            else:
                print(f"❌ StartConsolidation failed: {response.error_message}")
                return None
                
        except grpc.RpcError as e:
            print(f"❌ gRPC error in StartConsolidation: {e.code()} - {e.details()}")
            return None
        except Exception as e:
            print(f"❌ Unexpected error in StartConsolidation: {e}")
            return None
    
    def test_get_consolidation_status(self, job_id):
        """Test GetConsolidationStatus operation"""
        print(f"\n🧪 Testing GetConsolidationStatus operation...")
        
        if not job_id:
            print("❌ No job ID to test consolidation status")
            return False
        
        try:
            request = vault_pb2.ConsolidationStatusRequest(job_id=job_id)
            response = self.stub.GetConsolidationStatus(request, timeout=10)
            
            if response.success:
                print(f"✅ GetConsolidationStatus successful!")
                print(f"   Job Status: {vault_pb2.ConsolidationJobStatus.Name(response.status)}")
                print(f"   Progress: {response.progress:.1f}%")
                print(f"   Episodes Processed: {response.episodes_processed}")
                print(f"   Episodes Remaining: {response.episodes_remaining}")
                print(f"   Current Operation: {response.current_operation}")
                
                if response.metrics.total_processing_time > 0:
                    print(f"   Processing Time: {response.metrics.total_processing_time:.2f}s")
                    print(f"   Avg Episode Time: {response.metrics.avg_episode_processing_time:.2f}ms")
                    print(f"   Phase Coherence Improvement: {response.metrics.phase_coherence_improvement:.3f}")
                
                return True
            else:
                print(f"❌ GetConsolidationStatus failed: {response.error_message}")
                return False
                
        except grpc.RpcError as e:
            print(f"❌ gRPC error in GetConsolidationStatus: {e.code()} - {e.details()}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error in GetConsolidationStatus: {e}")
            return False
    
    def test_vault_stats(self):
        """Test GetVaultStats operation"""
        print(f"\n🧪 Testing GetVaultStats operation...")
        
        try:
            request = vault_pb2.VaultStatsRequest(
                include_details=True,
                user_id="test_user_123"
            )
            
            # Set time range (last 24 hours)
            current_time = int(time.time())
            request.time_range.start_time = current_time - 86400  # 24 hours ago
            request.time_range.end_time = current_time
            
            response = self.stub.GetVaultStats(request, timeout=10)
            
            if response.success:
                print(f"✅ GetVaultStats successful!")
                print(f"   Total Episodes: {response.total_episodes}")
                print(f"   Total Size: {response.total_size_bytes} bytes")
                print(f"   Average Episode Size: {response.avg_episode_size:.2f} bytes")
                print(f"   Storage Efficiency: {response.storage_efficiency:.3f}")
                print(f"   Backup Coverage: {response.backup_coverage:.1f}%")
                
                if response.episodes_by_protection_level:
                    print("   Episodes by Protection Level:")
                    for level, count in response.episodes_by_protection_level.items():
                        print(f"     {level}: {count}")
                
                if response.phase_distribution.avg_coherence > 0:
                    print(f"   Average Phase Coherence: {response.phase_distribution.avg_coherence:.3f}")
                    print(f"   Coherence Std Dev: {response.phase_distribution.coherence_stddev:.3f}")
                
                return True
            else:
                print(f"❌ GetVaultStats failed: {response.error_message}")
                return False
                
        except grpc.RpcError as e:
            print(f"❌ gRPC error in GetVaultStats: {e.code()} - {e.details()}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error in GetVaultStats: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from the vault service"""
        if self.channel:
            self.channel.close()
            print("✅ Disconnected from vault service")

def run_vault_integration_tests():
    """Run comprehensive vault service integration tests"""
    print("╔═══════════════════════════════════════════════════════╗")
    print("║         TORI Vault gRPC Integration Tests            ║")
    print("╚═══════════════════════════════════════════════════════╝")
    
    tester = VaultServiceTester()
    
    # Test results tracking
    test_results = {
        'connection': False,
        'put_episode': False,
        'get_episode': False,
        'start_consolidation': False,
        'consolidation_status': False,
        'vault_stats': False
    }
    
    try:
        # Test 1: Connection
        print("\n[1/6] Testing vault service connection...")
        if tester.connect():
            test_results['connection'] = True
        else:
            print("❌ Cannot proceed without connection to vault service")
            print("   Make sure the vault gRPC server is running on localhost:50051")
            return False
        
        # Test 2: PutEpisode
        print("\n[2/6] Testing episode storage...")
        vault_id, episode_id = tester.test_put_episode()
        if vault_id or episode_id:
            test_results['put_episode'] = True
        
        # Test 3: GetEpisode
        print("\n[3/6] Testing episode retrieval...")
        if tester.test_get_episode(vault_id, episode_id):
            test_results['get_episode'] = True
        
        # Test 4: StartConsolidation
        print("\n[4/6] Testing memory consolidation...")
        job_id = tester.test_start_consolidation()
        if job_id:
            test_results['start_consolidation'] = True
        
        # Test 5: ConsolidationStatus
        print("\n[5/6] Testing consolidation status...")
        if tester.test_get_consolidation_status(job_id):
            test_results['consolidation_status'] = True
        
        # Test 6: VaultStats
        print("\n[6/6] Testing vault statistics...")
        if tester.test_vault_stats():
            test_results['vault_stats'] = True
        
    finally:
        tester.disconnect()
    
    # Results summary
    passed_tests = sum(test_results.values())
    total_tests = len(test_results)
    
    print("\n╔═══════════════════════════════════════════════════════╗")
    print("║              VAULT INTEGRATION TEST RESULTS          ║")
    print("╠═══════════════════════════════════════════════════════╣")
    print(f"║  Tests Passed: {passed_tests}/{total_tests}                                   ║")
    print(f"║  Success Rate: {(passed_tests/total_tests)*100:.1f}%                               ║")
    print("║                                                       ║")
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"║  {test_name:<20}: {status}                 ║")
    
    print("║                                                       ║")
    
    if passed_tests == total_tests:
        print("║  🎉 ALL TESTS PASSED - Vault gRPC Ready!             ║")
        print("║                                                       ║")
        print("║  📊 Vault service is fully operational               ║")
        print("║  🔧 PutEpisode, GetEpisode confirmed working         ║")
        print("║  ⚡ StartConsolidation integration verified          ║")
        status = True
    elif passed_tests >= total_tests * 0.8:
        print("║  ⚠️  MOSTLY PASSING - Minor issues detected          ║")
        print("║                                                       ║")
        print("║  🔧 Core operations working, some features need work ║")
        status = True
    else:
        print("║  ❌ INTEGRATION FAILED - Major issues detected       ║")
        print("║                                                       ║")
        print("║  🚨 Vault service needs significant fixes            ║")
        status = False
    
    print("╚═══════════════════════════════════════════════════════╝")
    
    return status

if __name__ == "__main__":
    success = run_vault_integration_tests()
    sys.exit(0 if success else 1)
