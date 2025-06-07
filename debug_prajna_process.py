#!/usr/bin/env python3
"""
Quick Prajna Process Debug
"""

import subprocess
import sys
import os
from pathlib import Path
import time

def test_prajna_process():
    """Test Prajna process startup with exact same parameters as launcher"""
    
    script_dir = Path(__file__).parent
    prajna_dir = script_dir / "prajna"
    start_script = prajna_dir / "start_prajna.py"
    
    print(f"📂 Script dir: {script_dir}")
    print(f"📂 Prajna dir: {prajna_dir}")
    print(f"📄 Start script: {start_script}")
    print(f"✅ Start script exists: {start_script.exists()}")
    
    if not start_script.exists():
        print("❌ Start script not found!")
        return
    
    # Use exact same command as launcher
    prajna_cmd = [
        sys.executable,
        str(start_script),
        "--port", "8001",
        "--host", "0.0.0.0",
        "--log-level", "INFO"
    ]
    
    # Use exact same environment as launcher
    env = os.environ.copy()
    parent_dir = prajna_dir.parent
    current_pythonpath = env.get('PYTHONPATH', '')
    if current_pythonpath:
        env['PYTHONPATH'] = f"{parent_dir}{os.pathsep}{current_pythonpath}"
    else:
        env['PYTHONPATH'] = str(parent_dir)
    
    print(f"💻 Command: {' '.join(prajna_cmd)}")
    print(f"🔧 PYTHONPATH: {env['PYTHONPATH']}")
    print(f"🏠 Working dir: {prajna_dir}")
    print("🚀 Starting process...")
    
    try:
        # Start with same parameters as launcher
        process = subprocess.Popen(
            prajna_cmd,
            cwd=str(prajna_dir),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            creationflags=subprocess.CREATE_NEW_CONSOLE if os.name == 'nt' else 0
        )
        
        print(f"📊 Process PID: {process.pid}")
        
        # Wait 5 seconds and check status
        time.sleep(5)
        
        exit_code = process.poll()
        if exit_code is not None:
            print(f"❌ Process exited with code: {exit_code}")
            try:
                stdout, stderr = process.communicate()
                if stdout:
                    print(f"📄 STDOUT:\n{stdout.decode('utf-8', errors='ignore')}")
                if stderr:
                    print(f"🚨 STDERR:\n{stderr.decode('utf-8', errors='ignore')}")
            except Exception as e:
                print(f"⚠️ Error getting output: {e}")
        else:
            print("✅ Process is still running!")
            
            # Test port binding
            import socket
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    result = s.connect_ex(('127.0.0.1', 8001))
                    if result == 0:
                        print("✅ Port 8001 is bound!")
                    else:
                        print(f"❌ Port 8001 not bound (error: {result})")
            except Exception as e:
                print(f"⚠️ Port check error: {e}")
            
            # Terminate for cleanup
            process.terminate()
            print("🧹 Process terminated")
            
    except Exception as e:
        print(f"❌ Error starting process: {e}")

if __name__ == "__main__":
    test_prajna_process()
