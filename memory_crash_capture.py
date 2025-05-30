#!/usr/bin/env python3
"""
🔍 MEMORY MONITORING CRASH CAPTURE
Monitors memory usage during extraction to identify memory-related crashes
"""

import psutil
import threading
import time
import sys
import os
import logging
from datetime import datetime
from pathlib import Path

class MemoryMonitor:
    def __init__(self, interval=1):
        self.interval = interval
        self.monitoring = False
        
        # Set up logging
        log_dir = Path(__file__).parent / "logs"
        log_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.memory_log = log_dir / f"memory_{timestamp}.log"
        
        self.logger = logging.getLogger("MEMORY_MONITOR")
        handler = logging.FileHandler(self.memory_log, encoding='utf-8')
        handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
        
    def start_monitoring(self):
        """Start memory monitoring in background thread"""
        self.monitoring = True
        thread = threading.Thread(target=self._monitor_loop, daemon=True)
        thread.start()
        print(f"🧠 Memory monitoring started, logging to: {self.memory_log}")
        
    def stop_monitoring(self):
        """Stop memory monitoring"""
        self.monitoring = False
        
    def _monitor_loop(self):
        """Memory monitoring loop"""
        process = psutil.Process()
        
        while self.monitoring:
            try:
                # Get memory info
                memory_info = process.memory_info()
                memory_percent = process.memory_percent()
                
                # Get system memory
                system_memory = psutil.virtual_memory()
                
                # Log memory stats
                log_msg = (
                    f"PID:{process.pid} | "
                    f"RSS:{memory_info.rss / 1024 / 1024:.1f}MB | "
                    f"VMS:{memory_info.vms / 1024 / 1024:.1f}MB | "
                    f"Percent:{memory_percent:.1f}% | "
                    f"System:{system_memory.percent:.1f}% | "
                    f"Available:{system_memory.available / 1024 / 1024 / 1024:.1f}GB"
                )
                
                self.logger.info(log_msg)
                
                # Print warning if memory usage is high
                if memory_percent > 50:
                    print(f"⚠️ HIGH MEMORY: {memory_percent:.1f}% ({memory_info.rss / 1024 / 1024:.1f}MB)")
                    
                if system_memory.percent > 80:
                    print(f"🚨 SYSTEM MEMORY CRITICAL: {system_memory.percent:.1f}%")
                
            except Exception as e:
                self.logger.error(f"Memory monitoring error: {e}")
                
            time.sleep(self.interval)

def run_with_memory_monitoring():
    """Run API server with memory monitoring"""
    
    print("🧠 MEMORY MONITORING CRASH CAPTURE")
    print("=" * 50)
    
    # Start memory monitoring
    monitor = MemoryMonitor(interval=0.5)  # Monitor every 500ms
    monitor.start_monitoring()
    
    try:
        # Import required modules
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
        
        print(f"🚀 Starting API server with memory monitoring...")
        print(f"📍 URL: http://localhost:{port}")
        print(f"🧠 Watch for memory warnings during extraction")
        print()
        
        # Add current directory to path
        current_dir = Path(__file__).parent
        sys.path.insert(0, str(current_dir))
        
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
        print(f"❌ SERVER CRASHED: {e}")
        print(f"📝 Check memory log: {monitor.memory_log}")
        
        # Get final memory reading
        try:
            process = psutil.Process()
            memory_info = process.memory_info()
            print(f"💾 Final memory usage: {memory_info.rss / 1024 / 1024:.1f}MB")
        except:
            pass
            
        import traceback
        print("❌ Full traceback:")
        traceback.print_exc()
        
    finally:
        monitor.stop_monitoring()
        print(f"📝 Memory log saved to: {monitor.memory_log}")

if __name__ == "__main__":
    run_with_memory_monitoring()
