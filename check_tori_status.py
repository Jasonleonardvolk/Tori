#!/usr/bin/env python3
"""
🔍 TORI STATUS CHECKER - Debug startup issues instantly
No more guessing what went wrong!
"""

import json
import requests
import subprocess
import socket
from pathlib import Path
from datetime import datetime
import sys

def check_port(port, name):
    """Check if a port is in use"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            result = s.connect_ex(('localhost', port))
            if result == 0:
                return f"✅ {name} (Port {port}): RUNNING"
            else:
                return f"❌ {name} (Port {port}): NOT RUNNING"
    except Exception as e:
        return f"⚠️ {name} (Port {port}): ERROR - {e}"

def check_url(url, name):
    """Check if a URL responds"""
    try:
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            return f"✅ {name}: HEALTHY (Status: {response.status_code})"
        else:
            return f"⚠️ {name}: RESPONDING but status {response.status_code}"
    except requests.exceptions.RequestException as e:
        return f"❌ {name}: NOT RESPONDING - {e}"

def read_status_file(file_path):
    """Read and display status file"""
    if file_path.exists():
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            return data
        except Exception as e:
            return {"error": f"Failed to read {file_path}: {e}"}
    return None

def check_processes():
    """Check for TORI-related processes"""
    try:
        result = subprocess.run(['tasklist'], capture_output=True, text=True)
        processes = []
        
        for line in result.stdout.split('\n'):
            if 'python' in line.lower() and ('tori' in line.lower() or 'uvicorn' in line.lower()):
                processes.append(line.strip())
            elif 'node' in line.lower() and 'npm' in line.lower():
                processes.append(line.strip())
        
        return processes
    except Exception as e:
        return [f"Error checking processes: {e}"]

def main():
    """Main status check"""
    script_dir = Path(__file__).parent.absolute()
    
    print("\n" + "=" * 60)
    print("🔍 TORI SYSTEM STATUS CHECKER")
    print("=" * 60)
    print(f"⏰ Check time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📂 Directory: {script_dir}")
    print("=" * 60)
    
    # 1. Check port status
    print("\n📡 PORT STATUS:")
    print(check_port(8002, "API Server (Primary)"))
    print(check_port(8003, "API Server (Alt)"))
    print(check_port(8004, "API Server (Alt 2)"))
    print(check_port(3000, "MCP Server"))
    print(check_port(3001, "MCP Gateway"))
    print(check_port(5173, "SvelteKit Frontend"))
    
    # 2. Check URL health
    print("\n🌐 SERVICE HEALTH:")
    
    # Check for dynamic port from config
    config_file = script_dir / "api_port.json"
    if config_file.exists():
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
            api_port = config.get('api_port')
            if api_port:
                print(check_url(f"http://localhost:{api_port}/health", f"API Server (Port {api_port})"))
                print(check_url(f"http://localhost:{api_port}/docs", f"API Docs (Port {api_port})"))
        except:
            print("⚠️ Could not read api_port.json")
    
    print(check_url("http://localhost:3000/health", "MCP Server"))
    print(check_url("http://localhost:5173", "SvelteKit Frontend"))
    
    # 3. Check status files
    print("\n📊 STATUS FILES:")
    
    # Main status file
    status_file = script_dir / "tori_status.json"
    status_data = read_status_file(status_file)
    if status_data:
        print(f"✅ tori_status.json: Found")
        print(f"   📍 Last stage: {status_data.get('stage', 'unknown')}")
        print(f"   📊 Status: {status_data.get('status', 'unknown')}")
        print(f"   ⏰ Timestamp: {status_data.get('timestamp', 'unknown')}")
        print(f"   🔌 API Port: {status_data.get('api_port', 'not set')}")
        print(f"   🚀 MCP Running: {status_data.get('mcp_running', False)}")
        print(f"   🔗 Bridge Ready: {status_data.get('bridge_ready', False)}")
        
        if status_data.get('status') == 'failed':
            error = status_data.get('details', {}).get('error', 'Unknown error')
            print(f"   ❌ ERROR: {error}")
    else:
        print("❌ tori_status.json: NOT FOUND")
    
    # Port config file
    port_data = read_status_file(config_file)
    if port_data:
        print(f"✅ api_port.json: Found")
        print(f"   🔌 API Port: {port_data.get('api_port', 'not set')}")
        print(f"   🔗 MCP Integrated: {port_data.get('mcp_integrated', False)}")
    else:
        print("❌ api_port.json: NOT FOUND")
    
    # 4. Check running processes
    print("\n🔧 RUNNING PROCESSES:")
    processes = check_processes()
    if processes:
        for proc in processes[:5]:  # Show first 5 relevant processes
            print(f"   {proc}")
        if len(processes) > 5:
            print(f"   ... and {len(processes) - 5} more")
    else:
        print("   ❌ No TORI-related processes found")
    
    # 5. Quick recommendations
    print("\n💡 QUICK DIAGNOSTICS:")
    
    # Check if any services are running
    api_running = any("✅" in check_port(port, "API") for port in [8002, 8003, 8004])
    mcp_running = "✅" in check_port(3000, "MCP")
    frontend_running = "✅" in check_port(5173, "Frontend")
    
    if not api_running and not mcp_running and not frontend_running:
        print("   🚨 Nothing is running! Run START_TORI_WITH_CHAT.bat to start everything")
    elif api_running and not mcp_running:
        print("   ⚠️ API is running but MCP is not! Check MCP startup logs")
    elif mcp_running and not api_running:
        print("   ⚠️ MCP is running but API is not! Check API startup logs")
    elif not frontend_running:
        print("   ⚠️ Backend services running but frontend is not! Check npm run dev")
    else:
        print("   ✅ All services appear to be running!")
    
    # Check for common issues
    if status_data and status_data.get('stage') == 'mcp_startup' and status_data.get('status') == 'failed':
        print("   🔧 MCP startup failed. Check if npm dependencies are installed in mcp-server-architecture/")
        print("   🔧 Try running: cd mcp-server-architecture && npm install")
    
    if status_data and 'port' in str(status_data.get('details', {})):
        print("   🔧 Port conflict detected. Try killing existing processes or reboot")
    
    print("\n" + "=" * 60)
    print("💡 TIP: Run this script anytime to debug TORI startup issues!")
    print("💡 Status files are updated in real-time during startup")
    print("=" * 60)

if __name__ == "__main__":
    main()
