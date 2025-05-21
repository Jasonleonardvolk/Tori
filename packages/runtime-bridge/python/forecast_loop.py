"""
Forecast loop for spectral coherence prediction.

This module implements a background loop that periodically runs forecasts
on spectral data and broadcasts results via WebSocket for real-time client updates.
"""

import os
import sys
import json
import time
import logging
import threading
import asyncio
import websockets
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Callable
from backend import metrics

# Import our modules
import networkx as nx
from .trend_forecast import default_forecaster, get_forecaster, SpectralForecast
from .cluster_stability import analyze_clusters, build_concept_graph

# Configure logger
logger = logging.getLogger("forecast_loop")

# Default configuration
DEFAULT_FORECAST_INTERVAL = 30  # seconds between forecasts
DEFAULT_WS_URI = "ws://localhost:8000/ws/spectral_forecast"
DEFAULT_FULL_FORECAST_INTERVAL = 300  # seconds between full forecast runs (with model refresh)

class ForecastLoop:
    """Background loop for running forecasts and broadcasting results."""
    
    def __init__(self, 
                 forecaster: Optional[SpectralForecast] = None,
                 ws_uri: Optional[str] = None,
                 forecast_interval: Optional[int] = None,
                 full_forecast_interval: Optional[int] = None):
        """
        Initialize the forecast loop.
        
        Args:
            forecaster: SpectralForecast instance or None to use default
            ws_uri: WebSocket URI for broadcasting or None to use default/env
            forecast_interval: Seconds between forecast runs or None for default
            full_forecast_interval: Seconds between full forecast runs or None for default
        """
        # Use provided values or load from environment/defaults
        self.forecaster = forecaster or default_forecaster
        self.ws_uri = ws_uri or os.environ.get('SPECTRAL_FORECAST_WS_URI', DEFAULT_WS_URI)
        self.forecast_interval = int(os.environ.get(
            'SPECTRAL_FORECAST_INTERVAL', 
            forecast_interval or DEFAULT_FORECAST_INTERVAL
        ))
        self.full_forecast_interval = int(os.environ.get(
            'SPECTRAL_FULL_FORECAST_INTERVAL',
            full_forecast_interval or DEFAULT_FULL_FORECAST_INTERVAL
        ))
        
        # State tracking
        self.running = False
        self.last_forecast_time = None
        self.last_full_forecast_time = None
        self.last_forecast_result = None
        self.last_cluster_alerts = []
        self.clients = set()
        self.lock = threading.Lock()
        
        # Event loop for WebSockets
        self.loop = None
        self.server = None
        
        logger.info(f"Initialized ForecastLoop with interval={self.forecast_interval}s, "
                   f"full_interval={self.full_forecast_interval}s")
    
    async def handle_client(self, websocket, path):
        """Handle a client WebSocket connection."""
        # Register client
        self.clients.add(websocket)
        logger.info(f"Client connected - {len(self.clients)} clients now connected")
        
        try:
            # Send latest forecast if available
            if self.last_forecast_result:
                await websocket.send(json.dumps({
                    'type': 'coherence_forecast',
                    'data': self.last_forecast_result
                }))
            
            # Keep connection open and handle messages
            async for message in websocket:
                try:
                    # Parse client message
                    data = json.loads(message)
                    
                    # Handle request for immediate forecast refresh
                    if data.get('action') == 'refresh_forecast':
                        logger.info("Client requested forecast refresh")
                        # Run forecast in a separate thread to avoid blocking
                        threading.Thread(
                            target=self.run_and_broadcast_forecast,
                            args=(True,),  # Force refresh
                            daemon=True
                        ).start()
                        
                        # Acknowledge request
                        await websocket.send(json.dumps({
                            'type': 'forecast_refresh_ack',
                            'data': {'timestamp': datetime.now().isoformat()}
                        }))
                except json.JSONDecodeError:
                    logger.warning(f"Received invalid JSON: {message}")
                except Exception as e:
                    logger.error(f"Error handling client message: {e}")
        
        except (websockets.exceptions.ConnectionClosed, 
                websockets.exceptions.ConnectionClosedError) as e:
            logger.info(f"Client disconnected: {e}")
        except Exception as e:
            logger.error(f"Error in client handler: {e}")
        finally:
            # Remove client on disconnect
            self.clients.remove(websocket)
            logger.info(f"Client disconnected - {len(self.clients)} clients remaining")
    
    def run_and_broadcast_forecast(self, force_refresh=False):
        """
        Run forecast and broadcast results to all clients.
        
        Args:
            force_refresh: Whether to force a full refresh even if not scheduled
        """
        try:
            # Determine if we should do a full forecast
            now = datetime.now()
            do_full_forecast = (
                force_refresh or 
                self.last_full_forecast_time is None or
                (now - self.last_full_forecast_time).total_seconds() >= self.full_forecast_interval
            )
            
            # Run forecast
            if do_full_forecast:
                logger.info("Running full forecast with reload")
                # Use force_reload=True to get fresh data
                forecast_result = self.forecaster.forecast()
                self.last_full_forecast_time = now
            else:
                logger.info("Running incremental forecast")
                forecast_result = self.forecaster.forecast()
                
            # Calculate and expose confidence band metric for Prometheus
            try:
                coherence_metric = forecast_result.get('metrics', {}).get('coherence', {})
                forecast_points = coherence_metric.get('forecast', [])
                if forecast_points and len(forecast_points) > 0 and 'lower' in forecast_points[0] and 'upper' in forecast_points[0]:
                    # Calculate confidence band width at midpoint of forecast horizon
                    mid_point = min(5, len(forecast_points) - 1)  # Use 5th point or last available
                    ci_low = forecast_points[mid_point]['lower']
                    ci_high = forecast_points[mid_point]['upper']
                    confidence_band = ci_high - ci_low
                    metrics.forecast_confidence_interval.set(confidence_band)
                    logger.debug(f"Updated forecast confidence interval: {confidence_band:.4f}")
            except Exception as e:
                logger.error(f"Error calculating confidence band: {e}")
            
            # Update last forecast time
            self.last_forecast_time = now
            
            # Save result for new clients
            with self.lock:
                self.last_forecast_result = forecast_result
            
            # Broadcast to all clients
            self.broadcast_forecast(forecast_result)
            
            # Log forecast status
            status = forecast_result.get('assessment', {}).get('status', 'unknown')
            message = forecast_result.get('assessment', {}).get('message', 'No assessment')
            logger.info(f"Forecast complete: {status} - {message}")
            
            # Handle critical forecasts with special actions if configured
            if status == 'critical':
                self.handle_critical_forecast(forecast_result)
            
            # Perform cluster stability analysis if enabled
            if os.environ.get('CLUSTER_STABILITY_ENABLED', 'true').lower() == 'true':
                try:
                    self.run_and_broadcast_cluster_analysis(forecast_result)
                except Exception as e:
                    logger.error(f"Error running cluster analysis: {e}")
            
        except Exception as e:
            logger.error(f"Error running forecast: {e}")
    
    def run_and_broadcast_cluster_analysis(self, forecast_result):
        """
        Run cluster stability analysis and broadcast results.
        
        Args:
            forecast_result: The forecast result to use for analysis
        """
        try:
            # Get coherence values from forecast
            coherence_metric = forecast_result.get('metrics', {}).get('coherence', {})
            
            # Extract coherence for each concept - this would come from somewhere else in real implementation
            # In a real implementation, this would be populated from the concept store
            # For now, we'll use synthetic data
            chi = {f"concept_{i}": 0.7 + 0.2 * (i % 3) / 3 for i in range(20)}
            
            # Build concept graph - in real implementation, this would use actual concept relationships
            # For testing, create a synthetic graph with community structure
            G = nx.random_partition_graph([5, 7, 8], 0.7, 0.1)
            
            # Relabel nodes to concept IDs
            mapping = {i: f"concept_{i}" for i in G.nodes()}
            G = nx.relabel_nodes(G, mapping)
            
            # Create a forecast function that uses the Level-1 forecast from our PCA system
            # This is a simplification - would be integrated with actual forecast in real implementation
            def forecast_fn(value):
                # Simple trend based on PCA forecast trend
                trend = coherence_metric.get('trend', 0)
                return value * (1 + trend)
            
            # Run cluster analysis
            chi_threshold = float(os.environ.get('CLUSTER_CHI_THRESH', '0.45'))
            stab_threshold = float(os.environ.get('CLUSTER_STAB_THRESH', '0.15'))
            
            alerts = analyze_clusters(
                G,
                chi,
                horizon_steps=12,  # Look ahead 1 hour (12 steps × 5 min)
                forecast_fn=forecast_fn,
                chi_thresh=chi_threshold,
                stab_thresh=stab_threshold
            )
            
            # Cache alerts
            self.last_cluster_alerts = alerts
            
            # If we have alerts, broadcast them
            if alerts:
                logger.warning(f"Generated {len(alerts)} cluster stability alerts")
                
                # Prepare alert data for broadcast
                alert_data = [alert.to_dict() for alert in alerts]
                
                # Broadcast to clients
                self.broadcast_cluster_alerts(alert_data)
                
        except Exception as e:
            logger.error(f"Error in cluster stability analysis: {e}")
            raise
    
    def broadcast_cluster_alerts(self, alerts):
        """
        Broadcast cluster stability alerts to connected clients.
        
        Args:
            alerts: List of cluster alerts to broadcast
        """
        if not self.clients:
            logger.debug("No clients connected, skipping broadcast")
            return
        
        # Prepare message
        message = json.dumps({
            'type': 'cluster_alert',
            'data': alerts
        })
        
        # Get event loop
        loop = self.loop or asyncio.get_event_loop()
        
        # Send to all clients
        websockets_connected = len(self.clients)
        
        if websockets_connected > 0:
            logger.info(f"Broadcasting cluster alerts to {websockets_connected} clients")
            
            # Create tasks for each client
            for client in list(self.clients):
                asyncio.run_coroutine_threadsafe(
                    self.safe_send(client, message),
                    loop
                )
    
    def broadcast_forecast(self, forecast_result):
        """
        Broadcast forecast result to all connected clients.
        
        Args:
            forecast_result: The forecast result to broadcast
        """
        if not self.clients:
            logger.debug("No clients connected, skipping broadcast")
            return
        
        # Prepare message
        message = json.dumps({
            'type': 'coherence_forecast',
            'data': forecast_result
        })
        
        # Get event loop
        loop = self.loop or asyncio.get_event_loop()
        
        # Send to all clients
        websockets_connected = len(self.clients)
        
        if websockets_connected > 0:
            logger.info(f"Broadcasting forecast to {websockets_connected} clients")
            
            # Create tasks for each client
            for client in list(self.clients):
                asyncio.run_coroutine_threadsafe(
                    self.safe_send(client, message),
                    loop
                )
    
    async def safe_send(self, websocket, message):
        """Send message safely to a client, handling exceptions."""
        try:
            await websocket.send(message)
        except (websockets.exceptions.ConnectionClosed, 
                websockets.exceptions.ConnectionClosedError):
            # Client disconnect will be handled by handle_client
            pass
        except Exception as e:
            logger.error(f"Error sending to client: {e}")
    
    def handle_critical_forecast(self, forecast_result):
        """
        Handle critical forecast with special actions.
        
        This could trigger alerts, emails, or other actions.
        
        Args:
            forecast_result: The critical forecast result
        """
        # Example: log critical event
        logger.warning("CRITICAL FORECAST DETECTED - Special handling required")
        
        # Example: here you could add code to:
        # - Send email alerts
        # - Push notifications to an alerting system
        # - Trigger automatic actions like freezing ingestion
        
        # For now, we just log the details
        logger.warning(f"Assessment: {forecast_result.get('assessment', {})}")
        
        # Check if we should enable memory gating
        if os.environ.get('SPECTRAL_ENABLE_AUTO_GATING', 'false').lower() == 'true':
            logger.warning("Auto-gating enabled - would trigger memory gating here")
            # In a real implementation, you would call into memory_gating.py
            # Example: memory_gating.enable_safety_mode()
    
    async def forecast_loop_task(self):
        """Background task that periodically runs forecasts."""
        while self.running:
            try:
                # Check if it's time to run a forecast
                now = datetime.now()
                
                if (self.last_forecast_time is None or
                    (now - self.last_forecast_time).total_seconds() >= self.forecast_interval):
                    # Run forecast in thread to avoid blocking event loop
                    threading.Thread(
                        target=self.run_and_broadcast_forecast,
                        daemon=True
                    ).start()
                
                # Wait a second before checking again
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error in forecast loop: {e}")
                await asyncio.sleep(5)  # Wait a bit longer after error
    
    async def start_server(self):
        """Start the WebSocket server."""
        self.server = await websockets.serve(
            self.handle_client,
            '0.0.0.0',  # Listen on all interfaces
            int(self.ws_uri.split(':')[-1].split('/')[0])  # Extract port from URI
        )
        logger.info(f"WebSocket server started on {self.ws_uri}")
    
    def start(self):
        """Start the forecast loop and WebSocket server."""
        if self.running:
            logger.warning("Forecast loop already running")
            return
        
        # Mark as running
        self.running = True
        
        # Create and start event loop in a new thread
        def run_loop():
            # Create new event loop for this thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            self.loop = loop
            
            # Start WebSocket server
            loop.run_until_complete(self.start_server())
            
            # Start forecast loop task
            loop.create_task(self.forecast_loop_task())
            
            # Run event loop
            loop.run_forever()
        
        # Start thread
        self.thread = threading.Thread(target=run_loop, daemon=True)
        self.thread.start()
        
        logger.info("Forecast loop started")
    
    def stop(self):
        """Stop the forecast loop and WebSocket server."""
        if not self.running:
            logger.warning("Forecast loop not running")
            return
        
        # Mark as stopped
        self.running = False
        
        # Stop server if running
        if self.server:
            asyncio.run_coroutine_threadsafe(
                self.server.close(),
                self.loop
            )
            self.server = None
        
        # Stop event loop
        if self.loop:
            self.loop.call_soon_threadsafe(self.loop.stop)
            self.loop = None
        
        # Wait for thread to stop
        if hasattr(self, 'thread') and self.thread.is_alive():
            self.thread.join(timeout=5)
        
        logger.info("Forecast loop stopped")

# Default instance
default_forecast_loop = None

def start_forecast_loop():
    """Start the default forecast loop."""
    global default_forecast_loop
    
    if default_forecast_loop is None:
        # Create forecast loop
        default_forecast_loop = ForecastLoop()
    
    # Start if not already running
    if not default_forecast_loop.running:
        default_forecast_loop.start()
    
    return default_forecast_loop

def stop_forecast_loop():
    """Stop the default forecast loop."""
    global default_forecast_loop
    
    if default_forecast_loop is not None and default_forecast_loop.running:
        default_forecast_loop.stop()

# Auto-start if enabled
if os.environ.get('SPECTRAL_AUTOSTART_FORECAST', 'true').lower() == 'true':
    try:
        start_forecast_loop()
    except Exception as e:
        logger.error(f"Error auto-starting forecast loop: {e}")

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Start forecast loop
    loop = start_forecast_loop()
    
    # Keep running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping forecast loop...")
        stop_forecast_loop()
        print("Stopped")
