#!/usr/bin/env python3
"""
🔬 DEEP SURGICAL DIAGNOSTICS - Complete Prajna Analysis
Multi-threaded, real-time monitoring with process inspection, memory analysis, 
network monitoring, and comprehensive error detection
"""

import subprocess
import sys
import os
import time
import socket
import threading
import queue
import json
import psutil
import signal
from pathlib import Path
from datetime import datetime
import traceback
import logging

class DeepPrajnaAnalyzer:
    """Comprehensive multi-layered Prajna diagnostic system"""
    
    def __init__(self):
        self.script_dir = Path(__file__).parent
        self.prajna_dir = self.script_dir / "prajna"
        self.start_script = self.prajna_dir / "start_prajna.py"
        self.process = None
        self.output_queue = queue.Queue()
        self.monitoring_active = False
        self.startup_timeline = []
        self.system_metrics = []
        self.network_activity = []
        
        # Setup logging
        logging.basicConfig(
            level=logging.DEBUG,
            format='%(asctime)s.%(msecs)03d [%(levelname)s] %(message)s',
            datefmt='%H:%M:%S'
        )
        self.logger = logging.getLogger(__name__)
    
    def run_complete_analysis(self):
        """Execute comprehensive Prajna analysis"""
        print("🔬 DEEP SURGICAL DIAGNOSTICS - COMPLETE PRAJNA ANALYSIS")
        print("=" * 70)
        print("🎯 Multi-threaded monitoring with process inspection")
        print("📊 Real-time metrics, network activity, and error detection")
        print("🧬 Comprehensive system state analysis")
        print("=" * 70)
        
        try:
            # Phase 1: Pre-startup analysis
            self.analyze_pre_startup_state()
            
            # Phase 2: Environment deep dive
            self.deep_environment_analysis()
            
            # Phase 3: Dependency chain analysis
            self.analyze_dependency_chain()
            
            # Phase 4: Monitored startup with threading
            self.monitored_startup_analysis()
            
            # Phase 5: Post-mortem analysis
            self.post_mortem_analysis()
            
        except Exception as e:
            self.logger.error(f"❌ Analysis failed: {e}")
            traceback.print_exc()
        
        print("\\n🎯 DEEP ANALYSIS COMPLETE")
    
    def analyze_pre_startup_state(self):
        """Analyze system state before Prajna startup"""
        print("\\n🔍 PHASE 1: PRE-STARTUP SYSTEM STATE ANALYSIS")
        print("-" * 50)
        
        # System resources
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=1)
        disk = psutil.disk_usage('C:\\\\')
        
        print(f"💾 Memory: {memory.percent}% used ({memory.available // (1024**3)} GB available)")
        print(f"🖥️ CPU: {cpu_percent}% usage")
        print(f"💿 Disk: {disk.percent}% used ({disk.free // (1024**3)} GB free)")
        
        # Network ports in use
        print("\\n🔌 Network ports analysis:")
        connections = psutil.net_connections(kind='inet')
        occupied_ports = set()
        for conn in connections:
            if conn.laddr and conn.status == 'LISTEN':
                occupied_ports.add(conn.laddr.port)
        
        ports_of_interest = [8001, 8002, 8003, 3000, 5173]
        for port in ports_of_interest:
            status = "❌ OCCUPIED" if port in occupied_ports else "✅ Available"
            print(f"  Port {port}: {status}")
        
        # Python processes
        print("\\n🐍 Existing Python processes:")
        python_processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                if proc.info['name'] and 'python' in proc.info['name'].lower():
                    python_processes.append(proc.info)
                    cmdline = ' '.join(proc.info['cmdline'][:3]) if proc.info['cmdline'] else 'N/A'
                    print(f"  PID {proc.info['pid']}: {cmdline}")
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        print(f"📊 Total Python processes: {len(python_processes)}")
    
    def deep_environment_analysis(self):
        """Deep analysis of Python environment and Prajna structure"""
        print("\\n🔍 PHASE 2: DEEP ENVIRONMENT ANALYSIS")
        print("-" * 50)
        
        # Python environment details
        print(f"🐍 Python executable: {sys.executable}")
        print(f"🐍 Python version: {sys.version}")
        print(f"🐍 Python path entries ({len(sys.path)}):")
        for i, path in enumerate(sys.path[:10]):  # First 10 entries
            print(f"  {i}: {path}")
        if len(sys.path) > 10:
            print(f"  ... and {len(sys.path) - 10} more")
        
        # Environment variables
        relevant_env_vars = ['PYTHONPATH', 'PATH', 'VIRTUAL_ENV', 'CONDA_DEFAULT_ENV']
        print("\\n🌍 Environment variables:")
        for var in relevant_env_vars:
            value = os.environ.get(var, 'Not set')
            print(f"  {var}: {value[:100]}{'...' if len(str(value)) > 100 else ''}")
        
        # Prajna directory deep analysis
        print("\\n📁 Prajna directory deep analysis:")
        self.analyze_directory_recursive(self.prajna_dir, max_depth=3)
        
        # File permissions and accessibility
        critical_files = [
            self.prajna_dir / "__init__.py",
            self.prajna_dir / "start_prajna.py",
            self.prajna_dir / "config" / "prajna_config.py",
            self.prajna_dir / "api" / "prajna_api.py"
        ]
        
        print("\\n🔐 File permissions analysis:")
        for file_path in critical_files:
            if file_path.exists():
                stat = file_path.stat()
                readable = os.access(file_path, os.R_OK)
                executable = os.access(file_path, os.X_OK)
                print(f"  {file_path.name}: Size {stat.st_size}, "
                      f"{'✅' if readable else '❌'} readable, "
                      f"{'✅' if executable else '❌'} executable")
            else:
                print(f"  {file_path.name}: ❌ Missing")
    
    def analyze_directory_recursive(self, directory, max_depth=2, current_depth=0):
        """Recursively analyze directory structure"""
        if current_depth >= max_depth or not directory.exists():
            return
        
        indent = "  " * current_depth
        try:
            items = list(directory.iterdir())
            for item in items:
                if item.is_dir():
                    print(f"{indent}📁 {item.name}/")
                    self.analyze_directory_recursive(item, max_depth, current_depth + 1)
                else:
                    size = item.stat().st_size
                    size_str = f"{size:,}" if size < 1024 else f"{size//1024}KB"
                    print(f"{indent}📄 {item.name} ({size_str})")
        except PermissionError:
            print(f"{indent}❌ Permission denied")
        except Exception as e:
            print(f"{indent}❌ Error: {e}")
    
    def analyze_dependency_chain(self):
        """Analyze complete dependency import chain"""
        print("\\n🔍 PHASE 3: DEPENDENCY CHAIN ANALYSIS")
        print("-" * 50)
        
        # Ensure Prajna is in path
        parent_dir = self.prajna_dir.parent
        if str(parent_dir) not in sys.path:
            sys.path.insert(0, str(parent_dir))
        
        # Test import chain with detailed error capture
        import_chain = [
            ("prajna", "Base package import"),
            ("prajna.config", "Config package"),
            ("prajna.config.prajna_config", "Config module"),
            ("prajna.api", "API package"),
            ("prajna.api.prajna_api", "API module"),
            ("uvicorn", "Uvicorn web server"),
            ("fastapi", "FastAPI framework"),
        ]
        
        successful_imports = 0
        for module_name, description in import_chain:
            try:
                start_time = time.time()
                imported_module = __import__(module_name)
                import_time = time.time() - start_time
                
                print(f"✅ {description}: {module_name} ({import_time:.3f}s)")
                successful_imports += 1
                
                # Additional analysis for key modules
                if module_name == "prajna.config.prajna_config":
                    try:
                        from prajna.config.prajna_config import load_config
                        config = load_config()
                        print(f"  📋 Config loaded: {len(config) if isinstance(config, dict) else 'N/A'} entries")
                    except Exception as e:
                        print(f"  ❌ Config load failed: {e}")
                
                elif module_name == "prajna.api.prajna_api":
                    try:
                        from prajna.api.prajna_api import app
                        print(f"  🌐 FastAPI app: {type(app).__name__}")
                    except Exception as e:
                        print(f"  ❌ FastAPI app failed: {e}")
                        
            except ImportError as e:
                print(f"❌ {description}: {module_name} - ImportError: {e}")
                # Try to get more details
                self.analyze_import_error(module_name, e)
            except Exception as e:
                print(f"⚠️ {description}: {module_name} - {type(e).__name__}: {e}")
        
        print(f"\\n📊 Import success rate: {successful_imports}/{len(import_chain)} ({successful_imports/len(import_chain)*100:.1f}%)")
    
    def analyze_import_error(self, module_name, error):
        """Analyze import errors in detail"""
        print(f"  🔍 Analyzing import failure for {module_name}:")
        
        # Check if it's a missing file issue
        parts = module_name.split('.')
        current_path = self.script_dir
        
        for part in parts:
            if part == 'prajna':
                current_path = self.prajna_dir
            else:
                current_path = current_path / part
            
            if current_path.with_suffix('.py').exists():
                print(f"    ✅ Found: {current_path.with_suffix('.py')}")
            elif (current_path / "__init__.py").exists():
                print(f"    ✅ Found package: {current_path}/__init__.py")
            else:
                print(f"    ❌ Missing: {current_path}")
                break
    
    def monitored_startup_analysis(self):
        """Multi-threaded monitored startup with comprehensive tracking"""
        print("\\n🔍 PHASE 4: MONITORED STARTUP ANALYSIS")
        print("-" * 50)
        
        if not self.start_script.exists():
            print("❌ Start script not found")
            return
        
        # Setup monitoring
        self.monitoring_active = True
        self.startup_timeline = []
        
        # Start monitoring threads
        threads = [
            threading.Thread(target=self.monitor_system_metrics, daemon=True),
            threading.Thread(target=self.monitor_network_activity, daemon=True),
            threading.Thread(target=self.monitor_process_output, daemon=True)
        ]
        
        for thread in threads:
            thread.start()
        
        print("🚀 Starting Prajna with comprehensive monitoring...")
        self.log_timeline("STARTUP_INITIATED")
        
        # Prepare startup command
        prajna_cmd = [
            sys.executable,
            str(self.start_script),
            "--port", "8001",
            "--host", "0.0.0.0",
            "--log-level", "DEBUG"
        ]
        
        # Environment setup
        env = os.environ.copy()
        parent_dir = self.prajna_dir.parent
        env['PYTHONPATH'] = str(parent_dir)
        env['PYTHONUNBUFFERED'] = '1'  # Force unbuffered output
        
        try:
            # Start process
            self.process = subprocess.Popen(
                prajna_cmd,
                cwd=str(self.prajna_dir),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=0  # Unbuffered
            )
            
            print(f"📊 Process started with PID: {self.process.pid}")
            self.log_timeline(f"PROCESS_STARTED_PID_{self.process.pid}")
            
            # Monitor for 45 seconds with detailed tracking
            start_time = time.time()
            last_output_time = start_time
            output_lines = []
            port_test_times = [10, 20, 30]  # Test port at these intervals
            
            while time.time() - start_time < 45:
                current_time = time.time()
                
                # Check if process ended
                if self.process.poll() is not None:
                    self.log_timeline(f"PROCESS_EXITED_CODE_{self.process.poll()}")
                    print(f"📊 Process exited with code: {self.process.poll()}")
                    break
                
                # Read output with timeout
                try:
                    # Check for output without blocking
                    if not self.output_queue.empty():
                        line = self.output_queue.get_nowait()
                        output_lines.append(line)
                        last_output_time = current_time
                        
                        self.log_timeline(f"OUTPUT: {line[:50]}...")
                        print(f"PRAJNA [{current_time-start_time:.1f}s]: {line}")
                        
                        # Analyze output in real-time
                        self.analyze_output_line(line, current_time - start_time)
                        
                except queue.Empty:
                    pass
                
                # Test port at intervals
                for test_time in port_test_times:
                    if abs(current_time - start_time - test_time) < 0.5:  # Within 0.5s of test time
                        self.test_port_with_timeline(8001, test_time)
                        port_test_times.remove(test_time)  # Don't test again
                        break
                
                # Check for hanging (no output for 10 seconds)
                if current_time - last_output_time > 10:
                    self.log_timeline("POTENTIAL_HANG_DETECTED")
                    print(f"⚠️ Potential hang detected - no output for {current_time - last_output_time:.1f}s")
                    
                    # Get process info
                    try:
                        proc = psutil.Process(self.process.pid)
                        cpu_percent = proc.cpu_percent()
                        memory_mb = proc.memory_info().rss / (1024*1024)
                        status = proc.status()
                        print(f"🔍 Process status: {status}, CPU: {cpu_percent}%, Memory: {memory_mb:.1f}MB")
                    except:
                        pass
                
                time.sleep(0.1)
            
            # Final port test
            print("\\n🔌 Final port connectivity test:")
            self.test_port_with_timeline(8001, "FINAL")
            
            # Stop monitoring
            self.monitoring_active = False
            
            # Cleanup process
            if self.process and self.process.poll() is None:
                self.log_timeline("TERMINATING_PROCESS")
                print("🧹 Terminating process...")
                self.process.terminate()
                try:
                    self.process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    print("🔫 Force killing process...")
                    self.process.kill()
            
            # Wait for monitoring threads to finish
            time.sleep(1)
            
            # Analyze all collected data
            self.analyze_monitoring_results(output_lines)
            
        except Exception as e:
            self.log_timeline(f"STARTUP_ERROR: {str(e)}")
            print(f"❌ Startup failed: {e}")
            traceback.print_exc()
    
    def monitor_process_output(self):
        """Monitor process output in separate thread"""
        if not self.process:
            return
        
        try:
            while self.monitoring_active and self.process.poll() is None:
                line = self.process.stdout.readline()
                if line:
                    self.output_queue.put(line.strip())
                else:
                    time.sleep(0.01)
        except Exception as e:
            self.logger.error(f"Output monitoring error: {e}")
    
    def monitor_system_metrics(self):
        """Monitor system metrics during startup"""
        while self.monitoring_active:
            try:
                timestamp = time.time()
                
                # System metrics
                memory = psutil.virtual_memory()
                cpu = psutil.cpu_percent()
                
                # Process metrics if available
                proc_cpu = 0
                proc_memory = 0
                if self.process:
                    try:
                        proc = psutil.Process(self.process.pid)
                        proc_cpu = proc.cpu_percent()
                        proc_memory = proc.memory_info().rss / (1024*1024)  # MB
                    except:
                        pass
                
                metrics = {
                    'timestamp': timestamp,
                    'system_memory_percent': memory.percent,
                    'system_cpu_percent': cpu,
                    'process_cpu_percent': proc_cpu,
                    'process_memory_mb': proc_memory
                }
                
                self.system_metrics.append(metrics)
                
            except Exception as e:
                self.logger.error(f"Metrics monitoring error: {e}")
            
            time.sleep(1)  # Collect metrics every second
    
    def monitor_network_activity(self):
        """Monitor network activity during startup"""
        initial_connections = set()
        try:
            for conn in psutil.net_connections(kind='inet'):
                if conn.laddr:
                    initial_connections.add((conn.laddr.ip, conn.laddr.port))
        except:
            pass
        
        while self.monitoring_active:
            try:
                current_connections = set()
                for conn in psutil.net_connections(kind='inet'):
                    if conn.laddr:
                        current_connections.add((conn.laddr.ip, conn.laddr.port))
                
                # Check for new connections
                new_connections = current_connections - initial_connections
                if new_connections:
                    for ip, port in new_connections:
                        self.network_activity.append({
                            'timestamp': time.time(),
                            'event': 'NEW_BINDING',
                            'ip': ip,
                            'port': port
                        })
                        if port == 8001:
                            self.log_timeline(f"PORT_8001_BOUND_{ip}")
                
                initial_connections = current_connections
                
            except Exception as e:
                self.logger.error(f"Network monitoring error: {e}")
            
            time.sleep(0.5)  # Check network every 0.5 seconds
    
    def log_timeline(self, event):
        """Log timeline event with precise timestamp"""
        self.startup_timeline.append({
            'timestamp': time.time(),
            'event': event
        })
    
    def analyze_output_line(self, line, elapsed_time):
        """Analyze each output line for key indicators"""
        line_lower = line.lower()
        
        # Key startup phases
        if "configuration" in line_lower and "load" in line_lower:
            self.log_timeline("CONFIG_LOADING")
        elif "uvicorn" in line_lower and "running" in line_lower:
            self.log_timeline("UVICORN_RUNNING")
        elif "application startup complete" in line_lower:
            self.log_timeline("APP_STARTUP_COMPLETE")
        elif "started server process" in line_lower:
            self.log_timeline("SERVER_PROCESS_STARTED")
        elif "waiting for application startup" in line_lower:
            self.log_timeline("WAITING_FOR_APP_STARTUP")
        elif "error" in line_lower or "exception" in line_lower:
            self.log_timeline(f"ERROR_DETECTED: {line[:100]}")
        elif "traceback" in line_lower:
            self.log_timeline("TRACEBACK_DETECTED")
    
    def test_port_with_timeline(self, port, label):
        """Test port and log to timeline"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex(('127.0.0.1', port))
                if result == 0:
                    self.log_timeline(f"PORT_TEST_{label}_SUCCESS")
                    print(f"✅ Port {port} test at {label}: Connected!")
                    return True
                else:
                    self.log_timeline(f"PORT_TEST_{label}_FAILED_{result}")
                    print(f"❌ Port {port} test at {label}: Failed (error {result})")
                    return False
        except Exception as e:
            self.log_timeline(f"PORT_TEST_{label}_ERROR_{str(e)}")
            print(f"❌ Port {port} test at {label}: Exception {e}")
            return False
    
    def analyze_monitoring_results(self, output_lines):
        """Analyze all monitoring results"""
        print("\\n📊 MONITORING RESULTS ANALYSIS")
        print("-" * 50)
        
        # Timeline analysis
        print("⏱️ Startup timeline:")
        for event in self.startup_timeline:
            timestamp = datetime.fromtimestamp(event['timestamp']).strftime('%H:%M:%S.%f')[:-3]
            print(f"  {timestamp}: {event['event']}")
        
        # System metrics summary
        if self.system_metrics:
            max_cpu = max(m['system_cpu_percent'] for m in self.system_metrics)
            max_memory = max(m['system_memory_percent'] for m in self.system_metrics)
            max_proc_cpu = max(m['process_cpu_percent'] for m in self.system_metrics)
            max_proc_memory = max(m['process_memory_mb'] for m in self.system_metrics)
            
            print(f"\\n📈 System metrics during startup:")
            print(f"  Max system CPU: {max_cpu:.1f}%")
            print(f"  Max system memory: {max_memory:.1f}%")
            print(f"  Max process CPU: {max_proc_cpu:.1f}%")
            print(f"  Max process memory: {max_proc_memory:.1f}MB")
        
        # Network activity
        if self.network_activity:
            print(f"\\n🌐 Network activity ({len(self.network_activity)} events):")
            for activity in self.network_activity:
                timestamp = datetime.fromtimestamp(activity['timestamp']).strftime('%H:%M:%S.%f')[:-3]
                print(f"  {timestamp}: {activity['event']} {activity['ip']}:{activity['port']}")
        else:
            print("\\n🌐 No network activity detected")
        
        # Output analysis
        print(f"\\n📝 Output analysis ({len(output_lines)} lines):")
        error_lines = [line for line in output_lines if any(word in line.lower() for word in ['error', 'exception', 'failed', 'traceback'])]
        if error_lines:
            print(f"  🚨 Error lines found: {len(error_lines)}")
            for error_line in error_lines[:5]:  # Show first 5 errors
                print(f"    {error_line}")
            if len(error_lines) > 5:
                print(f"    ... and {len(error_lines) - 5} more")
        else:
            print("  ✅ No error patterns detected in output")
    
    def post_mortem_analysis(self):
        """Post-mortem analysis and recommendations"""
        print("\\n🔍 PHASE 5: POST-MORTEM ANALYSIS")
        print("-" * 50)
        
        print("🎯 DIAGNOSTIC SUMMARY:")
        
        # Check timeline for key events
        timeline_events = [event['event'] for event in self.startup_timeline]
        
        if any('PROCESS_STARTED' in event for event in timeline_events):
            print("✅ Process started successfully")
        else:
            print("❌ Process failed to start")
        
        if any('CONFIG_LOADING' in event for event in timeline_events):
            print("✅ Configuration loading initiated")
        else:
            print("❌ Configuration loading not detected")
        
        if any('UVICORN_RUNNING' in event for event in timeline_events):
            print("✅ Uvicorn server started")
        else:
            print("❌ Uvicorn server startup not detected")
        
        if any('PORT_8001_BOUND' in event for event in timeline_events):
            print("✅ Port 8001 successfully bound")
        else:
            print("❌ Port 8001 binding failed")
        
        if any('ERROR_DETECTED' in event for event in timeline_events):
            print("❌ Errors detected during startup")
        else:
            print("✅ No errors detected")
        
        # Recommendations
        print("\\n💡 RECOMMENDATIONS:")
        
        error_events = [event for event in timeline_events if 'ERROR' in event]
        if error_events:
            print("1. Investigate error messages in detail")
            print("2. Check dependency versions and compatibility")
        
        if not any('PORT_8001_BOUND' in event for event in timeline_events):
            print("1. Check for port conflicts on 8001")
            print("2. Verify firewall/antivirus settings")
            print("3. Test with alternative port")
        
        if any('HANG_DETECTED' in event for event in timeline_events):
            print("1. Process appears to hang - check for infinite loops")
            print("2. Add more debugging to startup sequence")
            print("3. Consider timeout mechanisms")
        
        # Save detailed report
        self.save_diagnostic_report()
    
    def save_diagnostic_report(self):
        """Save comprehensive diagnostic report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'timeline': self.startup_timeline,
            'system_metrics': self.system_metrics,
            'network_activity': self.network_activity,
            'analysis_summary': {
                'total_events': len(self.startup_timeline),
                'monitoring_duration': len(self.system_metrics),
                'network_events': len(self.network_activity)
            }
        }
        
        report_file = self.script_dir / "prajna_diagnostic_report.json"
        try:
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"\\n💾 Detailed report saved: {report_file}")
        except Exception as e:
            print(f"\\n❌ Failed to save report: {e}")

def main():
    """Run deep Prajna analysis"""
    try:
        analyzer = DeepPrajnaAnalyzer()
        analyzer.run_complete_analysis()
    except KeyboardInterrupt:
        print("\\n👋 Analysis interrupted by user")
    except Exception as e:
        print(f"\\n❌ Analysis failed: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    main()
