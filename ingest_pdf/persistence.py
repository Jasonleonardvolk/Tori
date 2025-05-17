import numpy as np
import json
from typing import List
from pathlib import Path
from alan_backend.concept_index.concept_store import ConceptStore, Concept
from .models import ConceptTuple

def save_concepts(tuples: List[ConceptTuple], index_path: str):
    store = ConceptStore(Path(index_path))
    
    # Convert ConceptTuple to tuple for ConceptStore (basic fields)
    raw_tuples = [(c.name, c.embedding, c.context, c.passage_embedding) for c in tuples]
    store.add_batch(raw_tuples)
    
    # Save extended metadata as a separate JSON file for richer concept information
    meta_path = str(Path(index_path).with_suffix(".meta.json"))
    try:
        with open(meta_path, "w", encoding="utf-8") as f:
            metadata = [
                {
                    "name": c.name,
                    "eigenfunction_id": c.eigenfunction_id,
                    "source_provenance": c.source_provenance,
                    "spectral_lineage": [(float(real), float(mag)) for real, mag in c.spectral_lineage],
                    "resonance_score": float(c.resonance_score),
                    "narrative_centrality": float(c.narrative_centrality),
                    "predictability_score": float(c.predictability_score),
                    "cluster_coherence": float(c.cluster_coherence),
                    "cluster_size": len(c.cluster_members)
                }
                for c in tuples
            ]
            json.dump(metadata, f, indent=2)
    except Exception as e:
        print(f"Warning: Failed to save concept metadata: {e}")
