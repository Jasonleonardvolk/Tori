#!/usr/bin/env python3
"""
Run the ELFIN Dashboard and API server.

This script launches both the API backend and frontend dashboard services.
"""

import os
import sys
import time
import argparse
import subprocess
import signal
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Process tracking
processes = []


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Run the ELFIN Dashboard")
    
    parser.add_argument("--api-port", type=int, default=8000, help="API server port")
    parser.add_argument("--dash-port", type=int, default=3000, help="Dashboard server port")
    parser.add_argument("--demo-concepts", type=int, default=30, help="Number of demo concepts")
    parser.add_argument("--demo-edges", type=int, default=100, help="Number of demo edges")
    parser.add_argument("--no-demo", action="store_true", help="Don't create demo system")
    parser.add_argument("--api-only", action="store_true", help="Run API server only")
    parser.add_argument("--dashboard-only", action="store_true", help="Run dashboard only")
    parser.add_argument("--dev", action="store_true", help="Run in development mode")
    parser.add_argument("--demo-system", type=str, default="quadrotor", 
                      help="Type of demo system to create (quadrotor, pendulum, default)")
    parser.add_argument("--pregenerate-isosurfaces", action="store_true", 
                      help="Pregenerate isosurfaces for quicker loading")
    
    return parser.parse_args()


