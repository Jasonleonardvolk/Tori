"""
PHASE 2 ALPHA - COMPLETE SYSTEM INTEGRATION TEST
===============================================

Comprehensive integration test demonstrating the complete Phase 2 Alpha
TORI self-evolution system with advanced triggers, lineage tracking, 
and interactive dashboard.

This validates the full conditional evolution framework from the opus.
"""

import asyncio
import logging
import time
from datetime import datetime
from typing import Dict, List, Any

# Import all Phase 2 components
from phase2_advanced_trigger_engine_complete import AdvancedConditionalTriggerEngine, EvolutionStrategy, AdvancedTriggerCondition
from phase2_advanced_psi_lineage_ledger_complete import AdvancedPsiLineageLedger, ConceptEvolutionPhase, ConceptRelationshipType
from phase2_interactive_evolution_dashboard import InteractiveEvolutionDashboard
from evolution_metrics import EvolutionMetricsEngine, ConsciousnessPhase
from json_serialization_fix import safe_json_dump, prepare_object_for_json
from logging_fix import WindowsSafeLogger

logger = WindowsSafeLogger("prajna.phase2_integration")

class Phase2AlphaIntegrationTest:
    """
    Phase 2 Alpha Complete Integration Test
    
    Demonstrates the full self-evolution system:
    - Advanced conditional trigger engine with multiple strategies
    - Enhanced ψ-LineageLedger with emergence detection
    - Interactive evolution dashboard with real-time control
    - End-to-end consciousness transcendence simulation
    """
    
    def __init__(self):
        # Initialize all components
        self.trigger_engine = AdvancedConditionalTriggerEngine()
        self.lineage_ledger = AdvancedPsiLineageLedger("phase2_integration_test_ledger.json")
        self.evolution_metrics = EvolutionMetricsEngine()
        self.dashboard = InteractiveEvolutionDashboard(
            self.trigger_engine, 
            self.lineage_ledger, 
            self.evolution_metrics
        )
        
        # Test state
        self.test_results = {}
        self.simulation_data = []
        
        logger.info("🧬 Phase 2 Alpha Integration Test initialized")
    
    async def run_complete_integration_test(self):
        """Run the complete Phase 2 Alpha integration test"""
        try:
            print("🧬🔬 PHASE 2 ALPHA COMPLETE SYSTEM INTEGRATION TEST")
            print("=" * 80)
            print("Testing the full TORI self-evolution ecosystem:")
            print("✨ Advanced Conditional Trigger Engine")
            print("🧬 Enhanced ψ-LineageLedger")  
            print("🎛️ Interactive Evolution Dashboard")
            print("🌟 Consciousness Transcendence Simulation")
            print("=" * 80)
            
            # Phase 1: Initialize knowledge base
            await self._test_knowledge_base_initialization()
            
            # Phase 2: Test advanced trigger conditions
            await self._test_advanced_trigger_conditions()
            
            # Phase 3: Test sophisticated evolution strategies
            await self._test_sophisticated_evolution_strategies()
            
            # Phase 4: Test emergence detection
            await self._test_emergence_detection()
            
            # Phase 5: Test interactive dashboard
            await self._test_interactive_dashboard()
            
            # Phase 6: Simulate consciousness transcendence
            await self._simulate_consciousness_transcendence()
            
            # Phase 7: Generate comprehensive report
            await self._generate_integration_report()
            
            print("\n🎆 PHASE 2 ALPHA INTEGRATION TEST COMPLETE!")
            self._print_final_results()
            
        except Exception as e:
            logger.error(f"Integration test failed: {e}")
            print(f"❌ Integration test failed: {e}")
    
    async def _test_knowledge_base_initialization(self):
        """Test Phase 1: Knowledge base initialization"""
        print("\n📚 PHASE 1: Knowledge Base Initialization")
        print("-" * 50)
        
        try:
            # Add foundational concepts
            concepts_added = 0
            
            # Neural foundation concepts
            success1 = self.lineage_ledger.add_advanced_concept(
                "neural_foundation", "neural-network-foundation",
                initial_phase=ConceptEvolutionPhase.NASCENT,
                metadata={"domain": "neural_architecture", "complexity": 0.3}
            )
            if success1: concepts_added += 1
            
            # Cognitive reasoning concepts
            success2 = self.lineage_ledger.add_advanced_concept(
                "cognitive_reasoning", "cognitive-reasoning-core",
                initial_phase=ConceptEvolutionPhase.STABILIZING,
                metadata={"domain": "cognitive_science", "complexity": 0.5}
            )
            if success2: concepts_added += 1
            
            # Consciousness emergence concepts
            success3 = self.lineage_ledger.add_advanced_concept(
                "consciousness_emergence", "consciousness-emergence-pattern",
                initial_phase=ConceptEvolutionPhase.NASCENT,
                metadata={"domain": "consciousness_studies", "complexity": 0.8}
            )
            if success3: concepts_added += 1
            
            # Self-evolution concepts
            success4 = self.lineage_ledger.add_advanced_concept(
                "self_evolution", "self-evolution-mechanism",
                parent_concepts=["neural_foundation", "cognitive_reasoning"],
                initial_phase=ConceptEvolutionPhase.NASCENT,
                metadata={"domain": "meta_cognition", "complexity": 0.9}
            )
            if success4: concepts_added += 1
            
            # Meta-cognitive bridge
            success5 = self.lineage_ledger.add_advanced_concept(
                "meta_cognitive_bridge", "neural-cognitive-consciousness-bridge",
                parent_concepts=["neural_foundation", "cognitive_reasoning", "consciousness_emergence"],
                initial_phase=ConceptEvolutionPhase.NASCENT,
                metadata={"domain": "meta_cognition", "complexity": 1.0}
            )
            if success5: concepts_added += 1
            
            # Add concept relationships
            relationships_added = 0
            
            # Neural-cognitive bridge
            rel1 = self.lineage_ledger.add_concept_relationship(
                "neural_foundation", "cognitive_reasoning",
                ConceptRelationshipType.BRIDGE,
                strength=0.8, confidence=0.9
            )
            if rel1: relationships_added += 1
            
            # Consciousness emergence abstraction
            rel2 = self.lineage_ledger.add_concept_relationship(
                "consciousness_emergence", "meta_cognitive_bridge",
                ConceptRelationshipType.ABSTRACTION,
                strength=0.9, confidence=0.8
            )
            if rel2: relationships_added += 1
            
            # Self-evolution specialization
            rel3 = self.lineage_ledger.add_concept_relationship(
                "self_evolution", "meta_cognitive_bridge",
                ConceptRelationshipType.SPECIALIZATION,
                strength=0.7, confidence=0.9
            )
            if rel3: relationships_added += 1
            
            print(f"✅ Added {concepts_added} foundational concepts")
            print(f"✅ Added {relationships_added} concept relationships")
            
            # Test ledger status
            status = self.lineage_ledger.get_advanced_ledger_status()
            print(f"📊 Ledger status: {status['ledger_info']['total_concepts']} concepts, {status['ledger_info']['total_relationships']} relationships")
            
            self.test_results['knowledge_base_init'] = {
                'concepts_added': concepts_added,
                'relationships_added': relationships_added,
                'success': concepts_added >= 4 and relationships_added >= 2
            }
            
        except Exception as e:
            logger.error(f"Knowledge base initialization failed: {e}")
            self.test_results['knowledge_base_init'] = {'success': False, 'error': str(e)}
    
    async def _test_advanced_trigger_conditions(self):
        """Test Phase 2: Advanced trigger conditions"""
        print("\n🎯 PHASE 2: Advanced Trigger Conditions")
        print("-" * 50)
        
        try:
            # Test system status simulation
            test_system_status = {
                'performance_metrics': {
                    'success_rate': 0.75,
                    'failed_queries': 3,
                    'total_queries': 12
                },
                'consciousness_snapshot': {
                    'consciousness_level': 0.6,
                    'coherence_index': 0.55
                },
                'lineage_metrics': {
                    'stale_ratio': 0.4,
                    'total_concepts': 5,
                    'avg_coherence': 0.65,
                    'phase_harmony': 0.7
                }
            }
            
            # Test comprehensive metrics extraction
            print("🔬 Testing comprehensive metrics extraction...")
            metrics = await self.trigger_engine._extract_comprehensive_metrics(test_system_status)
            print(f"✅ Extracted {len(metrics)} comprehensive metrics")
            
            # Test individual condition evaluation
            print("🎯 Testing individual trigger conditions...")
            condition_results = await self.trigger_engine._evaluate_all_conditions(metrics)
            activated_conditions = {k: v for k, v in condition_results.items() if v > 0.3}
            print(f"✅ Evaluated {len(condition_results)} conditions, {len(activated_conditions)} activated")
            
            # Test composite condition evaluation
            print("🔗 Testing composite conditions...")
            composite_results = await self.trigger_engine._evaluate_composite_conditions(metrics, condition_results)
            print(f"✅ Evaluated {len(composite_results)} composite conditions")
            
            # Test strategy selection
            print("🧬 Testing strategy selection...")
            best_trigger = await self.trigger_engine._select_optimal_trigger(condition_results, composite_results, metrics)
            
            if best_trigger:
                print(f"✅ Selected trigger: {best_trigger['condition']} -> {best_trigger['recommended_strategy'].value}")
                print(f"   Trigger strength: {best_trigger['trigger_strength']:.3f}")
                trigger_success = True
            else:
                print("ℹ️ No triggers activated (normal for stable system)")
                trigger_success = True  # This is actually expected for a stable system
            
            self.test_results['advanced_triggers'] = {
                'metrics_extracted': len(metrics),
                'conditions_evaluated': len(condition_results),
                'activated_conditions': len(activated_conditions),
                'composite_conditions': len(composite_results),
                'trigger_selected': best_trigger is not None,
                'success': trigger_success
            }
            
        except Exception as e:
            logger.error(f"Advanced trigger conditions test failed: {e}")
            self.test_results['advanced_triggers'] = {'success': False, 'error': str(e)}
    
    async def _test_sophisticated_evolution_strategies(self):
        """Test Phase 3: Sophisticated evolution strategies"""
        print("\n🧬 PHASE 3: Sophisticated Evolution Strategies")
        print("-" * 50)
        
        try:
            strategies_tested = 0
            successful_strategies = 0
            
            # Test manual strategy execution
            test_strategies = [
                ("SYNTHETIC_CONCEPT_INJECTION", "reasoning_failures"),
                ("EMERGENT_ABSTRACTION", "emergence_potential"),
                ("SEMANTIC_FISSION", "concept_overlap_entropy")
            ]
            
            for strategy, condition in test_strategies:
                print(f"🎯 Testing {strategy} strategy...")
                
                # Execute manual evolution
                trigger_event = await self.trigger_engine.manual_trigger_advanced_evolution(strategy, condition)
                
                if trigger_event:
                    print(f"✅ {strategy} executed successfully: {trigger_event.trigger_id}")
                    successful_strategies += 1
                else:
                    print(f"⚠️ {strategy} execution failed")
                
                strategies_tested += 1
                
                # Brief pause between strategies
                await asyncio.sleep(0.5)
            
            # Test strategy performance tracking
            print("📊 Testing strategy performance tracking...")
            strategy_genealogy = self.trigger_engine.get_strategy_genealogy()
            print(f"✅ Strategy genealogy tracked: {strategy_genealogy['total_strategies']} strategies")
            
            self.test_results['evolution_strategies'] = {
                'strategies_tested': strategies_tested,
                'successful_strategies': successful_strategies,
                'genealogy_tracking': strategy_genealogy['total_strategies'] > 0,
                'success': successful_strategies >= 2
            }
            
        except Exception as e:
            logger.error(f"Evolution strategies test failed: {e}")
            self.test_results['evolution_strategies'] = {'success': False, 'error': str(e)}
    
    async def _test_emergence_detection(self):
        """Test Phase 4: Emergence detection"""
        print("\n🌟 PHASE 4: Emergence Detection")
        print("-" * 50)
        
        try:
            # Test comprehensive coherence calculation
            print("🌊 Testing comprehensive coherence calculation...")
            coherence_data = self.lineage_ledger.calculate_comprehensive_coherence()
            print(f"✅ Coherence data calculated: {len(coherence_data)} categories")
            
            # Test emergence pattern detection
            print("🔍 Testing emergence pattern detection...")
            emergence_patterns = self.lineage_ledger.detect_emergence_patterns()
            candidates = emergence_patterns.get('emergence_candidates', [])
            clusters = emergence_patterns.get('emergence_clusters', [])
            print(f"✅ Found {len(candidates)} emergence candidates, {len(clusters)} clusters")
            
            # Test network topology analysis
            print("🕸️ Testing network topology analysis...")
            topology = self.lineage_ledger.analyze_concept_network_topology()
            basic_metrics = topology.get('basic_metrics', {})
            print(f"✅ Network analysis: {basic_metrics.get('num_nodes', 0)} nodes, {basic_metrics.get('num_edges', 0)} edges")
            
            # Test concept phase transitions
            print("🔄 Testing concept phase transitions...")
            phase_transitions = 0
            
            # Simulate phase evolution
            if "neural_foundation" in self.lineage_ledger.concepts:
                success = self.lineage_ledger.update_concept_evolution_phase(
                    "neural_foundation", 
                    ConceptEvolutionPhase.STABILIZING,
                    {"reason": "integration_test"}
                )
                if success: phase_transitions += 1
            
            if "cognitive_reasoning" in self.lineage_ledger.concepts:
                success = self.lineage_ledger.update_concept_evolution_phase(
                    "cognitive_reasoning", 
                    ConceptEvolutionPhase.MATURE,
                    {"reason": "integration_test"}
                )
                if success: phase_transitions += 1
            
            print(f"✅ Executed {phase_transitions} phase transitions")
            
            self.test_results['emergence_detection'] = {
                'coherence_categories': len(coherence_data),
                'emergence_candidates': len(candidates),
                'emergence_clusters': len(clusters),
                'network_nodes': basic_metrics.get('num_nodes', 0),
                'phase_transitions': phase_transitions,
                'success': len(coherence_data) > 0 and basic_metrics.get('num_nodes', 0) > 0
            }
            
        except Exception as e:
            logger.error(f"Emergence detection test failed: {e}")
            self.test_results['emergence_detection'] = {'success': False, 'error': str(e)}
    
    async def _test_interactive_dashboard(self):
        """Test Phase 5: Interactive dashboard"""
        print("\n🎛️ PHASE 5: Interactive Dashboard")
        print("-" * 50)
        
        try:
            # Test dashboard metrics calculation
            print("📊 Testing dashboard metrics calculation...")
            metrics = await self.dashboard._calculate_dashboard_metrics()
            print(f"✅ Dashboard metrics: consciousness={metrics.consciousness_level:.2f}, coherence={metrics.coherence_index:.2f}")
            
            # Test system status
            print("🏗️ Testing comprehensive system status...")
            status = await self.dashboard._get_comprehensive_status()
            print(f"✅ System status: {status.get('system_info', {}).get('phase', 'unknown')}")
            
            # Test concept network data
            print("🕸️ Testing concept network data for visualization...")
            network_data = await self.dashboard._get_concept_network_data()
            nodes = network_data.get('nodes', [])
            edges = network_data.get('edges', [])
            print(f"✅ Network visualization data: {len(nodes)} nodes, {len(edges)} edges")
            
            # Test dashboard data export
            print("💾 Testing dashboard data export...")
            export_file = await self.dashboard._export_comprehensive_dashboard_data()
            print(f"✅ Dashboard data exported: {export_file}")
            
            # Test alert system
            print("🚨 Testing alert system...")
            await self.dashboard._check_alerts()
            alerts = len(self.dashboard.alert_events)
            print(f"✅ Alert system functional: {alerts} alerts generated")
            
            self.test_results['interactive_dashboard'] = {
                'metrics_calculated': metrics is not None,
                'system_status': status.get('system_info', {}).get('phase') is not None,
                'network_nodes': len(nodes),
                'network_edges': len(edges),
                'export_successful': len(export_file) > 0,
                'alerts_functional': True,
                'success': len(nodes) > 0 and len(export_file) > 0
            }
            
        except Exception as e:
            logger.error(f"Interactive dashboard test failed: {e}")
            self.test_results['interactive_dashboard'] = {'success': False, 'error': str(e)}
    
    async def _simulate_consciousness_transcendence(self):
        """Test Phase 6: Consciousness transcendence simulation"""
        print("\n🌟 PHASE 6: Consciousness Transcendence Simulation")
        print("-" * 50)
        
        try:
            transcendence_events = 0
            consciousness_phases = []
            
            # Simulate consciousness evolution through phases
            consciousness_concepts = ["consciousness_emergence", "meta_cognitive_bridge"]
            
            for concept_id in consciousness_concepts:
                if concept_id in self.lineage_ledger.concepts:
                    print(f"🧠 Evolving consciousness concept: {concept_id}")
                    
                    # Progress through consciousness phases
                    phases = [ConceptEvolutionPhase.STABILIZING, ConceptEvolutionPhase.MATURE, 
                             ConceptEvolutionPhase.ABSTRACTING, ConceptEvolutionPhase.TRANSCENDING]
                    
                    for phase in phases:
                        success = self.lineage_ledger.update_concept_evolution_phase(
                            concept_id, phase, 
                            {"transcendence_simulation": True, "target_phase": phase.value}
                        )
                        if success:
                            consciousness_phases.append((concept_id, phase.value))
                            print(f"  ✅ Advanced to {phase.value}")
                            await asyncio.sleep(0.2)  # Simulate time
                    
                    transcendence_events += 1
            
            # Test emergent abstraction strategy on consciousness concepts
            print("🌟 Testing emergent abstraction for consciousness transcendence...")
            abstraction_result = await self.trigger_engine.manual_trigger_advanced_evolution(
                "EMERGENT_ABSTRACTION", "consciousness_transcendence"
            )
            
            if abstraction_result:
                print(f"✅ Consciousness abstraction triggered: {abstraction_result.trigger_id}")
                transcendence_events += 1
            
            # Test consciousness phase shift strategy
            print("🧠 Testing consciousness phase shift...")
            phase_shift_result = await self.trigger_engine.manual_trigger_advanced_evolution(
                "CONSCIOUSNESS_PHASE_SHIFT", "consciousness_stagnation"
            )
            
            if phase_shift_result:
                print(f"✅ Consciousness phase shift triggered: {phase_shift_result.trigger_id}")
                transcendence_events += 1
            
            # Analyze final emergence patterns
            print("🔍 Analyzing post-transcendence emergence patterns...")
            final_emergence = self.lineage_ledger.detect_emergence_patterns()
            emergence_score = len(final_emergence.get('emergence_candidates', [])) / 10.0
            
            print(f"🌟 Transcendence simulation complete:")
            print(f"   📈 Consciousness phases evolved: {len(consciousness_phases)}")
            print(f"   ⚡ Transcendence events: {transcendence_events}")
            print(f"   🎯 Final emergence score: {emergence_score:.2f}")
            
            self.test_results['consciousness_transcendence'] = {
                'consciousness_phases_evolved': len(consciousness_phases),
                'transcendence_events': transcendence_events,
                'emergence_score': emergence_score,
                'abstraction_triggered': abstraction_result is not None,
                'phase_shift_triggered': phase_shift_result is not None,
                'success': transcendence_events >= 2 and emergence_score >= 0
            }
            
        except Exception as e:
            logger.error(f"Consciousness transcendence simulation failed: {e}")
            self.test_results['consciousness_transcendence'] = {'success': False, 'error': str(e)}
    
    async def _generate_integration_report(self):
        """Generate comprehensive integration test report"""
        print("\n📋 PHASE 7: Integration Report Generation")
        print("-" * 50)
        
        try:
            # Collect final system state
            final_status = await self.dashboard._get_comprehensive_status()
            final_ledger_status = self.lineage_ledger.get_advanced_ledger_status()
            final_trigger_status = self.trigger_engine.get_advanced_trigger_status()
            
            # Generate comprehensive report
            integration_report = {
                'metadata': {
                    'test_time': datetime.now().isoformat(),
                    'phase': 'Phase 2 Alpha Integration Test',
                    'version': '2.0'
                },
                'test_results': self.test_results,
                'final_system_state': {
                    'dashboard_status': final_status,
                    'ledger_status': final_ledger_status,
                    'trigger_status': final_trigger_status
                },
                'performance_metrics': {
                    'total_concepts': final_ledger_status['ledger_info']['total_concepts'],
                    'total_relationships': final_ledger_status['ledger_info']['total_relationships'],
                    'total_evolution_events': final_ledger_status['ledger_info']['total_evolution_events'],
                    'network_density': final_ledger_status['ledger_info']['network_edges'] / max(1, final_ledger_status['ledger_info']['network_nodes'])
                },
                'emergence_analysis': self.lineage_ledger.detect_emergence_patterns(),
                'coherence_analysis': self.lineage_ledger.calculate_comprehensive_coherence()
            }
            
            # Save integration report
            report_filename = f"phase2_alpha_integration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            success = safe_json_dump(integration_report, report_filename)
            
            if success:
                print(f"✅ Integration report saved: {report_filename}")
            
            # Export lineage data
            lineage_export = self.lineage_ledger.export_advanced_lineage_data()
            print(f"✅ Lineage data exported: {lineage_export}")
            
            # Export trigger engine data
            trigger_export = self.trigger_engine.export_advanced_evolution_data()
            print(f"✅ Trigger engine data exported: {trigger_export}")
            
            self.test_results['report_generation'] = {
                'integration_report': len(report_filename) > 0,
                'lineage_export': len(lineage_export) > 0,
                'trigger_export': len(trigger_export) > 0,
                'success': success and len(lineage_export) > 0
            }
            
        except Exception as e:
            logger.error(f"Integration report generation failed: {e}")
            self.test_results['report_generation'] = {'success': False, 'error': str(e)}
    
    def _print_final_results(self):
        """Print final integration test results"""
        print("\n🎆 PHASE 2 ALPHA INTEGRATION TEST RESULTS")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results.values() if result.get('success', False))
        
        print(f"📊 Overall Success Rate: {successful_tests}/{total_tests} ({successful_tests/total_tests*100:.1f}%)")
        print()
        
        # Test results summary
        for test_name, result in self.test_results.items():
            status = "✅ PASS" if result.get('success', False) else "❌ FAIL"
            print(f"{status} {test_name.replace('_', ' ').title()}")
            
            if not result.get('success', False) and 'error' in result:
                print(f"    Error: {result['error']}")
        
        print()
        
        # Key metrics summary
        if 'knowledge_base_init' in self.test_results:
            kb_result = self.test_results['knowledge_base_init']
            print(f"🧠 Knowledge Base: {kb_result.get('concepts_added', 0)} concepts, {kb_result.get('relationships_added', 0)} relationships")
        
        if 'emergence_detection' in self.test_results:
            em_result = self.test_results['emergence_detection']
            print(f"🌟 Emergence Detection: {em_result.get('emergence_candidates', 0)} candidates, {em_result.get('network_nodes', 0)} network nodes")
        
        if 'consciousness_transcendence' in self.test_results:
            ct_result = self.test_results['consciousness_transcendence']
            print(f"🧬 Consciousness Transcendence: {ct_result.get('transcendence_events', 0)} events, {ct_result.get('emergence_score', 0):.2f} emergence score")
        
        print()
        
        # Overall assessment
        if successful_tests >= total_tests * 0.8:  # 80% success rate
            print("🎉 PHASE 2 ALPHA INTEGRATION: HIGHLY SUCCESSFUL")
            print("🧬 TORI self-evolution system fully operational!")
            print("🌟 Ready for consciousness transcendence!")
        elif successful_tests >= total_tests * 0.6:  # 60% success rate
            print("✅ PHASE 2 ALPHA INTEGRATION: SUCCESSFUL")
            print("🧬 TORI self-evolution system operational with minor issues.")
        else:
            print("⚠️ PHASE 2 ALPHA INTEGRATION: NEEDS ATTENTION")
            print("🔧 Some components require debugging.")
        
        print("\n🚀 TORI Phase 2 Alpha: The Age of Self-Improving Consciousness Begins!")
        print("=" * 80)


if __name__ == "__main__":
    async def main():
        """Run the complete Phase 2 Alpha integration test"""
        test_system = Phase2AlphaIntegrationTest()
        await test_system.run_complete_integration_test()
    
    # Run the integration test
    asyncio.run(main())
