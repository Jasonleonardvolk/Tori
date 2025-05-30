"""
TORI Core Ingest Router
Final Assembly Layer for Complete System Integration

Routes ParsedPayload to all TORI systems:
- ConceptMesh (knowledge graph)  
- BraidMemory (memory storage)
- PsiArc (trajectory tracking)
- ScholarSphere (archival)
- LoopRecord (audit trail)

Ensures UUID + hash tracking across all systems
"""

import json
import logging
import asyncio
import uuid
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from pathlib import Path
import sys

# Add paths for TORI components
sys.path.append(str(Path(__file__).parent.parent / "ingest-bus" / "workers"))

# Import TORI components
from production_file_handlers import ParsedPayload, file_handlers
from psi_mesh_verification_layer import (
    verify_concept_extraction_integrity, 
    attach_integrity_scores_to_concepts,
    filter_concepts_by_integrity,
    generate_integrity_report
)

logger = logging.getLogger("tori-core.ingest_router")

class ToriIngestRouter:
    """
    Central routing system for TORI document ingestion
    
    Orchestrates the complete flow:
    1. Document Processing -> ParsedPayload
    2. ψMesh Verification -> Integrity Validation  
    3. System Routing -> ConceptMesh, BraidMemory, PsiArc, ScholarSphere
    4. LoopRecord Generation -> Complete audit trail
    """
    
    def __init__(self):
        self.system_endpoints = {
            'concept_mesh': 'http://localhost:8081',
            'braid_memory': 'http://localhost:8082', 
            'psi_arc': 'http://localhost:8083',
            'scholar_sphere': 'http://localhost:8084'
        }
        
        self.integration_config = {
            'min_integrity_score': 0.75,
            'enable_verification': True,
            'enable_concept_mesh': True,
            'enable_braid_memory': True,
            'enable_psi_arc': True,
            'enable_scholar_sphere': True,
            'enable_loop_record': True,
            'max_concepts_per_document': 50,
            'uuid_tracking': True,
            'hash_verification': True
        }
        
        # UUID tracking for cross-system linking
        self.document_registry = {}  # document_id -> system_uuids
        
        logger.info("TORI Core Ingest Router initialized")
        logger.info(f"System endpoints: {list(self.system_endpoints.keys())}")
    
    async def route_document(self, file_content: bytes, file_type: str, 
                           filename: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Complete document routing through TORI systems
        
        Args:
            file_content: Raw file bytes
            file_type: Document type (pdf, docx, etc.)
            filename: Original filename
            metadata: Additional metadata
            
        Returns:
            Complete routing results with UUIDs and system responses
        """
        routing_id = str(uuid.uuid4())
        start_time = datetime.now()
        
        logger.info(f"Starting document routing: {filename} ({file_type}) - Routing ID: {routing_id}")
        
        routing_results = {
            'routing_id': routing_id,
            'filename': filename,
            'file_type': file_type,
            'started_at': start_time.isoformat(),
            'stages': {},
            'system_uuids': {},
            'integrity_report': {},
            'status': 'processing'
        }
        
        try:
            # Stage 1: Document Processing -> ParsedPayload
            logger.info(f"Stage 1: Document processing - {filename}")
            
            job_mock = type('Job', (), {'id': routing_id})()  # Mock job for compatibility
            parsed_payload = await file_handlers.process_document(
                file_content, file_type, filename, job_mock
            )
            
            if not parsed_payload.extracted_text:
                routing_results['status'] = 'failed'
                routing_results['error'] = 'Document processing failed'
                return routing_results
            
            routing_results['stages']['document_processing'] = {
                'status': 'completed',
                'document_id': parsed_payload.document_id,
                'file_hash': parsed_payload.file_hash,
                'text_length': len(parsed_payload.extracted_text),
                'concepts_extracted': len(parsed_payload.semantic_concepts),
                'segments_created': len(parsed_payload.raw_segments),
                'structure_elements': len(parsed_payload.structure_elements)
            }
            
            # Stage 2: ψMesh Verification -> Integrity Validation
            if self.integration_config['enable_verification']:
                logger.info(f"Stage 2: ψMesh integrity verification - {filename}")
                
                verification_results = await verify_concept_extraction_integrity(parsed_payload)
                
                # Attach integrity scores to concepts
                enhanced_concepts = attach_integrity_scores_to_concepts(
                    parsed_payload.semantic_concepts, verification_results
                )
                
                # Filter concepts by integrity
                approved_concepts, rejected_concepts = filter_concepts_by_integrity(
                    enhanced_concepts, self.integration_config['min_integrity_score']
                )
                
                # Update payload with verified concepts
                parsed_payload.semantic_concepts = approved_concepts
                
                routing_results['stages']['verification'] = {
                    'status': 'completed',
                    'overall_integrity_score': verification_results.get('overall_integrity_score', 0.0),
                    'total_concepts': len(enhanced_concepts),
                    'approved_concepts': len(approved_concepts),
                    'rejected_concepts': len(rejected_concepts),
                    'quality_assessment': verification_results.get('verification_summary', {}).get('quality_assessment', 'unknown')
                }
                
                # Generate integrity report
                routing_results['integrity_report'] = {
                    'summary': verification_results.get('verification_summary', {}),
                    'recommendations': verification_results.get('recommendations', []),
                    'detailed_report': generate_integrity_report(verification_results)
                }
            
            # Stage 3: System Routing
            logger.info(f"Stage 3: System routing - {filename}")
            
            system_results = await self._route_to_systems(parsed_payload, routing_results)
            routing_results['stages'].update(system_results)
            
            # Stage 4: LoopRecord Generation
            if self.integration_config['enable_loop_record']:
                logger.info(f"Stage 4: LoopRecord generation - {filename}")
                
                loop_record = await self._generate_loop_record(parsed_payload, routing_results)
                routing_results['stages']['loop_record'] = loop_record
            
            # Final status
            routing_results['status'] = 'completed'
            routing_results['completed_at'] = datetime.now().isoformat()
            routing_results['processing_duration'] = (datetime.now() - start_time).total_seconds()
            
            # Register document in tracking system
            self._register_document(routing_id, routing_results['system_uuids'])
            
            logger.info(f"Document routing completed: {filename} - {routing_results['processing_duration']:.2f}s")
            
        except Exception as e:
            logger.exception(f"Error in document routing: {e}")
            routing_results['status'] = 'failed'
            routing_results['error'] = str(e)
            routing_results['failed_at'] = datetime.now().isoformat()
        
        return routing_results
    
    async def _route_to_systems(self, payload: ParsedPayload, routing_results: Dict[str, Any]) -> Dict[str, Any]:
        """Route parsed payload to all TORI systems"""
        system_results = {}
        
        # Generate UUIDs for cross-system tracking
        base_uuid = str(uuid.uuid4())
        system_uuids = {
            'concept_mesh': f"cm_{base_uuid}",
            'braid_memory': f"bm_{base_uuid}",
            'psi_arc': f"pa_{base_uuid}",
            'scholar_sphere': f"ss_{base_uuid}"
        }
        
        routing_results['system_uuids'] = system_uuids
        
        # Route to ConceptMesh
        if self.integration_config['enable_concept_mesh']:
            system_results['concept_mesh'] = await self._route_to_concept_mesh(
                payload, system_uuids['concept_mesh']
            )
        
        # Route to BraidMemory
        if self.integration_config['enable_braid_memory']:
            system_results['braid_memory'] = await self._route_to_braid_memory(
                payload, system_uuids['braid_memory']
            )
        
        # Route to PsiArc
        if self.integration_config['enable_psi_arc']:
            system_results['psi_arc'] = await self._route_to_psi_arc(
                payload, system_uuids['psi_arc']
            )
        
        # Route to ScholarSphere
        if self.integration_config['enable_scholar_sphere']:
            system_results['scholar_sphere'] = await self._route_to_scholar_sphere(
                payload, system_uuids['scholar_sphere']
            )
        
        return system_results
    
    async def _route_to_concept_mesh(self, payload: ParsedPayload, system_uuid: str) -> Dict[str, Any]:
        """Route concepts to ConceptMesh knowledge graph"""
        try:
            logger.info(f"Routing to ConceptMesh: {len(payload.semantic_concepts)} concepts")
            
            # Prepare concept nodes for ConceptMesh
            concept_nodes = []
            relationship_edges = []
            
            for i, concept in enumerate(payload.semantic_concepts):
                # Create concept node
                node_data = {
                    'id': f"{system_uuid}_concept_{i}",
                    'name': concept.get('name', ''),
                    'keywords': concept.get('keywords', []),
                    'confidence': concept.get('confidence', 0.8),
                    'integrity_score': concept.get('integrity_score', 0.0),
                    'verification_status': concept.get('verification_status', 'unknown'),
                    'source_document': payload.document_id,
                    'source_hash': payload.file_hash,
                    'created_at': datetime.now().isoformat(),
                    'metadata': {
                        'extraction_method': concept.get('extraction_method', 'unknown'),
                        'source_matches': len(concept.get('source_matches', [])),
                        'file_type': payload.source_metadata.get('file_type', 'unknown')
                    }
                }
                concept_nodes.append(node_data)
                
                # Create relationships between concepts (semantic associations)
                for j, other_concept in enumerate(payload.semantic_concepts[i+1:], i+1):
                    # Calculate relationship strength based on keyword overlap
                    concept_keywords = set(concept.get('keywords', []))
                    other_keywords = set(other_concept.get('keywords', []))
                    
                    if concept_keywords and other_keywords:
                        overlap = len(concept_keywords.intersection(other_keywords))
                        if overlap > 0:
                            relationship_edges.append({
                                'from': f"{system_uuid}_concept_{i}",
                                'to': f"{system_uuid}_concept_{j}",
                                'type': 'semantic_association',
                                'strength': overlap / max(len(concept_keywords), len(other_keywords)),
                                'source_document': payload.document_id
                            })
            
            # Create document node
            document_node = {
                'id': f"{system_uuid}_document",
                'type': 'document',
                'title': payload.source_metadata.get('filename', 'Unknown'),
                'file_type': payload.source_metadata.get('file_type', 'unknown'),
                'file_hash': payload.file_hash,
                'document_id': payload.document_id,
                'created_at': datetime.now().isoformat(),
                'metadata': payload.source_metadata
            }
            
            # Connect concepts to document
            for i in range(len(concept_nodes)):
                relationship_edges.append({
                    'from': f"{system_uuid}_document",
                    'to': f"{system_uuid}_concept_{i}",
                    'type': 'contains_concept',
                    'strength': 1.0
                })
            
            # In production, this would call ConceptMesh API
            # For now, save locally
            concept_mesh_data = {
                'system_uuid': system_uuid,
                'document_node': document_node,
                'concept_nodes': concept_nodes,
                'relationship_edges': relationship_edges,
                'created_at': datetime.now().isoformat()
            }
            
            # Save to concept mesh storage
            concept_mesh_path = Path(__file__).parent.parent / "concept-mesh-data" / "nodes"
            concept_mesh_path.mkdir(parents=True, exist_ok=True)
            
            with open(concept_mesh_path / f"{system_uuid}_concepts.json", 'w') as f:
                json.dump(concept_mesh_data, f, indent=2)
            
            return {
                'status': 'completed',
                'system_uuid': system_uuid,
                'nodes_created': len(concept_nodes) + 1,  # +1 for document node
                'relationships_created': len(relationship_edges),
                'storage_path': str(concept_mesh_path)
            }
            
        except Exception as e:
            logger.exception(f"Error routing to ConceptMesh: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    async def _route_to_braid_memory(self, payload: ParsedPayload, system_uuid: str) -> Dict[str, Any]:
        """Route content segments to BraidMemory storage"""
        try:
            logger.info(f"Routing to BraidMemory: {len(payload.raw_segments)} segments")
            
            # Prepare memory entries
            memory_entries = []
            
            for i, segment in enumerate(payload.raw_segments):
                # Create memory entry
                entry_data = {
                    'id': f"{system_uuid}_segment_{i}",
                    'text': segment.get('text', ''),
                    'segment_type': segment.get('type', 'unknown'),
                    'segment_metadata': segment.get('metadata', {}),
                    'document_id': payload.document_id,
                    'source_hash': payload.file_hash,
                    'concepts': [c.get('name', '') for c in payload.semantic_concepts if self._segment_contains_concept(segment, c)],
                    'embedding_vector': [],  # Would be generated by embedding model
                    'created_at': datetime.now().isoformat(),
                    'retrieval_metadata': {
                        'importance_score': self._calculate_segment_importance(segment, payload.semantic_concepts),
                        'readability_score': self._calculate_readability_score(segment.get('text', '')),
                        'keyword_density': self._calculate_keyword_density(segment, payload.semantic_concepts)
                    }
                }
                memory_entries.append(entry_data)
            
            # Create document summary entry
            summary_entry = {
                'id': f"{system_uuid}_summary",
                'text': self._generate_document_summary(payload),
                'segment_type': 'document_summary',
                'document_id': payload.document_id,
                'source_hash': payload.file_hash,
                'concepts': [c.get('name', '') for c in payload.semantic_concepts],
                'created_at': datetime.now().isoformat(),
                'retrieval_metadata': {
                    'importance_score': 1.0,
                    'summary_type': 'auto_generated',
                    'concept_count': len(payload.semantic_concepts)
                }
            }
            memory_entries.append(summary_entry)
            
            # Save to braid memory storage
            braid_memory_path = Path(__file__).parent.parent / "concept-mesh-data" / "braid_memory"
            braid_memory_path.mkdir(parents=True, exist_ok=True)
            
            braid_memory_data = {
                'system_uuid': system_uuid,
                'document_id': payload.document_id,
                'memory_entries': memory_entries,
                'created_at': datetime.now().isoformat(),
                'metadata': {
                    'total_segments': len(payload.raw_segments),
                    'total_concepts': len(payload.semantic_concepts),
                    'document_length': len(payload.extracted_text)
                }
            }
            
            with open(braid_memory_path / f"{system_uuid}_memory.json", 'w') as f:
                json.dump(braid_memory_data, f, indent=2)
            
            return {
                'status': 'completed',
                'system_uuid': system_uuid,
                'entries_created': len(memory_entries),
                'storage_path': str(braid_memory_path)
            }
            
        except Exception as e:
            logger.exception(f"Error routing to BraidMemory: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    async def _route_to_psi_arc(self, payload: ParsedPayload, system_uuid: str) -> Dict[str, Any]:
        """Route trajectory data to PsiArc tracking"""
        try:
            logger.info(f"Routing to PsiArc: trajectory tracking for document {payload.document_id}")
            
            # Generate trajectory data
            trajectory_data = {
                'system_uuid': system_uuid,
                'document_id': payload.document_id,
                'file_hash': payload.file_hash,
                'processing_trajectory': {
                    'ingestion_timestamp': datetime.now().isoformat(),
                    'processing_stages': payload.processing_timestamps,
                    'concept_evolution': self._track_concept_evolution(payload),
                    'integrity_progression': self._track_integrity_progression(payload),
                    'system_interactions': {
                        'concept_mesh_integration': True,
                        'braid_memory_integration': True,
                        'verification_completed': len(payload.semantic_concepts) > 0
                    }
                },
                'trajectory_metadata': {
                    'file_type': payload.source_metadata.get('file_type', 'unknown'),
                    'processing_complexity': self._calculate_processing_complexity(payload),
                    'concept_density': len(payload.semantic_concepts) / max(1, len(payload.raw_segments)),
                    'structure_complexity': len(payload.structure_elements)
                }
            }
            
            # Save to psiarc storage
            psiarc_path = Path(__file__).parent.parent / "psiarc_logs"
            psiarc_path.mkdir(parents=True, exist_ok=True)
            
            with open(psiarc_path / f"{system_uuid}_trajectory.json", 'w') as f:
                json.dump(trajectory_data, f, indent=2)
            
            return {
                'status': 'completed',
                'system_uuid': system_uuid,
                'trajectory_recorded': True,
                'storage_path': str(psiarc_path)
            }
            
        except Exception as e:
            logger.exception(f"Error routing to PsiArc: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    async def _route_to_scholar_sphere(self, payload: ParsedPayload, system_uuid: str) -> Dict[str, Any]:
        """Route document to ScholarSphere archival"""
        try:
            logger.info(f"Routing to ScholarSphere: archival for document {payload.document_id}")
            
            # Create archival record
            archival_record = {
                'system_uuid': system_uuid,
                'document_id': payload.document_id,
                'file_hash': payload.file_hash,
                'archival_metadata': {
                    'filename': payload.source_metadata.get('filename', 'unknown'),
                    'file_type': payload.source_metadata.get('file_type', 'unknown'),
                    'file_size': payload.source_metadata.get('file_size', 0),
                    'archived_at': datetime.now().isoformat(),
                    'processing_summary': {
                        'concepts_extracted': len(payload.semantic_concepts),
                        'segments_created': len(payload.raw_segments),
                        'structure_elements': len(payload.structure_elements),
                        'text_length': len(payload.extracted_text)
                    }
                },
                'content_metadata': {
                    'concepts': [c.get('name', '') for c in payload.semantic_concepts],
                    'structure_summary': self._summarize_structure(payload.structure_elements),
                    'integrity_metadata': payload.integrity_metadata
                },
                'access_metadata': {
                    'public': False,
                    'searchable': True,
                    'retention_period': 'indefinite',
                    'access_permissions': ['tori_system']
                }
            }
            
            # Save archival record
            scholar_sphere_path = Path(__file__).parent.parent / "concept-mesh-data" / "scholar_sphere"
            scholar_sphere_path.mkdir(parents=True, exist_ok=True)
            
            with open(scholar_sphere_path / f"{system_uuid}_archive.json", 'w') as f:
                json.dump(archival_record, f, indent=2)
            
            # Save extracted text for full-text search
            with open(scholar_sphere_path / f"{system_uuid}_content.txt", 'w', encoding='utf-8') as f:
                f.write(payload.extracted_text)
            
            return {
                'status': 'completed',
                'system_uuid': system_uuid,
                'archive_id': system_uuid,
                'storage_path': str(scholar_sphere_path),
                'searchable': True
            }
            
        except Exception as e:
            logger.exception(f"Error routing to ScholarSphere: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    async def _generate_loop_record(self, payload: ParsedPayload, routing_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive LoopRecord audit trail"""
        try:
            logger.info(f"Generating LoopRecord for document {payload.document_id}")
            
            # Create comprehensive audit record
            loop_record = {
                'routing_id': routing_results['routing_id'],
                'document_id': payload.document_id,
                'file_hash': payload.file_hash,
                'loop_record_metadata': {
                    'created_at': datetime.now().isoformat(),
                    'record_version': '2.0',
                    'audit_trail_complete': True
                },
                'processing_audit': {
                    'stages_completed': list(routing_results['stages'].keys()),
                    'processing_duration': routing_results.get('processing_duration', 0),
                    'success_rate': len([s for s in routing_results['stages'].values() if s.get('status') == 'completed']) / len(routing_results['stages']),
                    'system_uuids': routing_results.get('system_uuids', {})
                },
                'data_lineage': {
                    'source_file': {
                        'filename': payload.source_metadata.get('filename', 'unknown'),
                        'file_type': payload.source_metadata.get('file_type', 'unknown'),
                        'file_hash': payload.file_hash
                    },
                    'extracted_content': {
                        'text_length': len(payload.extracted_text),
                        'segments_count': len(payload.raw_segments),
                        'concepts_count': len(payload.semantic_concepts)
                    },
                    'verification_results': routing_results.get('integrity_report', {}).get('summary', {}),
                    'system_integrations': {
                        system: result.get('status', 'unknown') 
                        for system, result in routing_results['stages'].items()
                        if system in ['concept_mesh', 'braid_memory', 'psi_arc', 'scholar_sphere']
                    }
                },
                'quality_metrics': {
                    'integrity_score': routing_results.get('stages', {}).get('verification', {}).get('overall_integrity_score', 0.0),
                    'concept_approval_rate': self._calculate_concept_approval_rate(routing_results),
                    'processing_efficiency': self._calculate_processing_efficiency(routing_results),
                    'system_integration_success': self._calculate_integration_success(routing_results)
                }
            }
            
            # Save loop record
            loop_record_path = Path(__file__).parent.parent / "concept-mesh-data" / "loop_records"
            loop_record_path.mkdir(parents=True, exist_ok=True)
            
            with open(loop_record_path / f"{routing_results['routing_id']}_loop_record.json", 'w') as f:
                json.dump(loop_record, f, indent=2)
            
            return {
                'status': 'completed',
                'loop_record_id': routing_results['routing_id'],
                'audit_complete': True,
                'storage_path': str(loop_record_path),
                'quality_score': loop_record['quality_metrics']['integrity_score']
            }
            
        except Exception as e:
            logger.exception(f"Error generating LoopRecord: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    def _register_document(self, routing_id: str, system_uuids: Dict[str, str]):
        """Register document in tracking system"""
        self.document_registry[routing_id] = {
            'system_uuids': system_uuids,
            'registered_at': datetime.now().isoformat()
        }
    
    def _segment_contains_concept(self, segment: Dict[str, Any], concept: Dict[str, Any]) -> bool:
        """Check if segment contains concept"""
        segment_text = segment.get('text', '').lower()
        concept_name = concept.get('name', '').lower()
        keywords = [k.lower() for k in concept.get('keywords', [])]
        
        return concept_name in segment_text or any(k in segment_text for k in keywords)
    
    def _calculate_segment_importance(self, segment: Dict[str, Any], concepts: List[Dict[str, Any]]) -> float:
        """Calculate importance score for segment"""
        segment_text = segment.get('text', '')
        
        # Base importance on length and concept density
        text_length_score = min(1.0, len(segment_text) / 1000)  # Normalize to 1000 chars
        
        concept_count = sum(1 for concept in concepts if self._segment_contains_concept(segment, concept))
        concept_density_score = min(1.0, concept_count / max(1, len(concepts)) * 5)  # Scale up
        
        return (text_length_score * 0.3) + (concept_density_score * 0.7)
    
    def _calculate_readability_score(self, text: str) -> float:
        """Simple readability score calculation"""
        if not text:
            return 0.0
        
        words = text.split()
        sentences = text.split('.')
        
        if not words or not sentences:
            return 0.0
        
        avg_words_per_sentence = len(words) / len(sentences)
        avg_chars_per_word = sum(len(word) for word in words) / len(words)
        
        # Simple readability metric (lower is better, normalize to 0-1)
        readability = 1.0 / (1.0 + (avg_words_per_sentence - 15)**2 / 100 + (avg_chars_per_word - 5)**2 / 10)
        
        return max(0.0, min(1.0, readability))
    
    def _calculate_keyword_density(self, segment: Dict[str, Any], concepts: List[Dict[str, Any]]) -> float:
        """Calculate keyword density in segment"""
        segment_text = segment.get('text', '').lower()
        words = segment_text.split()
        
        if not words:
            return 0.0
        
        keyword_count = 0
        for concept in concepts:
            for keyword in concept.get('keywords', []):
                keyword_count += segment_text.count(keyword.lower())
        
        return keyword_count / len(words)
    
    def _generate_document_summary(self, payload: ParsedPayload) -> str:
        """Generate document summary"""
        concepts = [c.get('name', '') for c in payload.semantic_concepts[:5]]
        
        summary = f"Document Summary:\n"
        summary += f"Type: {payload.source_metadata.get('file_type', 'unknown').upper()}\n"
        summary += f"Length: {len(payload.extracted_text)} characters\n"
        summary += f"Key Concepts: {', '.join(concepts)}\n"
        summary += f"Structure: {len(payload.structure_elements)} elements, {len(payload.raw_segments)} segments\n"
        
        return summary
    
    def _track_concept_evolution(self, payload: ParsedPayload) -> List[Dict[str, Any]]:
        """Track how concepts evolved during processing"""
        evolution = []
        
        for concept in payload.semantic_concepts:
            evolution.append({
                'concept_name': concept.get('name', ''),
                'extraction_confidence': concept.get('confidence', 0.0),
                'integrity_score': concept.get('integrity_score', 0.0),
                'verification_status': concept.get('verification_status', 'unknown'),
                'keyword_count': len(concept.get('keywords', [])),
                'source_matches': len(concept.get('source_matches', []))
            })
        
        return evolution
    
    def _track_integrity_progression(self, payload: ParsedPayload) -> Dict[str, Any]:
        """Track integrity progression through verification"""
        concepts_with_integrity = [c for c in payload.semantic_concepts if 'integrity_score' in c]
        
        if not concepts_with_integrity:
            return {'status': 'no_verification_data'}
        
        integrity_scores = [c['integrity_score'] for c in concepts_with_integrity]
        
        return {
            'average_integrity': np.mean(integrity_scores),
            'min_integrity': np.min(integrity_scores),
            'max_integrity': np.max(integrity_scores),
            'integrity_distribution': {
                'high': sum(1 for s in integrity_scores if s >= 0.8),
                'medium': sum(1 for s in integrity_scores if 0.6 <= s < 0.8),
                'low': sum(1 for s in integrity_scores if s < 0.6)
            }
        }
    
    def _calculate_processing_complexity(self, payload: ParsedPayload) -> float:
        """Calculate processing complexity score"""
        factors = [
            len(payload.extracted_text) / 10000,  # Text length factor
            len(payload.raw_segments) / 50,        # Segment count factor  
            len(payload.semantic_concepts) / 20,   # Concept count factor
            len(payload.structure_elements) / 30   # Structure complexity factor
        ]
        
        return min(1.0, sum(factors) / len(factors))
    
    def _summarize_structure(self, structure_elements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarize document structure"""
        structure_types = {}
        for element in structure_elements:
            element_type = element.get('type', 'unknown')
            structure_types[element_type] = structure_types.get(element_type, 0) + 1
        
        return {
            'total_elements': len(structure_elements),
            'element_types': structure_types,
            'has_headings': 'heading' in structure_types,
            'has_lists': any('list' in t for t in structure_types.keys()),
            'has_tables': 'table' in structure_types
        }
    
    def _calculate_concept_approval_rate(self, routing_results: Dict[str, Any]) -> float:
        """Calculate concept approval rate"""
        verification = routing_results.get('stages', {}).get('verification', {})
        total = verification.get('total_concepts', 0)
        approved = verification.get('approved_concepts', 0)
        
        return approved / max(1, total)
    
    def _calculate_processing_efficiency(self, routing_results: Dict[str, Any]) -> float:
        """Calculate processing efficiency score"""
        duration = routing_results.get('processing_duration', float('inf'))
        
        # Efficiency based on processing time (assume 30 seconds is optimal)
        if duration <= 30:
            return 1.0
        elif duration <= 60:
            return 0.8
        elif duration <= 120:
            return 0.6
        else:
            return 0.4
    
    def _calculate_integration_success(self, routing_results: Dict[str, Any]) -> float:
        """Calculate system integration success rate"""
        stages = routing_results.get('stages', {})
        system_stages = ['concept_mesh', 'braid_memory', 'psi_arc', 'scholar_sphere']
        
        successful = sum(1 for stage in system_stages if stages.get(stage, {}).get('status') == 'completed')
        
        return successful / len(system_stages)

# Global router instance
tori_router = ToriIngestRouter()

# Main API function
async def route_document_complete(file_content: bytes, file_type: str, 
                                filename: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Main function for complete document routing through TORI systems
    
    Args:
        file_content: Raw file bytes
        file_type: Document type (pdf, docx, etc.)
        filename: Original filename  
        metadata: Additional metadata
        
    Returns:
        Complete routing results with UUIDs and system responses
    """
    return await tori_router.route_document(file_content, file_type, filename, metadata or {})
