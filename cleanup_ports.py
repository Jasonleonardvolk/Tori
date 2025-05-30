#!/usr/bin/env python3
"""
🔫 KILL PORT CONFLICTS - Clean up any processes blocking our ports
"""

import subprocess
import sys

def kill_processes_on_ports(ports):
    """Kill processes using specified ports"""
    for port in ports:
        try:
            print(f"🔍 Checking for processes on port {port}...")
            
            # Get processes using the port
            result = subprocess.run(['netstat', '-ano'], capture_output=True, text=True)
            
            for line in result.stdout.split('\n'):
                if f':{port}' in line and 'LISTENING' in line:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        print(f"🔫 Killing process {pid} on port {port}")
                        
                        # Kill the process
                        kill_result = subprocess.run(['taskkill', '/PID', pid, '/F'], 
                                                   capture_output=True, text=True)
                        
                        if kill_result.returncode == 0:
                            print(f"✅ Successfully killed process {pid}")
                        else:
                            print(f"⚠️ Failed to kill process {pid}: {kill_result.stderr}")
                            
        except Exception as e:
            print(f"❌ Error processing port {port}: {e}")
    
    print(f"\n🧹 Port cleanup complete")

if __name__ == "__main__":
    ports_to_clean = [8002, 8003, 8004, 8005]
    print("🧹 CLEANING UP API PORTS")
    print("=" * 30)
    kill_processes_on_ports(ports_to_clean)
