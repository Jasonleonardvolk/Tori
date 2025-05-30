#!/usr/bin/env python3
"""
🔍 DIRECT API CRASH CAPTURE - Run the API server directly with crash detection
Bypasses the dynamic startup script to isolate the crash
"""

import sys
import os
import traceback
import logging
from datetime import datetime
from pathlib import Path

# Set up detailed logging
log_dir = Path(__file__).parent / "logs"
log_dir.mkdir(exist_ok=True)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
log_file = log_dir / f"direct_api_{timestamp}.log"

# Configure logging to capture everything
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("CRASH_CAPTURE")

def run_api_with_crash_detection():
    """Run the API server with comprehensive crash detection"""
    
    logger.info("🔍 DIRECT API CRASH CAPTURE STARTING")
    logger.info("=" * 50)
    logger.info(f"📝 Full log saved to: {log_file}")
    
    try:
        # Add current directory to Python path
        current_dir = Path(__file__).parent
        sys.path.insert(0, str(current_dir))
        
        logger.info("🔧 Setting up crash detection...")
        
        # Import and run the API server directly
        import uvicorn
        
        # Find an available port
        import socket
        def find_port():
            for port in [8002, 8003, 8004, 8005]:
                try:
                    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                        s.bind(('0.0.0.0', port))
                        logger.info(f"✅ Found available port: {port}")
                        return port
                except OSError:
                    logger.info(f"❌ Port {port} is busy")
            raise Exception("No available ports found")
        
        port = find_port()
        
        logger.info(f"🚀 Starting API server on port {port}")
        logger.info(f"📍 URL: http://localhost:{port}")
        logger.info(f"🔗 Health: http://localhost:{port}/health")
        
        # Run the server with crash detection
        uvicorn.run(
            "ingest_pdf.main:app",
            host="0.0.0.0",
            port=port,
            log_level="debug",
            access_log=True,
            reload=False  # Disable reload to avoid file watcher issues
        )
        
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user (Ctrl+C)")
        
    except Exception as e:
        logger.error("❌ CRITICAL CRASH DETECTED!")
        logger.error(f"❌ Error: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        logger.error("❌ Full traceback:")
        logger.error(traceback.format_exc())
        
        # Additional crash analysis
        logger.error("🔍 CRASH ANALYSIS:")
        logger.error(f"🔍 Python version: {sys.version}")
        logger.error(f"🔍 Working directory: {os.getcwd()}")
        logger.error(f"🔍 Python path: {sys.path[:3]}...")  # First 3 entries
        
        # Try to identify the crash point
        tb = traceback.extract_tb(e.__traceback__)
        if tb:
            last_frame = tb[-1]
            logger.error(f"🔍 Crash location: {last_frame.filename}:{last_frame.lineno}")
            logger.error(f"🔍 Crash function: {last_frame.name}")
            logger.error(f"🔍 Crash line: {last_frame.line}")
            
    finally:
        logger.info("🔍 CRASH CAPTURE COMPLETE")
        logger.info(f"📝 Full log available at: {log_file}")

if __name__ == "__main__":
    print("🔍 DIRECT API CRASH CAPTURE")
    print("=" * 40)
    print("Running API server directly with comprehensive crash detection")
    print("Press Ctrl+C to stop")
    print()
    
    run_api_with_crash_detection()
