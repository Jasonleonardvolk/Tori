"""
ELFIN Debug System Fully Standalone Demo

This script is completely self-contained and doesn't rely on any imports from the alan_backend package.
It demonstrates the core functionality of the ELFIN Debug System with a simple pendulum example.
"""

import time
import math
import random
import threading
import asyncio
import websockets
import json
import logging
import argparse
import numpy as np
import signal
from threading import Thread
import concurrent.futures

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("elfin_standalone_demo")

# =============================================================================
# Lyapunov Monitor
# =============================================================================

class LyapunovMonitor:
    """
    Monitor for Lyapunov stability in controller systems.
    
    This class tracks Lyapunov function values and derivatives in real-time,
    providing stability feedback and generating events when stability conditions
    are violated.
    """
    
    def __init__(self, port=8642):
        """
        Initialize a Lyapunov monitor.
        
        Args:
            port: WebSocket server port for UI connections
        """
        self.port = port
        self.running = False
        self.clients = set()
        self.server = None
        self.server_task = None
        self.seq_counter = 0
        self.start_time = time.time()
        
        # Barrier functions being monitored
        self.barrier_functions = {}
        
        # Breakpoints - conditions that pause execution
        self.breakpoints = []
        
        # State variables
        self.state_vars = {}
        
        # Events that have occurred
        self.events = []
        
        # Lyapunov function and its derivative
        self.V = 0.0
        self.Vdot = 0.0
        
        # System metadata
        self.metadata = {
            "mode": "default",
            "status": "initializing",
            "units": {}
        }
        
        # Last send time to limit update frequency
        self.last_send_time = 0
        self.min_update_interval = 0.01  # 100Hz maximum update rate
        self.dt_nominal = self.min_update_interval  # Default value, can be updated
        
        # Handshake packet sent at connection
        self.handshake_packet = {
            "type": "handshake",
            "seq": self.seq_counter,  # Add sequence number to handshake
            "schema": {
                "vars": {},
                "barriers": []
            },
            "dt_nominal": self.dt_nominal,
            "real_t": time.time()
        }
        self.seq_counter += 1  # Increment after creating handshake
        
        # Create safe evaluation environment with limited builtins
        self.safe_builtins = {
            'abs': abs,
            'max': max,
            'min': min,
            'sum': sum,
            'len': len,
            'round': round,
            'int': int,
            'float': float,
            'bool': bool,
        }
        
        # Setup signal handlers for graceful shutdown
        self._setup_signal_handlers()
    
    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown."""
        # Use a flag for handling signals to avoid asyncio shutdown complications
        self._shutdown_requested = False
        
        def handle_signal(signum, frame):
            if signum in (signal.SIGINT, signal.SIGTERM):
                logger.info(f"Received signal {signum}, initiating graceful shutdown...")
                self._shutdown_requested = True
                self.stop()
        
        # Register for both SIGINT (Ctrl+C) and SIGTERM
        signal.signal(signal.SIGINT, handle_signal)
        signal.signal(signal.SIGTERM, handle_signal)
    
    def set_dt_nominal(self, dt):
        """
        Set the nominal time step for simulation.
        
        Args:
            dt: Nominal time step (seconds)
        """
        self.dt_nominal = dt
        self.handshake_packet["dt_nominal"] = dt
        logger.info(f"Set nominal time step to {dt} seconds")
    
    async def start_server(self):
        """Start the WebSocket server."""
        if self.server is not None:
            logger.warning("Server already running")
            return
        
        self.running = True
        self.server = await websockets.serve(
            self.client_handler, 
            "localhost", 
            self.port
        )
        logger.info(f"Lyapunov monitor server started on port {self.port}")
    
    def start(self):
        """Start the monitor in a background thread."""
        def run_server_thread():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            self.server_task = loop.create_task(self.start_server())
            loop.run_forever()
        
        # Start in a separate thread
        server_thread = threading.Thread(target=run_server_thread, daemon=True)
        server_thread.start()
        logger.info("Lyapunov monitor started in background thread")
        
        # Update handshake with registered barriers and current time
        self.handshake_packet["schema"]["barriers"] = list(self.barrier_functions.keys())
        self.handshake_packet["real_t"] = time.time()
    
    async def send_disconnect_notification(self):
        """Send disconnect notification to all clients before closing."""
        if not self.clients:
            return
            
        disconnect_packet = {
            "type": "disconnect",
            "seq": self.seq_counter,
            "t": time.time() - self.start_time,
            "real_t": time.time(),
            "message": "Server shutting down"
        }
        self.seq_counter += 1
        
        try:
            # Convert to JSON
            message = json.dumps(disconnect_packet)
            
            # Send to all clients
            close_coroutines = []
            for websocket in self.clients:
                try:
                    await websocket.send(message)
                    # Give clients a moment to process the disconnect message
                    close_coroutines.append(websocket.close(1000, "Server shutdown"))
                except websockets.exceptions.ConnectionClosed:
                    pass
                    
            # Wait for all connections to close
            if close_coroutines:
                await asyncio.gather(*close_coroutines, return_exceptions=True)
                
            logger.info("Sent disconnect notification to all clients")
        except Exception as e:
            logger.error(f"Error sending disconnect notification: {e}")
    
    async def stop_server(self):
        """Stop the WebSocket server."""
        if self.server is None:
            return
        
        self.running = False
        
        # Send disconnect notification
        await self.send_disconnect_notification()
        
        # Close the server
        self.server.close()
        await self.server.wait_closed()
        self.server = None
        
        # Clear client list
        self.clients.clear()
        logger.info("Lyapunov monitor server stopped")
    
    def stop(self):
        """Stop the monitor."""
        try:
            # Create a new event loop if needed
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
            if loop.is_running():
                asyncio.create_task(self.stop_server())
            else:
                # For stopping from outside the event loop
                future = asyncio.run_coroutine_threadsafe(self.stop_server(), loop)
                try:
                    future.result(timeout=5)  # Wait up to 5 seconds for clean shutdown
                except (concurrent.futures.TimeoutError, asyncio.CancelledError):
                    logger.warning("Server shutdown timed out")
                    
            logger.info("Lyapunov monitor stopped")
        except Exception as e:
            logger.error(f"Error stopping monitor: {e}")
    
    async def client_handler(self, websocket, path):
        """
        Handle WebSocket client connections.
        
        Args:
            websocket: WebSocket connection
            path: Connection path
        """
        try:
            # Add to clients set
            self.clients.add(websocket)
            client_id = id(websocket)
            logger.info(f"Client connected: {websocket.remote_address} (id: {client_id})")
            
            # Update handshake with latest information
            self.handshake_packet["real_t"] = time.time()
            self.handshake_packet["seq"] = self.seq_counter
            self.seq_counter += 1
            
            # Send handshake packet
            await websocket.send(json.dumps(self.handshake_packet))
            
            # Keep connection open and handle incoming messages
            async for message in websocket:
                try:
                    data = json.loads(message)
                    # Handle client message (future: command processing)
                    await self.handle_client_message(websocket, data)
                except json.JSONDecodeError:
                    logger.error("Invalid JSON message from client")
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client disconnected: {websocket.remote_address} (id: {client_id})")
        finally:
            # Remove from clients set
            if websocket in self.clients:
                self.clients.remove(websocket)
    
    async def handle_client_message(self, websocket, data):
        """
        Handle messages from clients.
        
        Args:
            websocket: Client WebSocket
            data: Message data
        """
        # Future: implement command handling
        pass
    
    async def broadcast(self, message):
        """
        Broadcast a message to all connected clients.
        
        Args:
            message: Message to broadcast
        """
        if not self.clients:
            return
        
        # Convert message to JSON
        if isinstance(message, dict):
            message = json.dumps(message)
        
        # Send to all clients
        websockets_to_remove = set()
        
        for websocket in self.clients:
            try:
                await websocket.send(message)
            except websockets.exceptions.ConnectionClosed:
                websockets_to_remove.add(websocket)
        
        # Remove closed connections
        for websocket in websockets_to_remove:
            if websocket in self.clients:
                self.clients.remove(websocket)
    
    def register_barrier_function(self, name, func, threshold, description=""):
        """
        Register a barrier function to monitor.
        
        Args:
            name: Barrier function name
            func: Barrier function (callable)
            threshold: Safety threshold (barrier is safe when func >= threshold)
            description: Human-readable description
        """
        self.barrier_functions[name] = {
            "func": func,
            "threshold": threshold,
            "description": description,
            "value": None
        }
        
        # Update handshake packet
        self.handshake_packet["schema"]["barriers"] = list(self.barrier_functions.keys())
        
        logger.info(f"Registered barrier function: {name}")
    
    def register_state_var(self, name, unit=None):
        """
        Register a state variable with optional unit information.
        
        Args:
            name: Variable name
            unit: Optional unit specification (e.g., 'm', 'rad/s')
        """
        self.state_vars[name] = None
        
        # Update handshake packet with unit information
        if unit:
            if "vars" not in self.handshake_packet["schema"]:
                self.handshake_packet["schema"]["vars"] = {}
            self.handshake_packet["schema"]["vars"][name] = unit
            
            # Also store in metadata
            self.metadata["units"][name] = unit
        
        logger.info(f"Registered state variable: {name} ({unit or 'no unit'})")
    
    def set_lyapunov_function(self, V_func, Vdot_func):
        """
        Set the Lyapunov function and its derivative for stability monitoring.
        
        Args:
            V_func: Lyapunov function V(x)
            Vdot_func: Lyapunov derivative function dV/dt(x)
        """
        self.V_func = V_func
        self.Vdot_func = Vdot_func
        logger.info("Lyapunov functions set")
    
    def add_breakpoint(self, condition, expression):
        """
        Add a breakpoint that pauses execution when a condition is met.
        
        Args:
            condition: Condition string (e.g., "V > 0.2")
            expression: Python expression to evaluate
        """
        self.breakpoints.append({
            "condition": condition,
            "expression": expression,
            "enabled": True
        })
        logger.info(f"Added breakpoint: {condition}")
    
    def update(self, **kwargs):
        """
        Update state variables and check stability conditions.
        
        Args:
            **kwargs: State variable values to update
        """
        # Check if shutdown was requested
        if self._shutdown_requested:
            return
            
        # Update state variables
        for name, value in kwargs.items():
            self.state_vars[name] = value
        
        # Update Lyapunov function and derivative
        try:
            if hasattr(self, 'V_func'):
                self.V = self.V_func(**self.state_vars)
            if hasattr(self, 'Vdot_func'):
                self.Vdot = self.Vdot_func(**self.state_vars)
        except Exception as e:
            logger.error(f"Error computing Lyapunov functions: {e}")
        
        # Update barrier functions
        for name, barrier in self.barrier_functions.items():
            try:
                barrier["value"] = barrier["func"](**self.state_vars)
            except Exception as e:
                logger.error(f"Error computing barrier function {name}: {e}")
        
        # Check breakpoints
        event = None
        for bp in self.breakpoints:
            if not bp["enabled"]:
                continue
                
            try:
                # Create evaluation context with state variables
                eval_context = {**self.state_vars}
                eval_context['V'] = self.V
                eval_context['Vdot'] = self.Vdot
                
                # Add barrier functions
                for b_name, barrier in self.barrier_functions.items():
                    eval_context[b_name] = barrier["value"]
                
                # Evaluate the breakpoint condition with safe builtins
                if eval(bp["expression"], {"__builtins__": self.safe_builtins}, eval_context):
                    event = f"break:{bp['condition']}"
                    self.events.append({
                        "type": "breakpoint",
                        "condition": bp["condition"],
                        "time": time.time()
                    })
                    break
            except Exception as e:
                logger.error(f"Error evaluating breakpoint {bp['condition']}: {e}")
        
        # Check barrier violations
        if event is None:
            for name, barrier in self.barrier_functions.items():
                if barrier["value"] is not None and barrier["value"] < barrier["threshold"]:
                    event = f"warn:barrier:{name}"
                    self.events.append({
                        "type": "barrier_violation",
                        "barrier": name,
                        "value": barrier["value"],
                        "threshold": barrier["threshold"],
                        "time": time.time()
                    })
                    break
        
        # Check Lyapunov instability
        if event is None and self.Vdot > 0:
            event = f"warn:unstable"
            self.events.append({
                "type": "instability",
                "V": self.V,
                "Vdot": self.Vdot,
                "time": time.time()
            })
        
        # Send update to connected clients
        self.send_update(event)
    
    def send_update(self, event=None):
        """
        Send a state update to connected clients if enough time has passed.
        
        Args:
            event: Optional event string
        """
        # Check if enough time has passed since last update
        now = time.time()
        if now - self.last_send_time < self.min_update_interval and event is None:
            return
        
        self.last_send_time = now
        
        # Prepare state packet
        packet = {
            "type": "state",
            "seq": self.seq_counter,
            "t": now - self.start_time,  # Simulation time
            "real_t": now,               # Wall clock time
            "vars": {**self.state_vars},
            "V": self.V,
            "Vdot": self.Vdot,
            "barriers": {
                name: barrier["value"] 
                for name, barrier in self.barrier_functions.items()
                if barrier["value"] is not None
            },
            "event": event,
            "meta": self.metadata
        }
        
        # Increment sequence counter
        self.seq_counter += 1
        
        # Send asynchronously
        try:
            # Get the event loop or create a new one if needed
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                # No event loop in this thread, create a new one
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
            # Create task to broadcast the message
            loop.create_task(self.broadcast(packet))
        except Exception as e:
            logger.error(f"Error sending update: {e}")

# Create a singleton instance
lyapunov_monitor = LyapunovMonitor()

# =============================================================================
# Pendulum Example
# =============================================================================

class Pendulum:
    """A simple pendulum system for demonstration."""
    
    def __init__(self, mass=1.0, length=1.0, damping=0.1, g=9.81, dt=0.01):
        """
        Initialize the pendulum.
        
        Args:
            mass: Pendulum mass (kg)
            length: Pendulum length (m)
            damping: Damping coefficient
            g: Gravitational acceleration (m/s^2)
            dt: Time step (s)
        """
        self.mass = mass
        self.length = length
        self.damping = damping
        self.g = g
        
        # Update nominal time step
        lyapunov_monitor.set_dt_nominal(dt)
        
        # State: [theta, omega]
        self.state = np.array([0.0, 0.0])
        
        # Control input
        self.torque = 0.0
        
        # Register with Lyapunov monitor
        self._register_with_monitor()
    
    def _register_with_monitor(self):
        """Register with the Lyapunov monitor."""
        # Register state variables with units
        lyapunov_monitor.register_state_var("theta", "rad")
        lyapunov_monitor.register_state_var("omega", "rad/s")
        lyapunov_monitor.register_state_var("energy", "J")
        
        # Set Lyapunov function (energy-based)
        lyapunov_monitor.set_lyapunov_function(
            V_func=self.energy,
            Vdot_func=self.energy_derivative
        )
        
        # Register barrier function for angle limits
        lyapunov_monitor.register_barrier_function(
            name="angle_limit",
            func=self.angle_barrier,
            threshold=0.0,
            description="Pendulum angle limit"
        )
        
        # Add breakpoints
        lyapunov_monitor.add_breakpoint(
            condition="V > 10.0",
            expression="V > 10.0"
        )
        lyapunov_monitor.add_breakpoint(
            condition="omega > 5.0",
            expression="abs(omega) > 5.0"
        )
    
    def energy(self, **kwargs):
        """
        Calculate the total energy of the pendulum (Lyapunov function).
        
        Args:
            **kwargs: State variables (ignored, using internal state)
            
        Returns:
            The energy (J)
        """
        theta, omega = self.state
        
        # Kinetic energy
        T = 0.5 * self.mass * self.length**2 * omega**2
        
        # Potential energy (zero at the bottom position)
        U = self.mass * self.g * self.length * (1 - math.cos(theta))
        
        return T + U
    
    def energy_derivative(self, **kwargs):
        """
        Calculate the time derivative of energy (Lyapunov derivative).
        
        Args:
            **kwargs: State variables (ignored, using internal state)
            
        Returns:
            The energy derivative (J/s)
        """
        _, omega = self.state
        
        # For a damped pendulum: dE/dt = -b*omega^2 + tau*omega
        return -self.damping * omega**2 + self.torque * omega
    
    def angle_barrier(self, **kwargs):
        """
        Barrier function for angle limits.
        
        Args:
            **kwargs: State variables (ignored, using internal state)
            
        Returns:
            Barrier value (positive when safe)
        """
        theta, _ = self.state
        theta_max = math.pi  # Maximum allowed angle
        
        # Barrier: B(x) = theta_max^2 - theta^2
        return theta_max**2 - theta**2
    
    def update(self, dt):
        """
        Update the pendulum state.
        
        Args:
            dt: Time step (s)
        """
        theta, omega = self.state
        
        # Pendulum dynamics
        # d(theta)/dt = omega
        # d(omega)/dt = -(g/L)*sin(theta) - (b/mL^2)*omega + tau/(mL^2)
        
        # Euler integration
        theta_dot = omega
        omega_dot = (
            -(self.g / self.length) * math.sin(theta) 
            - (self.damping / (self.mass * self.length**2)) * omega
            + self.torque / (self.mass * self.length**2)
        )
        
        theta += theta_dot * dt
        omega += omega_dot * dt
        
        # Update state
        self.state = np.array([theta, omega])
        
        # Update Lyapunov monitor with current state
        lyapunov_monitor.update(
            theta=theta,
            omega=omega,
            energy=self.energy()
        )
    
    def set_torque(self, torque):
        """Set the control torque."""
        self.torque = torque
    
    def reset(self, theta0=None, omega0=None):
        """Reset the pendulum state."""
        if theta0 is None:
            theta0 = random.uniform(-math.pi/2, math.pi/2)
        if omega0 is None:
            omega0 = random.uniform(-1.0, 1.0)
        
        self.state = np.array([theta0, omega0])
        self.torque = 0.0


def demo_controlled_pendulum():
    """Run a demo of a controlled pendulum with debug monitoring."""
    # Time step for simulation
    dt = 0.01
    
    # Create pendulum with the time step
    pendulum = Pendulum(mass=1.0, length=1.0, damping=0.2, dt=dt)
    
    # Start Lyapunov monitor server
    try:
        lyapunov_monitor.start()
    except Exception as e:
        print(f"Error starting monitor: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Initial state
    pendulum.reset(theta0=math.pi/4, omega0=0.0)
    
    # Run simulation
    t = 0.0
    t_end = 60.0
    
    print(f"Running pendulum simulation for {t_end} seconds...")
    print("Connect to ws://localhost:8642/state to monitor")
    print("Press Ctrl+C to stop the simulation")
    
    # Destabilizing control after 20 seconds
    def destabilize_controller():
        time.sleep(20.0)
        print("Applying destabilizing control...")
        pendulum.set_torque(2.0)
        
        # Reset to stabilizing control after 10 more seconds
        time.sleep(10.0)
        print("Applying stabilizing control...")
        pendulum.set_torque(-1.0)
    
    # Start controller in a separate thread
    controller_thread = Thread(target=destabilize_controller)
    controller_thread.daemon = True
    controller_thread.start()
    
    try:
        while t < t_end and not lyapunov_monitor._shutdown_requested:
            # Update pendulum
            pendulum.update(dt)
            
            # Sleep to simulate real-time
            time.sleep(dt)
            
            # Update time
            t += dt
            
            # Print status occasionally
            if int(t * 100) % 100 == 0:
                theta, omega = pendulum.state
                energy = pendulum.energy()
                print(f"t={t:.1f} s, θ={theta:.2f} rad, ω={omega:.2f} rad/s, E={energy:.2f} J")
    
    except KeyboardInterrupt:
        print("Simulation interrupted by user.")
    
    finally:
        # Stop Lyapunov monitor
        try:
            lyapunov_monitor.stop()
        except Exception as e:
            print(f"Error stopping monitor: {e}")
        print("Simulation finished.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ELFIN Debug Standalone Demo")
    parser.add_argument("--port", type=int, default=8642, help="WebSocket server port")
    
    args = parser.parse_args()
    
    try:
        demo_controlled_pendulum()
    except Exception as e:
        print(f"Error running demo: {e}")
        import traceback
        traceback.print_exc()
