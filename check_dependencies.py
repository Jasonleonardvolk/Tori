#!/usr/bin/env python3
"""
DEPENDENCY CHECKER - Check what's missing
"""

import sys
import subprocess

def check_dependency(package_name, import_name=None):
    """Check if a dependency is available"""
    if import_name is None:
        import_name = package_name
    
    try:
        __import__(import_name)
        return True, "✅ Available"
    except ImportError as e:
        return False, f"❌ Missing: {e}"

def install_missing(package_name):
    """Try to install missing package"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
        return True
    except Exception as e:
        return False

def main():
    print("🔍 DEPENDENCY CHECKER FOR TORI PIPELINE")
    print("=" * 50)
    
    # Critical dependencies for the pipeline
    dependencies = [
        ("numpy", "numpy"),
        ("PyPDF2", "PyPDF2"), 
        ("sentence-transformers", "sentence_transformers"),
        ("scikit-learn", "sklearn"),
        ("yake", "yake"),
        ("spacy", "spacy"),
        ("transformers", "transformers"),
        ("torch", "torch"),
    ]
    
    missing_packages = []
    
    for package, import_name in dependencies:
        available, status = check_dependency(package, import_name)
        print(f"  {status}: {package}")
        if not available:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️ MISSING PACKAGES: {', '.join(missing_packages)}")
        print("🔧 To fix, run:")
        for package in missing_packages:
            print(f"   pip install {package}")
        
        print(f"\n🚨 OR use the minimal pipeline temporarily:")
        print("   cd C:\\Users\\jason\\Desktop\\tori\\kha\\ingest_pdf")
        print("   copy pipeline.py pipeline_full_backup.py")
        print("   copy pipeline_minimal.py pipeline.py")
        
    else:
        print(f"\n✅ ALL DEPENDENCIES AVAILABLE!")
        print("🎯 The 500 error is likely something else. Run the diagnostic test:")
        print("   python test_500_diagnostic.py")

if __name__ == "__main__":
    main()
