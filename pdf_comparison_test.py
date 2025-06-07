#!/usr/bin/env python3
"""
PDF Processing Comparison Script
================================

This script runs the same PDF through both ScholarSphere and Prajna systems
to compare their processing approaches, results, and insights.

Target PDF: C:\Users\jason\Desktop\tori\kha\data\2502.17445v1.pdf
"""

import json
import time
import requests
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

class PDFComparisonAnalyzer:
    """Comprehensive comparison of ScholarSphere vs Prajna PDF processing"""
    
    def __init__(self, pdf_path: str):
        self.pdf_path = Path(pdf_path)
        self.results = {
            "pdf_info": {
                "filename": self.pdf_path.name,
                "filepath": str(self.pdf_path),
                "file_size": self.pdf_path.stat().st_size if self.pdf_path.exists() else 0,
                "test_timestamp": datetime.now().isoformat()
            },
            "scholarsphere": {},
            "prajna": {},
            "comparison": {}
        }
        
        # API endpoints
        self.scholarsphere_api = "http://localhost:8002"
        self.prajna_education_api = "http://localhost:3000"  # Our education system
        
        print(f"🔍 PDF Comparison Analyzer initialized")
        print(f"📄 Target PDF: {self.pdf_path}")
        print(f"📊 File size: {self.results['pdf_info']['file_size']:,} bytes")
    
    def check_systems_availability(self) -> Dict[str, bool]:
        """Check if both systems are running"""
        print("\n🔍 Checking system availability...")
        
        availability = {
            "scholarsphere": False,
            "prajna_education": False
        }
        
        # Check ScholarSphere
        try:
            response = requests.get(f"{self.scholarsphere_api}/health", timeout=5)
            availability["scholarsphere"] = response.status_code == 200
            print(f"✅ ScholarSphere: {'Available' if availability['scholarsphere'] else 'Not responding'}")
        except Exception as e:
            print(f"❌ ScholarSphere: Not available ({e})")
        
        # Check Prajna Education
        try:
            response = requests.get(f"{self.prajna_education_api}/api/health", timeout=5)
            availability["prajna_education"] = response.status_code == 200
            print(f"✅ Prajna Education: {'Available' if availability['prajna_education'] else 'Not responding'}")
        except Exception as e:
            print(f"❌ Prajna Education: Not available ({e})")
        
        return availability
    
    def process_with_scholarsphere(self) -> Dict[str, Any]:
        """Process PDF through ScholarSphere (4000-hour sophisticated system)"""
        print(f"\n🏛️ Processing with ScholarSphere (4000-hour system)...")
        
        start_time = time.time()
        
        try:
            # Upload PDF to ScholarSphere
            with open(self.pdf_path, 'rb') as pdf_file:
                files = {'file': (self.pdf_path.name, pdf_file, 'application/pdf')}
                data = {'user_id': 'comparison_test', 'doc_id': f'ss_test_{int(time.time())}'} 
                
                response = requests.post(
                    f"{self.scholarsphere_api}/api/upload",
                    files=files,
                    data=data,
                    timeout=300  # 5 minutes
                )
            
            processing_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                
                ss_result = {
                    "success": True,
                    "processing_time": processing_time,
                    "status_code": response.status_code,
                    "num_concepts": result.get("num_concepts", 0),
                    "concepts": result.get("concepts", []),
                    "method": result.get("integration_info", {}).get("extraction_method", "unknown"),
                    "advanced_analytics": result.get("advanced_analytics", {}),
                    "summary": result.get("summary", {}),
                    "raw_response": result
                }
                
                print(f"✅ ScholarSphere completed in {processing_time:.2f}s")
                print(f"📊 Extracted {ss_result['num_concepts']} concepts")
                print(f"🔧 Method: {ss_result['method']}")
                
                return ss_result
            else:
                print(f"❌ ScholarSphere failed: {response.status_code}")
                return {
                    "success": False,
                    "processing_time": processing_time,
                    "status_code": response.status_code,
                    "error": response.text
                }
                
        except Exception as e:
            processing_time = time.time() - start_time
            print(f"❌ ScholarSphere error: {str(e)}")
            return {
                "success": False,
                "processing_time": processing_time,
                "error": str(e)
            }
    
    def process_with_prajna_education(self) -> Dict[str, Any]:
        """Process PDF through Prajna Education system"""
        print(f"\n🧠 Processing with Prajna Education system...")
        
        start_time = time.time()
        
        try:
            # Upload PDF to Prajna Education
            with open(self.pdf_path, 'rb') as pdf_file:
                files = {'file': (self.pdf_path.name, pdf_file, 'application/pdf')}
                data = {'user_id': 'comparison_test', 'doc_id': f'prajna_test_{int(time.time())}'}
                
                response = requests.post(
                    f"{self.prajna_education_api}/api/upload",
                    files=files,
                    data=data,
                    timeout=300  # 5 minutes
                )
            
            processing_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                
                prajna_result = {
                    "success": True,
                    "processing_time": processing_time,
                    "status_code": response.status_code,
                    "num_concepts": result.get("num_concepts", 0),
                    "concepts": result.get("concepts", []),
                    "method": result.get("method", "unknown"),
                    "summary": result.get("summary", {}),
                    "raw_response": result
                }
                
                print(f"✅ Prajna Education completed in {processing_time:.2f}s")
                print(f"📊 Extracted {prajna_result['num_concepts']} concepts")
                print(f"🔧 Method: {prajna_result['method']}")
                
                return prajna_result
            else:
                print(f"❌ Prajna Education failed: {response.status_code}")
                return {
                    "success": False,
                    "processing_time": processing_time,
                    "status_code": response.status_code,
                    "error": response.text
                }
                
        except Exception as e:
            processing_time = time.time() - start_time
            print(f"❌ Prajna Education error: {str(e)}")
            return {
                "success": False,
                "processing_time": processing_time,
                "error": str(e)
            }
    
    def analyze_concept_overlap(self, ss_concepts: List[Dict], prajna_concepts: List[Dict]) -> Dict[str, Any]:
        """Analyze overlap and differences between concept sets"""
        print(f"\n🔍 Analyzing concept overlap...")
        
        # Extract concept names for comparison
        ss_names = set()
        prajna_names = set()
        
        for concept in ss_concepts:
            if isinstance(concept, dict) and "name" in concept:
                ss_names.add(concept["name"].lower().strip())
        
        for concept in prajna_concepts:
            if isinstance(concept, dict) and "name" in concept:
                prajna_names.add(concept["name"].lower().strip())
        
        # Calculate overlaps
        overlap = ss_names.intersection(prajna_names)
        ss_unique = ss_names - prajna_names
        prajna_unique = prajna_names - ss_names
        
        # Calculate similarity metrics
        total_unique_concepts = len(ss_names.union(prajna_names))
        overlap_percentage = (len(overlap) / total_unique_concepts * 100) if total_unique_concepts > 0 else 0
        
        analysis = {
            "total_concepts": {
                "scholarsphere": len(ss_names),
                "prajna": len(prajna_names),
                "total_unique": total_unique_concepts
            },
            "overlap": {
                "count": len(overlap),
                "percentage": overlap_percentage,
                "concepts": list(overlap)
            },
            "unique_to_scholarsphere": {
                "count": len(ss_unique),
                "concepts": list(ss_unique)
            },
            "unique_to_prajna": {
                "count": len(prajna_unique),
                "concepts": list(prajna_unique)
            }
        }
        
        print(f"📊 Overlap Analysis:")
        print(f"   ScholarSphere: {len(ss_names)} concepts")
        print(f"   Prajna: {len(prajna_names)} concepts")
        print(f"   Overlap: {len(overlap)} concepts ({overlap_percentage:.1f}%)")
        print(f"   Unique to SS: {len(ss_unique)} concepts")
        print(f"   Unique to Prajna: {len(prajna_unique)} concepts")
        
        return analysis
    
    def analyze_quality_metrics(self, ss_result: Dict, prajna_result: Dict) -> Dict[str, Any]:
        """Compare quality metrics between systems"""
        print(f"\n📈 Analyzing quality metrics...")
        
        quality_analysis = {
            "processing_time": {
                "scholarsphere": ss_result.get("processing_time", 0),
                "prajna": prajna_result.get("processing_time", 0),
                "faster_system": "scholarsphere" if ss_result.get("processing_time", float('inf')) < prajna_result.get("processing_time", float('inf')) else "prajna"
            },
            "concept_scores": {
                "scholarsphere": [],
                "prajna": []
            },
            "methods_used": {
                "scholarsphere": ss_result.get("method", "unknown"),
                "prajna": prajna_result.get("method", "unknown")
            }
        }
        
        # Extract concept scores
        for concept in ss_result.get("concepts", []):
            if isinstance(concept, dict) and "score" in concept:
                quality_analysis["concept_scores"]["scholarsphere"].append(concept["score"])
        
        for concept in prajna_result.get("concepts", []):
            if isinstance(concept, dict) and "score" in concept:
                quality_analysis["concept_scores"]["prajna"].append(concept["score"])
        
        # Calculate average scores
        ss_scores = quality_analysis["concept_scores"]["scholarsphere"]
        prajna_scores = quality_analysis["concept_scores"]["prajna"]
        
        quality_analysis["average_scores"] = {
            "scholarsphere": sum(ss_scores) / len(ss_scores) if ss_scores else 0,
            "prajna": sum(prajna_scores) / len(prajna_scores) if prajna_scores else 0
        }
        
        print(f"⚡ Processing Time:")
        print(f"   ScholarSphere: {quality_analysis['processing_time']['scholarsphere']:.2f}s")
        print(f"   Prajna: {quality_analysis['processing_time']['prajna']:.2f}s")
        print(f"   Faster: {quality_analysis['processing_time']['faster_system']}")
        
        print(f"📊 Average Concept Scores:")
        print(f"   ScholarSphere: {quality_analysis['average_scores']['scholarsphere']:.3f}")
        print(f"   Prajna: {quality_analysis['average_scores']['prajna']:.3f}")
        
        return quality_analysis
    
    def generate_recommendations(self, comparison: Dict) -> List[str]:
        """Generate recommendations based on comparison results"""
        recommendations = []
        
        overlap_pct = comparison.get("concept_overlap", {}).get("overlap", {}).get("percentage", 0)
        ss_time = comparison.get("quality_metrics", {}).get("processing_time", {}).get("scholarsphere", 0)
        prajna_time = comparison.get("quality_metrics", {}).get("processing_time", {}).get("prajna", 0)
        
        # Overlap analysis
        if overlap_pct < 30:
            recommendations.append("🔄 Low overlap suggests systems have complementary strengths - consider using both")
        elif overlap_pct > 70:
            recommendations.append("🎯 High overlap suggests redundancy - one system may be sufficient")
        else:
            recommendations.append("⚖️ Moderate overlap suggests systems find different but related concepts")
        
        # Speed analysis
        if abs(ss_time - prajna_time) > 30:  # More than 30 second difference
            faster = "ScholarSphere" if ss_time < prajna_time else "Prajna"
            recommendations.append(f"⚡ {faster} is significantly faster - consider for real-time applications")
        
        # Method analysis
        ss_method = comparison.get("quality_metrics", {}).get("methods_used", {}).get("scholarsphere", "")
        if "advanced_4000h" in ss_method or "package_aware" in ss_method:
            recommendations.append("🏆 ScholarSphere uses sophisticated 4000-hour system - higher quality expected")
        
        if not recommendations:
            recommendations.append("📊 Systems show similar performance - choice depends on specific use case")
        
        return recommendations
    
    def run_full_comparison(self) -> Dict[str, Any]:
        """Run complete comparison analysis"""
        print("🚀 Starting PDF Processing Comparison")
        print("=" * 70)
        
        # Check if PDF exists
        if not self.pdf_path.exists():
            print(f"❌ PDF not found: {self.pdf_path}")
            return {"error": "PDF file not found"}
        
        # Check system availability
        availability = self.check_systems_availability()
        if not any(availability.values()):
            print("❌ No systems available for testing")
            return {"error": "No systems available"}
        
        # Process with ScholarSphere
        if availability["scholarsphere"]:
            self.results["scholarsphere"] = self.process_with_scholarsphere()
        else:
            print("⏭️ Skipping ScholarSphere (not available)")
            self.results["scholarsphere"] = {"success": False, "error": "System not available"}
        
        # Process with Prajna Education
        if availability["prajna_education"]:
            self.results["prajna"] = self.process_with_prajna_education()
        else:
            print("⏭️ Skipping Prajna Education (not available)")
            self.results["prajna"] = {"success": False, "error": "System not available"}
        
        # Compare results if both succeeded
        if (self.results["scholarsphere"].get("success") and 
            self.results["prajna"].get("success")):
            
            # Concept overlap analysis
            ss_concepts = self.results["scholarsphere"].get("concepts", [])
            prajna_concepts = self.results["prajna"].get("concepts", [])
            
            self.results["comparison"]["concept_overlap"] = self.analyze_concept_overlap(ss_concepts, prajna_concepts)
            self.results["comparison"]["quality_metrics"] = self.analyze_quality_metrics(
                self.results["scholarsphere"], 
                self.results["prajna"]
            )
            
            # Generate recommendations
            self.results["comparison"]["recommendations"] = self.generate_recommendations(self.results["comparison"])
        
        return self.results
    
    def save_results(self, output_dir: str = "comparison_results"):
        """Save detailed results to files"""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save JSON results
        json_file = output_path / f"pdf_comparison_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        # Save readable report
        report_file = output_path / f"pdf_comparison_report_{timestamp}.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(self.generate_text_report())
        
        print(f"\n📁 Results saved:")
        print(f"   📊 JSON: {json_file}")
        print(f"   📄 Report: {report_file}")
        
        return json_file, report_file
    
    def generate_text_report(self) -> str:
        """Generate human-readable report"""
        report = []
        report.append("PDF PROCESSING COMPARISON REPORT")
        report.append("=" * 50)
        report.append(f"PDF: {self.results['pdf_info']['filename']}")
        report.append(f"Timestamp: {self.results['pdf_info']['test_timestamp']}")
        report.append(f"File Size: {self.results['pdf_info']['file_size']:,} bytes")
        report.append("")
        
        # ScholarSphere results
        ss = self.results["scholarsphere"]
        report.append("SCHOLARSPHERE RESULTS:")
        report.append("-" * 25)
        if ss.get("success"):
            report.append(f"✅ Success: {ss['num_concepts']} concepts in {ss['processing_time']:.2f}s")
            report.append(f"Method: {ss['method']}")
        else:
            report.append(f"❌ Failed: {ss.get('error', 'Unknown error')}")
        report.append("")
        
        # Prajna results  
        prajna = self.results["prajna"]
        report.append("PRAJNA EDUCATION RESULTS:")
        report.append("-" * 25)
        if prajna.get("success"):
            report.append(f"✅ Success: {prajna['num_concepts']} concepts in {prajna['processing_time']:.2f}s")
            report.append(f"Method: {prajna['method']}")
        else:
            report.append(f"❌ Failed: {prajna.get('error', 'Unknown error')}")
        report.append("")
        
        # Comparison
        if "comparison" in self.results:
            comp = self.results["comparison"]
            report.append("COMPARISON ANALYSIS:")
            report.append("-" * 20)
            
            if "concept_overlap" in comp:
                overlap = comp["concept_overlap"]
                report.append(f"Concept Overlap: {overlap['overlap']['percentage']:.1f}%")
                report.append(f"Unique to ScholarSphere: {overlap['unique_to_scholarsphere']['count']}")
                report.append(f"Unique to Prajna: {overlap['unique_to_prajna']['count']}")
                report.append("")
            
            if "recommendations" in comp:
                report.append("RECOMMENDATIONS:")
                for rec in comp["recommendations"]:
                    report.append(f"• {rec}")
        
        return "\n".join(report)
    
    def print_summary(self):
        """Print summary to console"""
        print("\n" + "=" * 70)
        print("📊 COMPARISON SUMMARY")
        print("=" * 70)
        
        # Quick stats
        ss = self.results["scholarsphere"]
        prajna = self.results["prajna"]
        
        if ss.get("success") and prajna.get("success"):
            print(f"📄 PDF: {self.results['pdf_info']['filename']}")
            print(f"📊 ScholarSphere: {ss['num_concepts']} concepts ({ss['processing_time']:.1f}s)")
            print(f"🧠 Prajna: {prajna['num_concepts']} concepts ({prajna['processing_time']:.1f}s)")
            
            if "comparison" in self.results:
                overlap_pct = self.results["comparison"].get("concept_overlap", {}).get("overlap", {}).get("percentage", 0)
                print(f"🔗 Concept Overlap: {overlap_pct:.1f}%")
                
                print(f"\n💡 RECOMMENDATIONS:")
                for rec in self.results["comparison"].get("recommendations", []):
                    print(f"   {rec}")
        else:
            print("⚠️ Cannot compare - one or both systems failed")
        
        print("=" * 70)

def main():
    """Main execution"""
    pdf_path = r"C:\Users\jason\Desktop\tori\kha\data\2502.17445v1.pdf"
    
    print("🚀 PDF Processing Comparison Tool")
    print("Comparing ScholarSphere vs Prajna Education systems")
    print("-" * 50)
    
    analyzer = PDFComparisonAnalyzer(pdf_path)
    results = analyzer.run_full_comparison()
    
    if "error" not in results:
        analyzer.print_summary()
        analyzer.save_results()
    else:
        print(f"❌ Comparison failed: {results['error']}")

if __name__ == "__main__":
    main()
