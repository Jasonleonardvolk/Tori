# cognitive_interface.py — ConceptMesh + ψArc Integration Bridge
"""
Cognitive interface for injecting extracted concepts into TORI's ConceptMesh system.

This module provides the bridge between the concept extraction pipeline and
TORI's cognitive architecture, handling memory injection, ψArc trajectory logging,
and ConceptMesh updates.

Key Features:
- ConceptMesh injection API
- ψTrajectory logging integration
- Memory diff tracking
- Event bus notifications
- UI update callbacks
"""

import logging
import json
import time
import numpy as np
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime
from pathlib import Path

# Configure logging
logger = logging.getLogger("cognitive_interface")

# ConceptMesh storage path (adjust as needed for your setup)
CONCEPT_MESH_PATH = Path("./concept_mesh_data.json")
PSI_TRAJECTORY_PATH = Path("./psi_trajectory.json")

# Event callbacks
_concept_mesh_callbacks: List[Callable] = []
_psi_trajectory_callbacks: List[Callable] = []

class ConceptDiff:
    """
    Represents a differential update to the ConceptMesh.
    
    This encapsulates a set of concepts extracted from a document
    along with metadata about the extraction process.
    """
    
    def __init__(
        self,
        diff_type: str,
        title: str,
        concepts: List[Dict[str, Any]],
        summary: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.id = f"diff_{int(time.time() * 1000)}_{hash(title) % 10000}"
        self.type = diff_type
        self.title = title
        self.concepts = concepts
        self.summary = summary
        self.metadata = metadata or {}
        self.timestamp = datetime.now().isoformat()
        self.eigen_ids = [c.get("eigenfunction_id", "") for c in concepts if isinstance(c, dict)]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "type": self.type,
            "title": self.title,
            "concepts": self.concepts,
            "summary": self.summary,
            "metadata": self.metadata,
            "timestamp": self.timestamp,
            "eigen_ids": self.eigen_ids
        }

def load_concept_mesh() -> List[Dict[str, Any]]:
    """
    Load existing ConceptMesh from storage.
    
    Returns:
        List of concept diffs in the mesh
    """
    try:
        if CONCEPT_MESH_PATH.exists():
            with open(CONCEPT_MESH_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"Could not load ConceptMesh from {CONCEPT_MESH_PATH}: {e}")
    
    return []

def make_json_serializable(obj):
    """
    Convert any object to a JSON-serializable format, handling numpy and other weird types robustly.
    - Never drops or empties content.
    - NumPy 2.0+ compatible.
    """
    if obj is None:
        return None
    elif isinstance(obj, (str, int, float, bool)):
        return obj
    elif isinstance(obj, bytes):
        try:
            return obj.decode("utf-8")
        except Exception:
            return obj.hex()
    # Robust NumPy handling for 2.0+
    elif "numpy" in str(type(obj)):
        # Try converting to Python scalar
        try:
            return obj.item()
        except Exception:
            # Try array to list if scalar fails
            try:
                return obj.tolist()
            except Exception:
                return str(obj)
    elif isinstance(obj, dict):
        return {str(k): make_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple, set)):
        return [make_json_serializable(item) for item in obj]
    elif hasattr(obj, "__dict__"):
        return make_json_serializable(obj.__dict__)
    else:
        return str(obj)

def save_concept_mesh(mesh: List[Dict[str, Any]]) -> bool:
    """
    Save ConceptMesh to storage with proper JSON serialization.
    
    Args:
        mesh: ConceptMesh data to save
        
    Returns:
        True if save succeeded, False otherwise
    """
    try:
        # Ensure directory exists
        CONCEPT_MESH_PATH.parent.mkdir(parents=True, exist_ok=True)
        
        # Make mesh JSON-serializable
        serializable_mesh = make_json_serializable(mesh)
        
        with open(CONCEPT_MESH_PATH, "w", encoding="utf-8") as f:
            json.dump(serializable_mesh, f, indent=2)
        
        logger.info(f"ConceptMesh saved to {CONCEPT_MESH_PATH} ({len(mesh)} diffs)")
        return True
    except Exception as e:
        logger.error(f"Failed to save ConceptMesh: {e}")
        return False

def load_psi_trajectory() -> List[Dict[str, Any]]:
    """
    Load ψTrajectory history from storage.
    
    Returns:
        List of trajectory events
    """
    try:
        if PSI_TRAJECTORY_PATH.exists():
            with open(PSI_TRAJECTORY_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"Could not load ψTrajectory from {PSI_TRAJECTORY_PATH}: {e}")
    
    return []

def append_psi_trajectory(event: Dict[str, Any]) -> bool:
    """
    Append event to ψTrajectory log with proper JSON serialization.
    
    Args:
        event: Trajectory event to append
        
    Returns:
        True if append succeeded, False otherwise
    """
    try:
        trajectory = load_psi_trajectory()
        
        # Make event JSON-serializable before appending
        serializable_event = make_json_serializable(event)
        trajectory.append(serializable_event)
        
        # Keep only last 1000 events to prevent unbounded growth
        if len(trajectory) > 1000:
            trajectory = trajectory[-1000:]
        
        # Ensure directory exists
        PSI_TRAJECTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
        
        with open(PSI_TRAJECTORY_PATH, "w", encoding="utf-8") as f:
            json.dump(trajectory, f, indent=2)
        
        return True
    except Exception as e:
        logger.error(f"Failed to append ψTrajectory event: {e}")
        return False

