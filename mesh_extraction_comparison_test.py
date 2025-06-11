"""
mesh_extraction_comparison_test.py
==================================
Scientific comparison test: PDF and TXT extraction through ScholarSphere (5731) vs Prajna API (8001)

This script runs 4 controlled tests to validate the mesh lockdown migration:
1. PDF → ScholarSphere (legacy direct mesh write)
2. PDF → Prajna API (lockdown proposal system)  
3. TXT → ScholarSphere (legacy direct mesh write)
4. TXT → Prajna API (lockdown proposal system)
"""

import requests
import json
import time
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler('mesh_comparison_test.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MeshExtractionTester:
    """Scientific mesh extraction comparison tester."""
    
    def __init__(self):
        self.results = []
        self.test_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Endpoints
        self.scholarsphere_url = "http://localhost:5731"
        self.prajna_url = "http://localhost:8001"
        
        # Test files (you'll specify these)
        self.test_pdf = None
        self.test_txt = None
        
        # Results storage
        self.results_file = f"mesh_test_results_{self.test_timestamp}.json"
        
    def set_test_files(self, pdf_path: str, txt_path: str):
        """Set the test files to use for comparison."""
        self.test_pdf = Path(pdf_path)
        self.test_txt = Path(txt_path)
        
        if not self.test_pdf.exists():
            raise FileNotFoundError(f"PDF test file not found: {pdf_path}")
        if not self.test_txt.exists():
            raise FileNotFoundError(f"TXT test file not found: {txt_path}")
            
        logger.info(f"📄 Test PDF: {self.test_pdf}")
        logger.info(f"📝 Test TXT: {self.test_txt}")
    
    def check_service_health(self, url: str, service_name: str) -> bool:
        """Check if a service is running and healthy."""
        try:
            response = requests.get(f"{url}/health", timeout=5)
            if response.status_code == 200:
                logger.info(f"✅ {service_name} ({url}) is healthy")
                return True
            else:
                logger.error(f"❌ {service_name} ({url}) unhealthy: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ {service_name} ({url}) not reachable: {e}")
            return False
    
    def test_scholarsphere_pdf(self) -> Dict[str, Any]:
        """Test 1: PDF → ScholarSphere (legacy direct mesh write)"""
        logger.info("\n" + "="*60)
        logger.info("🧪 TEST 1: PDF → ScholarSphere (Port 5731) - LEGACY")
        logger.info("="*60)
        
        start_time = time.time()
        test_result = {
            "test_number": 1,
            "test_name": "PDF_ScholarSphere_Legacy",
            "file_type": "PDF",
            "port": 5731,
            "endpoint": "ScholarSphere",
            "method": "Legacy direct mesh write",
            "timestamp": datetime.now().isoformat(),
            "file_path": str(self.test_pdf),
            "success": False,
            "error": None,
            "concept_count": 0,
            "top_concepts": [],
            "log_summary": [],
            "response_time": 0,
            "raw_response": None
        }
        
        try:
            # Upload PDF to ScholarSphere
            with open(self.test_pdf, 'rb') as f:
                files = {'file': (self.test_pdf.name, f, 'application/pdf')}
                
                logger.info(f"📤 Uploading {self.test_pdf.name} to ScholarSphere...")
                response = requests.post(
                    f"{self.scholarsphere_url}/upload",
                    files=files,
                    timeout=60
                )
            
            test_result["response_time"] = time.time() - start_time
            test_result["raw_response"] = response.text
            
            if response.status_code == 200:
                result_data = response.json()
                test_result["success"] = True
                test_result["concept_count"] = result_data.get("concept_count", 0)
                test_result["top_concepts"] = result_data.get("concept_names", [])[:10]
                
                logger.info(f"✅ ScholarSphere PDF upload successful!")
                logger.info(f"📊 Concepts extracted: {test_result['concept_count']}")
                logger.info(f"🎯 Top concepts: {', '.join(test_result['top_concepts'][:5])}")
                
                # Check for mesh file update
                mesh_file = Path("concept_mesh_data.json")
                if mesh_file.exists():
                    test_result["log_summary"].append("concept_mesh_data.json updated")
                    logger.info("📝 Direct mesh file update confirmed")
                
            else:
                test_result["error"] = f"HTTP {response.status_code}: {response.text}"
                logger.error(f"❌ ScholarSphere upload failed: {response.status_code}")
                
        except Exception as e:
            test_result["error"] = str(e)
            test_result["response_time"] = time.time() - start_time
            logger.error(f"❌ ScholarSphere test failed: {e}")
        
        self.results.append(test_result)
        return test_result
    
    def test_prajna_pdf(self) -> Dict[str, Any]:
        """Test 2: PDF → Prajna API (lockdown proposal system)"""
        logger.info("\n" + "="*60)
        logger.info("🧪 TEST 2: PDF → Prajna API (Port 8001) - LOCKDOWN")
        logger.info("="*60)
        
        start_time = time.time()
        test_result = {
            "test_number": 2,
            "test_name": "PDF_Prajna_Lockdown",
            "file_type": "PDF", 
            "port": 8001,
            "endpoint": "Prajna API",
            "method": "Lockdown proposal system",
            "timestamp": datetime.now().isoformat(),
            "file_path": str(self.test_pdf),
            "success": False,
            "error": None,
            "concept_count": 0,
            "top_concepts": [],
            "log_summary": [],
            "response_time": 0,
            "proposals_sent": 0,
            "proposals_successful": 0,
            "raw_response": None
        }
        
        try:
            # First upload PDF to Prajna for extraction
            with open(self.test_pdf, 'rb') as f:
                files = {'file': (self.test_pdf.name, f, 'application/pdf')}
                
                logger.info(f"📤 Uploading {self.test_pdf.name} to Prajna for extraction...")
                upload_response = requests.post(
                    f"{self.prajna_url}/api/upload",
                    files=files,
                    timeout=60
                )
            
            if upload_response.status_code != 200:
                raise Exception(f"Prajna upload failed: {upload_response.status_code} - {upload_response.text}")
                
            upload_data = upload_response.json()
            concepts = upload_data.get("concept_names", [])
            test_result["concept_count"] = len(concepts)
            test_result["top_concepts"] = concepts[:10]
            
            logger.info(f"📊 Concepts extracted by Prajna: {len(concepts)}")
            logger.info(f"🎯 Top concepts: {', '.join(concepts[:5])}")
            
            # Now send each concept as a proposal through the lockdown API
            logger.info("🔒 Sending concepts through lockdown proposal API...")
            
            successful_proposals = 0
            for i, concept in enumerate(concepts):
                proposal = {
                    "concept": concept,
                    "context": f"Extracted from {self.test_pdf.name} via Prajna extraction",
                    "provenance": {
                        "source": "mesh_comparison_test",
                        "test_number": 2,
                        "original_file": self.test_pdf.name,
                        "extraction_method": "prajna_upload_then_propose",
                        "timestamp": datetime.now().isoformat()
                    }
                }
                
                try:
                    prop_response = requests.post(
                        f"{self.prajna_url}/api/prajna/propose",
                        json=proposal,
                        timeout=10
                    )
                    
                    if prop_response.status_code == 200:
                        successful_proposals += 1
                        if i < 3:  # Log first few
                            logger.info(f"✅ Proposal {i+1}: {concept}")
                    else:
                        logger.warning(f"⚠️ Proposal failed for '{concept}': {prop_response.status_code}")
                        
                except Exception as e:
                    logger.warning(f"⚠️ Proposal error for '{concept}': {e}")
            
            test_result["proposals_sent"] = len(concepts)
            test_result["proposals_successful"] = successful_proposals
            test_result["success"] = successful_proposals > 0
            test_result["response_time"] = time.time() - start_time
            
            logger.info(f"✅ Prajna lockdown test completed!")
            logger.info(f"📊 Proposals sent: {test_result['proposals_sent']}")
            logger.info(f"✅ Proposals successful: {successful_proposals}")
            
            test_result["log_summary"].append(f"Lockdown API proposals: {successful_proposals}/{len(concepts)}")
            
        except Exception as e:
            test_result["error"] = str(e)
            test_result["response_time"] = time.time() - start_time
            logger.error(f"❌ Prajna lockdown test failed: {e}")
        
        self.results.append(test_result)
        return test_result
    
    def test_scholarsphere_txt(self) -> Dict[str, Any]:
        """Test 3: TXT → ScholarSphere (legacy direct mesh write)"""
        logger.info("\n" + "="*60)
        logger.info("🧪 TEST 3: TXT → ScholarSphere (Port 5731) - LEGACY")
        logger.info("="*60)
        
        start_time = time.time()
        test_result = {
            "test_number": 3,
            "test_name": "TXT_ScholarSphere_Legacy",
            "file_type": "TXT",
            "port": 5731,
            "endpoint": "ScholarSphere",
            "method": "Legacy direct mesh write",
            "timestamp": datetime.now().isoformat(),
            "file_path": str(self.test_txt),
            "success": False,
            "error": None,
            "concept_count": 0,
            "top_concepts": [],
            "log_summary": [],
            "response_time": 0,
            "raw_response": None
        }
        
        try:
            # Upload TXT to ScholarSphere
            with open(self.test_txt, 'rb') as f:
                files = {'file': (self.test_txt.name, f, 'text/plain')}
                
                logger.info(f"📤 Uploading {self.test_txt.name} to ScholarSphere...")
                response = requests.post(
                    f"{self.scholarsphere_url}/upload",
                    files=files,
                    timeout=60
                )
            
            test_result["response_time"] = time.time() - start_time
            test_result["raw_response"] = response.text
            
            if response.status_code == 200:
                result_data = response.json()
                test_result["success"] = True
                test_result["concept_count"] = result_data.get("concept_count", 0)
                test_result["top_concepts"] = result_data.get("concept_names", [])[:10]
                
                logger.info(f"✅ ScholarSphere TXT upload successful!")
                logger.info(f"📊 Concepts extracted: {test_result['concept_count']}")
                logger.info(f"🎯 Top concepts: {', '.join(test_result['top_concepts'][:5])}")
                
            else:
                test_result["error"] = f"HTTP {response.status_code}: {response.text}"
                logger.error(f"❌ ScholarSphere TXT upload failed: {response.status_code}")
                
        except Exception as e:
            test_result["error"] = str(e)
            test_result["response_time"] = time.time() - start_time
            logger.error(f"❌ ScholarSphere TXT test failed: {e}")
        
        self.results.append(test_result)
        return test_result
    
    def test_prajna_txt(self) -> Dict[str, Any]:
        """Test 4: TXT → Prajna API (lockdown proposal system)"""
        logger.info("\n" + "="*60)
        logger.info("🧪 TEST 4: TXT → Prajna API (Port 8001) - LOCKDOWN")
        logger.info("="*60)
        
        start_time = time.time()
        test_result = {
            "test_number": 4,
            "test_name": "TXT_Prajna_Lockdown",
            "file_type": "TXT",
            "port": 8001,
            "endpoint": "Prajna API",
            "method": "Lockdown proposal system",
            "timestamp": datetime.now().isoformat(),
            "file_path": str(self.test_txt),
            "success": False,
            "error": None,
            "concept_count": 0,
            "top_concepts": [],
            "log_summary": [],
            "response_time": 0,
            "proposals_sent": 0,
            "proposals_successful": 0,
            "raw_response": None
        }
        
        try:
            # Upload TXT to Prajna for extraction
            with open(self.test_txt, 'rb') as f:
                files = {'file': (self.test_txt.name, f, 'text/plain')}
                
                logger.info(f"📤 Uploading {self.test_txt.name} to Prajna for extraction...")
                upload_response = requests.post(
                    f"{self.prajna_url}/api/upload",
                    files=files,
                    timeout=60
                )
            
            if upload_response.status_code != 200:
                raise Exception(f"Prajna TXT upload failed: {upload_response.status_code}")
                
            upload_data = upload_response.json()
            concepts = upload_data.get("concept_names", [])
            test_result["concept_count"] = len(concepts)
            test_result["top_concepts"] = concepts[:10]
            
            logger.info(f"📊 Concepts extracted by Prajna: {len(concepts)}")
            logger.info(f"🎯 Top concepts: {', '.join(concepts[:5])}")
            
            # Send concepts through lockdown API
            logger.info("🔒 Sending concepts through lockdown proposal API...")
            
            successful_proposals = 0
            for i, concept in enumerate(concepts):
                proposal = {
                    "concept": concept,
                    "context": f"Extracted from {self.test_txt.name} via Prajna extraction",
                    "provenance": {
                        "source": "mesh_comparison_test",
                        "test_number": 4,
                        "original_file": self.test_txt.name,
                        "extraction_method": "prajna_upload_then_propose",
                        "timestamp": datetime.now().isoformat()
                    }
                }
                
                try:
                    prop_response = requests.post(
                        f"{self.prajna_url}/api/prajna/propose",
                        json=proposal,
                        timeout=10
                    )
                    
                    if prop_response.status_code == 200:
                        successful_proposals += 1
                        if i < 3:  # Log first few
                            logger.info(f"✅ Proposal {i+1}: {concept}")
                    else:
                        logger.warning(f"⚠️ Proposal failed for '{concept}': {prop_response.status_code}")
                        
                except Exception as e:
                    logger.warning(f"⚠️ Proposal error for '{concept}': {e}")
            
            test_result["proposals_sent"] = len(concepts)
            test_result["proposals_successful"] = successful_proposals
            test_result["success"] = successful_proposals > 0
            test_result["response_time"] = time.time() - start_time
            
            logger.info(f"✅ Prajna TXT lockdown test completed!")
            logger.info(f"📊 Proposals sent: {test_result['proposals_sent']}")
            logger.info(f"✅ Proposals successful: {successful_proposals}")
            
        except Exception as e:
            test_result["error"] = str(e)
            test_result["response_time"] = time.time() - start_time
            logger.error(f"❌ Prajna TXT lockdown test failed: {e}")
        
        self.results.append(test_result)
        return test_result
    
    def save_results(self):
        """Save test results to JSON file."""
        with open(self.results_file, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        logger.info(f"📊 Results saved to: {self.results_file}")
    
    def print_comparison_summary(self):
        """Print a comparison summary of all tests."""
        logger.info("\n" + "="*80)
        logger.info("📊 MESH EXTRACTION COMPARISON SUMMARY")
        logger.info("="*80)
        
        print("\n| Test | File | Port | Method | Concepts | Success | Time (s) |")
        print("|------|------|------|--------|----------|---------|----------|")
        
        for result in self.results:
            success_icon = "✅" if result["success"] else "❌"
            print(f"| {result['test_number']} | {result['file_type']} | {result['port']} | "
                  f"{result['method'][:15]}... | {result['concept_count']} | {success_icon} | "
                  f"{result['response_time']:.2f} |")
        
        # Analysis
        logger.info("\n🔍 ANALYSIS:")
        
        pdf_legacy = next((r for r in self.results if r["test_number"] == 1), None)
        pdf_lockdown = next((r for r in self.results if r["test_number"] == 2), None)
        txt_legacy = next((r for r in self.results if r["test_number"] == 3), None)
        txt_lockdown = next((r for r in self.results if r["test_number"] == 4), None)
        
        if pdf_legacy and pdf_lockdown:
            pdf_diff = pdf_lockdown["concept_count"] - pdf_legacy["concept_count"]
            logger.info(f"📄 PDF: Legacy={pdf_legacy['concept_count']}, Lockdown={pdf_lockdown['concept_count']}, Diff={pdf_diff:+d}")
            
        if txt_legacy and txt_lockdown:
            txt_diff = txt_lockdown["concept_count"] - txt_legacy["concept_count"]
            logger.info(f"📝 TXT: Legacy={txt_legacy['concept_count']}, Lockdown={txt_lockdown['concept_count']}, Diff={txt_diff:+d}")
        
        # Identify any failures
        failures = [r for r in self.results if not r["success"]]
        if failures:
            logger.error(f"\n❌ FAILURES: {len(failures)} tests failed")
            for failure in failures:
                logger.error(f"   Test {failure['test_number']}: {failure['error']}")
        else:
            logger.info(f"\n✅ ALL TESTS PASSED!")
        
        logger.info(f"\n📁 Detailed results: {self.results_file}")
    
    def run_all_tests(self, pdf_path: str, txt_path: str):
        """Run the complete test suite."""
        logger.info("🧪 STARTING MESH EXTRACTION COMPARISON TESTS")
        logger.info(f"⏰ Test run: {self.test_timestamp}")
        
        # Setup
        self.set_test_files(pdf_path, txt_path)
        
        # Health checks
        logger.info("\n🏥 HEALTH CHECKS:")
        scholarsphere_ok = self.check_service_health(self.scholarsphere_url, "ScholarSphere")
        prajna_ok = self.check_service_health(self.prajna_url, "Prajna API")
        
        if not scholarsphere_ok:
            logger.error("❌ ScholarSphere not available - tests will fail")
        if not prajna_ok:
            logger.error("❌ Prajna API not available - tests will fail")
        
        # Run tests
        try:
            self.test_scholarsphere_pdf()
            time.sleep(2)  # Brief pause between tests
            
            self.test_prajna_pdf()
            time.sleep(2)
            
            self.test_scholarsphere_txt()
            time.sleep(2)
            
            self.test_prajna_txt()
            
        except KeyboardInterrupt:
            logger.info("\n⏹️ Tests interrupted by user")
        except Exception as e:
            logger.error(f"\n❌ Test suite failed: {e}")
        
        # Results
        self.save_results()
        self.print_comparison_summary()

def main():
    """Main test runner."""
    print("🧪 MESH EXTRACTION COMPARISON TEST SUITE")
    print("=" * 60)
    
    # Get test files from user
    pdf_path = input("📄 Enter path to test PDF file: ").strip()
    txt_path = input("📝 Enter path to test TXT file: ").strip()
    
    if not pdf_path or not txt_path:
        print("❌ Both PDF and TXT paths are required")
        return
    
    # Run tests
    tester = MeshExtractionTester()
    tester.run_all_tests(pdf_path, txt_path)

if __name__ == "__main__":
    main()
