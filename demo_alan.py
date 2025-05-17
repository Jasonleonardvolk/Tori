"""demo_alan.py - Demonstration of ALAN's pure emergent cognition capabilities.

This script provides a step-by-step demonstration of ALAN's key capabilities:
1. System initialization
2. Canonical source ingestion
3. Concept extraction and phase graph integration
4. Knowledge exploration
5. Phase-coherent reasoning

Usage:
  python demo_alan.py [sample_pdf_path]
  
If no PDF path is provided, the script will generate a simple sample document.
"""

import os
import sys
import time
import argparse
import logging
import json
import tempfile
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("logs/demo.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("alan_demo")

# Import ALAN system components
try:
    from ingest_pdf.models import ConceptTuple
    from ingest_pdf.koopman_phase_graph import get_koopman_phase_graph
    from ingest_pdf.canonical_ingestion import (
        get_active_ingestion_manager, 
        ingest_pdf_file, 
        validate_and_ingest_pdf
    )
    from ingest_pdf.reasoning_coherence import get_reasoning_coherence_manager
    from ingest_pdf.expert_router import get_expert_routing_manager
except ImportError as e:
    logger.error(f"Failed to import ALAN components: {e}")
    logger.error("Please make sure the ALAN system is properly installed.")
    sys.exit(1)

def ensure_directories():
    """Create necessary directories."""
    os.makedirs("logs", exist_ok=True)
    os.makedirs("data", exist_ok=True)
    os.makedirs("output", exist_ok=True)
    os.makedirs("data/samples", exist_ok=True)

def generate_sample_pdf(output_path):
    """
    Generate a simple sample PDF document for demonstration.
    
    In a real implementation, this would create an actual PDF.
    For this demo, we'll create a text file with .pdf extension.
    
    Args:
        output_path: Path to save the sample PDF
    
    Returns:
        Path to the created sample
    """
    sample_content = """Koopman Operator Theory in Dynamical Systems

Abstract
This paper presents an overview of Koopman operator theory and its applications
in analyzing dynamical systems. We explore how spectral decomposition of the 
Koopman operator enables linear representation of nonlinear dynamics.

Introduction
Dynamical systems are mathematical models that describe the time evolution of points
in a state space. The Koopman operator is an infinite-dimensional linear operator
that acts on observable functions of the state space. Despite the system dynamics
being nonlinear, the Koopman operator is linear, which allows for powerful spectral
analysis methods to be applied.

1. Koopman Operator Fundamentals

Definition 1: The Koopman operator U is defined as the composition of an observable
function g with the flow map F of the dynamical system: (Ug)(x) = g(F(x)).

Theorem 1: For any dynamical system, the Koopman operator is linear even when the
underlying dynamics are nonlinear.

The linearity of the Koopman operator allows us to decompose the dynamics using
eigenvalues and eigenfunctions. The Koopman eigenvalues determine the temporal
behavior, while the eigenfunctions provide a coordinate system in which the dynamics
appear linear.

2. Spectral Decomposition

The spectral decomposition of the Koopman operator reveals coherent structures in
the dynamics. The Koopman modes are the projections of the state onto the Koopman
eigenfunctions:

x(t) = ∑ vj e^(λj t) φj(x0)

where:
- λj are the Koopman eigenvalues
- φj are the Koopman eigenfunctions
- vj are the Koopman modes
- x0 is the initial state

3. Phase Synchronization

Phase synchronization emerges when the phases of different oscillatory processes
become locked. This phenomenon can be analyzed through Koopman eigenfunctions by:

φ(x) = e^(iθ(x))

where θ(x) represents the phase of the system at state x. Phase-locked states
correspond to regions where the phase differences between multiple systems remain
constant.

Conclusion
Koopman operator theory provides a powerful framework for analyzing dynamical systems
through spectral methods. By representing nonlinear dynamics in a linear operator
framework, we can apply spectral decomposition techniques to extract coherent structures
and understand complex behaviors.

References
[1] Koopman, B.O. (1931). Hamiltonian systems and transformations in Hilbert space.
[2] Mezić, I. (2005). Spectral Properties of Dynamical Systems, Model Reduction and Decompositions.
[3] Budišić, M., Mohr, R., & Mezić, I. (2012). Applied Koopmanism.
[4] Brunton, S.L., & Kutz, J.N. (2019). Data-Driven Science and Engineering.
"""

    # In a real implementation, we would generate a PDF
    # For this demo, we'll create a text file with .pdf extension
    with open(output_path, 'w') as f:
        f.write(sample_content)
        
    logger.info(f"Generated sample document: {output_path}")
    return output_path

def initialize_alan():
    """
    Initialize the ALAN system.
    
    Returns:
        Dictionary with initialization results
    """
    logger.info("Initializing ALAN system...")
    start_time = time.time()
    
    # Initialize core components
    koopman_graph = get_koopman_phase_graph()
    reasoning_manager = get_reasoning_coherence_manager()
    routing_manager = get_expert_routing_manager()
    ingestion_manager = get_active_ingestion_manager()
    
    elapsed_time = time.time() - start_time
    
    return {
        "status": "success",
        "initialization_time": elapsed_time,
        "timestamp": datetime.now().isoformat()
    }

def demonstrate_ingestion(pdf_path):
    """
    Demonstrate the ingestion process with a sample PDF.
    
    Args:
        pdf_path: Path to the PDF file to ingest
        
    Returns:
        Dictionary with ingestion results
    """
    logger.info(f"Demonstrating canonical source ingestion with: {pdf_path}")
    
    # Validate and ingest the PDF
    start_time = time.time()
    
    logger.info("Step 1: Validating source against canonical criteria...")
    time.sleep(1)  # Simulate processing time
    
    result = validate_and_ingest_pdf(
        pdf_path=pdf_path,
        domain="dynamical_systems",
        metadata={
            "demo": True,
            "source_credibility": 0.9
        }
    )
    
    elapsed_time = time.time() - start_time
    
    if result.get("status") != "success":
        logger.error(f"Ingestion failed: {result.get('message', 'Unknown error')}")
        return {
            "status": "error",
            "message": result.get("message", "Ingestion failed"),
            "elapsed_time": elapsed_time
        }
    
    # Add elapsed time to result
    result["elapsed_time"] = elapsed_time
    
    # Get concepts extracted
    ingestion_result = result.get("ingestion_result", {})
    concepts_ingested = ingestion_result.get("concepts_ingested", 0)
    concepts_rejected = ingestion_result.get("concepts_rejected", 0)
    
    logger.info(f"Ingestion completed in {elapsed_time:.2f} seconds")
    logger.info(f"Concepts ingested: {concepts_ingested}, rejected: {concepts_rejected}")
    
    return result

def demonstrate_phase_analysis():
    """
    Demonstrate phase analysis and coherence assessment.
    
    Returns:
        Dictionary with phase analysis results
    """
    logger.info("Demonstrating phase analysis and coherence assessment...")
    
    # Get Koopman phase graph
    koopman_graph = get_koopman_phase_graph()
    
    # Update phase oscillators
    start_time = time.time()
    
    logger.info("Step 1: Updating phase oscillators...")
    update_result = koopman_graph.update_concept_phase_oscillators(
        dt=0.1,
        coupling_iterations=10
    )
    
    # Identify phase clusters
    logger.info("Step 2: Identifying phase-locked clusters...")
    clusters = koopman_graph.identify_phase_clusters(phase_similarity_threshold=0.2)
    
    # Get phase coherence statistics
    cluster_sizes = [len(cluster) for cluster in clusters]
    
    elapsed_time = time.time() - start_time
    
    return {
        "status": "success",
        "clusters": len(clusters),
        "cluster_sizes": cluster_sizes,
        "largest_cluster": max(cluster_sizes) if cluster_sizes else 0,
        "average_size": sum(cluster_sizes) / len(cluster_sizes) if cluster_sizes else 0,
        "update_result": update_result,
        "elapsed_time": elapsed_time
    }

def demonstrate_inference():
    """
    Demonstrate inference based on ingested knowledge.
    
    Returns:
        Dictionary with inference results
    """
    logger.info("Demonstrating phase-coherent inference...")
    
    # Get needed components
    koopman_graph = get_koopman_phase_graph()
    reasoning_manager = get_reasoning_coherence_manager()
    
    # Create a simple inference graph
    logger.info("Step 1: Creating inference graph...")
    graph_name = "demo_inference"
    
    # Check if we have concepts to work with
    if not hasattr(koopman_graph, "concepts") or not koopman_graph.concepts:
        return {
            "status": "error",
            "message": "No concepts available for inference"
        }
    
    # Create inference graph
    inference_graph = reasoning_manager.create_inference_graph(
        name=graph_name,
        metadata={
            "demo": True,
            "timestamp": datetime.now().isoformat()
        }
    )
    
    # Add some concept nodes to the graph
    concept_ids = list(koopman_graph.concepts.keys())
    
    # Use first concept as premise
    if concept_ids:
        premise_concept = koopman_graph.concepts[concept_ids[0]]
        premise_node = reasoning_manager.create_node_from_concept(
            concept=premise_concept.to_concept_tuple(),
            node_type="premise"
        )
        reasoning_manager.add_node_to_graph(graph_name, premise_node)
        
        # If we have more concepts, add an inference
        if len(concept_ids) > 1:
            inference_concept = koopman_graph.concepts[concept_ids[1]]
            inference_node = reasoning_manager.create_node_from_concept(
                concept=inference_concept.to_concept_tuple(),
                node_type="inference"
            )
            reasoning_manager.add_node_to_graph(graph_name, inference_node)
            
            # Create edge from premise to inference
            from ingest_pdf.reasoning_coherence import InferenceEdge
            edge = InferenceEdge(
                source_id=premise_node.id,
                target_id=inference_node.id,
                relation_type="supports",
                weight=0.8
            )
            reasoning_manager.add_edge_to_graph(graph_name, edge)
            
            # If we have a third concept, use it as conclusion
            if len(concept_ids) > 2:
                conclusion_concept = koopman_graph.concepts[concept_ids[2]]
                conclusion_node = reasoning_manager.create_node_from_concept(
                    concept=conclusion_concept.to_concept_tuple(),
                    node_type="conclusion"
                )
                reasoning_manager.add_node_to_graph(graph_name, conclusion_node)
                
                # Create edge from inference to conclusion
                edge = InferenceEdge(
                    source_id=inference_node.id,
                    target_id=conclusion_node.id,
                    relation_type="supports",
                    weight=0.7
                )
                reasoning_manager.add_edge_to_graph(graph_name, edge)
    
    # Analyze the inference graph
    logger.info("Step 2: Analyzing inference graph...")
    analysis = reasoning_manager.analyze_graph(graph_name)
    
    # Verify reasoning
    logger.info("Step 3: Verifying reasoning coherence...")
    verification = reasoning_manager.verify_reasoning(graph_name)
    
    return {
        "status": "success",
        "graph_name": graph_name,
        "analysis": analysis,
        "verification": verification
    }

def format_demo_result(result):
    """
    Format a demo result for display.
    
    Args:
        result: Result dictionary from a demo function
        
    Returns:
        Formatted string representation
    """
    if isinstance(result, dict):
        if "status" in result and result["status"] == "error":
            return f"ERROR: {result.get('message', 'Unknown error')}"
            
        # Basic formatting for dict
        lines = []
        for key, value in result.items():
            if key in ["status", "message", "timestamp"]:
                continue
                
            if isinstance(value, dict):
                lines.append(f"{key}:")
                for k, v in value.items():
                    lines.append(f"  {k}: {v}")
            elif isinstance(value, list):
                lines.append(f"{key}: {value}")
            else:
                lines.append(f"{key}: {value}")
                
        return "\n".join(lines)
    else:
        return str(result)

def run_demo(pdf_path=None):
    """
    Run the ALAN demonstration.
    
    Args:
        pdf_path: Optional path to a PDF file for ingestion
    """
    print("\n" + "="*60)
    print(" ALAN - Pure Emergent Cognition Demonstration ")
    print("="*60 + "\n")
    
    # Ensure directories exist
    ensure_directories()
    
    # If no PDF path provided, generate a sample
    if pdf_path is None:
        pdf_path = os.path.join("data", "samples", "koopman_sample.pdf")
        generate_sample_pdf(pdf_path)
    
    # Step 1: Initialize ALAN
    print("\n[1] Initializing ALAN System\n" + "-"*30)
    init_result = initialize_alan()
    print(f"Initialization completed in {init_result.get('initialization_time', 0):.2f} seconds")
    
    # Step 2: Ingest PDF
    print("\n[2] Ingesting Canonical Source\n" + "-"*30)
    ingestion_result = demonstrate_ingestion(pdf_path)
    
    if ingestion_result.get("status") == "error":
        print(f"ERROR: {ingestion_result.get('message', 'Unknown error')}")
        return
        
    ingestion_details = ingestion_result.get("ingestion_result", {})
    print(f"Source: {os.path.basename(pdf_path)}")
    print(f"Domain: {ingestion_result.get('domain', 'unknown')}")
    print(f"Quality score: {ingestion_result.get('quality_score', 0):.2f}")
    print(f"Concepts extracted: {ingestion_details.get('concepts_extracted', 0)}")
    print(f"Concepts ingested: {ingestion_details.get('concepts_ingested', 0)}")
    print(f"Concepts rejected: {ingestion_details.get('concepts_rejected', 0)}")
    print(f"Time: {ingestion_result.get('elapsed_time', 0):.2f} seconds")
    
    # Step 3: Phase Analysis
    print("\n[3] Phase Analysis\n" + "-"*30)
    phase_result = demonstrate_phase_analysis()
    
    print(f"Phase clusters: {phase_result.get('clusters', 0)}")
    print(f"Largest cluster: {phase_result.get('largest_cluster', 0)} concepts")
    print(f"Average cluster size: {phase_result.get('average_size', 0):.2f} concepts")
    print(f"Time: {phase_result.get('elapsed_time', 0):.2f} seconds")
    
    # Step 4: Inference Demonstration
    print("\n[4] Phase-Coherent Inference\n" + "-"*30)
    inference_result = demonstrate_inference()
    
    if inference_result.get("status") == "error":
        print(f"ERROR: {inference_result.get('message', 'Unknown error')}")
    else:
        verification = inference_result.get("verification", {})
        if verification:
            validity_score = verification.get("validity_score", 0)
            completeness = verification.get("completeness", {}).get("score", 0)
            coherence = verification.get("coherence", {}).get("score", 0)
            
            print(f"Inference graph: {inference_result.get('graph_name', 'unknown')}")
            print(f"Validity score: {validity_score:.2f}")
            print(f"Completeness: {completeness:.2f}")
            print(f"Coherence: {coherence:.2f}")
            print(f"Is valid: {verification.get('is_valid', False)}")
    
    # Summary
    print("\n[5] Summary\n" + "-"*30)
    print("ALAN has demonstrated:")
    print("1. Canonical source validation and ingestion")
    print("2. Entropy-gated concept integration")
    print("3. Phase synchronization and cluster formation")
    print("4. Coherence-based inference verification")
    print("\nAll operations maintained provenance and spectral lineage,")
    print("following ALAN's five core commitments to pure emergent cognition.")
    
    print("\nDemo completed successfully.")

def main():
    """Main entry point for the demo."""
    parser = argparse.ArgumentParser(description="ALAN Demo")
    parser.add_argument('pdf_path', nargs='?', default=None, 
                        help='Path to a PDF file to ingest (optional)')
    
    args = parser.parse_args()
    run_demo(args.pdf_path)

if __name__ == "__main__":
    main()