def register_concept_mesh_callback(callback: Callable[[Dict[str, Any]], None]):
    """
    Register callback for ConceptMesh updates.
    
    Args:
        callback: Function to call when ConceptMesh is updated
    """
    _concept_mesh_callbacks.append(callback)
    logger.info(f"Registered ConceptMesh callback: {callback.__name__}")

def register_psi_trajectory_callback(callback: Callable[[Dict[str, Any]], None]):
    """
    Register callback for ψTrajectory updates.
    
    Args:
        callback: Function to call when ψTrajectory is updated
    """
    _psi_trajectory_callbacks.append(callback)
    logger.info(f"Registered ψTrajectory callback: {callback.__name__}")

def add_concept_diff(diff_data: Dict[str, Any]) -> bool:
    """
    Add a concept differential to the ConceptMesh and trigger ψArc logging.
    
    This is the main injection point for concept extraction results.
    
    Args:
        diff_data: Dictionary containing concept diff information
        
    Returns:
        True if injection succeeded, False otherwise
    """
    try:
        # Create ConceptDiff object
        diff = ConceptDiff(
            diff_type=diff_data.get("type", "document"),
            title=diff_data.get("title", "Untitled"),
            concepts=diff_data.get("concepts", []),
            summary=diff_data.get("summary", ""),
            metadata=diff_data.get("metadata", {})
        )
        
        # Load current mesh
        mesh = load_concept_mesh()
        
        # Add new diff
        mesh.append(diff.to_dict())
        
        # Save updated mesh
        if not save_concept_mesh(mesh):
            return False
        
        # Log to ψTrajectory
        psi_event = {
            "event_type": "concept_injection",
            "diff_id": diff.id,
            "title": diff.title,
            "concept_count": len(diff.concepts),
            "eigen_ids": diff.eigen_ids,
            "timestamp": diff.timestamp,
            "metadata": diff.metadata
        }
        
        append_psi_trajectory(psi_event)
        
        # Notify callbacks
        for callback in _concept_mesh_callbacks:
            try:
                callback(diff.to_dict())
            except Exception as e:
                logger.error(f"ConceptMesh callback failed: {e}")
        
        for callback in _psi_trajectory_callbacks:
            try:
                callback(psi_event)
            except Exception as e:
                logger.error(f"ψTrajectory callback failed: {e}")
        
        # Log successful injection
        logger.info(f"[ConceptMesh] Injected {len(diff.concepts)} concepts for '{diff.title}' (ID: {diff.id})")
        logger.info(f"[ψArc] Logged concept injection trajectory with {len(diff.eigen_ids)} eigen IDs")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to add concept diff: {e}")
        return False

def get_concept_mesh_stats() -> Dict[str, Any]:
    """
    Get statistics about the current ConceptMesh.
    
    Returns:
        Dictionary with mesh statistics
    """
    try:
        mesh = load_concept_mesh()
        
        total_diffs = len(mesh)
        total_concepts = sum(len(diff.get("concepts", [])) for diff in mesh)
        
        # Analyze diff types
        diff_types = {}
        for diff in mesh:
            diff_type = diff.get("type", "unknown")
            diff_types[diff_type] = diff_types.get(diff_type, 0) + 1
        
        # Recent activity (last 24 hours)
        now = datetime.now()
        recent_diffs = 0
        for diff in mesh:
            try:
                diff_time = datetime.fromisoformat(diff.get("timestamp", ""))
                if (now - diff_time).total_seconds() < 86400:  # 24 hours
                    recent_diffs += 1
            except:
                pass
        
        return {
            "total_diffs": total_diffs,
            "total_concepts": total_concepts,
            "diff_types": diff_types,
            "recent_diffs_24h": recent_diffs,
            "storage_path": str(CONCEPT_MESH_PATH)
        }
        
    except Exception as e:
        logger.error(f"Failed to get ConceptMesh stats: {e}")
        return {"error": str(e)}

def clear_concept_mesh(confirm: bool = False) -> bool:
    """
    Clear the ConceptMesh (use with caution).
    
    Args:
        confirm: Must be True to actually clear the mesh
        
    Returns:
        True if cleared successfully, False otherwise
    """
    if not confirm:
        logger.warning("ConceptMesh clear requested but not confirmed")
        return False
    
    try:
        save_concept_mesh([])
        logger.warning("ConceptMesh cleared!")
        return True
    except Exception as e:
        logger.error(f"Failed to clear ConceptMesh: {e}")
        return False

def export_concept_mesh(export_path: str) -> bool:
    """
    Export ConceptMesh to a file with proper JSON serialization.
    
    Args:
        export_path: Path to export the mesh to
        
    Returns:
        True if export succeeded, False otherwise
    """
    try:
        mesh = load_concept_mesh()
        
        # Make mesh JSON-serializable before export
        serializable_mesh = make_json_serializable(mesh)
        
        with open(export_path, "w", encoding="utf-8") as f:
            json.dump(serializable_mesh, f, indent=2)
        
        logger.info(f"ConceptMesh exported to {export_path} ({len(mesh)} diffs)")
        return True
    except Exception as e:
        logger.error(f"Failed to export ConceptMesh: {e}")
        return False

# WebSocket/UI integration stub
def notify_ui_update(diff_data: Dict[str, Any]):
    """
    Notify UI of ConceptMesh update (implement based on your UI architecture).
    
    Args:
        diff_data: Concept diff that was added
    """
    # TODO: Implement based on your UI framework
    # For SvelteKit: could use WebSocket or server-sent events
    # For React: could update a shared state store
    # For now, just log the event
    logger.info(f"[UI] ConceptMesh update available: {diff_data.get('title', 'Unknown')}")

# Register default UI callback
register_concept_mesh_callback(notify_ui_update)
