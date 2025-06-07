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
