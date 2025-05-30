#!/usr/bin/env python3
"""
🔧 WINDOWS-COMPATIBLE EXTRACTION CRASH PREVENTION
Uses threading instead of Unix signals for Windows compatibility
"""

import os
import sys
import time
import threading
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

# Add current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

def patch_extraction_with_windows_timeout():
    """Patch the extraction function with Windows-compatible timeout"""
    
    # Import the original extraction function
    try:
        from ingest_pdf.extractConceptsFromDocument import extractConceptsFromDocument
        print("✅ Successfully imported extractConceptsFromDocument")
    except ImportError as e:
        print(f"❌ Failed to import extraction function: {e}")
        return
    
    def safe_extraction_wrapper(text, threshold=0.0, timeout_seconds=120):
        """Windows-compatible wrapper with timeout and memory monitoring"""
        
        print(f"🔧 SAFE EXTRACTION (Windows): Processing {len(text)} characters with {timeout_seconds}s timeout")
        
        try:
            # Monitor memory before extraction
            import psutil
            process = psutil.Process()
            initial_memory = process.memory_info().rss / 1024 / 1024
            print(f"🧠 Initial memory: {initial_memory:.1f}MB")
            
            # Limit text size if too large (potential memory issue)
            original_length = len(text)
            if len(text) > 800000:  # 800KB limit (reduced from 1MB for safety)
                print(f"⚠️ Large text detected ({len(text)} chars), truncating to prevent memory issues")
                text = text[:800000]
                print(f"🔧 Truncated from {original_length} to {len(text)} characters")
            
            # Use ThreadPoolExecutor for timeout on Windows
            print("🚀 Starting concept extraction with Windows timeout...")
            start_time = time.time()
            
            result = None
            error = None
            
            def extract_with_error_handling():
                """Wrapper to capture exceptions in thread"""
                try:
                    return extractConceptsFromDocument(text, threshold)
                except Exception as e:
                    nonlocal error
                    error = e
                    return []
            
            # Run extraction in thread pool with timeout
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(extract_with_error_handling)
                
                try:
                    result = future.result(timeout=timeout_seconds)
                except FuturesTimeoutError:
                    print(f"⏰ EXTRACTION TIMEOUT after {timeout_seconds}s!")
                    print("🔧 Cancelling extraction and returning empty result")
                    return []
            
            # Check if there was an error in the extraction thread
            if error:
                raise error
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            # Check final memory
            final_memory = process.memory_info().rss / 1024 / 1024
            memory_increase = final_memory - initial_memory
            
            print(f"✅ Extraction completed successfully!")
            print(f"⏱️ Processing time: {processing_time:.2f}s")
            print(f"🧠 Final memory: {final_memory:.1f}MB (+{memory_increase:.1f}MB)")
            
            # Validate result
            if isinstance(result, list):
                print(f"📊 Concepts found: {len(result)}")
            else:
                print(f"📊 Result type: {type(result)}")
                if hasattr(result, '__len__'):
                    print(f"📊 Result length: {len(result)}")
            
            return result if result is not None else []
            
        except MemoryError:
            print("🧠 MEMORY ERROR during extraction!")
            print("🔧 Returning empty result to prevent crash")
            return []
            
        except Exception as e:
            print(f"❌ EXTRACTION ERROR: {e}")
            print(f"❌ Error type: {type(e).__name__}")
            print("🔧 Returning empty result to prevent crash")
            
            # Print more detailed error for debugging
            import traceback
            print("❌ Detailed error:")
            traceback.print_exc()
            return []
    
    # Monkey patch the extraction function
    import ingest_pdf.extractConceptsFromDocument
    ingest_pdf.extractConceptsFromDocument.extractConceptsFromDocument = safe_extraction_wrapper
    
    print("✅ Extraction function patched with Windows-compatible crash protection")

def run_windows_protected_server():
    """Run the server with Windows-compatible extraction crash protection"""
    
    print("🔧 WINDOWS-COMPATIBLE EXTRACTION CRASH PREVENTION")
    print("=" * 50)
    print("Using threading-based timeout (Windows compatible)")
    print()
    
    # Apply the protection patch
    patch_extraction_with_windows_timeout()
    
    try:
        import uvicorn
        import socket
        
        # Find available port
        def find_port():
            for port in [8002, 8003, 8004, 8005]:
                try:
                    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                        s.bind(('0.0.0.0', port))
                        print(f"✅ Found available port: {port}")
                        return port
                except OSError:
                    print(f"❌ Port {port} is busy")
            raise Exception("No available ports found")
        
        port = find_port()
        
        print(f"🚀 Starting Windows-protected API server...")
        print(f"📍 URL: http://localhost:{port}")
        print(f"🔧 Extraction timeout: 120 seconds (threading-based)")
        print(f"🧠 Memory protection: enabled")
        print(f"📏 Text size limit: 800KB (Windows-optimized)")
        print()
        
        # Save port config for SvelteKit
        import json
        config = {
            "api_port": port,
            "api_url": f"http://localhost:{port}",
            "timestamp": time.time(),
            "status": "active"
        }
        
        config_file = Path(__file__).parent / "api_port.json"
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"📝 Port config saved: {config_file}")
        
        # Run the server
        uvicorn.run(
            "ingest_pdf.main:app",
            host="0.0.0.0",
            port=port,
            log_level="info",
            access_log=True,
            reload=False
        )
        
    except KeyboardInterrupt:
        print("🛑 Server stopped by user")
        
    except Exception as e:
        print(f"❌ SERVER ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_windows_protected_server()
