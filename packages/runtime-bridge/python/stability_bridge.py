"""
Stability Bridge - Python bindings for Spectral Stability integration

This module provides a bridge between the TypeScript spectral monitoring system
and the Python stability reasoning module. It fetches stability metrics from the
runtime bridge and provides them to the stability reasoning system.
"""

import json
import logging
import os
import time
import threading
import asyncio
import websockets
from typing import Dict, List, Any, Optional, Set, Tuple, Union, Callable

from ingest_pdf.concept_metadata import ConceptMetadata

# Configure logging
logger = logging.getLogger("stability_bridge")

class StabilityBridge:
    """
    Bridge between the TypeScript spectral monitor and Python stability reasoning.
    
    This class provides methods to access spectral stability metrics from the
    runtime bridge and feed them into the stability reasoning system.
    """
    
    def __init__(
        self,
        websocket_endpoint: str = None,
        sync_interval: float = 5.0,
        stability_threshold: float = 0.4,
        coherence_threshold: float = 0.6
    ):
        """
        Initialize the stability bridge.
        
        Args:
            websocket_endpoint: WebSocket endpoint for connecting to runtime
            sync_interval: Interval in seconds for syncing metrics
            stability_threshold: Minimum stability threshold for concepts
            coherence_threshold: Minimum coherence threshold for reasoning
        """
        # Configuration
        self.websocket_endpoint = websocket_endpoint or os.environ.get(
            "SPECTRAL_WS_ENDPOINT", "ws://localhost:8000/ws"
        )
        self.sync_interval = sync_interval
        self.stability_threshold = stability_threshold
        self.coherence_threshold = coherence_threshold
        
        # State
        self.last_update_time: float = 0
        self.global_spectral_state: Dict[str, Any] = {
            "coherence": 0.0,
            "orderParameter": 0.0,
            "driftDetected": False,
            "driftingConcepts": []
        }
        
        # Sync thread
        self._sync_thread = None
        self._stop_event = threading.Event()
        
        # WebSocket connection
        self._ws = None
        self._connected = False
        
        # Callbacks
        self._on_update_callbacks: List[Callable[[], None]] = []
        self._on_coherence_break_callbacks: List[Callable[[Dict[str, Any]], None]] = []
    
    def start_sync(self) -> bool:
        """
        Start synchronizing with the spectral monitor in the background.
        
        Returns:
            True if sync thread started, False otherwise
        """
        if self._sync_thread and self._sync_thread.is_alive():
            logger.warning("Sync thread already running")
            return False
        
        self._stop_event.clear()
        self._sync_thread = threading.Thread(
            target=self._sync_loop,
            daemon=True
        )
        self._sync_thread.start()
        logger.info(f"Started stability bridge sync thread (interval: {self.sync_interval}s)")
        return True
    
    def stop_sync(self) -> None:
        """Stop the background synchronization thread."""
        if self._sync_thread and self._sync_thread.is_alive():
            self._stop_event.set()
            self._sync_thread.join(timeout=2.0)
            logger.info("Stopped stability bridge sync thread")
    
    def _sync_loop(self) -> None:
        """Background loop for syncing with spectral monitor."""
        asyncio.set_event_loop(asyncio.new_event_loop())
        while not self._stop_event.is_set():
            try:
                # Run WebSocket connection
                asyncio.get_event_loop().run_until_complete(self._websocket_connect())
            except Exception as e:
                logger.error(f"Error in WebSocket connection: {e}")
                # Wait before reconnecting
                time.sleep(self.sync_interval)
    
    async def _websocket_connect(self) -> None:
        """Connect to the WebSocket server and handle messages."""
        try:
            async with websockets.connect(self.websocket_endpoint) as websocket:
                self._ws = websocket
                self._connected = True
                logger.info(f"Connected to spectral WebSocket at {self.websocket_endpoint}")
                
                # Initial connection message
                await websocket.send(json.dumps({
                    "v": 1,
                    "kind": "auth",
                    "payload": {"client_type": "stability_bridge"},
                    "timestamp": int(time.time() * 1000)
                }))
                
                # Listen for messages
                while not self._stop_event.is_set():
                    try:
                        message = await websocket.recv()
                        await self._handle_message(message)
                    except websockets.exceptions.ConnectionClosed:
                        logger.warning("WebSocket connection closed")
                        self._connected = False
                        break
                    except Exception as e:
                        logger.error(f"Error handling WebSocket message: {e}")
        
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
            self._connected = False
            self._ws = None
            
            # Wait before reconnecting
            await asyncio.sleep(self.sync_interval)
    
    async def _handle_message(self, message_data: str) -> None:
        """
        Handle incoming WebSocket message.
        
        Args:
            message_data: JSON message data as string
        """
        try:
            message = json.loads(message_data)
            
            # Check if it's a spectral state update
            if message.get("kind") == "concept_update" and message.get("payload", {}).get("type") == "spectral_state":
                await self._process_spectral_state(message["payload"]["data"])
        except json.JSONDecodeError:
            logger.warning(f"Received invalid JSON: {message_data[:100]}...")
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {e}")
    
    async def _process_spectral_state(self, spectral_state: Dict[str, Any]) -> None:
        """
        Process a spectral state update from the WebSocket.
        
        Args:
            spectral_state: The spectral state data
        """
        # Track coherence changes
        prev_coherence = self.global_spectral_state.get("coherence", 0.0)
        new_coherence = spectral_state.get("coherence", 0.0)
        coherence_drop = max(0, prev_coherence - new_coherence)
        
        # Update global state
        self.global_spectral_state = spectral_state
        self.last_update_time = time.time()
        
        # Check for coherence break
        if coherence_drop > 0.2:  # Significant drop
            break_info = {
                "timestamp": time.time(),
                "coherence": new_coherence,
                "coherence_drop": coherence_drop,
                "driftingConcepts": spectral_state.get("driftingConcepts", [])
            }
            
            # Call coherence break callbacks
            for callback in self._on_coherence_break_callbacks:
                try:
                    callback(break_info)
                except Exception as e:
                    logger.error(f"Error in coherence break callback: {e}")
        
        # Call update callbacks
        for callback in self._on_update_callbacks:
            try:
                callback()
            except Exception as e:
                logger.error(f"Error in update callback: {e}")
    
    def apply_spectral_state_to_concepts(
        self,
        concept_store: Dict[str, Union[ConceptMetadata, Any]],
        concept_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Apply current spectral state to concepts in the store.
        
        Args:
            concept_store: Dictionary mapping concept IDs to metadata
            concept_ids: Optional list of concept IDs to update
                         If None, updates all concepts in the store
        
        Returns:
            Dictionary with update statistics
        """
        if not self.global_spectral_state:
            return {
                "conceptsUpdated": 0,
                "coherenceBreaks": 0,
                "error": "No spectral state available"
            }
        
        # Get concepts to update
        if concept_ids is None:
            concept_ids = list(concept_store.keys())
        
        # Track metrics
        concepts_updated = 0
        coherence_breaks = 0
        
        # Get spectral state metrics
        coherence = self.global_spectral_state.get("coherence", 0.5)
        order_parameter = self.global_spectral_state.get("orderParameter", 0.5)
        drifting_concepts = set(self.global_spectral_state.get("driftingConcepts", []))
        
        # Update each concept
        for concept_id in concept_ids:
            if concept_id not in concept_store:
                continue
            
            concept = concept_store[concept_id]
            
            # Check if ConceptMetadata or similar
            if hasattr(concept, 'stability') and hasattr(concept, 'phase_coherence'):
                # Calculate concept stability from spectral state
                is_drifting = concept_id in drifting_concepts
                
                # Start with global metrics
                new_stability = coherence * 0.7 + order_parameter * 0.3
                
                # Apply drift penalty if applicable
                if is_drifting:
                    new_stability = max(0.0, new_stability - 0.3)
                    coherence_breaks += 1
                
                # Apply time-aware update to concept
                if hasattr(concept, 'update_stability'):
                    # Use method if available
                    concept.update_stability(new_stability, 0.7)  # 70% new, 30% old
                else:
                    # Direct update otherwise
                    concept.stability = 0.7 * new_stability + 0.3 * concept.stability
                
                # Update phase coherence
                concept.phase_coherence = coherence
                
                # Record desync event if drifting
                if is_drifting and hasattr(concept, 'last_coherence_break'):
                    concept.last_coherence_break = time.time()
                
                concepts_updated += 1
        
        return {
            "timestamp": time.time(),
            "conceptsUpdated": concepts_updated,
            "coherenceBreaks": coherence_breaks,
            "globalCoherence": coherence
        }
    
    def get_global_spectral_state(self) -> Dict[str, Any]:
        """
        Get the current global spectral state.
        
        Returns:
            Dictionary with global spectral metrics
        """
        return self.global_spectral_state.copy()
    
    def on_update(self, callback: Callable[[], None]) -> None:
        """
        Register a callback for metric updates.
        
        Args:
            callback: Function to call when metrics are updated
        """
        if callback not in self._on_update_callbacks:
            self._on_update_callbacks.append(callback)
    
    def on_coherence_break(self, callback: Callable[[Dict[str, Any]], None]) -> None:
        """
        Register a callback for coherence breaks.
        
        Args:
            callback: Function to call when a coherence break is detected
                     Takes break info dictionary as argument
        """
        if callback not in self._on_coherence_break_callbacks:
            self._on_coherence_break_callbacks.append(callback)
    
    def remove_callback(self, callback: Callable) -> bool:
        """
        Remove a registered callback.
        
        Args:
            callback: Callback function to remove
            
        Returns:
            True if callback was removed, False if not found
        """
        if callback in self._on_update_callbacks:
            self._on_update_callbacks.remove(callback)
            return True
        
        if callback in self._on_coherence_break_callbacks:
            self._on_coherence_break_callbacks.remove(callback)
            return True
        
        return False
    
    async def send_websocket_message(self, kind: str, payload: Any) -> bool:
        """
        Send a message through the WebSocket connection.
        
        Args:
            kind: Message kind (e.g., 'ping', 'auth')
            payload: Message payload
            
        Returns:
            True if successful, False otherwise
        """
        if not self._connected or not self._ws:
            logger.warning("Cannot send message: WebSocket not connected")
            return False
        
        try:
            message = {
                "v": 1,
                "kind": kind,
                "payload": payload,
                "timestamp": int(time.time() * 1000)
            }
            
            await self._ws.send(json.dumps(message))
            return True
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {e}")
            return False


# Global singleton instance for easy import
default_stability_bridge = StabilityBridge()


def update_stability_reasoning_context(
    stability_reasoning = None,
    concept_store = None
) -> Dict[str, Any]:
    """
    Update the StabilityReasoning context with latest metrics.
    
    Args:
        stability_reasoning: StabilityReasoning instance to update
                             If None, uses default_stability_reasoning
        concept_store: Concept store to update
                       If None, uses stability_reasoning's concept_store
                       
    Returns:
        Dictionary with update statistics
    """
    # Import here to avoid circular imports
    from ingest_pdf.stability_reasoning import default_stability_reasoning
    
    # Use provided stability_reasoning or default
    sr = stability_reasoning or default_stability_reasoning
    
    # Use provided concept_store or get from stability_reasoning
    store = concept_store
    if store is None and sr is not None:
        store = getattr(sr, 'concept_store', None)
    
    if store is not None:
        # Apply spectral state to concepts
        return default_stability_bridge.apply_spectral_state_to_concepts(store)
    
    return {
        "timestamp": time.time(),
        "conceptsUpdated": 0,
        "coherenceBreaks": 0,
        "error": "No concept store available"
    }


def start_stability_bridge(
    websocket_endpoint: str = None,
    sync_interval: float = 5.0
) -> bool:
    """
    Start the stability bridge sync process.
    
    This starts the background thread that synchronizes stability metrics
    between the spectral monitor and stability reasoning.
    
    Args:
        websocket_endpoint: WebSocket endpoint for connecting to runtime
        sync_interval: Interval in seconds for syncing metrics
        
    Returns:
        True if started successfully, False otherwise
    """
    global default_stability_bridge
    
    if websocket_endpoint:
        default_stability_bridge.websocket_endpoint = websocket_endpoint
    
    if sync_interval:
        default_stability_bridge.sync_interval = sync_interval
    
    return default_stability_bridge.start_sync()


def stop_stability_bridge() -> None:
    """Stop the stability bridge sync process."""
    global default_stability_bridge
    default_stability_bridge.stop_sync()


def create_stability_reasoning_factory():
    """
    Create a factory function for StabilityReasoning that integrates with spectral state.
    
    Returns:
        Factory function for creating a StabilityReasoning instance
    """
    from ingest_pdf.stability_reasoning import StabilityReasoning
    
    def create_stability_reasoning_from_spectral(
        concept_store = None,
        time_context = None,
        logger = None,
        stability_threshold = None,
        coherence_threshold = None
    ):
        """
        Create a StabilityReasoning instance with spectral metrics.
        
        Args:
            concept_store: Concept store to use
            time_context: TimeContext to use
            logger: ConceptLogger to use
            stability_threshold: Override stability threshold
            coherence_threshold: Override coherence threshold
            
        Returns:
            Configured StabilityReasoning instance
        """
        # Get thresholds from spectral bridge if not provided
        if stability_threshold is None:
            stability_threshold = default_stability_bridge.stability_threshold
            
        if coherence_threshold is None:
            coherence_threshold = default_stability_bridge.coherence_threshold
        
        # Create StabilityReasoning instance
        sr = StabilityReasoning(
            concept_store=concept_store,
            time_context=time_context,
            logger=logger,
            stability_threshold=stability_threshold,
            coherence_threshold=coherence_threshold
        )
        
        # Register for coherence break events
        default_stability_bridge.on_coherence_break(
            lambda break_info: _handle_coherence_break(sr, break_info)
        )
        
        return sr
    
    def _handle_coherence_break(sr, break_info):
        """Handle coherence break events by recording desync."""
        for concept_id in break_info["driftingConcepts"]:
            if hasattr(sr, 'record_desync_event'):
                sr.record_desync_event(concept_id, break_info["coherence"])
    
    return create_stability_reasoning_from_spectral
