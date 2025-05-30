#!/usr/bin/env python3
"""
🔧 ADD GRACEFUL SHUTDOWN TO MAIN.PY
This script adds graceful shutdown functionality to your FastAPI server
"""

import os
import re

def add_graceful_shutdown():
    """Add graceful shutdown functionality to main.py"""
    
    main_py_path = r"C:\Users\jason\Desktop\tori\kha\main.py"
    
    if not os.path.exists(main_py_path):
        print(f"❌ main.py not found at: {main_py_path}")
        return False
    
    print("🔍 Reading main.py...")
    
    with open(main_py_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if shutdown handlers already exist
    if "@app.on_event(\"shutdown\")" in content:
        print("✅ Graceful shutdown already exists in main.py")
        return True
    
    # Find insertion point (after CORS middleware, before first route)
    insertion_pattern = r'(\s*\)\s*\n\s*@app\.get\("/"\))'
    
    shutdown_code = '''
# Graceful shutdown event handlers
@app.on_event("startup")
async def startup_event():
    """API startup event"""
    logger.info("🚀 TORI Universal Concept Extraction API starting up...")
    logger.info("📍 Available endpoints: /health, /extract, /extract/text, /docs")

@app.on_event("shutdown") 
async def shutdown_event():
    """API shutdown event"""
    logger.info("🛑 TORI Universal Concept Extraction API shutting down...")
    logger.info("👋 Goodbye!")

# Optional: Remote shutdown endpoint (useful for development)
@app.get("/shutdown")
async def shutdown_api():
    """
    🛑 GRACEFUL SHUTDOWN ENDPOINT
    
    Allows remote shutdown of the API server.
    Useful for development and automated deployments.
    """
    import os
    import signal
    import asyncio
    
    logger.info("🛑 Shutdown requested via /shutdown endpoint")
    
    # Schedule shutdown after brief delay to allow response
    async def delayed_shutdown():
        await asyncio.sleep(1)  # Give time for response to be sent
        logger.info("🧨 Initiating graceful shutdown...")
        os.kill(os.getpid(), signal.SIGTERM)
    
    # Start shutdown in background
    asyncio.create_task(delayed_shutdown())
    
    return {
        "status": "shutdown_initiated",
        "message": "API server shutting down gracefully...",
        "timestamp": time.time()
    }

'''
    
    # Insert shutdown code before first route
    if re.search(insertion_pattern, content):
        updated_content = re.sub(
            insertion_pattern,
            shutdown_code + r'\1',
            content
        )
        
        # Write updated content
        with open(main_py_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print("✅ Added graceful shutdown functionality to main.py")
        print("🔧 Features added:")
        print("   - Startup/shutdown event handlers")
        print("   - Remote shutdown endpoint: GET /shutdown")
        print("   - Graceful process termination")
        
        return True
    else:
        print("❌ Could not find insertion point in main.py")
        print("💡 Manual addition required")
        return False

if __name__ == "__main__":
    success = add_graceful_shutdown()
    
    if success:
        print("\n🚀 RESTART YOUR API SERVER:")
        print('   "C:\\Users\\jason\\Desktop\\tori\\kha\\START_API.bat"')
        print("\n🛑 SHUTDOWN OPTIONS:")
        print("   1. Press Ctrl+C in the terminal")
        print("   2. Visit: http://localhost:8002/shutdown")
        print("   3. Use Task Manager (still works)")
    else:
        print("\n❌ Automatic update failed")
        print("💡 You can manually add the shutdown handlers")
