#!/usr/bin/env python3
"""
🔧 EXTRACTION CRASH PREVENTION
Add timeout and memory limits to prevent extraction crashes
"""

import os
import sys
import time
import signal
import threading
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

def patch_extraction_with_timeout():
    """Patch the extraction function with timeout and memory protection"""
    
    # Import the original extraction function
    try:
        from ingest_pdf.extractConceptsFromDocument import extractConceptsFromDocument
        print("✅ Successfully imported extractConceptsFromDocument")
    except ImportError as e:
        print(f"❌ Failed to import extraction function: {e}")
        return
    
    # Create a timeout wrapper
    class TimeoutError(Exception):
        pass
    
    def timeout_handler(signum, frame):
        raise TimeoutError("Extraction timed out")
    
    def safe_extraction_wrapper(text, threshold=0.0, timeout_seconds=120):
        """Wrapper with timeout and memory monitoring"""
        
        print(f"🔧 SAFE EXTRACTION: Processing {len(text)} characters with {timeout_seconds}s timeout")
        
        # Set up timeout
        old_handler = signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(timeout_seconds)
        
        try:
            # Monitor memory before extraction
            import psutil
            process = psutil.Process()
            initial_memory = process.memory_info().rss / 1024 / 1024
            print(f"🧠 Initial memory: {initial_memory:.1f}MB")
            
            # Limit text size if too large (potential memory issue)
            if len(text) > 1000000:  # 1MB of text
                print(f"⚠️ Large text detected ({len(text)} chars), truncating to prevent memory issues")
                text = text[:1000000]  # Limit to 1MB
                print(f"🔧 Truncated to {len(text)} characters")
            
            # Call original extraction with progress monitoring
            print("🚀 Starting concept extraction...")
            start_time = time.time()
            
            result = extractConceptsFromDocument(text, threshold)
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            # Check final memory
            final_memory = process.memory_info().rss / 1024 / 1024
            memory_increase = final_memory - initial_memory
            
            print(f"✅ Extraction completed successfully!")
            print(f"⏱️ Processing time: {processing_time:.2f}s")
            print(f"🧠 Final memory: {final_memory:.1f}MB (+{memory_increase:.1f}MB)")
            print(f"📊 Concepts found: {len(result) if isinstance(result, list) else 'unknown'}")
            
            return result
            
        except TimeoutError:
            print(f"⏰ EXTRACTION TIMEOUT after {timeout_seconds}s!")
            print("🔧 Returning empty result to prevent crash")
            return []
            
        except MemoryError:
            print("🧠 MEMORY ERROR during extraction!")
            print("🔧 Returning empty result to prevent crash")
            return []
            
        except Exception as e:
            print(f"❌ EXTRACTION ERROR: {e}")
            print("🔧 Returning empty result to prevent crash")
            import traceback
            traceback.print_exc()
            return []
            
        finally:
            # Restore original signal handler and cancel alarm
            signal.alarm(0)
            signal.signal(signal.SIGALRM, old_handler)
    
    # Monkey patch the extraction function
    import ingest_pdf.extractConceptsFromDocument
    ingest_pdf.extractConceptsFromDocument.extractConceptsFromDocument = safe_extraction_wrapper
    
    print("✅ Extraction function patched with crash protection")

def run_protected_server():
    """Run the server with extraction crash protection"""
    
    print("🔧 EXTRACTION CRASH PREVENTION")
    print("=" * 40)
    print("Patching extraction function with timeout and memory protection")
    print()
    
    # Apply the protection patch
    patch_extraction_with_timeout()
    
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
        
        print(f"🚀 Starting protected API server...")
        print(f"📍 URL: http://localhost:{port}")
        print(f"🔧 Extraction timeout: 120 seconds")
        print(f"🧠 Memory protection: enabled")
        print(f"📏 Text size limit: 1MB")
        print()
        
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
    run_protected_server()
