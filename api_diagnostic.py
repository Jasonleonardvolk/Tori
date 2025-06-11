#!/usr/bin/env python3
"""
🔍 API DIAGNOSTIC SCRIPT - Check TORI API health and pipeline status
"""

import requests
import json
import sys
import os
from pathlib import Path
import time

def test_api_health():
    """Test if the API is running and healthy"""
    print("🏥 Testing API Health...")
    
    # Try different possible ports
    ports = [8002, 8003, 8004, 8005]
    
    for port in ports:
        try:
            url = f"http://localhost:{port}/health"
            print(f"   Trying port {port}...")
            
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ API is healthy on port {port}!")
                print(f"   Status: {data.get('status')}")
                print(f"   Engine: {data.get('extraction_engine')}")
                print(f"   Temp writable: {data.get('temp_writable')}")
                return port, data
            else:
                print(f"   ❌ Port {port}: HTTP {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Port {port}: Connection refused")
        except Exception as e:
            print(f"   ❌ Port {port}: {e}")
    
    print("❌ No healthy API found on any port!")
    return None, None

def test_pipeline_import():
    """Test if the pipeline can be imported locally"""
    print("\n🧬 Testing Pipeline Import...")
    
    try:
        # Add paths
        current_dir = Path(__file__).parent
        ingest_pdf_dir = current_dir / "ingest_pdf"
        sys.path.insert(0, str(ingest_pdf_dir))
        sys.path.insert(0, str(current_dir))
        
        # Try to import
        from ingest_pdf.pipeline import ingest_pdf_clean
        print("✅ Successfully imported ingest_pdf_clean!")
        
        # Try a simple test call with a dummy file
        print("   Testing with dummy parameters...")
        test_result = ingest_pdf_clean("nonexistent_file.pdf", extraction_threshold=0.0, admin_mode=True)
        print(f"   Test result status: {test_result.get('status')}")
        print(f"   Test result message: {test_result.get('error_message', 'No error')}")
        
        if test_result.get('status') == 'error' and 'nonexistent_file' in str(test_result.get('error_message', '')):
            print("✅ Pipeline responds correctly to missing file")
            return True
        else:
            print("⚠️ Pipeline gave unexpected response")
            return False
            
    except ImportError as e:
        print(f"❌ Failed to import pipeline: {e}")
        print("\n🔍 Checking ingest_pdf directory...")
        
        if ingest_pdf_dir.exists():
            print("   ingest_pdf directory exists")
            files = list(ingest_pdf_dir.iterdir())
            print(f"   Files in ingest_pdf: {[f.name for f in files]}")
            
            if (ingest_pdf_dir / "pipeline.py").exists():
                print("   pipeline.py exists - checking for syntax errors...")
                try:
                    # Try to compile the file
                    with open(ingest_pdf_dir / "pipeline.py", 'r') as f:
                        code = f.read()
                    compile(code, 'pipeline.py', 'exec')
                    print("   ✅ pipeline.py syntax is valid")
                except SyntaxError as se:
                    print(f"   ❌ Syntax error in pipeline.py: {se}")
                    print(f"      Line {se.lineno}: {se.text}")
                    return False
            else:
                print("   ❌ pipeline.py not found!")
        else:
            print("   ❌ ingest_pdf directory not found!")
        
        return False
    except Exception as e:
        print(f"❌ Unexpected error testing pipeline: {e}")
        return False

def test_temp_directory():
    """Test temp directory access"""
    print("\n📁 Testing Temp Directory...")
    
    temp_root = r"C:\Users\jason\Desktop\tori\kha\tmp"
    
    try:
        # Check if directory exists
        if not os.path.exists(temp_root):
            print(f"   Creating temp directory: {temp_root}")
            os.makedirs(temp_root, exist_ok=True)
        
        # Test write access
        test_file = os.path.join(temp_root, "diagnostic_test.txt")
        with open(test_file, 'w') as f:
            f.write("diagnostic test")
        
        # Test read access
        with open(test_file, 'r') as f:
            content = f.read()
        
        # Clean up
        os.remove(test_file)
        
        print(f"✅ Temp directory is accessible: {temp_root}")
        return True
        
    except Exception as e:
        print(f"❌ Temp directory error: {e}")
        return False

def test_api_with_dummy_request(port):
    """Test the API with a dummy request"""
    print(f"\n🧪 Testing API Extraction Endpoint on port {port}...")
    
    try:
        # Create a small test file
        temp_root = r"C:\Users\jason\Desktop\tori\kha\tmp"
        test_file = os.path.join(temp_root, "diagnostic_test.txt")
        
        with open(test_file, 'w') as f:
            f.write("This is a diagnostic test file with some sample concepts like machine learning and artificial intelligence.")
        
        # Test the extract endpoint
        url = f"http://localhost:{port}/extract"
        payload = {
            "file_path": test_file,
            "filename": "diagnostic_test.txt",
            "content_type": "text/plain"
        }
        
        print(f"   Sending request to {url}")
        print(f"   Payload: {payload}")
        
        response = requests.post(url, json=payload, timeout=30)
        
        print(f"   Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Extraction successful!")
            print(f"   Concepts found: {data.get('concept_count', 0)}")
            print(f"   Status: {data.get('status')}")
            print(f"   Method: {data.get('extraction_method')}")
            
            if data.get('concept_count', 0) > 0:
                concept_names = data.get('concept_names', [])
                print(f"   Sample concepts: {concept_names[:3]}")
                return True
            else:
                print(f"   ⚠️ No concepts extracted - this might be the issue!")
                print(f"   Error message: {data.get('error_message', 'None')}")
                return False
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            print(f"❌ Extraction failed: {error_data}")
            return False
            
        # Clean up
        try:
            os.remove(test_file)
        except:
            pass
            
    except Exception as e:
        print(f"❌ API test error: {e}")
        return False

def main():
    """Run all diagnostic tests"""
    print("🔍 TORI API DIAGNOSTIC REPORT")
    print("=" * 50)
    
    # Test 1: API Health
    port, health_data = test_api_health()
    
    # Test 2: Pipeline Import
    pipeline_ok = test_pipeline_import()
    
    # Test 3: Temp Directory
    temp_ok = test_temp_directory()
    
    # Test 4: API Extraction (if API is running)
    extraction_ok = False
    if port:
        extraction_ok = test_api_with_dummy_request(port)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 DIAGNOSTIC SUMMARY:")
    print(f"   API Health: {'✅' if port else '❌'}")
    print(f"   Pipeline Import: {'✅' if pipeline_ok else '❌'}")
    print(f"   Temp Directory: {'✅' if temp_ok else '❌'}")
    print(f"   API Extraction: {'✅' if extraction_ok else '❌'}")
    
    if port and not extraction_ok:
        print("\n🔧 LIKELY ISSUE: API is running but extraction is failing!")
        print("   This suggests a problem with the pipeline or its dependencies.")
        print("   Check the API logs for error details.")
    elif not port:
        print("\n🔧 LIKELY ISSUE: API server is not running!")
        print("   Start the API with: python main.py")
    elif not pipeline_ok:
        print("\n🔧 LIKELY ISSUE: Pipeline import is failing!")
        print("   Check for syntax errors or missing dependencies.")
    
    print("\n🎯 Next steps:")
    if not port:
        print("   1. Start the API server: python main.py")
    if port and not extraction_ok:
        print("   1. Check API server logs for errors")
        print("   2. Restart the API server")
        print("   3. Check pipeline.py for recent changes")

if __name__ == "__main__":
    main()
