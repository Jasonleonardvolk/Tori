#!/usr/bin/env python3
"""
Stable FastAPI server launcher - avoids uvicorn file watcher issues
"""

import os
import sys
import uvicorn
from pathlib import Path

def main():
    """Launch the PDF ingestion server without problematic file watching"""
    
    # Get the directory containing this script
    script_dir = Path(__file__).parent.absolute()
    
    # Change to the correct directory
    os.chdir(script_dir)
    
    print("🚀 Starting TORI FastAPI Server (Stable Mode)")
    print(f"📂 Working directory: {script_dir}")
    print(f"🌐 Server will be available at: http://localhost:8002")
    print("🔧 File watching disabled for stability")
    print("=" * 50)
    
    try:
        # Run without reload to avoid file watching issues
        uvicorn.run(
            "ingest_pdf.main:app",
            host="0.0.0.0",
            port=8002,
            reload=False,  # ✅ NO FILE WATCHING - STABLE
            workers=1,
            log_level="info",
            access_log=True
        )
        
    except KeyboardInterrupt:
        print("\n👋 Server shutdown requested")
    except Exception as e:
        print(f"❌ Server error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
