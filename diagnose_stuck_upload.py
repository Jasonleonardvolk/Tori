#!/usr/bin/env python3
"""
STUCK UPLOAD DIAGNOSTIC SCRIPT
Diagnoses and fixes frontend upload issues
"""

import requests
import json
import time
import os
import psutil
from pathlib import Path
from datetime import datetime

def print_header(title):
    print("\n" + "=" * 60)
    print(f"🔍 {title}")
    print("=" * 60)

def print_step(step_num, description):
    print(f"\n{step_num}. {description}")
    print("-" * 40)

def check_backend_health():
    """Check if backend is responsive"""
    print_step(1, "CHECKING BACKEND HEALTH")
    
    try:
        # Test basic health
        response = requests.get("http://localhost:8002/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            data = response.json()
            print(f"   Status: {data.get('status', 'unknown')}")
            print(f"   Timestamp: {data.get('timestamp', 'unknown')}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend not responding: {e}")
        return False

def test_api_endpoints():
    """Test key API endpoints"""
    print_step(2, "TESTING API ENDPOINTS")
    
    endpoints = [
        ("/", "Root endpoint"),
        ("/health", "Health check"),
        ("/test", "Test endpoint"),
        ("/debug/last-upload", "Debug uploads")
    ]
    
    for endpoint, description in endpoints:
        try:
            response = requests.get(f"http://localhost:8002{endpoint}", timeout=10)
            if response.status_code == 200:
                print(f"✅ {description}: OK")
                
                if endpoint == "/debug/last-upload":
                    data = response.json()
                    recent_files = data.get('recent_files', [])
                    print(f"   Recent uploads: {len(recent_files)}")
                    for file_info in recent_files[:3]:
                        print(f"     - {file_info.get('name', 'unknown')} ({file_info.get('size_mb', 0)} MB)")
                        
                elif endpoint == "/test":
                    data = response.json()
                    test_data = data.get('test_data', {})
                    print(f"   Test concepts: {test_data.get('concept_count', 0)}")
                    
            else:
                print(f"❌ {description}: {response.status_code}")
        except Exception as e:
            print(f"❌ {description}: {e}")

def check_frontend_connection():
    """Check if frontend is accessible"""
    print_step(3, "CHECKING FRONTEND CONNECTION")
    
    try:
        response = requests.get("http://localhost:5173", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend returned: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend not responding: {e}")
        return False

def check_processes():
    """Check running processes"""
    print_step(4, "CHECKING RUNNING PROCESSES")
    
    # Check for Python processes
    python_processes = []
    node_processes = []
    
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            if proc.info['name'] and 'python' in proc.info['name'].lower():
                cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
                if 'tori' in cmdline.lower() or 'uvicorn' in cmdline.lower():
                    python_processes.append({
                        'pid': proc.info['pid'],
                        'cmd': cmdline[:100] + '...' if len(cmdline) > 100 else cmdline
                    })
            elif proc.info['name'] and 'node' in proc.info['name'].lower():
                cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
                if '5173' in cmdline or 'vite' in cmdline.lower():
                    node_processes.append({
                        'pid': proc.info['pid'],
                        'cmd': cmdline[:100] + '...' if len(cmdline) > 100 else cmdline
                    })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    
    print(f"Backend processes found: {len(python_processes)}")
    for proc in python_processes:
        print(f"  PID {proc['pid']}: {proc['cmd']}")
    
    print(f"Frontend processes found: {len(node_processes)}")
    for proc in node_processes:
        print(f"  PID {proc['pid']}: {proc['cmd']}")

def check_temp_files():
    """Check temporary upload files"""
    print_step(5, "CHECKING TEMPORARY FILES")
    
    tmp_dir = Path("C:/Users/jason/Desktop/tori/kha/tmp")
    if tmp_dir.exists():
        files = list(tmp_dir.glob("*"))
        files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        
        print(f"Temp directory: {tmp_dir}")
        print(f"Total files: {len(files)}")
        
        if files:
            print("Recent files:")
            for f in files[:5]:
                size_mb = f.stat().st_size / (1024 * 1024)
                modified = datetime.fromtimestamp(f.stat().st_mtime)
                print(f"  {f.name} - {size_mb:.2f} MB - {modified}")
        else:
            print("No files in temp directory")
    else:
        print(f"❌ Temp directory not found: {tmp_dir}")

def test_upload_functionality():
    """Test upload with a small test file"""
    print_step(6, "TESTING UPLOAD FUNCTIONALITY")
    
    # Create a small test file
    test_file_path = Path("C:/Users/jason/Desktop/tori/kha/test_upload.txt")
    test_content = "This is a test file for upload functionality.\n" * 100
    
    try:
        with open(test_file_path, 'w') as f:
            f.write(test_content)
        
        print(f"Created test file: {test_file_path}")
        print(f"File size: {test_file_path.stat().st_size} bytes")
        
        # Try to call extract endpoint directly
        extract_data = {
            "file_path": str(test_file_path.absolute()),
            "filename": test_file_path.name,
            "content_type": "text/plain"
        }
        
        print("Testing direct extract call...")
        response = requests.post(
            "http://localhost:8002/extract",
            json=extract_data,
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ Extract endpoint working")
            data = response.json()
            print(f"   Success: {data.get('success', False)}")
            print(f"   Status: {data.get('status', 'unknown')}")
            print(f"   Concepts: {data.get('concept_count', 0)}")
        else:
            print(f"❌ Extract endpoint failed: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
        
        # Clean up
        test_file_path.unlink()
        print("Test file cleaned up")
        
    except Exception as e:
        print(f"❌ Upload test failed: {e}")

def provide_solutions():
    """Provide step-by-step solutions"""
    print_step(7, "RECOMMENDED SOLUTIONS")
    
    solutions = [
        "🔄 REFRESH FRONTEND: Open new tab to http://localhost:5173",
        "🛑 CLEAR BROWSER CACHE: Ctrl+Shift+R to hard refresh",
        "📱 TRY INCOGNITO MODE: Test upload in private/incognito window",
        "⏱️ CHECK TIMEOUT: Try uploading smaller PDF first (<1MB)",
        "🔌 RESTART SERVICES: Stop and restart both frontend and backend",
        "📊 MONITOR LOGS: Watch backend console during upload",
        "🧪 USE TEST ENDPOINT: Try http://localhost:8002/test first"
    ]
    
    for i, solution in enumerate(solutions, 1):
        print(f"{i}. {solution}")

def generate_restart_script():
    """Generate restart script"""
    print_step(8, "GENERATING RESTART SCRIPT")
    
    restart_script = '''@echo off
echo 🛑 Stopping all TORI processes...

REM Kill Python processes
taskkill /f /im python.exe 2>nul
taskkill /f /im pythonw.exe 2>nul

REM Kill Node processes
taskkill /f /im node.exe 2>nul

echo ⏳ Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo 🚀 Starting TORI system...
cd /d "C:\\Users\\jason\\Desktop\\tori\\kha"
start "TORI Backend" cmd /k "python start_unified_tori.py"

echo ✅ Restart script complete!
echo 📱 Open browser to: http://localhost:5173
pause
'''
    
    restart_path = Path("C:/Users/jason/Desktop/tori/kha/restart_tori.bat")
    with open(restart_path, 'w') as f:
        f.write(restart_script)
    
    print(f"✅ Restart script created: {restart_path}")
    print("Run this script to completely restart TORI")

def main():
    """Main diagnostic function"""
    print_header("TORI STUCK UPLOAD DIAGNOSTIC")
    print(f"🕒 Started: {datetime.now()}")
    
    # Run all diagnostics
    backend_ok = check_backend_health()
    test_api_endpoints()
    frontend_ok = check_frontend_connection()
    check_processes()
    check_temp_files()
    
    if backend_ok:
        test_upload_functionality()
    else:
        print("\n⚠️ Skipping upload test - backend not healthy")
    
    provide_solutions()
    generate_restart_script()
    
    # Summary
    print_header("DIAGNOSTIC SUMMARY")
    print(f"Backend Status: {'✅ OK' if backend_ok else '❌ ISSUES'}")
    print(f"Frontend Status: {'✅ OK' if frontend_ok else '❌ ISSUES'}")
    
    if backend_ok and frontend_ok:
        print("\n🎯 LIKELY ISSUE: Frontend upload progress tracking stuck")
        print("🔧 QUICK FIX: Refresh browser tab (F5)")
    elif not backend_ok:
        print("\n🎯 ISSUE: Backend not responding")
        print("🔧 FIX: Restart backend service")
    elif not frontend_ok:
        print("\n🎯 ISSUE: Frontend not accessible")
        print("🔧 FIX: Restart frontend service")
    
    print("\n🏁 Diagnostic complete!")

if __name__ == "__main__":
    main()
