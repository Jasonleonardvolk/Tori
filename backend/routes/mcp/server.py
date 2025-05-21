"""
MCP 2.0 Server for PCC State Broadcasting

This microservice provides WebSocket broadcasting of PCC state information
and exposes REST endpoints for direct interaction with Prometheus metrics.
"""

import os
import json
import time
import asyncio
import logging
from typing import List, Dict, Any, Optional, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Body, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from .schema_v2 import PCCState
from backend.metrics_utils import (
    register_counter, register_gauge, register_histogram, register_summary,
    inc_counter, set_gauge, observe_histogram, get_metrics_text, Timer
)

# Load environment variables
PCC_WIRE_FORMAT = os.getenv("PCC_WIRE_FORMAT", "json")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
MCP_API_KEY = os.getenv("MCP_API_KEY", "")  # Shared secret for API auth

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp-server")

# Create FastAPI app
app = FastAPI(
    title="MCP 2.0 Server",
    description="WebSocket and REST service for PCC state broadcasting",
    version="2.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track active WebSocket connections and their last state
_live_sockets: List[WebSocket] = []
_client_last_state: Dict[WebSocket, Dict[str, Any]] = {}

# Rate limiting
_ip_request_count: Dict[str, int] = {}
_ip_last_reset: Dict[str, float] = {}
RATE_LIMIT = 500  # requests per minute
RATE_WINDOW = 60  # seconds

# Register Prometheus metrics
register_gauge(
    name="mcp_ws_connections_current",
    description="Current number of active WebSocket connections",
)

register_counter(
    name="mcp_ws_connections_total",
    description="Total number of WebSocket connections since server start",
)

register_counter(
    name="mcp_ws_disconnections_total",
    description="Total number of WebSocket disconnections since server start",
)

register_counter(
    name="mcp_pcc_messages_received_total",
    description="Total number of PCC state messages received",
)

register_counter(
    name="mcp_pcc_messages_broadcast_total",
    description="Total number of PCC state messages broadcast to clients",
)

register_counter(
    name="mcp_pcc_messages_dropped_total",
    description="Total number of PCC state messages dropped due to back-pressure",
)

register_histogram(
    name="mcp_pcc_message_size_bytes",
    description="Size of PCC state messages in bytes",
    buckets=[100, 500, 1000, 5000, 10000, 50000],
)

register_histogram(
    name="mcp_pcc_message_processing_seconds",
    description="Time to process and broadcast a PCC state message",
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
)

register_histogram(
    name="mcp_pcc_broadcast_latency_seconds",
    description="Latency of broadcasting to all clients",
    buckets=[0.0005, 0.001, 0.005, 0.01, 0.05, 0.1],
)

register_gauge(
    name="mcp_rate_limit_current",
    description="Current rate limit usage per endpoint",
    labels=["endpoint", "client_ip"],
)

# Application tier and criticality metadata
register_gauge(
    name="mcp_service_info",
    description="MCP service metadata",
    labels=["component", "tier", "version"],
)

# Set service info at startup
set_gauge(
    name="mcp_service_info",
    value=1,
    labels={
        "component": "pcc_state_broadcaster",
        "tier": "0",  # Mission-critical
        "version": "2.0.0",
    },
)


# Middleware for API key verification (simple shared secret)
@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    """API key middleware for POST requests to /pcc_state."""
    if (
        request.url.path == "/pcc_state" 
        and request.method == "POST"
        and MCP_API_KEY  # Only check if API key is configured
    ):
        api_key = request.headers.get("X-API-Key", "")
        if api_key != MCP_API_KEY:
            logger.warning(f"Invalid API key from {request.client.host}")
            return HTTPException(
                status_code=401, 
                detail="Invalid API key"
            )
    
    # Continue processing the request
    response = await call_next(request)
    return response

# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware for POST requests to /pcc_state."""
    if request.url.path == "/pcc_state" and request.method == "POST":
        client_ip = request.client.host
        endpoint = request.url.path
        current_time = time.time()
        
        # Reset count if window has passed
        if client_ip in _ip_last_reset and current_time - _ip_last_reset[client_ip] > RATE_WINDOW:
            _ip_request_count[client_ip] = 0
            _ip_last_reset[client_ip] = current_time
            
        # Initialize if new client
        if client_ip not in _ip_request_count:
            _ip_request_count[client_ip] = 0
            _ip_last_reset[client_ip] = current_time
            
        # Check rate limit
        if _ip_request_count[client_ip] >= RATE_LIMIT:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return HTTPException(status_code=429, detail="Rate limit exceeded")
            
        # Increment count
        _ip_request_count[client_ip] += 1
        
        # Update gauge for this client
        set_gauge(
            name="mcp_rate_limit_current",
            value=_ip_request_count[client_ip] / RATE_LIMIT,  # As percentage of limit
            labels={"endpoint": endpoint, "client_ip": client_ip}
        )
        
    # Continue processing the request
    response = await call_next(request)
    return response

# WebSocket connection handler
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Handle WebSocket connections for real-time updates."""
    # Check Origin header for security
    if ALLOWED_ORIGINS != ["*"]:
        origin = websocket.headers.get("origin", "")
        if origin not in ALLOWED_ORIGINS:
            await websocket.close(code=1008, reason="Not allowed origin")
            return
            
    await websocket.accept()
    _live_sockets.append(websocket)
    _client_last_state[websocket] = {}
    
    # Update metrics
    inc_counter("mcp_ws_connections_total")
    set_gauge("mcp_ws_connections_current", len(_live_sockets))
    
    logger.info(f"WebSocket client connected. {len(_live_sockets)} active connections.")
    
    try:
        while True:
            # Keep the connection alive, wait for any messages
            # (Primarily for client pings/keep-alive)
            await websocket.receive_text()
    except WebSocketDisconnect:
        _live_sockets.remove(websocket)
        if websocket in _client_last_state:
            del _client_last_state[websocket]
        
        # Update metrics
        inc_counter("mcp_ws_disconnections_total")
        set_gauge("mcp_ws_connections_current", len(_live_sockets))
        
        logger.info(f"WebSocket client disconnected. {len(_live_sockets)} remaining.")


async def send_with_backpressure(
    websocket: WebSocket, 
    data: Dict[str, Any],
    client_id: str = "unknown"
) -> bool:
    """
    Send data to a WebSocket client with back-pressure handling.
    
    Args:
        websocket: WebSocket connection
        data: Data to send
        client_id: Client identifier for logging
    
    Returns:
        True if send was successful, False otherwise.
    """
    try:
        with Timer("mcp_pcc_broadcast_latency_seconds"):
            await websocket.send_json(data)
        
        # Successfully sent message
        inc_counter("mcp_pcc_messages_broadcast_total")
        return True
    except (RuntimeError, asyncio.QueueFull) as e:
        logger.warning(f"WebSocket back-pressure detected for client {client_id}: {e}")
        inc_counter("mcp_pcc_messages_dropped_total")
        return False
    except Exception as e:
        logger.error(f"Error sending to client {client_id}: {e}")
        inc_counter("mcp_pcc_messages_dropped_total")
        return False

# Calculate state delta
def get_state_delta(current: Dict[str, Any], previous: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate delta between current and previous state for efficient transmission.
    
    For the first message, return the full state.
    For subsequent messages, return only changed values.
    
    Args:
        current: Current state
        previous: Previous state
    
    Returns:
        Delta state or full state if no previous state
    """
    if not previous:
        return current
        
    delta = {"step": current["step"]}
    
    # Always include energy as it's small
    delta["energy"] = current["energy"]
    
    # For phases and spins, only include changed values
    if "phases" in current and "phases" in previous:
        changed_phases = {}
        for i, (curr, prev) in enumerate(zip(current["phases"], previous["phases"])):
            if abs(curr - prev) > 0.001:  # Small threshold for floating point comparison
                changed_phases[str(i)] = curr
        delta["phases_delta"] = changed_phases
    else:
        delta["phases"] = current.get("phases", [])
        
    if "spins" in current and "spins" in previous:
        changed_spins = {}
        for i, (curr, prev) in enumerate(zip(current["spins"], previous["spins"])):
            if curr != prev:
                changed_spins[str(i)] = curr
        delta["spins_delta"] = changed_spins
    else:
        delta["spins"] = current.get("spins", [])
        
    # Include flags to indicate this is a delta update
    delta["is_delta"] = True
    
    # Calculate compression ratio for metrics
    full_size = len(json.dumps(current))
    delta_size = len(json.dumps(delta))
    compression_ratio = 1.0 - (delta_size / full_size) if full_size > 0 else 0
    logger.debug(f"Delta compression: {compression_ratio:.2%} reduction")
    
    return delta

# REST endpoints
@app.post("/pcc_state")
async def receive_pcc_state(state: PCCState, request: Request):
    """
    Receive PCC state update and broadcast to WebSocket clients.
    
    This endpoint accepts PCC state data and broadcasts it to all
    connected WebSocket clients for real-time updates.
    
    Args:
        state: PCC state data
        request: FastAPI request
    
    Returns:
        Status with client count
    """
    # Process start time
    start_time = time.time()
    client_ip = request.client.host
    
    # Log info about the received state
    logger.debug(f"Received PCC state update: step={state.step}, energy={state.energy}")
    
    # Increment received messages counter
    inc_counter("mcp_pcc_messages_received_total")
    
    # Measure message size
    state_json = state.model_dump_json()
    observe_histogram("mcp_pcc_message_size_bytes", len(state_json))
    
    # Convert to dict for delta calculation
    state_dict = state.model_dump()
    
    # Add timestamp for latency measurement if not present
    if "timestamp" not in state_dict:
        state_dict["timestamp"] = start_time
    
    # Broadcast the state to all WebSocket clients
    disconnect_clients = []
    
    for i, connection in enumerate(_live_sockets):
        client_id = f"client-{i}"
        
        # Calculate delta from previous state for this client
        previous_state = _client_last_state.get(connection, {})
        delta = get_state_delta(state_dict, previous_state) if PCC_WIRE_FORMAT == "json" else state_dict
        
        # Send with back-pressure handling
        success = await send_with_backpressure(connection, delta, client_id)
        
        if success:
            # Update last state for this client
            _client_last_state[connection] = state_dict.copy()
        else:
            disconnect_clients.append(connection)
    
    # Remove disconnected clients
    for client in disconnect_clients:
        if client in _live_sockets:
            _live_sockets.remove(client)
        if client in _client_last_state:
            del _client_last_state[client]
    
    # Measure total processing time
    processing_time = time.time() - start_time
    observe_histogram("mcp_pcc_message_processing_seconds", processing_time)
    
    if processing_time > 0.01:  # 10ms threshold for warning
        logger.warning(f"PCC state processing took {processing_time*1000:.2f}ms (step={state.step})")
    
    return {
        "ok": True, 
        "step": state.step, 
        "clients": len(_live_sockets),
        "processing_time_ms": round(processing_time * 1000, 2)
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy", 
        "websocket_clients": len(_live_sockets),
        "wire_format": PCC_WIRE_FORMAT,
        "uptime_seconds": time.time() - app.state.start_time if hasattr(app.state, "start_time") else 0
    }

@app.get("/metrics", response_class=PlainTextResponse)
async def metrics():
    """
    Prometheus metrics endpoint.
    
    This endpoint returns metrics in Prometheus text format for scraping.
    """
    return get_metrics_text()

@app.get("/metrics/json")
async def metrics_json():
    """
    JSON metrics endpoint for debugging.
    
    This endpoint returns the same metrics as /metrics but in JSON format
    for easier human reading.
    """
    # Update live connection count (in case it drifted)
    set_gauge("mcp_ws_connections_current", len(_live_sockets))
    
    return {
        "ws_clients_current": len(_live_sockets),
        "wire_format": PCC_WIRE_FORMAT,
        "uptime_seconds": time.time() - app.state.start_time if hasattr(app.state, "start_time") else 0
    }


@app.on_event("startup")
async def startup_event():
    """Initialize app state on startup."""
    app.state.start_time = time.time()
    logger.info(f"MCP 2.0 Server starting up - Wire format: {PCC_WIRE_FORMAT}")
    
    # Schedule periodic metrics updates
    asyncio.create_task(periodic_metrics_update())

async def periodic_metrics_update():
    """Update metrics that might drift periodically."""
    while True:
        # Update live connection count (in case it drifted)
        set_gauge("mcp_ws_connections_current", len(_live_sockets))
        
        # Wait 60 seconds before next update
        await asyncio.sleep(60)

# Main entrypoint
if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment variable or use default
    port = int(os.environ.get("MCP_SERVER_PORT", 8787))
    
    # Start the server with optimized settings
    logger.info(f"Starting MCP 2.0 Server on port {port}")
    logger.info(f"Wire format: {PCC_WIRE_FORMAT}")
    uvicorn.run(
        "server:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True,
        reload_dirs=["backend/routes/mcp"],
        loop="uvloop",
        http="httptools",
        workers=1
    )
