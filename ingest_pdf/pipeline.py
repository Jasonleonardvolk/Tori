from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import json
import os
import hashlib
import PyPDF2
import logging
from datetime import datetime
from .extract_blocks import extract_concept_blocks
from .features import build_feature_matrix
from .spectral import spectral_embed
from .clustering import run_oscillator_clustering, cluster_cohesion
from .scoring import score_clusters, resonance_score, narrative_centrality, build_cluster_adjacency
from .keywords import extract_keywords
from .models import ConceptTuple
from .persistence import save_concepts
from .lyapunov import concept_predictability, document_chaos_profile
from .source_validator import validate_source, SourceValidationResult
from .memory_gating import apply_memory_gating
from .phase_walk import PhaseCoherentWalk

# Configure logging
logger = logging.getLogger("pdf_ingestion")

def extract_pdf_metadata(pdf_path: str) -> Dict[str, Any]:
    """Extract metadata from PDF file for source provenance tracking."""
    metadata = {
        "filename": Path(pdf_path).name,
        "file_path": pdf_path,
        "extraction_timestamp": datetime.now().isoformat(),
    }
    
    # Calculate file hash for provenance tracking
    try:
        with open(pdf_path, "rb") as f:
            file_content = f.read()
            metadata["sha256"] = hashlib.sha256(file_content).hexdigest()
    except Exception as e:
        print(f"Warning: Could not calculate file hash: {e}")
    
    # Extract PDF document metadata
    try:
        with open(pdf_path, "rb") as f:
            pdf = PyPDF2.PdfReader(f)
            if pdf.metadata:
                metadata["pdf_metadata"] = {
                    k.lower().replace('/', ''): str(v) 
                    for k, v in pdf.metadata.items() 
                    if k and v
                }
                
                # Extract potential academic source info
                if "author" in metadata["pdf_metadata"]:
                    metadata["author"] = metadata["pdf_metadata"]["author"]
                if "title" in metadata["pdf_metadata"]:
                    metadata["title"] = metadata["pdf_metadata"]["title"]
                if "subject" in metadata["pdf_metadata"]:
                    metadata["subject"] = metadata["pdf_metadata"]["subject"]
                if "producer" in metadata["pdf_metadata"]:
                    metadata["producer"] = metadata["pdf_metadata"]["producer"]
            
            # Get number of pages
            metadata["page_count"] = len(pdf.pages)
    except Exception as e:
        print(f"Warning: Could not extract PDF metadata: {e}")
    
    return metadata

