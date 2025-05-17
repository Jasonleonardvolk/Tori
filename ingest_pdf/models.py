from dataclasses import dataclass, field
from typing import List, Dict, Any, Tuple
import numpy as np
import uuid

@dataclass
class ConceptTuple:
    name: str
    embedding: np.ndarray
    context: str
    passage_embedding: np.ndarray
    cluster_members: List[int]
    resonance_score: float
    narrative_centrality: float
    predictability_score: float = 0.5  # New field for Lyapunov-based predictability
    
    # New fields for transparency and provenance tracking
    eigenfunction_id: str = ""  # Unique spectral identifier
    source_provenance: Dict[str, Any] = field(default_factory=dict)  # Document source metadata
    spectral_lineage: List[Tuple[float, float]] = field(default_factory=list)  # Eigenvalue, magnitude pairs
    cluster_coherence: float = 0.0  # Internal similarity measure
    
    def __post_init__(self):
        """Generate a unique eigenfunction ID if not provided."""
        if not self.eigenfunction_id:
            # Create a deterministic ID based on embedding fingerprint if possible
            if hasattr(self, 'embedding') and self.embedding is not None:
                fingerprint = hash(self.embedding.tobytes()) % 10000000
                self.eigenfunction_id = f"eigen-{fingerprint}"
            else:
                # Fallback to random UUID
                self.eigenfunction_id = f"eigen-{str(uuid.uuid4())[:8]}"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to a fully traceable dictionary representation for visualization and debugging."""
        return {
            "name": self.name,
            "context": self.context,
            "resonance_score": self.resonance_score,
            "narrative_centrality": self.narrative_centrality,
            "predictability_score": self.predictability_score,
            "eigenfunction_id": self.eigenfunction_id,
            "source_provenance": self.source_provenance,
            "spectral_lineage": [(float(real), float(mag)) for real, mag in self.spectral_lineage],
            "cluster_coherence": self.cluster_coherence,
            "cluster_size": len(self.cluster_members)
        }
