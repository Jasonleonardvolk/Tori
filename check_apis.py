#!/usr/bin/env python3
"""
🔍 API COMPARISON CHECKER
Check which APIs are running and their status
"""

import requests
import json
from pathlib import Path

def check_api_status():
    """Check status of all possible APIs"""
    
    print("🔍 CHECKING API STATUS")
    print("=" * 30)
    
    ports_to_check = [8002, 8003, 8004, 8005]
    active_apis = []
    
    for port in ports_to_check:
        try:
            url = f"http://localhost:{port}/health"
            response = requests.get(url, timeout=2)
            
            if response.status_code == 200:
                data = response.json()
                api_type = data.get('api_type', 'unknown')
                test_concepts = data.get('test_concepts_found', 0)
                
                print(f"✅ Port {port}: {api_type} ({test_concepts} test concepts)")
                active_apis.append({
                    'port': port,
                    'type': api_type,
                    'url': f"http://localhost:{port}",
                    'test_concepts': test_concepts
                })
            else:
                print(f"❌ Port {port}: HTTP {response.status_code}")
                
        except requests.exceptions.RequestException:
            print(f"❌ Port {port}: Not responding")
    
    print(f"\n📊 ACTIVE APIS: {len(active_apis)}")
    
    # Check port config
    config_file = Path(__file__).parent / "api_port.json"
    if config_file.exists():
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
            
            print(f"\n📝 PORT CONFIG:")
            print(f"   Primary API: {config.get('api_url')}")
            print(f"   Type: {config.get('api_type', 'unknown')}")
        except:
            print("\n📝 PORT CONFIG: Invalid/corrupted")
    else:
        print("\n📝 PORT CONFIG: Not found")
    
    return active_apis

def recommend_best_api(active_apis):
    """Recommend which API to use"""
    
    if not active_apis:
        print("\n❌ NO ACTIVE APIS FOUND")
        return
    
    print(f"\n🎯 RECOMMENDATIONS:")
    
    # Prefer simple_clean_api if available
    simple_apis = [api for api in active_apis if 'simple' in api.get('type', '')]
    complex_apis = [api for api in active_apis if 'simple' not in api.get('type', '')]
    
    if simple_apis:
        best = simple_apis[0]
        print(f"✅ BEST: Simple API on port {best['port']}")
        print(f"   - Clean, direct extraction")
        print(f"   - Should give 44+ concepts")
        print(f"   - No complex wrappers")
    
    if complex_apis:
        print(f"⚠️  BACKUP: Complex API on port {complex_apis[0]['port']}")
        print(f"   - Crash-protected but may fallback")
        print(f"   - Currently gives ~3 concepts")
    
    print(f"\n🌐 SVELTEKIT WILL:")
    print(f"   1. Try primary API from config")
    print(f"   2. Fall back to other ports")
    print(f"   3. Use whichever gives best results")

if __name__ == "__main__":
    active_apis = check_api_status()
    recommend_best_api(active_apis)