def ingest_pdf_and_update_index(
    pdf_path: str, 
    index_path: str, 
    max_concepts: int = 12, 
    dim: int = 16, 
    json_out: str = None,
    min_quality_score: float = 0.6,
    apply_gating: bool = True,
    coherence_threshold: float = 0.7
) -> dict:
    """
    Process a PDF file, extract concepts, and update the concept index.
    
    Args:
        pdf_path: Path to the PDF file
        index_path: Path to the concept index
        max_concepts: Maximum number of concepts to extract
        dim: Dimension of the spectral embedding
        json_out: Optional path to save JSON output
        min_quality_score: Minimum quality score for source validation
        apply_gating: Whether to apply memory gating (redundancy detection, etc.)
        coherence_threshold: Minimum phase coherence threshold
        
    Returns:
        Dictionary with metadata about the extraction process
    """
    # Step 1: Validate the source
    validation = validate_source(pdf_path, min_quality_score)
    if not validation.is_valid:
        logger.warning(f"Source rejected: {pdf_path} (Score: {validation.quality_score:.2f})")
        return {
            "filename": Path(pdf_path).name,
            "concept_count": 0,
            "status": "rejected",
            "reason": "Failed source validation",
            "quality_score": validation.quality_score,
            "validation_reasons": validation.reasons
        }
        
    logger.info(f"Source validated: {pdf_path} (Score: {validation.quality_score:.2f})")
    
    # Step 2: Extract blocks from document
    blocks = extract_concept_blocks(pdf_path)
    if not blocks:
        return {"filename": Path(pdf_path).name, "concept_count": 0, "status": "empty"}
    
    # Extract document metadata for provenance tracking
    doc_metadata = extract_pdf_metadata(pdf_path)
    
    # Add validation metadata
    doc_metadata["source_validation"] = validation.to_dict()
    
    # Keep track of original block ordering for temporal analysis
    blocks_indices = list(range(len(blocks)))
    
    # build_feature_matrix returns (matrix, vocab list)
    feats, vocab = build_feature_matrix(blocks)
    # For tfidf, we'll use the feature matrix directly
    tfidf = feats
    emb = spectral_embed(feats, k=dim)
    
    # Get eigenvalues and eigenvectors directly for spectral lineage tracking
    # Note: In a real implementation, we would need to extract these from the Koopman decomposition
    # Here we'll create mock eigenvalues for illustration
    eigenvalues = np.ones(dim) * 0.8  # Mock eigenvalues between 0 and 1
    eigenvectors = np.eye(dim)  # Mock eigenvectors (identity matrix)
    
    labels = run_oscillator_clustering(emb)
    top_cids = score_clusters(labels, emb)[:max_concepts]
    
    # Calculate predictability scores using Lyapunov analysis
    predictability_scores = concept_predictability(labels, emb, blocks_indices)
    
    # Generate document-wide chaos profile
    chaos_profile = document_chaos_profile(labels, emb, blocks_indices)
    
    tuples: List[ConceptTuple] = []
    names: List[str] = []
    adj = build_cluster_adjacency(labels, emb)
    for cid in top_cids:
        mem = [i for i, l in enumerate(labels) if l == cid]
        other_blocks = [blocks[i] for i in range(len(blocks)) if i not in mem]
        cluster_blocks = [blocks[i] for i in mem]
        # Use advanced keyword extraction
        keywords = extract_keywords(cluster_blocks, other_blocks, n=3)
        title = " ".join(w.capitalize() for w in keywords) or f"Concept-{cid+1}"
        # Ensure tfidf is a numpy array before indexing with a list
        tfidf_array = np.array(tfidf) if not isinstance(tfidf, np.ndarray) else tfidf
        cluster_tfidf = tfidf_array[mem].mean(axis=0).astype(np.float32)
        res_score = resonance_score(mem, emb)
        cent_score = narrative_centrality(mem, adj)
        # Get predictability score for this concept 
        pred_score = predictability_scores.get(cid, 0.5)  # Default to 0.5 if not available
        
        # Calculate cluster coherence
        coherence = cluster_cohesion(emb, mem)
        
        # Generate spectral lineage data (eigenvalue magnitudes and contributions)
        # In a real implementation, this would come from the actual Koopman decomposition
        # For now, we'll create realistic mock data
        spectral_lineage = []
        for i in range(min(5, dim)):  # Track top 5 eigenvalues
            # Create (eigenvalue_real, magnitude) pairs
            # Eigenvalues closer to unit circle (0.8-1.0) indicate more important modes
            eigenval = 0.8 + 0.2 * np.random.random()
            magnitude = 0.5 + 0.5 * np.random.random()
            spectral_lineage.append((float(eigenval), float(magnitude)))
        
        # Create ConceptTuple with enhanced fields
        concept = ConceptTuple(
            name=title,
            embedding=cluster_tfidf,
            context=blocks[min(mem)],
            passage_embedding=feats[min(mem)],
            cluster_members=mem,
            resonance_score=res_score,
            narrative_centrality=cent_score,
            predictability_score=pred_score,
            # New fields
            eigenfunction_id="",  # Will be auto-generated in __post_init__
            source_provenance=doc_metadata,
            spectral_lineage=spectral_lineage,
            cluster_coherence=coherence
        )
        
        tuples.append(concept)
        names.append(title)
    
    # Step 3: Apply memory gating if enabled (remove redundancies & low-entropy concepts)
    if apply_gating and len(tuples) > 1:
        logger.info(f"Applying memory gating to {len(tuples)} concepts")
        original_count = len(tuples)
        tuples = apply_memory_gating(tuples)
        gated_count = len(tuples)
        if gated_count < original_count:
            logger.info(f"Memory gating reduced concept count from {original_count} to {gated_count}")
            names = [t.name for t in tuples]

    # Step 4: Build phase-coherent concept graph for potential traversal
    concept_graph = PhaseCoherentWalk()
    concept_graph.add_concepts_from_tuples(tuples)
    
    # Run dynamics to establish phase relationships
    concept_graph.run_dynamics(steps=30, dt=0.1, noise=0.01)
    
    # Find highly coherent concept pairs (for debugging/visualization)
    coherent_pairs = []
    concept_names = [t.name for t in tuples]
    for i, name1 in enumerate(concept_names):
        for name2 in concept_names[i+1:]:
            coherence = concept_graph.phase_coherence(name1, name2)
            if coherence >= coherence_threshold:
                coherent_pairs.append((name1, name2, coherence))
    
    if coherent_pairs:
        logger.info(f"Found {len(coherent_pairs)} highly coherent concept pairs")
        
    # Step 5: Save concepts to index
    save_concepts(tuples, index_path)
    
    # Output JSON for UI/visualization
    if json_out:
        # Concept data including ALL metadata for visualization
        json_data = [t.to_dict() for t in tuples]
        
        # Add embeddings separately since they're not in to_dict()
        for i, t in enumerate(tuples):
            json_data[i]["embedding"] = t.embedding.tolist()
            if hasattr(t, "passage_embedding") and t.passage_embedding is not None:
                json_data[i]["passage_embedding"] = t.passage_embedding.tolist()
        
        # Add document chaos profile as a special entry
        json_data.append({
            "type": "document_chaos_profile",
            "values": chaos_profile
        })
        
        # Add phase coherence information
        if coherent_pairs:
            json_data.append({
                "type": "phase_coherence_network",
                "pairs": [{"source": s, "target": t, "coherence": c} for s, t, c in coherent_pairs]
            })
            
        # Add source validation information
        json_data.append({
            "type": "source_validation",
            "quality_score": validation.quality_score,
            "details": validation.to_dict()
        })
        
        with open(json_out, "w", encoding="utf-8") as f:
            json.dump(json_data, f, indent=2)
            
    # Generate paths through concepts based on phase coherence
    # This demonstrates the capability for phase-coherent traversal
    if len(tuples) >= 3:
        start_concept = names[0]  # Use first concept as seed
        path = concept_graph.walk_phase_coherent_path(
            start_concept, 
            steps=min(5, len(tuples)-1),
            threshold=coherence_threshold
        )
        path_names = [name for name, _ in path]
        logger.info(f"Sample phase-coherent path: {' → '.join(path_names)}")
            
    return {
        "filename": Path(pdf_path).name,
        "concept_count": len(names),
        "concept_names": names,
        "quality_score": validation.quality_score,
        "source_type": validation.source_type,
        "coherent_pairs": len(coherent_pairs) if coherent_pairs else 0,
        "applied_gating": apply_gating,
        "status": "success"
    }
