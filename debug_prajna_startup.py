#!/usr/bin/env python3
"""
Prajna Startup Debugging Script
==============================

This script helps debug Prajna startup issues by testing the health endpoint
and providing clear diagnostics.
"""

import requests
import time
import sys
from pathlib import Path

def test_health_endpoint(port=8002, max_retries=5):
    """Test the health endpoint and return detailed status"""
    url = f"http://localhost:{port}/api/health"
    
    print(f"🔍 Testing health endpoint: {url}")
    
    for attempt in range(max_retries):
        try:
            print(f"   Attempt {attempt + 1}/{max_retries}...")
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Server is responding (status: {response.status_code})")
                return data
            else:
                print(f"⚠️ Server responded with status: {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection failed - server may not be running on port {port}")
        except requests.exceptions.Timeout:
            print(f"⏰ Request timeout")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
        
        if attempt < max_retries - 1:
            print(f"   Retrying in 2 seconds...")
            time.sleep(2)
    
    return None

def analyze_health_response(health_data):
    """Analyze health response and provide diagnostics"""
    print("\n" + "=" * 60)
    print("📋 HEALTH CHECK ANALYSIS")
    print("=" * 60)
    
    if not health_data:
        print("❌ No health data received - server may not be running")
        print("\n💡 TROUBLESHOOTING STEPS:")
        print("   1. Check if the server is running")
        print("   2. Verify the correct port (8002)")
        print("   3. Check server logs for startup errors")
        return False
    
    # Check overall status
    status = health_data.get("status", "unknown")
    print(f"Server Status: {status}")
    
    # Check Prajna availability
    prajna_available = health_data.get("prajna_available", False)
    prajna_loaded = health_data.get("prajna_loaded", False)
    prajna_model = health_data.get("prajna_model", "unknown")
    
    print(f"Prajna Available: {'✅' if prajna_available else '❌'} {prajna_available}")
    print(f"Prajna Loaded: {'✅' if prajna_loaded else '❌'} {prajna_loaded}")
    print(f"Prajna Model Type: {prajna_model}")
    
    # Analyze the situation
    if not prajna_available:
        print("\n🚨 ISSUE: Prajna model not available")
        print("💡 LIKELY CAUSES:")
        print("   1. Startup hook never ran - check for '🛠️ Entered load_prajna_model()' in logs")
        print("   2. Import error - check for import failure messages")
        print("   3. Complete startup failure - check for exception details")
        
        print("\n🔧 DEBUGGING STEPS:")
        print("   1. Check server logs for startup messages")
        print("   2. Look for: '🛠️ Entered load_prajna_model() - startup hook triggered'")
        print("   3. If that message is missing, the startup hook isn't running")
        print("   4. If present, follow the subsequent log messages to find the failure point")
        return False
        
    elif prajna_available and not prajna_loaded:
        print("\n⚠️ ISSUE: Prajna model available but not loaded")
        print("💡 LIKELY CAUSES:")
        print("   1. Model instantiated but load_model() failed")
        print("   2. Model loaded but is_loaded() returns False")
        
        print("\n🔧 DEBUGGING STEPS:")
        print("   1. Check logs for model loading attempts")
        print("   2. Look for 'Model.load_model() completed successfully'")
        print("   3. Check if 'Model reports as loaded' appears")
        return False
        
    else:
        print("\n✅ SUCCESS: Prajna model is available and loaded!")
        print(f"   Model type: {prajna_model}")
        return True

def test_prajna_stats(port=8002):
    """Test the Prajna stats endpoint"""
    url = f"http://localhost:{port}/api/prajna/stats"
    
    try:
        print(f"\n🔍 Testing Prajna stats endpoint: {url}")
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Prajna stats endpoint working")
            
            status = data.get("status", "unknown")
            model_ready = data.get("model_ready", False)
            
            print(f"   Status: {status}")
            print(f"   Model Ready: {model_ready}")
            
            if "runtime_stats" in data:
                stats = data["runtime_stats"]
                total_requests = stats.get("total_requests", 0)
                successful_responses = stats.get("successful_responses", 0)
                avg_response_time = stats.get("average_response_time", 0)
                
                print(f"   Total Requests: {total_requests}")
                print(f"   Successful Responses: {successful_responses}")
                print(f"   Average Response Time: {avg_response_time:.3f}s")
            
            return True
        else:
            print(f"❌ Stats endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Stats endpoint error: {e}")
        return False

def main():
    """Main debugging function"""
    print("🚀 PRAJNA STARTUP DEBUGGING")
    print("=" * 60)
    
    # Test health endpoint
    health_data = test_health_endpoint()
    
    # Analyze results
    prajna_working = analyze_health_response(health_data)
    
    if prajna_working:
        # Test additional endpoints
        test_prajna_stats()
        
        print("\n🎉 ALL TESTS PASSED!")
        print("\n📋 NEXT STEPS:")
        print("   1. Test the /api/answer endpoint with a real query")
        print("   2. Monitor logs during actual usage")
        print("   3. Check performance metrics via /api/prajna/stats")
        
        return 0
    else:
        print("\n❌ DEBUGGING NEEDED!")
        print("\n📋 IMMEDIATE ACTIONS:")
        print("   1. Check server startup logs for the diagnostic messages")
        print("   2. Look for the specific log patterns mentioned above")
        print("   3. Restart the server and watch the logs carefully")
        print("   4. Run this script again after making fixes")
        
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
