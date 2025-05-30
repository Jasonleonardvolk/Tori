"""
TORI Complete Document Ingestion - Final Integration Test
Tests the complete 2-hour integration with all file types and systems

Run this to verify the entire pipeline works end-to-end
"""

import asyncio
import json
import logging
from pathlib import Path
from datetime import datetime
import sys

# Add TORI core to path
sys.path.append(str(Path(__file__).parent))

from ingestRouter import route_document_complete

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("tori-integration-test")

class ToriCompleteIntegrationTest:
    """
    Final integration test for the complete TORI document ingestion system
    Tests all file types and system integrations
    """
    
    def __init__(self):
        self.test_results = {}
        self.start_time = datetime.now()
        
        logger.info("🚀 TORI Complete Integration Test Suite starting")
    
    async def run_complete_test_suite(self) -> Dict[str, any]:
        """Run complete integration test suite"""
        logger.info("📋 Running TORI Complete Integration Test Suite")
        
        test_results = {
            'test_suite': 'TORI Complete Integration',
            'started_at': self.start_time.isoformat(),
            'tests': {}
        }
        
        # Test 1: PDF Document Processing
        logger.info("📄 Testing PDF document processing...")
        test_results['tests']['pdf_processing'] = await self.test_pdf_complete_integration()
        
        # Test 2: DOCX Document Processing  
        logger.info("📝 Testing DOCX document processing...")
        test_results['tests']['docx_processing'] = await self.test_docx_complete_integration()
        
        # Test 3: CSV Data Processing
        logger.info("📊 Testing CSV data processing...")
        test_results['tests']['csv_processing'] = await self.test_csv_complete_integration()
        
        # Test 4: JSON Document Processing
        logger.info("🗂️ Testing JSON document processing...")
        test_results['tests']['json_processing'] = await self.test_json_complete_integration()
        
        # Test 5: Markdown Document Processing
        logger.info("📋 Testing Markdown document processing...")
        test_results['tests']['markdown_processing'] = await self.test_markdown_complete_integration()
        
        # Test 6: System Integration Verification
        logger.info("🔗 Testing system integration verification...")
        test_results['tests']['system_integration'] = await self.test_system_integration_verification()
        
        # Generate final summary
        test_results['completed_at'] = datetime.now().isoformat()
        test_results['total_duration'] = (datetime.now() - self.start_time).total_seconds()
        test_results['summary'] = self.generate_test_summary(test_results)
        
        logger.info("✅ TORI Complete Integration Test Suite completed")
        
        return test_results
    
    async def test_pdf_complete_integration(self) -> Dict[str, any]:
        """Test complete PDF processing through entire TORI pipeline"""
        try:
            # Create mock PDF content
            pdf_content = self.create_mock_pdf_content()
            
            # Route through complete TORI system
            result = await route_document_complete(
                file_content=pdf_content,
                file_type='pdf',
                filename='test_integration.pdf',
                metadata={'test': True, 'source': 'integration_test'}
            )
            
            return {
                'status': result.get('status', 'unknown'),
                'processing_duration': result.get('processing_duration', 0),
                'stages_completed': len(result.get('stages', {})),
                'system_uuids': result.get('system_uuids', {}),
                'integrity_score': result.get('stages', {}).get('verification', {}).get('overall_integrity_score', 0.0),
                'concepts_extracted': result.get('stages', {}).get('document_processing', {}).get('concepts_extracted', 0),
                'error': result.get('error')
            }
            
        except Exception as e:
            logger.exception(f"PDF integration test failed: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    async def test_docx_complete_integration(self) -> Dict[str, any]:
        """Test complete DOCX processing through entire TORI pipeline"""
        try:
            # Create mock DOCX content
            docx_content = self.create_mock_docx_content()
            
            # Route through complete TORI system
            result = await route_document_complete(
                file_content=docx_content,
                file_type='docx',
                filename='test_integration.docx',
                metadata={'test': True, 'source': 'integration_test'}
            )
            
            return {
                'status': result.get('status', 'unknown'),
                'processing_duration': result.get('processing_duration', 0),
                'stages_completed': len(result.get('stages', {})),
                'system_uuids': result.get('system_uuids', {}),
                'integrity_score': result.get('stages', {}).get('verification', {}).get('overall_integrity_score', 0.0),
                'concepts_extracted': result.get('stages', {}).get('document_processing', {}).get('concepts_extracted', 0),
                'error': result.get('error')
            }
            
        except Exception as e:
            logger.exception(f"DOCX integration test failed: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    async def test_csv_complete_integration(self) -> Dict[str, any]:
        """Test complete CSV processing through entire TORI pipeline"""
        try:
            # Create CSV content
            csv_content = b"""Name,Age,Department,Salary,Performance_Score
John Smith,28,Engineering,75000,4.2
Jane Doe,32,Marketing,68000,4.7
Bob Johnson,45,Engineering,95000,4.1
Alice Brown,29,Design,62000,4.5
Charlie Wilson,38,Marketing,72000,4.3
Diana Davis,41,Engineering,88000,4.6
Eva Martinez,26,Design,58000,4.4
Frank Thompson,35,Marketing,71000,4.2"""
            
            # Route through complete TORI system
            result = await route_document_complete(
                file_content=csv_content,
                file_type='csv',
                filename='employee_data.csv',
                metadata={'test': True, 'source': 'integration_test', 'data_type': 'employee_records'}
            )
            
            return {
                'status': result.get('status', 'unknown'),
                'processing_duration': result.get('processing_duration', 0),
                'stages_completed': len(result.get('stages', {})),
                'system_uuids': result.get('system_uuids', {}),
                'integrity_score': result.get('stages', {}).get('verification', {}).get('overall_integrity_score', 0.0),
                'concepts_extracted': result.get('stages', {}).get('document_processing', {}).get('concepts_extracted', 0),
                'error': result.get('error')
            }
            
        except Exception as e:
            logger.exception(f"CSV integration test failed: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    async def test_json_complete_integration(self) -> Dict[str, any]:
        """Test complete JSON processing through entire TORI pipeline"""
        try:
            # Create JSON content
            json_data = {
                "document_title": "TORI System Architecture",
                "version": "2.0",
                "last_updated": "2025-05-27",
                "components": {
                    "ingest_bus": {
                        "description": "Document ingestion microservice",
                        "technologies": ["FastAPI", "Python", "AsyncIO"],
                        "capabilities": ["PDF processing", "DOCX processing", "concept extraction"]
                    },
                    "concept_mesh": {
                        "description": "Knowledge graph system",
                        "technologies": ["Rust", "Graph databases"],
                        "capabilities": ["concept linking", "relationship mapping", "knowledge storage"]
                    },
                    "psi_mesh": {
                        "description": "Semantic association system",
                        "technologies": ["Python", "Vector databases"],
                        "capabilities": ["semantic verification", "integrity checking", "concept validation"]
                    }
                },
                "integration_points": [
                    "Document processing pipeline",
                    "Concept extraction and verification",
                    "Knowledge graph population",
                    "Memory storage and retrieval"
                ],
                "metadata": {
                    "complexity": "high",
                    "maturity": "production-ready",
                    "scalability": "horizontal"
                }
            }
            
            json_content = json.dumps(json_data, indent=2).encode('utf-8')
            
            # Route through complete TORI system
            result = await route_document_complete(
                file_content=json_content,
                file_type='json',
                filename='tori_architecture.json',
                metadata={'test': True, 'source': 'integration_test', 'content_type': 'system_architecture'}
            )
            
            return {
                'status': result.get('status', 'unknown'),
                'processing_duration': result.get('processing_duration', 0),
                'stages_completed': len(result.get('stages', {})),
                'system_uuids': result.get('system_uuids', {}),
                'integrity_score': result.get('stages', {}).get('verification', {}).get('overall_integrity_score', 0.0),
                'concepts_extracted': result.get('stages', {}).get('document_processing', {}).get('concepts_extracted', 0),
                'error': result.get('error')
            }
            
        except Exception as e:
            logger.exception(f"JSON integration test failed: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    async def test_markdown_complete_integration(self) -> Dict[str, any]:
        """Test complete Markdown processing through entire TORI pipeline"""
        try:
            # Create Markdown content
            markdown_content = b"""# TORI Document Ingestion Integration Test

This document tests the complete TORI document ingestion pipeline with all systems integrated.

## Overview

TORI (Total Organizational Reasoning Intelligence) provides comprehensive document processing capabilities including:

- **Document Parsing**: Support for PDF, DOCX, CSV, PPTX, XLSX, JSON, TXT, and MD formats
- **Concept Extraction**: Advanced semantic concept identification and validation
- **Knowledge Integration**: Connection to ConceptMesh, BraidMemory, PsiArc, and ScholarSphere
- **Verification System**: ψMesh integrity checking with confidence scoring

## Key Features

### 1. Multi-Format Support
The system processes various document types with specialized handlers:
- PDF documents with structure detection
- Word documents with heading extraction
- Spreadsheets with data analysis
- Structured data with schema recognition

### 2. Semantic Processing
Advanced concept extraction identifies:
- Named entities and key phrases
- Semantic relationships
- Document structure and context
- Cross-references and dependencies

### 3. Integrity Verification
The ψMesh verification layer ensures:
- Concept grounding in source text
- Non-hallucinated extractions
- Confidence score validation
- Source attribution accuracy

## System Integration

### ConceptMesh
Knowledge graph system storing:
- Concept nodes with metadata
- Relationship edges
- Document provenance
- Cross-system UUIDs

### BraidMemory
Memory storage providing:
- Segment-based retrieval
- Embedding vectors
- Importance scoring
- Context preservation

### PsiArc
Trajectory tracking with:
- Processing history
- Concept evolution
- Quality metrics
- System interactions

### ScholarSphere
Archival system featuring:
- Long-term storage
- Full-text search
- Access control
- Retention policies

## Conclusion

This integration test validates the complete TORI document ingestion pipeline across all supported file types and system integrations.
"""
            
            # Route through complete TORI system
            result = await route_document_complete(
                file_content=markdown_content,
                file_type='md',
                filename='tori_integration_test.md',
                metadata={'test': True, 'source': 'integration_test', 'content_type': 'documentation'}
            )
            
            return {
                'status': result.get('status', 'unknown'),
                'processing_duration': result.get('processing_duration', 0),
                'stages_completed': len(result.get('stages', {})),
                'system_uuids': result.get('system_uuids', {}),
                'integrity_score': result.get('stages', {}).get('verification', {}).get('overall_integrity_score', 0.0),
                'concepts_extracted': result.get('stages', {}).get('document_processing', {}).get('concepts_extracted', 0),
                'error': result.get('error')
            }
            
        except Exception as e:
            logger.exception(f"Markdown integration test failed: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    async def test_system_integration_verification(self) -> Dict[str, any]:
        """Test that all systems are properly integrated"""
        try:
            # Check that required directories exist
            base_path = Path(__file__).parent.parent
            required_paths = [
                base_path / "concept-mesh-data" / "nodes",
                base_path / "concept-mesh-data" / "braid_memory", 
                base_path / "concept-mesh-data" / "scholar_sphere",
                base_path / "concept-mesh-data" / "loop_records",
                base_path / "psiarc_logs"
            ]
            
            paths_exist = []
            for path in required_paths:
                exists = path.exists()
                paths_exist.append(exists)
                if not exists:
                    logger.warning(f"Required path does not exist: {path}")
            
            # Check for generated files from previous tests
            generated_files = {
                'concept_mesh_files': list((base_path / "concept-mesh-data" / "nodes").glob("*.json")) if (base_path / "concept-mesh-data" / "nodes").exists() else [],
                'braid_memory_files': list((base_path / "concept-mesh-data" / "braid_memory").glob("*.json")) if (base_path / "concept-mesh-data" / "braid_memory").exists() else [],
                'scholar_sphere_files': list((base_path / "concept-mesh-data" / "scholar_sphere").glob("*.json")) if (base_path / "concept-mesh-data" / "scholar_sphere").exists() else [],
                'loop_record_files': list((base_path / "concept-mesh-data" / "loop_records").glob("*.json")) if (base_path / "concept-mesh-data" / "loop_records").exists() else [],
                'psiarc_files': list((base_path / "psiarc_logs").glob("*.json")) if (base_path / "psiarc_logs").exists() else []
            }
            
            total_files = sum(len(files) for files in generated_files.values())
            
            return {
                'status': 'completed',
                'paths_verified': sum(paths_exist),
                'total_paths': len(required_paths),
                'paths_success_rate': sum(paths_exist) / len(required_paths),
                'generated_files': {k: len(v) for k, v in generated_files.items()},
                'total_generated_files': total_files,
                'integration_complete': all(paths_exist) and total_files > 0
            }
            
        except Exception as e:
            logger.exception(f"System integration verification failed: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    def create_mock_pdf_content(self) -> bytes:
        """Create mock PDF content for testing"""
        # This is a very basic PDF-like content
        # In a real implementation, you'd use a library to create valid PDF
        return b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 100 Td
(TORI Integration Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000185 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
279
%%EOF"""
    
    def create_mock_docx_content(self) -> bytes:
        """Create mock DOCX content for testing"""
        # This is a simplified approach - normally you'd use python-docx
        return b"""This is mock DOCX content for TORI integration testing.

Heading 1: Document Processing

This document tests the complete TORI document ingestion pipeline with concept extraction, verification, and system integration.

Key concepts include:
- Document processing
- Concept extraction
- System integration
- Knowledge management

Heading 2: Verification

The system includes integrity verification to ensure concept accuracy and source attribution."""
    
    def generate_test_summary(self, test_results: Dict[str, any]) -> Dict[str, any]:
        """Generate comprehensive test summary"""
        tests = test_results.get('tests', {})
        
        # Count successful tests
        successful_tests = sum(1 for test in tests.values() if test.get('status') == 'completed')
        total_tests = len(tests)
        
        # Calculate average scores
        integrity_scores = [test.get('integrity_score', 0) for test in tests.values() if 'integrity_score' in test]
        avg_integrity = sum(integrity_scores) / len(integrity_scores) if integrity_scores else 0
        
        processing_durations = [test.get('processing_duration', 0) for test in tests.values() if 'processing_duration' in test]
        avg_duration = sum(processing_durations) / len(processing_durations) if processing_durations else 0
        
        # System integration check
        system_integration = tests.get('system_integration', {})
        integration_complete = system_integration.get('integration_complete', False)
        
        return {
            'total_tests': total_tests,
            'successful_tests': successful_tests,
            'success_rate': successful_tests / total_tests if total_tests > 0 else 0,
            'average_integrity_score': avg_integrity,
            'average_processing_duration': avg_duration,
            'system_integration_complete': integration_complete,
            'overall_status': 'success' if successful_tests == total_tests and integration_complete else 'partial_success' if successful_tests > 0 else 'failed',
            'recommendations': self.generate_recommendations(test_results)
        }
    
    def generate_recommendations(self, test_results: Dict[str, any]) -> List[str]:
        """Generate recommendations based on test results"""
        recommendations = []
        tests = test_results.get('tests', {})
        
        # Check for failed tests
        failed_tests = [name for name, test in tests.items() if test.get('status') != 'completed']
        if failed_tests:
            recommendations.append(f"Address failed tests: {', '.join(failed_tests)}")
        
        # Check integrity scores
        integrity_scores = [test.get('integrity_score', 0) for test in tests.values() if 'integrity_score' in test]
        if integrity_scores:
            avg_integrity = sum(integrity_scores) / len(integrity_scores)
            if avg_integrity < 0.7:
                recommendations.append("Improve concept extraction quality - average integrity score is below 0.7")
        
        # Check processing performance
        durations = [test.get('processing_duration', 0) for test in tests.values() if 'processing_duration' in test]
        if durations:
            max_duration = max(durations)
            if max_duration > 60:
                recommendations.append("Optimize processing performance - some tests took over 60 seconds")
        
        # Check system integration
        system_integration = tests.get('system_integration', {})
        if not system_integration.get('integration_complete', False):
            recommendations.append("Complete system integration setup - not all required paths/files are present")
        
        if not recommendations:
            recommendations.append("All tests passed successfully! TORI integration is working correctly.")
        
        return recommendations

async def main():
    """Run the complete TORI integration test"""
    print("🚀 Starting TORI Complete Document Ingestion Integration Test")
    print("=" * 80)
    
    test_suite = ToriCompleteIntegrationTest()
    
    try:
        results = await test_suite.run_complete_test_suite()
        
        # Print results
        print("\n📊 TEST RESULTS SUMMARY")
        print("=" * 40)
        
        summary = results.get('summary', {})
        print(f"Total Tests: {summary.get('total_tests', 0)}")
        print(f"Successful Tests: {summary.get('successful_tests', 0)}")
        print(f"Success Rate: {summary.get('success_rate', 0):.1%}")
        print(f"Average Integrity Score: {summary.get('average_integrity_score', 0):.3f}")
        print(f"Average Processing Duration: {summary.get('average_processing_duration', 0):.2f}s")
        print(f"System Integration Complete: {summary.get('system_integration_complete', False)}")
        print(f"Overall Status: {summary.get('overall_status', 'unknown').upper()}")
        
        print("\n📋 RECOMMENDATIONS:")
        for i, rec in enumerate(summary.get('recommendations', []), 1):
            print(f"{i}. {rec}")
        
        print("\n🔍 DETAILED TEST RESULTS:")
        for test_name, test_result in results.get('tests', {}).items():
            status = test_result.get('status', 'unknown')
            duration = test_result.get('processing_duration', 0)
            concepts = test_result.get('concepts_extracted', 0)
            integrity = test_result.get('integrity_score', 0)
            
            print(f"  {test_name}: {status.upper()} ({duration:.2f}s, {concepts} concepts, {integrity:.3f} integrity)")
        
        # Save results to file
        results_path = Path(__file__).parent.parent / "TORI_INTEGRATION_TEST_RESULTS.json"
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n📁 Full results saved to: {results_path}")
        
        if summary.get('overall_status') == 'success':
            print("\n🎉 TORI INTEGRATION TEST COMPLETED SUCCESSFULLY!")
            print("✅ All systems are working correctly")
        else:
            print("\n⚠️ TORI INTEGRATION TEST COMPLETED WITH ISSUES")
            print("❌ Some components need attention")
        
    except Exception as e:
        logger.exception(f"Integration test failed: {e}")
        print(f"\n❌ INTEGRATION TEST FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main())
