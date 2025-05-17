"""concept_logger.py - Implements structured logging for concept lifecycle events.

This module provides a ConceptLogger that tracks and logs significant events
in ALAN's concept ecosystem, including:

1. Concept birth and creation
2. Concept merges and lineage tracking
3. Stability changes and phase coherence
4. Activation patterns and resonance events

The logger creates a structured historical record that supports future
reflection, debugging, and visualization of ALAN's cognitive processes,
forming the "reflexive historian" component of the system.
"""

import logging
import os
import time
import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Set, Union, Tuple
import threading

from .models import ConceptTuple
from .concept_metadata import ConceptMetadata

# Configure base logger
logger = logging.getLogger("concept_events")

class ConceptLogger:
    """
    Logger for concept lifecycle events with structured output.
    
    ConceptLogger provides an event-tracking system that records the full
    lifecycle of concepts, their interactions, and significant state changes.
    This creates a reflexive historical record that can be used for analysis,
    visualization, and debugging of ALAN's cognitive processes.
    
    Attributes:
        log_file: Path to the log file
        console: Whether to output to console
        json_format: Whether to output in JSON format
        event_counts: Counter for different event types
        logger: The underlying logger instance
    """
    
    # Event categories for easier filtering
    EVENT_BIRTH = "BIRTH"
    EVENT_MERGE = "MERGE"
    EVENT_STABILITY = "STABILITY"
    EVENT_PHASE = "PHASE"
    EVENT_ACTIVATION = "ACTIVATION"
    EVENT_PRUNE = "PRUNE"
    EVENT_ERROR = "ERROR"
    
    def __init__(
        self,
        log_file: str = "concept_events.log",
        console: bool = True,
        json_format: bool = False,
        log_level: int = logging.INFO
    ) -> None:
        """
        Initialize a new ConceptLogger instance.
        
        Args:
            log_file: Path to the log file
            console: Whether to output to console
            json_format: Whether to output in JSON format
            log_level: Logging level (default: INFO)
        """
        self.log_file = log_file
        self.console = console
        self.json_format = json_format
        self.event_counts: Dict[str, int] = {
            self.EVENT_BIRTH: 0,
            self.EVENT_MERGE: 0,
            self.EVENT_STABILITY: 0,
            self.EVENT_PHASE: 0,
            self.EVENT_ACTIVATION: 0,
            self.EVENT_PRUNE: 0,
            self.EVENT_ERROR: 0
        }
        
        # Ensure log directory exists
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
        
        # Configure logger
        self.logger = logger
        self.logger.setLevel(log_level)
        self.logger.handlers = []  # Remove existing handlers
        
        # File handler
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(log_level)
        
        # Console handler
        if console:
            console_handler = logging.StreamHandler()
            console_handler.setLevel(log_level)
            self.logger.addHandler(console_handler)
        
        # Formatter - JSON or text
        if json_format:
            formatter = logging.Formatter('%(message)s')
        else:
            formatter = logging.Formatter(
                '%(asctime)s | %(levelname)s | %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            
        file_handler.setFormatter(formatter)
        if console:
            console_handler.setFormatter(formatter)
            
        self.logger.addHandler(file_handler)
        
        # Lock for thread safety
        self._lock = threading.RLock()
        
        # Log initialization
        self._log_event(self.EVENT_BIRTH, "LOGGER", "ConceptLogger initialized", 
                        details={"log_file": log_file, "json_format": json_format})
    
    def _format_message(self, event_type: str, subject_id: str, message: str) -> str:
        """Format log message with event type and subject ID."""
        return f"{event_type} | {subject_id} | {message}"
    
    def _log_event(
        self,
        event_type: str,
        subject_id: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        level: int = logging.INFO
    ) -> None:
        """Log an event with optional details."""
        with self._lock:
            # Update event counter
            self.event_counts[event_type] = self.event_counts.get(event_type, 0) + 1
            
            if self.json_format:
                # Create structured JSON event
                event = {
                    "timestamp": datetime.now().isoformat(),
                    "event_type": event_type,
                    "subject_id": subject_id,
                    "message": message,
                    "details": details or {}
                }
                self.logger.log(level, json.dumps(event))
            else:
                # Log text format
                formatted_msg = self._format_message(event_type, subject_id, message)
                if details:
                    details_str = " | " + " | ".join(f"{k}={v}" for k, v in details.items())
                    formatted_msg += details_str
                self.logger.log(level, formatted_msg)
    
    def log_concept_birth(
        self,
        concept: Union[ConceptTuple, str],
        source: str,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log creation of a new concept.
        
        Args:
            concept: ConceptTuple or concept ID
            source: Source of the concept (e.g., file, process)
            details: Optional additional details
        """
        concept_id = concept if isinstance(concept, str) else concept.eigenfunction_id
        concept_name = concept if isinstance(concept, str) else concept.name
        
        log_details = {
            "source": source,
            "name": concept_name
        }
        if details:
            log_details.update(details)
            
        self._log_event(self.EVENT_BIRTH, concept_id, f"New concept: '{concept_name}'", log_details)
    
    def log_concept_merge(
        self,
        parent_ids: List[str],
        child_id: str,
        reason: str,
        parent_names: Optional[List[str]] = None,
        child_name: Optional[str] = None,
        score: Optional[float] = None
    ) -> None:
        """
        Log merger of concepts.
        
        Args:
            parent_ids: List of parent concept IDs
            child_id: Resulting concept ID
            reason: Reason for the merge
            parent_names: Optional list of parent concept names
            child_name: Optional name of resulting concept
            score: Optional similarity/redundancy score
        """
        parents_str = ",".join(parent_ids)
        
        details = {"reason": reason}
        if parent_names:
            details["parent_names"] = parent_names
        if child_name:
            details["child_name"] = child_name
        if score is not None:
            details["score"] = f"{score:.3f}"
            
        self._log_event(
            self.EVENT_MERGE,
            child_id,
            f"Merged concepts: {parents_str} → {child_id}",
            details
        )
    
    def log_stability_change(
        self,
        concept_id: str,
        old_value: float,
        new_value: float,
        concept_name: Optional[str] = None,
        threshold: float = 0.1
    ) -> None:
        """
        Log significant stability changes.
        
        Args:
            concept_id: Concept ID
            old_value: Previous stability value
            new_value: New stability value
            concept_name: Optional concept name
            threshold: Minimum change to log (default: 0.1)
        """
        # Only log significant changes
        if abs(new_value - old_value) <= threshold:
            return
            
        direction = "↑" if new_value > old_value else "↓"
        name_str = f"'{concept_name}'" if concept_name else ""
        
        details = {
            "old": f"{old_value:.2f}",
            "new": f"{new_value:.2f}",
            "change": f"{direction}{abs(new_value - old_value):.2f}"
        }
        if concept_name:
            details["name"] = concept_name
            
        self._log_event(
            self.EVENT_STABILITY,
            concept_id,
            f"Stability changed: {old_value:.2f} → {new_value:.2f} {direction} {name_str}",
            details
        )
    
    def log_phase_alert(
        self,
        concept_ids: List[str],
        coherence: float,
        event: str,
        concept_names: Optional[List[str]] = None
    ) -> None:
        """
        Log phase coherence events.
        
        Args:
            concept_ids: List of concept IDs involved
            coherence: Phase coherence value
            event: Description of the event
            concept_names: Optional list of concept names
        """
        # Format concept list
        if len(concept_ids) <= 3:
            concepts_str = ",".join(concept_ids)
        else:
            concepts_str = ",".join(concept_ids[:3]) + f"+{len(concept_ids) - 3}"
            
        details = {
            "coherence": f"{coherence:.2f}",
            "event": event,
            "concept_count": len(concept_ids)
        }
        if concept_names:
            # Add names but limit to first 3
            if len(concept_names) <= 3:
                details["names"] = concept_names
            else:
                details["names"] = concept_names[:3] + [f"+{len(concept_names) - 3}"]
                
        self._log_event(
            self.EVENT_PHASE,
            concepts_str,
            f"Phase event: {event} (coherence: {coherence:.2f})",
            details
        )
    
    def log_concept_activation(
        self,
        concept_id: str,
        strength: float,
        context: Optional[str] = None,
        concept_name: Optional[str] = None,
        activation_count: Optional[int] = None
    ) -> None:
        """
        Log concept activation.
        
        Args:
            concept_id: Concept ID
            strength: Activation strength (0.0-1.0)
            context: Optional activation context
            concept_name: Optional concept name
            activation_count: Optional running count of activations
        """
        name_str = f"'{concept_name}'" if concept_name else ""
        
        details = {"strength": f"{strength:.2f}"}
        if context:
            details["context"] = context
        if concept_name:
            details["name"] = concept_name
        if activation_count is not None:
            details["count"] = activation_count
            
        # Log at DEBUG level unless it's an unusual activation pattern
        level = logging.DEBUG
        if strength > 0.9 or (activation_count is not None and activation_count == 1):
            level = logging.INFO
            
        self._log_event(
            self.EVENT_ACTIVATION,
            concept_id,
            f"Concept activated: {name_str} (strength: {strength:.2f})",
            details,
            level=level
        )
    
    def log_concept_pruning(
        self,
        concept_id: str,
        reason: str,
        metrics: Dict[str, Any],
        concept_name: Optional[str] = None
    ) -> None:
        """
        Log concept pruning event.
        
        Args:
            concept_id: Concept ID
            reason: Reason for pruning
            metrics: Dictionary of metrics that led to pruning
            concept_name: Optional concept name
        """
        name_str = f"'{concept_name}'" if concept_name else ""
        
        details = {
            "reason": reason,
            **metrics
        }
        if concept_name:
            details["name"] = concept_name
            
        self._log_event(
            self.EVENT_PRUNE,
            concept_id,
            f"Concept pruned: {name_str} ({reason})",
            details
        )
    
    def log_error(
        self,
        operation: str,
        error: Union[str, Exception],
        concept_id: Optional[str] = None,
        severity: str = "WARNING"
    ) -> None:
        """
        Log error or warning during concept operations.
        
        Args:
            operation: Operation that failed
            error: Error message or exception
            concept_id: Optional concept ID
            severity: Severity level (ERROR, WARNING)
        """
        subject = concept_id or "SYSTEM"
        error_msg = str(error)
        
        details = {
            "operation": operation,
            "severity": severity
        }
        if concept_id:
            details["concept_id"] = concept_id
            
        level = logging.ERROR if severity == "ERROR" else logging.WARNING
            
        self._log_event(
            self.EVENT_ERROR,
            subject,
            f"Error in {operation}: {error_msg}",
            details,
            level=level
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about logged events.
        
        Returns:
            Dict containing event counts and logger information
        """
        with self._lock:
            return {
                "events": dict(self.event_counts),
                "total_events": sum(self.event_counts.values()),
                "log_file": self.log_file,
                "json_format": self.json_format
            }

# For convenience, create a singleton instance
default_concept_logger = ConceptLogger()
