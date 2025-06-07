#!/usr/bin/env python3
"""
🚀 ENHANCED UNIFIED TORI LAUNCHER - With Comprehensive Logging
Advanced logging, real-time subprocess monitoring, and detailed diagnostics
"""

import socket
import json
import os
import sys
import time
import subprocess
import requests
import asyncio
import atexit
import logging
import threading
from pathlib import Path
from datetime import datetime
from typing import Optional
import uvicorn

# Optional MCP bridge import - don't crash if not available
try:
    from mcp_bridge_real_tori import create_real_mcp_bridge, RealMCPBridge
    MCP_BRIDGE_AVAILABLE = True
except ImportError:
    MCP_BRIDGE_AVAILABLE = False
    create_real_mcp_bridge = None
    RealMCPBridge = None

# Prajna integration - add to path and import
prajna_path = Path(__file__).parent / "prajna"
if prajna_path.exists():
    sys.path.insert(0, str(prajna_path))
    try:
        from prajna.config.prajna_config import load_config as load_prajna_config
        # Import API directly to avoid circular imports
        from prajna.api.prajna_api import app as prajna_app
        PRAJNA_AVAILABLE = True
    except ImportError as e:
        PRAJNA_AVAILABLE = False
        prajna_app = None
        load_prajna_config = None
else:
    PRAJNA_AVAILABLE = False
    prajna_app = None
    load_prajna_config = None

class EnhancedLogger:
    """Enhanced logging system with file output and real-time monitoring"""
    
    def __init__(self, script_dir: Path):
        self.script_dir = script_dir
        self.logs_dir = script_dir / "logs"
        self.logs_dir.mkdir(exist_ok=True)
        
        # Create timestamped log session
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.session_dir = self.logs_dir / f"session_{self.session_id}"
        self.session_dir.mkdir(exist_ok=True)
        
        # Create master log file path BEFORE setting up loggers
        self.master_log = self.session_dir / "master_session.log"
        
        # Set up loggers
        self.main_logger = self._setup_logger("main", "launcher.log")
        self.prajna_logger = self._setup_logger("prajna", "prajna.log")
        self.mcp_logger = self._setup_logger("mcp", "mcp.log")
        self.frontend_logger = self._setup_logger("frontend", "frontend.log")
        
        self.main_logger.info(f"🚀 Enhanced logging session started: {self.session_id}")
        self.main_logger.info(f"📂 Log directory: {self.session_dir}")
    
    def _setup_logger(self, name: str, filename: str) -> logging.Logger:
        """Set up individual logger with file and console output"""
        logger = logging.getLogger(f"tori.{name}")
        logger.setLevel(logging.DEBUG)
        
        # Clear any existing handlers
        logger.handlers.clear()
        
        # File handler
        file_handler = logging.FileHandler(self.session_dir / filename, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        file_format = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_format)
        logger.addHandler(file_handler)
        
        # Console handler (only for main logger to avoid spam)
        if name == "main":
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.INFO)
            console_format = logging.Formatter(
                '%(asctime)s | %(levelname)s | %(message)s',
                datefmt='%H:%M:%S'
            )
            console_handler.setFormatter(console_format)
            logger.addHandler(console_handler)
        
        # Master log handler (all messages)
        master_handler = logging.FileHandler(self.master_log, encoding='utf-8')
        master_handler.setLevel(logging.DEBUG)
        master_format = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | [%(name)s] | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        master_handler.setFormatter(master_format)
        logger.addHandler(master_handler)
        
        return logger
    
    def log_subprocess_output(self, process: subprocess.Popen, service_name: str, logger: logging.Logger):
        """Monitor subprocess output in real-time"""
        def monitor_stream(stream, stream_name, log_func):
            try:
                for line in iter(stream.readline, ''):
                    if line:
                        line = line.strip()
                        if line:
                            log_func(f"[{stream_name}] {line}")
            except Exception as e:
                logger.error(f"Error monitoring {stream_name}: {e}")
            finally:
                stream.close()
        
        # Start monitoring threads
        if process.stdout:
            stdout_thread = threading.Thread(
                target=monitor_stream,
                args=(process.stdout, "STDOUT", logger.info),
                daemon=True
            )
            stdout_thread.start()
        
        if process.stderr:
            stderr_thread = threading.Thread(
                target=monitor_stream,
                args=(process.stderr, "STDERR", logger.warning),
                daemon=True
            )
            stderr_thread.start()
    
    def get_logger(self, service: str) -> logging.Logger:
        """Get logger for specific service"""
        return getattr(self, f"{service}_logger", self.main_logger)