def pregenerate_isosurfaces(system_id, function_types=None, levels=None):
    """
    Pregenerate isosurfaces for quicker loading in the dashboard.
    
    Args:
        system_id: System ID
        function_types: List of function types ('barrier', 'lyapunov')
        levels: List of level values
    """
    logger.info(f"Pregenerating isosurfaces for {system_id}...")
    
    try:
        from alan_backend.elfin.visualization.isosurface_generator import get_or_generate_isosurface
        
        function_types = function_types or ['barrier', 'lyapunov']
        levels = levels or [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
        
        for func_type in function_types:
            for level in levels:
                logger.info(f"Generating {func_type} isosurface at level {level}...")
                path = get_or_generate_isosurface(system_id, func_type, level)
                if path:
                    logger.info(f"Generated: {path}")
                else:
                    logger.warning(f"Failed to generate {func_type} isosurface at level {level}")
    
    except ImportError:
        logger.warning("Isosurface generation not available, skipping pregeneration")
    except Exception as e:
        logger.error(f"Error pregenerating isosurfaces: {e}")


def create_demo_quadrotor():
    """Create a demo quadrotor system for barrier function visualization."""
    logger.info("Creating demo quadrotor system...")
    
    try:
        from alan_backend.elfin.visualization.api import create_demo_system
        create_demo_system("quadrotor", num_concepts=10, num_edges=20)
        
        # Pre-initialize barrier stream
        from alan_backend.elfin.visualization.barrier_stream import get_barrier_stream
        get_barrier_stream("quadrotor", "quadrotor")
        
        logger.info("Demo quadrotor system created successfully")
        
    except ImportError:
        logger.warning("Required modules not available, skipping demo quadrotor creation")
    except Exception as e:
        logger.error(f"Error creating demo quadrotor: {e}")


def run_api_server(port=8000, dev_mode=False):
    """
    Run the FastAPI server for visualization API endpoints.
    
    Args:
        port: Port number for the API server
        dev_mode: Whether to run in development mode with auto-reload
    """
    try:
        import uvicorn
        from alan_backend.elfin.visualization.api import app
        
        logger.info(f"Starting API server on port {port}")
        
        # Configure uvicorn server
        if dev_mode:
            # Run uvicorn directly from the command line for auto-reload
            cmd = [
                sys.executable, "-m", "uvicorn", 
                "alan_backend.elfin.visualization.api:app", 
                "--reload", "--host", "0.0.0.0", 
                "--port", str(port)
            ]
            
            proc = subprocess.Popen(cmd)
            processes.append(proc)
        else:
            # Run server in the current process
            uvicorn.run(app, host="0.0.0.0", port=port)
        
    except ImportError as e:
        logger.error(f"Failed to import required modules: {e}")
        logger.error("Please install the required packages: pip install fastapi uvicorn")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error starting API server: {e}")
        sys.exit(1)


def run_dashboard(port=3000, api_url=None, dev_mode=False):
    """
    Run the React dashboard for visualization.
    
    Args:
        port: Port number for the dashboard
        api_url: URL of the API server to connect to
        dev_mode: Whether to run in development mode
    """
    try:
        dashboard_dir = Path("dashboard")
        
        if not dashboard_dir.exists():
            logger.error(f"Dashboard directory not found: {dashboard_dir}")
            sys.exit(1)
        
        # Set environment variables
        env = os.environ.copy()
        if api_url:
            env["VITE_API_URL"] = api_url
        env["PORT"] = str(port)
        
        # Command to run
        if dev_mode:
            cmd = ["npm", "run", "dev", "--", "--port", str(port)]
        else:
            # Build and serve in production mode
            build_cmd = ["npm", "run", "build"]
            serve_cmd = ["npx", "vite", "preview", "--port", str(port)]
            
            # Build first
            logger.info("Building dashboard for production...")
            result = subprocess.run(build_cmd, cwd=dashboard_dir, env=env)
            
            if result.returncode != 0:
                logger.error("Failed to build dashboard")
                sys.exit(1)
            
            # Then serve
            cmd = serve_cmd
        
        logger.info(f"Starting dashboard on port {port}")
        proc = subprocess.Popen(cmd, cwd=dashboard_dir, env=env)
        processes.append(proc)
        
    except Exception as e:
        logger.error(f"Error starting dashboard: {e}")
        sys.exit(1)


def signal_handler(sig, frame):
    """Handle process termination signals."""
    logger.info("Shutting down...")
    
    for proc in processes:
        try:
            proc.terminate()
        except Exception:
            pass
    
    sys.exit(0)


def main():
    """Main function to run the dashboard and API server."""
    args = parse_args()
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    api_url = f"http://localhost:{args.api_port}"
    
    try:
        # Create demo systems if not disabled
        if not args.no_demo and not args.dashboard_only:
            # Create appropriate demo system based on user selection
            if args.demo_system == "quadrotor":
                create_demo_quadrotor()
            else:
                # Create regular phase engine demo system
                logger.info(f"Creating default demo system with {args.demo_concepts} concepts...")
                from alan_backend.elfin.visualization.api import create_demo_system
                create_demo_system("demo_system", 
                                   num_concepts=args.demo_concepts, 
                                   num_edges=args.demo_edges)
        
        # Pregenerate isosurfaces if requested
        if args.pregenerate_isosurfaces and not args.dashboard_only:
            pregenerate_isosurfaces(args.demo_system)
        
        # Start services based on flags
        if not args.dashboard_only:
            if args.dev:
                # Run API server in a separate process in dev mode
                run_api_server(port=args.api_port, dev_mode=True)
            else:
                # Create dedicated process for API server
                api_proc = subprocess.Popen([
                    sys.executable, "-c",
                    f"from alan_backend.elfin.visualization.api import app; "
                    f"import uvicorn; "
                    f"uvicorn.run(app, host='0.0.0.0', port={args.api_port})"
                ])
                processes.append(api_proc)
        
        if not args.api_only:
            # Start dashboard
            run_dashboard(port=args.dash_port, api_url=api_url, dev_mode=args.dev)
        
        # Wait for processes to complete
        while processes:
            for proc in processes[:]:
                if proc.poll() is not None:
                    logger.info(f"Process exited with code {proc.returncode}")
                    processes.remove(proc)
            
            time.sleep(1)
        
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    finally:
        # Clean up
        for proc in processes:
            try:
                proc.terminate()
            except Exception:
                pass
    
    logger.info("Shutdown complete")


if __name__ == "__main__":
    main()
