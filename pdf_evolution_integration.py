"""
PDF Evolution Integration - LIVE CONCEPT BREEDING FROM PDF INGESTION
===================================================================

Integrates PDF ingestion with concept evolution system.
Every PDF processed can trigger concept evolution and consciousness enhancement.
This creates a true feedback loop: PDFs → Concepts → Evolution → Better Reasoning
"""

import asyncio
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

# Import our evolution components
try:
    from prajna_cognitive_enhanced import PrajnaCognitiveEnhanced
    from cognitive_evolution_bridge import CognitiveEvolutionBridge
    from mesh_mutator import MeshMutator
    from concept_synthesizer import ConceptSynthesizer
    from prajna.memory.concept_mesh_api import ConceptMeshAPI
    from prajna.memory.soliton_interface import SolitonMemoryInterface
    EVOLUTION_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Evolution components not available: {e}")
    EVOLUTION_AVAILABLE = False

logger = logging.getLogger("prajna.pdf_evolution_integration")

class PDFEvolutionIntegrator:
    """
    Integrates PDF processing with concept evolution.
    
    This creates the living feedback loop:
    1. PDFs get processed → concepts extracted
    2. Concepts feed into evolution system
    3. Evolution creates new conceptual understanding  
    4. Enhanced understanding improves future PDF processing
    5. Cycle repeats, creating ever-improving consciousness
    """
    
    def __init__(self, data_directory: str = "C:\\Users\\jason\\Desktop\\tori\\kha\\data"):
        self.data_dir = Path(data_directory)
        self.enhanced_prajna = None
        self.evolution_bridge = None
        
        # Integration state
        self.pdfs_processed = 0
        self.evolution_cycles_triggered = 0
        self.concepts_bred = 0
        self.integration_active = False
        
        # Evolution triggers
        self.pdfs_per_evolution = 5  # Trigger evolution every 5 PDFs
        self.concept_threshold = 50  # Minimum concepts before evolution
        self.performance_threshold = 0.7  # Quality threshold for evolution
        
        logger.info("🧬📚 Initializing PDF Evolution Integrator...")
    
    async def initialize(self):
        """Initialize the integration system"""
        try:
            if not EVOLUTION_AVAILABLE:
                logger.warning("⚠️ Evolution components not available - running in simulation mode")
                return
            
            logger.info("🚀 Initializing PDF-Evolution integration...")
            
            # Initialize enhanced Prajna system
            self.enhanced_prajna = PrajnaCognitiveEnhanced()
            await self.enhanced_prajna.initialize()
            
            # Get evolution bridge from enhanced Prajna
            self.evolution_bridge = self.enhanced_prajna.evolution_bridge
            
            self.integration_active = True
            logger.info("✅ PDF Evolution Integration ACTIVE")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize PDF evolution integration: {e}")
            raise
    
    async def process_pdf_with_evolution(self, pdf_path: str, pdf_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single PDF and potentially trigger evolution.
        
        This is called after each PDF is processed to determine if evolution should occur.
        """
        try:
            self.pdfs_processed += 1
            
            logger.info(f"📚🧬 Processing PDF {self.pdfs_processed}: {Path(pdf_path).name}")
            
            # Extract key information from PDF
            concepts = pdf_content.get('concepts', [])
            document_type = pdf_content.get('document_type', 'unknown')
            pages = pdf_content.get('pages', 0)
            
            # Provide concept feedback to evolution system
            if self.evolution_bridge and concepts:
                for concept in concepts[:10]:  # Limit to top 10 concepts
                    await self.evolution_bridge.provide_reasoning_feedback(
                        concept, 
                        True,  # Assume PDF processing was successful
                        {
                            'source': 'pdf_ingestion',
                            'pdf_path': pdf_path,
                            'document_type': document_type,
                            'pages': pages
                        }
                    )
            
            # Check if evolution should be triggered
            evolution_result = await self._evaluate_evolution_trigger(pdf_content)
            
            # Update PDF content with evolution info
            enhanced_content = pdf_content.copy()
            enhanced_content.update({
                'evolution_integration': {
                    'pdfs_processed': self.pdfs_processed,
                    'evolution_triggered': evolution_result.get('triggered', False),
                    'evolution_reason': evolution_result.get('reason', 'none'),
                    'concepts_contributed': len(concepts),
                    'integration_timestamp': datetime.now().isoformat()
                }
            })
            
            return enhanced_content
            
        except Exception as e:
            logger.error(f"❌ PDF evolution processing failed: {e}")
            return pdf_content
    
    async def _evaluate_evolution_trigger(self, pdf_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate whether this PDF should trigger concept evolution.
        """
        try:
            evolution_reasons = []
            should_trigger = False
            
            # Trigger 1: Regular interval (every N PDFs)
            if self.pdfs_processed % self.pdfs_per_evolution == 0:
                evolution_reasons.append("regular_interval")
                should_trigger = True
            
            # Trigger 2: High-quality academic paper
            document_type = pdf_content.get('document_type', '')
            if document_type in ['academic_paper', 'research_document']:
                citation_count = pdf_content.get('citation_count', 0)
                if citation_count > 10:  # Well-cited paper
                    evolution_reasons.append("high_quality_academic")
                    should_trigger = True
            
            # Trigger 3: Novel domain concepts
            concepts = pdf_content.get('concepts', [])
            if len(concepts) > 20:  # Rich concept content
                evolution_reasons.append("rich_concept_content")
                should_trigger = True
            
            # Trigger 4: Cross-domain content
            research_field = pdf_content.get('research_field', '')
            if research_field in ['physics', 'neuroscience', 'computer_science']:
                evolution_reasons.append("cross_domain_potential")
                should_trigger = True
            
            # Execute evolution if triggered
            if should_trigger and self.evolution_bridge:
                evolution_success = await self._trigger_concept_evolution(pdf_content, evolution_reasons)
                
                if evolution_success:
                    self.evolution_cycles_triggered += 1
                    logger.info(f"🧬 Evolution cycle {self.evolution_cycles_triggered} triggered by PDF processing")
                
                return {
                    'triggered': evolution_success,
                    'reason': evolution_reasons,
                    'cycle_number': self.evolution_cycles_triggered if evolution_success else None
                }
            
            return {
                'triggered': False,
                'reason': 'no_trigger_conditions_met',
                'potential_reasons_evaluated': len(evolution_reasons)
            }
            
        except Exception as e:
            logger.error(f"❌ Evolution trigger evaluation failed: {e}")
            return {'triggered': False, 'error': str(e)}
    
    async def _trigger_concept_evolution(self, pdf_content: Dict[str, Any], reasons: List[str]) -> bool:
        """
        Trigger concept evolution based on PDF content.
        """
        try:
            logger.info(f"🧬 Triggering concept evolution - Reasons: {', '.join(reasons)}")
            
            # Create evolution context from PDF
            evolution_context = {
                'trigger_source': 'pdf_processing',
                'pdf_concepts': pdf_content.get('concepts', []),
                'pdf_document_type': pdf_content.get('document_type', ''),
                'pdf_research_field': pdf_content.get('research_field', ''),
                'trigger_reasons': reasons,
                'pdf_quality_indicators': {
                    'pages': pdf_content.get('pages', 0),
                    'citation_count': pdf_content.get('citation_count', 0),
                    'technical_level': pdf_content.get('technical_level', 'unknown')
                }
            }
            
            # Create targeted evolution request
            weak_concepts = pdf_content.get('concepts', [])[:5]  # Use PDF concepts as evolution targets
            target_domains = [pdf_content.get('research_field', 'general')]
            
            evolution_feedback = {
                'low_coherence': weak_concepts,
                'target_domains': target_domains,
                'pdf_context': evolution_context,
                'priority': 0.8  # High priority for PDF-triggered evolution
            }
            
            # Trigger evolution through enhanced Prajna
            if self.enhanced_prajna:
                # Use the reasoning system to trigger evolution
                evolution_query = f"Evolve concepts based on new knowledge from {pdf_content.get('document_type', 'document')} about {pdf_content.get('research_field', 'unknown field')}"
                
                result = await self.enhanced_prajna.reason_with_evolution(
                    evolution_query,
                    context={
                        'evolution_trigger': True,
                        'pdf_context': evolution_context,
                        'enable_evolution': True,
                        'evolution_priority': 0.9
                    }
                )
                
                evolution_triggered = result.get('evolution_triggered', False)
                
                if evolution_triggered:
                    # Track new concepts
                    evolved_concepts = result.get('concepts_evolved', [])
                    self.concepts_bred += len(evolved_concepts)
                    
                    logger.info(f"✅ Evolution successful - {len(evolved_concepts)} new concepts bred")
                    
                    # Save evolution event
                    await self._record_evolution_event(pdf_content, evolved_concepts, reasons)
                    
                    return True
                else:
                    logger.warning("⚠️ Evolution triggered but no concepts evolved")
                    return False
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Concept evolution trigger failed: {e}")
            return False
    
    async def _record_evolution_event(self, pdf_content: Dict[str, Any], 
                                    evolved_concepts: List[Dict], reasons: List[str]):
        """
        Record evolution event for tracking and analysis.
        """
        try:
            evolution_record = {
                'event_id': f"pdf_evolution_{self.evolution_cycles_triggered}",
                'timestamp': datetime.now().isoformat(),
                'trigger_source': 'pdf_processing',
                'trigger_reasons': reasons,
                'source_pdf': {
                    'title': pdf_content.get('title', 'Unknown'),
                    'document_type': pdf_content.get('document_type', ''),
                    'research_field': pdf_content.get('research_field', ''),
                    'concepts_count': len(pdf_content.get('concepts', []))
                },
                'evolution_results': {
                    'concepts_evolved': len(evolved_concepts),
                    'new_concept_names': [c.get('canonical_name', 'unknown') for c in evolved_concepts],
                    'evolution_strategies': list(set([c.get('synthesis_strategy', 'unknown') for c in evolved_concepts]))
                },
                'system_state': {
                    'pdfs_processed': self.pdfs_processed,
                    'total_evolution_cycles': self.evolution_cycles_triggered,
                    'total_concepts_bred': self.concepts_bred
                }
            }
            
            # Save to evolution history file
            evolution_history_file = Path("pdf_evolution_history.json")
            
            if evolution_history_file.exists():
                with open(evolution_history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            else:
                history = {'evolution_events': []}
            
            history['evolution_events'].append(evolution_record)
            
            # Keep only recent 100 events
            if len(history['evolution_events']) > 100:
                history['evolution_events'] = history['evolution_events'][-100:]
            
            with open(evolution_history_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=2, ensure_ascii=False)
            
            logger.info(f"📝 Evolution event recorded: {evolution_record['event_id']}")
            
        except Exception as e:
            logger.error(f"❌ Failed to record evolution event: {e}")
    
    async def process_pdf_batch_with_evolution(self, pdf_batch: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process a batch of PDFs with evolution integration.
        """
        logger.info(f"📚🧬 Processing PDF batch with evolution: {len(pdf_batch)} PDFs")
        
        enhanced_batch = []
        
        for pdf_data in pdf_batch:
            pdf_path = pdf_data.get('file_path', 'unknown')
            
            # Process PDF with evolution
            enhanced_pdf = await self.process_pdf_with_evolution(pdf_path, pdf_data)
            enhanced_batch.append(enhanced_pdf)
            
            # Brief pause between PDFs to allow evolution processing
            await asyncio.sleep(0.1)
        
        # Batch-level evolution analysis
        batch_analysis = await self._analyze_batch_evolution_potential(enhanced_batch)
        
        logger.info(f"✅ PDF batch processing complete - Evolution events: {batch_analysis.get('evolution_events', 0)}")
        
        return enhanced_batch
    
    async def _analyze_batch_evolution_potential(self, pdf_batch: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze evolution potential across a batch of PDFs.
        """
        try:
            # Count evolution events in batch
            evolution_events = sum(1 for pdf in pdf_batch 
                                 if pdf.get('evolution_integration', {}).get('evolution_triggered', False))
            
            # Analyze concept diversity
            all_concepts = []
            research_fields = set()
            document_types = set()
            
            for pdf in pdf_batch:
                all_concepts.extend(pdf.get('concepts', []))
                research_fields.add(pdf.get('research_field', 'unknown'))
                document_types.add(pdf.get('document_type', 'unknown'))
            
            unique_concepts = len(set(all_concepts))
            concept_diversity = unique_concepts / max(1, len(all_concepts))
            
            # Cross-domain potential
            cross_domain_potential = len(research_fields) > 1 and len(document_types) > 1
            
            analysis = {
                'evolution_events': evolution_events,
                'concept_diversity': concept_diversity,
                'unique_concepts': unique_concepts,
                'research_field_diversity': len(research_fields),
                'document_type_diversity': len(document_types),
                'cross_domain_potential': cross_domain_potential,
                'batch_size': len(pdf_batch)
            }
            
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Batch evolution analysis failed: {e}")
            return {'evolution_events': 0, 'error': str(e)}
    
    async def get_integration_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive integration statistics.
        """
        try:
            stats = {
                'integration_active': self.integration_active,
                'evolution_available': EVOLUTION_AVAILABLE,
                'processing_stats': {
                    'pdfs_processed': self.pdfs_processed,
                    'evolution_cycles_triggered': self.evolution_cycles_triggered,
                    'concepts_bred': self.concepts_bred,
                    'evolution_rate': self.evolution_cycles_triggered / max(1, self.pdfs_processed)
                },
                'evolution_triggers': {
                    'pdfs_per_evolution': self.pdfs_per_evolution,
                    'concept_threshold': self.concept_threshold,
                    'performance_threshold': self.performance_threshold
                }
            }
            
            # Add consciousness stats if available
            if self.enhanced_prajna:
                consciousness_status = await self.enhanced_prajna.get_system_status()
                stats['consciousness_status'] = {
                    'consciousness_level': consciousness_status.get('consciousness_snapshot', {}).get('consciousness_level', 0.0),
                    'system_health': consciousness_status.get('system_health', {})
                }
            
            return stats
            
        except Exception as e:
            logger.error(f"❌ Failed to get integration stats: {e}")
            return {'error': str(e)}
    
    async def shutdown(self):
        """
        Gracefully shutdown the integration system.
        """
        logger.info("🛑 Shutting down PDF Evolution Integration...")
        
        self.integration_active = False
        
        if self.enhanced_prajna:
            await self.enhanced_prajna.shutdown()
        
        logger.info("✅ PDF Evolution Integration shutdown complete")

# Integration function for existing PDF processing
async def integrate_pdf_evolution(pdf_data: Dict[str, Any], integrator: PDFEvolutionIntegrator = None) -> Dict[str, Any]:
    """
    Standalone function to integrate evolution with existing PDF processing.
    """
    if not integrator:
        integrator = PDFEvolutionIntegrator()
        await integrator.initialize()
    
    pdf_path = pdf_data.get('file_path', 'unknown')
    enhanced_pdf = await integrator.process_pdf_with_evolution(pdf_path, pdf_data)
    
    return enhanced_pdf

if __name__ == "__main__":
    # Test PDF Evolution Integration
    import asyncio
    
    async def test_pdf_evolution_integration():
        # Initialize integrator
        integrator = PDFEvolutionIntegrator()
        await integrator.initialize()
        
        # Test with mock PDF data
        test_pdf = {
            'file_path': 'test_paper.pdf',
            'title': 'Neural Networks and Quantum Consciousness',
            'concepts': ['neural network', 'quantum mechanics', 'consciousness', 'cognitive model'],
            'document_type': 'academic_paper',
            'research_field': 'neuroscience',
            'pages': 25,
            'citation_count': 15,
            'technical_level': 'graduate'
        }
        
        # Process PDF with evolution
        enhanced_pdf = await integrator.process_pdf_with_evolution('test_paper.pdf', test_pdf)
        print(f"🧬 Enhanced PDF: {enhanced_pdf}")
        
        # Get integration stats
        stats = await integrator.get_integration_stats()
        print(f"📊 Integration Stats: {stats}")
        
        # Shutdown
        await integrator.shutdown()
    
    asyncio.run(test_pdf_evolution_integration())