class EnhancedUnifiedToriLauncher:
    """Enhanced launcher with comprehensive logging and monitoring"""
    
    def __init__(self, base_port=8002, max_attempts=10):
        self.base_port = base_port
        self.max_attempts = max_attempts
        self.script_dir = Path(__file__).parent.absolute()
        self.config_file = self.script_dir / "api_port.json"
        self.status_file = self.script_dir / "tori_status.json"
        
        # Enhanced logging
        self.enhanced_logger = EnhancedLogger(self.script_dir)
        self.logger = self.enhanced_logger.main_logger
        
        # Service tracking
        self.mcp_process = None
        self.mcp_bridge = None
        self.frontend_process = None
        self.prajna_process = None
        self.api_port = None
        self.frontend_port = None
        self.prajna_port = None
        self.multi_tenant_config_file = self.script_dir / "multi_tenant_config.json"
        self.multi_tenant_mode = False
        
        # Directories
        self.frontend_dir = self.script_dir / "tori_ui_svelte"
        self.prajna_dir = self.script_dir / "prajna"
        
        # Check for multi-tenant mode
        self.multi_tenant_mode = self.check_multi_tenant_mode()
        
        # Register cleanup on exit
        atexit.register(self.cleanup)
        
        self.logger.info("🚀 Enhanced TORI Launcher initialized")
        self.logger.info(f"📂 Working directory: {self.script_dir}")
        self.logger.info(f"🏢 Multi-tenant mode: {self.multi_tenant_mode}")
    
    def check_multi_tenant_mode(self):
        """Check if multi-tenant mode is enabled"""
        try:
            if self.multi_tenant_config_file.exists():
                with open(self.multi_tenant_config_file, 'r') as f:
                    config = json.load(f)
                enabled = config.get("enabled", False)
                self.logger.info(f"📋 Multi-tenant config loaded: {enabled}")
                return enabled
        except Exception as e:
            self.logger.warning(f"⚠️ Failed to read multi-tenant config: {e}")
        return False
    
    def print_banner(self):
        """Print startup banner"""
        banner = "\n" + "=" * 70
        banner += "\n🚀 ENHANCED UNIFIED TORI LAUNCHER - Advanced Logging & Monitoring"
        banner += "\n" + "=" * 70
        banner += f"\n📂 Working directory: {self.script_dir}"
        banner += f"\n⏰ Started at: {datetime.now().strftime('%H:%M:%S')}"
        banner += f"\n📋 Session ID: {self.enhanced_logger.session_id}"
        banner += f"\n📁 Logs: {self.enhanced_logger.session_dir}"
        banner += "\n🔧 Features: Enhanced logging, real-time monitoring, diagnostics"
        banner += "\n🧠 Prajna: TORI's voice and language model"
        banner += "\n" + "=" * 70 + "\n"
        
        print(banner)
        self.logger.info("Enhanced TORI Launcher started with comprehensive logging")
    
    def update_status(self, stage: str, status: str, details: dict = None):
        """Update status file for debugging and frontend consumption"""
        status_data = {
            "timestamp": datetime.now().isoformat(),
            "stage": stage,
            "status": status,
            "details": details or {},
            "session_id": self.enhanced_logger.session_id,
            "api_port": self.api_port,
            "prajna_port": self.prajna_port,
            "mcp_running": self.mcp_process is not None and self.mcp_process.poll() is None,
            "prajna_running": self.prajna_process is not None and self.prajna_process.poll() is None,
            "bridge_ready": self.mcp_bridge is not None
        }
        
        with open(self.status_file, 'w') as f:
            json.dump(status_data, f, indent=2)
        
        self.logger.info(f"📊 Status: {stage} -> {status}")
        if details:
            self.logger.debug(f"📋 Details: {details}")
    
    def is_port_available(self, port):
        """Check if a port is available"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('0.0.0.0', port))
                return True
        except OSError:
            return False
    
    def find_available_port(self, start_port=None, service_name="service"):
        """Find the first available port starting from given port"""
        start = start_port or self.base_port
        self.logger.info(f"🔍 Searching for available {service_name} port starting from {start}")
        
        for i in range(self.max_attempts):
            port = start + i
            if self.is_port_available(port):
                self.logger.info(f"✅ Found available {service_name} port: {port}")
                return port
            else:
                self.logger.debug(f"❌ Port {port} is busy")
        
        raise Exception(f"❌ No available {service_name} ports found in range {start}-{start + self.max_attempts}")
    
    def start_prajna_service_enhanced(self):
        """Start Prajna voice system with enhanced monitoring"""
        prajna_logger = self.enhanced_logger.get_logger("prajna")
        
        if not PRAJNA_AVAILABLE:
            self.logger.info("⏭️ Skipping Prajna service (not available)")
            prajna_logger.info("Prajna not available - imports failed")
            self.update_status("prajna_startup", "skipped", {"reason": "Prajna not available"})
            return False
        
        if not self.prajna_dir.exists():
            self.logger.warning(f"⚠️ Prajna directory not found: {self.prajna_dir}")
            prajna_logger.error(f"Prajna directory not found: {self.prajna_dir}")
            self.update_status("prajna_startup", "skipped", {"reason": "Prajna directory not found"})
            return False
        
        self.update_status("prajna_startup", "starting", {"message": "Starting Prajna voice system..."})
        self.logger.info("🧠 Starting Prajna - TORI's Voice and Language Model...")
        prajna_logger.info("=== PRAJNA STARTUP SEQUENCE BEGIN ===")
        
        try:
            # Find available port for Prajna
            prajna_port = self.find_available_port(8001, "Prajna")
            self.prajna_port = prajna_port
            prajna_logger.info(f"Assigned port: {prajna_port}")
            
            # Check start script
            start_script = self.prajna_dir / "start_prajna.py"
            if not start_script.exists():
                prajna_logger.error(f"Start script not found: {start_script}")
                self.logger.warning(f"⚠️ Prajna start script not found: {start_script}")
                self.update_status("prajna_startup", "skipped", {"reason": "Start script not found"})
                return False
            
            prajna_logger.info(f"Using start script: {start_script}")
            
            # Prepare command
            prajna_cmd = [
                sys.executable,
                str(start_script),
                "--port", str(prajna_port),
                "--host", "0.0.0.0",
                "--log-level", "INFO"
            ]
            
            prajna_logger.info(f"Command: {' '.join(prajna_cmd)}")
            self.logger.info(f"🚀 Starting Prajna on port {prajna_port} in PRODUCTION MODE...")
            
            # Set up environment with correct PYTHONPATH
            env = os.environ.copy()
            # PYTHONPATH should point to parent directory so 'prajna' package can be imported
            parent_dir = self.prajna_dir.parent
            current_pythonpath = env.get('PYTHONPATH', '')
            if current_pythonpath:
                env['PYTHONPATH'] = f"{parent_dir}{os.pathsep}{current_pythonpath}"
            else:
                env['PYTHONPATH'] = str(parent_dir)
            
            prajna_logger.info(f"PYTHONPATH set to: {env['PYTHONPATH']}")
            prajna_logger.info(f"Working directory: {self.prajna_dir}")
            
            # Start process
            self.prajna_process = subprocess.Popen(
                prajna_cmd,
                cwd=str(self.prajna_dir),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True,
                bufsize=1  # Line buffered
            )
            
            prajna_logger.info(f"Process started with PID: {self.prajna_process.pid}")
            
            # Start real-time output monitoring
            self.enhanced_logger.log_subprocess_output(self.prajna_process, "Prajna", prajna_logger)
            
            # Wait for startup with enhanced monitoring
            max_retries = 60
            self.logger.info("⏳ Waiting for Prajna to initialize (production mode)...")
            prajna_logger.info(f"Waiting for health check on port {prajna_port} (max {max_retries} attempts)")
            
            for i in range(max_retries):
                # Check if process is still running
                if self.prajna_process.poll() is not None:
                    prajna_logger.error(f"Process exited early with code: {self.prajna_process.returncode}")
                    self.logger.error(f"❌ Prajna process exited early with code: {self.prajna_process.returncode}")
                    break
                
                try:
                    response = requests.get(f'http://127.0.0.1:{prajna_port}/api/health', timeout=2)
                    if response.status_code == 200:
                        self.logger.info("✅ Prajna voice system started successfully!")
                        prajna_logger.info("Health check passed - Prajna is ready!")
                        
                        # Test API endpoint
                        try:
                            test_response = requests.post(
                                f'http://127.0.0.1:{prajna_port}/api/answer',
                                json={"user_query": "Test Prajna startup"},
                                timeout=5
                            )
                            if test_response.status_code == 200:
                                self.logger.info("🧪 Prajna test query successful!")
                                prajna_logger.info("Test query successful")
                            else:
                                prajna_logger.warning(f"Test query failed: {test_response.status_code}")
                        except Exception as e:
                            prajna_logger.warning(f"Test query error: {e}")
                        
                        self.update_status("prajna_startup", "success", {
                            "port": prajna_port,
                            "api_url": f"http://127.0.0.1:{prajna_port}/api/answer",
                            "docs_url": f"http://127.0.0.1:{prajna_port}/docs",
                            "mode": "production"
                        })
                        
                        prajna_logger.info("=== PRAJNA STARTUP SEQUENCE SUCCESS ===")
                        return True
                        
                except requests.exceptions.RequestException as e:
                    prajna_logger.debug(f"Health check attempt {i+1}: {e}")
                
                # Progress reporting
                if i % 5 == 0 and i > 0:
                    self.logger.info(f"⏳ Still waiting for Prajna... ({i}/{max_retries} attempts)")
                    prajna_logger.info(f"Still waiting for health check... attempt {i+1}/{max_retries}")
                
                time.sleep(1)
            
            # Startup failed
            self.logger.warning("⚠️ Prajna failed to start within 60 seconds")
            prajna_logger.error("Prajna startup timeout - failed to respond to health checks")
            
            # Get final process status
            if self.prajna_process.poll() is not None:
                prajna_logger.error(f"Process exited with code: {self.prajna_process.returncode}")
            else:
                prajna_logger.warning("Process still running but not responding to health checks")
            
            prajna_logger.info("=== PRAJNA STARTUP SEQUENCE FAILED ===")
            self.update_status("prajna_startup", "failed", {"error": "Health check timeout"})
            return False
            
        except Exception as e:
            self.logger.warning(f"⚠️ Error starting Prajna service: {e}")
            prajna_logger.error(f"Exception during startup: {e}")
            prajna_logger.info("=== PRAJNA STARTUP SEQUENCE ERROR ===")
            self.update_status("prajna_startup", "failed", {"error": str(e)})
            return False
    
    def save_port_config(self, api_port, prajna_port=None):
        """Save the active ports to config file"""
        config = {
            "api_port": api_port,
            "api_url": f"http://localhost:{api_port}",
            "prajna_port": prajna_port,
            "prajna_url": f"http://localhost:{prajna_port}" if prajna_port else None,
            "timestamp": time.time(),
            "status": "active",
            "session_id": self.enhanced_logger.session_id,
            "mcp_integrated": True,
            "prajna_integrated": prajna_port is not None
        }
        
        with open(self.config_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        self.logger.info(f"📝 Saved port config: {self.config_file}")
        return config
    
    def cleanup(self):
        """Enhanced cleanup with logging"""
        self.logger.info("🧹 Starting enhanced cleanup...")
        
        if self.prajna_process and self.prajna_process.poll() is None:
            try:
                self.logger.info("🛑 Terminating Prajna process...")
                self.prajna_process.terminate()
                self.prajna_process.wait(timeout=5)
                self.logger.info("✅ Prajna process terminated")
            except Exception as e:
                self.logger.error(f"⚠️ Error terminating Prajna process: {e}")
        
        # Log session summary
        self.logger.info("📋 Session Summary:")
        self.logger.info(f"   📁 Log files: {self.enhanced_logger.session_dir}")
        self.logger.info(f"   🆔 Session ID: {self.enhanced_logger.session_id}")
        self.logger.info("✅ Enhanced cleanup complete")

def main():
    """Enhanced main entry point"""
    launcher = EnhancedUnifiedToriLauncher()
    launcher.print_banner()
    
    try:
        # Just test Prajna for now
        launcher.start_prajna_service_enhanced()
        
        print(f"\n📁 Check detailed logs at: {launcher.enhanced_logger.session_dir}")
        print(f"📄 Master log: {launcher.enhanced_logger.master_log}")
        
        input("\nPress Enter to exit...")
        
    except KeyboardInterrupt:
        launcher.logger.info("👋 Shutdown requested by user")
    except Exception as e:
        launcher.logger.error(f"❌ Fatal error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
