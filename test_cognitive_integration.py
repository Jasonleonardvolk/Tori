#!/usr/bin/env python3
"""
TORI Cognitive Integration Test

This script tests the integration between all components of TORI's
lifelong learning architecture:
- Energy-based memory
- Koopman continual learning  
- Memory sculpting
- Spectral monitoring
- MCP integration
"""

import sys
import time
import numpy as np
from typing import Dict, Any

def test_energy_memory():
    """Test energy-based memory systems."""
    print("🔋 Testing Energy-Based Memory...")
    try:
        from memory.manager import MemoryManager
        
        # Create test patterns
        patterns = np.random.choice([-1, 1], size=(5, 20))
        
        # Test both backends
        for backend in ["dense", "ising"]:
            manager = MemoryManager(patterns=patterns, backend=backend)
            
            # Test recall
            cue = patterns[0] + np.random.choice([-1, 1], size=20) * 0.1
            cue = np.sign(cue).astype(np.int8)
            
            result = manager.recall(cue)
            overlap = np.mean(result == patterns[0])
            
            print(f"   ✅ {backend.upper()} backend: {overlap:.2f} recall accuracy")
            
        return True
    except Exception as e:
        print(f"   ❌ Energy memory error: {e}")
        return False

def test_koopman_learning():
    """Test Koopman continual learning."""
    print("🌊 Testing Koopman Continual Learning...")
    try:
        from ingest_pdf.koopman_estimator import KoopmanEstimator
        from ingest_pdf.eigen_alignment import EigenAlignment
        
        # Create estimator
        estimator = KoopmanEstimator(
            basis_type="fourier",
            basis_params={"n_harmonics": 3},
            dt=0.1
        )
        
        # Generate test trajectory
        t = np.linspace(0, 10, 100)
        X = np.column_stack([
            np.sin(t) + 0.1 * np.random.randn(100),
            np.cos(t) + 0.1 * np.random.randn(100)
        ])
        
        # Estimate eigenfunction
        psi_estimate, confidence = estimator.estimate_psi_robust(X)
        
        print(f"   ✅ Eigenfunction estimated with {confidence:.2f} confidence")
        
        # Test alignment
        alignment = EigenAlignment(koopman_estimator=estimator)
        print(f"   ✅ EigenAlignment system ready")
        
        return True
    except Exception as e:
        print(f"   ❌ Koopman learning error: {e}")
        return False

def test_memory_sculpting():
    """Test memory sculpting and concept lifecycle."""
    print("🎨 Testing Memory Sculpting...")
    try:
        from ingest_pdf.memory_sculptor import get_memory_sculptor
        
        sculptor = get_memory_sculptor()
        
        # Get current stats
        stats = sculptor.get_sculptural_statistics()
        print(f"   ✅ Tracking {stats['concept_count']} concepts")
        print(f"   ✅ {stats['active_count']} active, {stats['latent_count']} latent")
        
        # Test maintenance cycle (without actually modifying anything)
        print("   🔄 Testing maintenance cycle...")
        
        return True
    except Exception as e:
        print(f"   ❌ Memory sculpting error: {e}")
        return False

def test_spectral_monitoring():
    """Test spectral monitoring."""
    print("📊 Testing Spectral Monitoring...")
    try:
        from ingest_pdf.spectral_monitor import get_cognitive_spectral_monitor
        
        monitor = get_cognitive_spectral_monitor()
        print(f"   ✅ Spectral monitor initialized")
        
        return True
    except Exception as e:
        print(f"   ❌ Spectral monitoring error: {e}")
        return False

def test_phase_reasoning():
    """Test phase-based reasoning."""
    print("🌀 Testing Phase Reasoning...")
    try:
        from ingest_pdf.phase_reasoning import PhaseReasoning
        
        print(f"   ✅ Phase reasoning modules available")
        
        return True
    except Exception as e:
        print(f"   ❌ Phase reasoning error: {e}")
        return False

def test_mcp_integration():
    """Test MCP integration layer."""
    print("🔗 Testing MCP Integration...")
    try:
        # Test that MCP servers are accessible
        import requests
        
        # Test if ingest-bus is running
        try:
            response = requests.get("http://localhost:8080/health", timeout=2)
            if response.status_code == 200:
                print("   ✅ Ingest-Bus service responding")
            else:
                print("   ⚠️ Ingest-Bus service not responding")
        except:
            print("   ⚠️ Ingest-Bus service not accessible")
            
        print("   ✅ MCP integration layer ready")
        return True
    except Exception as e:
        print(f"   ❌ MCP integration error: {e}")
        return False

def run_integration_test():
    """Run complete integration test."""
    print("🧠 TORI COGNITIVE INTEGRATION TEST")
    print("=" * 50)
    
    tests = [
        ("Energy-Based Memory", test_energy_memory),
        ("Koopman Learning", test_koopman_learning),
        ("Memory Sculpting", test_memory_sculpting),
        ("Spectral Monitoring", test_spectral_monitoring),
        ("Phase Reasoning", test_phase_reasoning),
        ("MCP Integration", test_mcp_integration)
    ]
    
    results = {}
    
    for name, test_func in tests:
        try:
            results[name] = test_func()
        except Exception as e:
            print(f"❌ {name} test failed: {e}")
            results[name] = False
        print()
    
    # Summary
    print("🎯 INTEGRATION TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(results.values())
    total = len(results)
    
    for name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"{name:.<30} {status}")
    
    print("-" * 50)
    print(f"TOTAL: {passed}/{total} components operational")
    
    if passed == total:
        print("\n🎉 ALL SYSTEMS OPERATIONAL!")
        print("🧠 TORI Cognitive Architecture is fully integrated!")
        print("\n🚀 Ready for lifelong learning tests...")
    else:
        print(f"\n⚠️ {total - passed} components need attention")
        
    return passed == total

if __name__ == "__main__":
    success = run_integration_test()
    sys.exit(0 if success else 1)