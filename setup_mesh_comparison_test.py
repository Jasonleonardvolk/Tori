"""
setup_mesh_comparison_test.py
============================
Quick setup script to help prepare and run the mesh extraction comparison tests.
"""

import os
import sys
from pathlib import Path
import subprocess

def find_test_files():
    """Find suitable test files in the project."""
    current_dir = Path.cwd()
    
    # Look for PDF files
    pdf_files = []
    for ext in ['*.pdf', '*.PDF']:
        pdf_files.extend(current_dir.glob(f"**/{ext}"))
    
    # Look for TXT files  
    txt_files = []
    for ext in ['*.txt', '*.TXT', '*.md', '*.MD']:
        txt_files.extend(current_dir.glob(f"**/{ext}"))
    
    print("🔍 Available test files found:")
    print("\n📄 PDF files:")
    for i, pdf in enumerate(pdf_files[:10]):  # Show first 10
        print(f"  {i+1}. {pdf}")
    
    print("\n📝 Text files:")
    for i, txt in enumerate(txt_files[:10]):  # Show first 10
        print(f"  {i+1}. {txt}")
    
    return pdf_files, txt_files

def create_sample_txt():
    """Create a sample test TXT file if none exists."""
    sample_content = """
Quantum Computing and Neural Networks

Quantum computing represents a paradigm shift in computational capabilities. Unlike classical computers that use bits, quantum computers leverage quantum bits (qubits) that can exist in superposition states.

Neural networks, particularly deep learning architectures, have revolutionized artificial intelligence. These networks consist of interconnected nodes that process information through weighted connections.

The intersection of quantum computing and neural networks presents fascinating possibilities:

1. Quantum neural networks could potentially solve optimization problems exponentially faster
2. Quantum entanglement might enable new forms of parallel processing
3. Quantum algorithms could enhance machine learning training efficiency

Key concepts in this domain include:
- Quantum superposition and its application to neural network states
- Quantum entanglement as a mechanism for distributed processing
- Variational quantum eigensolvers for optimization
- Quantum approximate optimization algorithms (QAOA)
- Hybrid classical-quantum neural architectures

The convergence of these technologies may lead to breakthroughs in:
- Drug discovery and molecular simulation
- Financial portfolio optimization
- Climate modeling and prediction
- Cryptography and security protocols
- Pattern recognition in high-dimensional data

Current challenges include quantum decoherence, error correction, and the limited availability of quantum hardware. However, progress in quantum error correction and fault-tolerant quantum computing continues to advance.

This represents a sample document for testing concept extraction systems with diverse technical vocabulary across multiple domains.
"""
    
    sample_file = Path("sample_test_document.txt")
    with open(sample_file, 'w', encoding='utf-8') as f:
        f.write(sample_content)
    
    print(f"✅ Created sample test file: {sample_file}")
    return sample_file

def check_services():
    """Check if both services are running."""
    import requests
    
    services = [
        ("ScholarSphere", "http://localhost:5731/health"),
        ("Prajna API", "http://localhost:8001/api/health")
    ]
    
    print("🏥 Checking service health...")
    
    all_ok = True
    for name, url in services:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {name} is running ({url})")
            else:
                print(f"⚠️ {name} responded with status {response.status_code}")
                all_ok = False
        except requests.exceptions.RequestException as e:
            print(f"❌ {name} is not reachable ({url})")
            print(f"   Error: {e}")
            all_ok = False
    
    return all_ok

def run_comparison_test():
    """Run the comparison test interactively."""
    print("\n🧪 MESH EXTRACTION COMPARISON TEST SETUP")
    print("=" * 50)
    
    # Check services first
    if not check_services():
        print("\n⚠️ WARNING: Not all services are running!")
        print("   Make sure both ScholarSphere (5731) and Prajna API (8001) are started")
        
        continue_anyway = input("\nContinue anyway? (y/n): ").lower().strip()
        if continue_anyway != 'y':
            print("❌ Test cancelled. Start both services and try again.")
            return
    
    # Find test files
    pdf_files, txt_files = find_test_files()
    
    # Get PDF file
    pdf_path = None
    if pdf_files:
        print(f"\n📄 Found {len(pdf_files)} PDF files")
        try:
            choice = int(input("Enter number for PDF file (or 0 to specify path): "))
            if choice > 0 and choice <= len(pdf_files):
                pdf_path = str(pdf_files[choice - 1])
        except (ValueError, IndexError):
            pass
    
    if not pdf_path:
        pdf_path = input("📄 Enter full path to PDF file: ").strip()
    
    # Get TXT file
    txt_path = None
    if txt_files:
        print(f"\n📝 Found {len(txt_files)} text files")
        print("  0. Create sample test file")
        try:
            choice = int(input("Enter number for text file (or 0 for sample): "))
            if choice == 0:
                txt_path = str(create_sample_txt())
            elif choice > 0 and choice <= len(txt_files):
                txt_path = str(txt_files[choice - 1])
        except (ValueError, IndexError):
            pass
    
    if not txt_path:
        create_sample = input("📝 Create sample text file? (y/n): ").lower().strip()
        if create_sample == 'y':
            txt_path = str(create_sample_txt())
        else:
            txt_path = input("📝 Enter full path to text file: ").strip()
    
    # Verify files exist
    if not Path(pdf_path).exists():
        print(f"❌ PDF file not found: {pdf_path}")
        return
    
    if not Path(txt_path).exists():
        print(f"❌ Text file not found: {txt_path}")
        return
    
    print(f"\n✅ Test configuration:")
    print(f"   📄 PDF: {pdf_path}")
    print(f"   📝 TXT: {txt_path}")
    
    # Run the test
    ready = input("\n🚀 Ready to run comparison tests? (y/n): ").lower().strip()
    if ready == 'y':
        print("\n" + "="*60)
        print("🧪 STARTING MESH EXTRACTION COMPARISON TESTS")
        print("="*60)
        
        # Import and run the test
        try:
            from mesh_extraction_comparison_test import MeshExtractionTester
            tester = MeshExtractionTester()
            tester.run_all_tests(pdf_path, txt_path)
        except ImportError:
            print("❌ Could not import test module. Make sure mesh_extraction_comparison_test.py exists.")
        except Exception as e:
            print(f"❌ Test failed: {e}")
    else:
        print("❌ Test cancelled")

def main():
    """Main setup function."""
    print("🛠️ MESH COMPARISON TEST SETUP")
    print("=" * 40)
    
    # Check if test script exists
    test_script = Path("mesh_extraction_comparison_test.py")
    if not test_script.exists():
        print("❌ mesh_extraction_comparison_test.py not found!")
        print("   Make sure you're in the correct directory.")
        return
    
    print("✅ Test script found")
    
    # Run interactive setup
    run_comparison_test()

if __name__ == "__main__":
    main()
