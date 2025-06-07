#!/usr/bin/env python3
"""
🔬 MINIMAL PRAJNA TEST - No interference, just basic startup test
"""

import subprocess
import sys
import time
from pathlib import Path

def test_prajna_minimal():
    """Test Prajna with minimal interference"""
    print("🔬 MINIMAL PRAJNA STARTUP TEST")
    print("=" * 40)
    
    script_dir = Path(__file__).parent
    prajna_dir = script_dir / "prajna"
    start_script = prajna_dir / "start_prajna.py"
    
    if not start_script.exists():
        print(f"❌ Start script not found: {start_script}")
        return
    
    # Minimal command - let it output to console directly
    cmd = [
        sys.executable,
        str(start_script),
        "--port", "8001",
        "--host", "0.0.0.0",
        "--log-level", "INFO"
    ]
    
    print(f"🚀 Command: {' '.join(cmd)}")
    print(f"📁 Working dir: {prajna_dir}")
    print("🎯 Starting Prajna with NO output capture (direct to console)...")
    print("=" * 40)
    
    try:
        # NO PIPES - let output go directly to console
        process = subprocess.Popen(
            cmd,
            cwd=str(prajna_dir)
            # No stdout/stderr capture!
        )
        
        print(f"📊 Process started with PID: {process.pid}")
        print("⏳ Waiting 30 seconds for startup...")
        print("📺 Watch console output above for Prajna messages")
        
        # Just wait and periodically check if process is alive
        for i in range(30):
            if process.poll() is not None:
                print(f"📊 Process exited with code: {process.poll()}")
                break
            
            if i % 5 == 0 and i > 0:
                print(f"⏳ Still waiting... ({i}/30 seconds)")
            
            time.sleep(1)
        
        # Test port at end
        print("\\n🔌 Testing port 8001...")
        import socket
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(2)
                result = s.connect_ex(('127.0.0.1', 8001))
                if result == 0:
                    print("✅ Port 8001 is responding!")
                    
                    # Try HTTP request
                    import requests
                    try:
                        response = requests.get('http://127.0.0.1:8001/api/health', timeout=5)
                        print(f"✅ HTTP health check: {response.status_code}")
                    except Exception as e:
                        print(f"❌ HTTP request failed: {e}")
                else:
                    print(f"❌ Port 8001 not responding (error: {result})")
        except Exception as e:
            print(f"❌ Socket test failed: {e}")
        
        # Cleanup
        if process.poll() is None:
            print("\\n🧹 Terminating process...")
            process.terminate()
            process.wait(timeout=5)
        
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_prajna_minimal()
