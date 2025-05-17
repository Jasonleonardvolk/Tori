"""demo_phase_iv.py - Demonstrates ALAN's semantic sovereignty through Phase IV components.

This script provides a demonstration of ALAN's Phase IV capabilities:
1. Dynamic concept lifecycle management through Memory Sculptor
2. Topological refinement through Ontology Refactor Engine
3. Meaningful concept naming through Ghost Label Synthesizer

These capabilities combine to create a system with true semantic sovereignty, where
concepts are not just stored, but dynamically shaped, refined, and given meaningful labels.
"""

import os
import sys
import time
import argparse
import logging
import json
from datetime import datetime
import random
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("logs/phase_iv_demo.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("alan_phase_iv_demo")

# Ensure path includes the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import ALAN components
try:
    from ingest_pdf.models import ConceptTuple
    from ingest_pdf.koopman_phase_graph import get_koopman_phase_graph, ConceptNode
    from ingest_pdf.memory_sculptor import get_memory_sculptor, ConceptState
    from ingest_pdf.ontology_refactor_engine import get_ontology_refactor_engine, RefactorOperation
    from ingest_pdf.ghost_label_synthesizer import get_ghost_label_synthesizer
except ImportError as e:
    logger.error(f"Failed to import ALAN components: {e}")
    logger.error("Please make sure the ALAN system is properly installed.")
    sys.exit(1)

# Ensure directories exist
def ensure_directories():
    """Create necessary directories."""
    os.makedirs("logs", exist_ok=True)
    os.makedirs("data", exist_ok=True)
    os.makedirs("output", exist_ok=True)

# Create some demo concepts
def generate_demo_concepts(count: int = 20, embedding_dim: int = 768) -> Dict[str, Any]:
    """
    Generate demo concepts for the demonstration.
    
    Args:
        count: Number of concepts to generate
        embedding_dim: Dimension of concept embeddings
        
    Returns:
        Dictionary with concept generation results
    """
    logger.info(f"Generating {count} demo concepts with dimension {embedding_dim}")
    
    # Get Koopman graph
    koopman_graph = get_koopman_phase_graph()
    
    # Generate concepts with specific patterns for clustering
    concept_ids = []
    
    # Create several concept clusters with similar embeddings
    clusters = 4
    concepts_per_cluster = count // clusters
    
    domain_types = ["mathematics", "physics", "dynamical_systems", "computer_science"]
    
    for cluster_idx in range(clusters):
        # Create a base embedding for this cluster
        base_embedding = np.random.normal(0, 1, size=embedding_dim)
        base_embedding = base_embedding / np.linalg.norm(base_embedding)
        
        # Create concepts in this cluster
        for i in range(concepts_per_cluster):
            # Add noise to create variation
            noise = np.random.normal(0, 0.2, size=embedding_dim)
            embedding = base_embedding + noise
            embedding = embedding / np.linalg.norm(embedding)
            
            # Create the concept
            name = f"DemoConcept_Cluster{cluster_idx+1}_{i+1}"
            domain = domain_types[cluster_idx % len(domain_types)]
            
            concept = koopman_graph.create_concept_from_embedding(
                name=name,
                embedding=embedding,
                source_document_id=f"demo_doc_{cluster_idx}",
                source_location=f"location_{i}"
            )
            
            concept_ids.append(concept.id)
            
    # Create edges between concepts
    edge_count = 0
    
    # Connect concepts within each cluster
    for cluster_idx in range(clusters):
        cluster_start = cluster_idx * concepts_per_cluster
        cluster_end = (cluster_idx + 1) * concepts_per_cluster
        
        # Get concepts in this cluster
        cluster_concept_ids = concept_ids[cluster_start:cluster_end]
        
        # Connect concepts
        for i, concept_id1 in enumerate(cluster_concept_ids):
            concept1 = koopman_graph.get_concept_by_id(concept_id1)
            
            for j, concept_id2 in enumerate(cluster_concept_ids):
                if i != j:  # Don't connect to self
                    # Add edge with high weight
                    edge_weight = 0.7 + random.random() * 0.3  # 0.7-1.0
                    concept1.edges.append((concept_id2, edge_weight))
                    edge_count += 1
                    
    # Add some cross-cluster connections
    for _ in range(count // 2):
        concept_id1 = random.choice(concept_ids)
        concept_id2 = random.choice(concept_ids)
        
        if concept_id1 != concept_id2:
            concept1 = koopman_graph.get_concept_by_id(concept_id1)
            
            # Check if edge already exists
            if not any(edge_id == concept_id2 for edge_id, _ in concept1.edges):
                # Add edge with lower weight
                edge_weight = 0.2 + random.random() * 0.4  # 0.2-0.6
                concept1.edges.append((concept_id2, edge_weight))
                edge_count += 1
                
    # Create some unstable concepts
    unstable_count = count // 5
    unstable_ids = []
    
    for i in range(unstable_count):
        # Create random embedding
        embedding = np.random.normal(0, 1, size=embedding_dim)
        embedding = embedding / np.linalg.norm(embedding)
        
        # Create the concept
        name = f"UnstableConcept_{i+1}"
        
        concept = koopman_graph.create_concept_from_embedding(
            name=name,
            embedding=embedding,
            source_document_id="unstable_doc",
            source_location=f"location_{i}"
        )
        
        # Add a few random edges
        edge_count_for_this = random.randint(1, 3)
        for _ in range(edge_count_for_this):
            target_id = random.choice(concept_ids)
            weight = 0.1 + random.random() * 0.3  # 0.1-0.4
            concept.edges.append((target_id, weight))
            edge_count += 1
            
        concept_ids.append(concept.id)
        unstable_ids.append(concept.id)
        
    # Create a hub concept with many connections
    hub_embedding = np.random.normal(0, 1, size=embedding_dim)
    hub_embedding = hub_embedding / np.linalg.norm(hub_embedding)
    
    hub_concept = koopman_graph.create_concept_from_embedding(
        name="HubConcept",
        embedding=hub_embedding,
        source_document_id="hub_doc",
        source_location="hub_location"
    )
    
    # Connect to many concepts
    for concept_id in concept_ids:
        if random.random() < 0.7:  # 70% chance of connection
            weight = 0.3 + random.random() * 0.6  # 0.3-0.9
            hub_concept.edges.append((concept_id, weight))
            edge_count += 1
            
    concept_ids.append(hub_concept.id)
    
    # Create concept states for tracking
    memory_sculptor = get_memory_sculptor()
    
    for concept_id in concept_ids:
        # Create state with random properties
        state = ConceptState(psi_id=concept_id)
        
        # Set properties based on concept type
        if concept_id in unstable_ids:
            # Unstable concepts
            state.stability_score = random.uniform(0.1, 0.3)
            state.phase_desyncs = random.randint(10, 20)
            state.resonance_count = random.randint(0, 3)
        elif concept_id == hub_concept.id:
            # Hub concept
            state.stability_score = random.uniform(0.5, 0.7)
            state.phase_desyncs = random.randint(3, 8)
            state.resonance_count = random.randint(15, 25)
        else:
            # Regular concepts
            state.stability_score = random.uniform(0.6, 0.9)
            state.phase_desyncs = random.randint(0, 5)
            state.resonance_count = random.randint(5, 15)
            
        # Add to memory sculptor
        memory_sculptor.concept_states[concept_id] = state
        
    return {
        "status": "success",
        "concept_count": len(concept_ids),
        "edge_count": edge_count,
        "cluster_count": clusters,
        "concept_ids": concept_ids,
        "unstable_ids": unstable_ids,
        "hub_id": hub_concept.id
    }

def demonstrate_memory_sculptor() -> Dict[str, Any]:
    """
    Demonstrate memory sculptor capabilities.
    
    Returns:
        Dictionary with demonstration results
    """
    logger.info("Demonstrating Memory Sculptor capabilities")
    
    sculptor = get_memory_sculptor()
    koopman_graph = get_koopman_phase_graph()
    
    # Get all concept IDs
    concept_ids = list(koopman_graph.concepts.keys())
    
    # Ensure we have concepts
    if not concept_ids:
        return {
            "status": "error",
            "message": "No concepts found to demonstrate on"
        }
        
    # 1. Show initial concept states
    start_time = time.time()
    initial_stats = {}
    
    logger.info("Step 1: Retrieving initial concept states...")
    concept_states = sculptor.get_concept_states()
    
    active_count = 0
    by_stability = {"low": 0, "medium": 0, "high": 0}
    
    for concept_id, state_dict in concept_states.items():
        if state_dict.get("is_active", True):
            active_count += 1
            
        stability = state_dict.get("stability_score", 0)
        if stability < 0.4:
            by_stability["low"] += 1
        elif stability < 0.7:
            by_stability["medium"] += 1
        else:
            by_stability["high"] += 1
            
    initial_stats["active_count"] = active_count
    initial_stats["total_count"] = len(concept_states)
    initial_stats["by_stability"] = by_stability
    
    # 2. Run maintenance cycle
    logger.info("Step 2: Running maintenance cycle...")
    maintenance_result = sculptor.run_maintenance_cycle()
    
    # 3. Show post-maintenance statistics
    logger.info("Step 3: Retrieving post-maintenance statistics...")
    post_stats = sculptor.get_sculptural_statistics()
    
    elapsed_time = time.time() - start_time
    
    return {
        "status": "success",
        "initial_stats": initial_stats,
        "maintenance_result": maintenance_result,
        "post_stats": post_stats,
        "elapsed_time": elapsed_time
    }

def demonstrate_ontology_refactoring() -> Dict[str, Any]:
    """
    Demonstrate ontology refactoring capabilities.
    
    Returns:
        Dictionary with demonstration results
    """
    logger.info("Demonstrating Ontology Refactor Engine capabilities")
    
    refactor_engine = get_ontology_refactor_engine()
    koopman_graph = get_koopman_phase_graph()
    
    # Get all concept IDs
    concept_ids = list(koopman_graph.concepts.keys())
    
    # Ensure we have concepts
    if not concept_ids:
        return {
            "status": "error",
            "message": "No concepts found to demonstrate on"
        }
        
    # 1. Find redundant clusters
    start_time = time.time()
    
    logger.info("Step 1: Finding redundant concept clusters...")
    redundant_result = refactor_engine.find_redundant_clusters(
        min_redundancy_score=0.75,
        max_results=3
    )
    
    # 2. Detect ambiguous phase profiles
    logger.info("Step 2: Detecting ambiguous phase profiles...")
    ambiguous_result = refactor_engine.detect_ambiguous_phase_profiles(
        max_results=3
    )
    
    # 3. Run a refactor cycle
    logger.info("Step 3: Running refactor cycle...")
    refactor_result = refactor_engine.run_refactor_cycle()
    
    elapsed_time = time.time() - start_time
    
    return {
        "status": "success",
        "redundant_clusters": redundant_result,
        "ambiguous_concepts": ambiguous_result,
        "refactor_result": refactor_result,
        "elapsed_time": elapsed_time
    }

def demonstrate_ghost_label_synthesis() -> Dict[str, Any]:
    """
    Demonstrate ghost label synthesis capabilities.
    
    Returns:
        Dictionary with demonstration results
    """
    logger.info("Demonstrating Ghost Label Synthesizer capabilities")
    
    synthesizer = get_ghost_label_synthesizer()
    koopman_graph = get_koopman_phase_graph()
    
    # Get all concept IDs
    concept_ids = list(koopman_graph.concepts.keys())
    
    # Ensure we have concepts
    if not concept_ids:
        return {
            "status": "error",
            "message": "No concepts found to demonstrate on"
        }
        
    # 1. Generate names for individual concepts
    start_time = time.time()
    
    logger.info("Step 1: Generating names for individual concepts...")
    individual_names = {}
    
    # Select a few concepts to name
    selected_ids = random.sample(concept_ids, min(5, len(concept_ids)))
    
    domain_types = ["mathematics", "physics", "dynamical_systems", "computer_science"]
    complexity_types = ["simple", "moderate", "complex"]
    
    for i, concept_id in enumerate(selected_ids):
        # Use different domains and complexities for variety
        domain = domain_types[i % len(domain_types)]
        complexity = complexity_types[i % len(complexity_types)]
        
        result = synthesizer.generate_name(
            concept_id=concept_id,
            domain=domain,
            complexity=complexity
        )
        
        if result.get("status") == "success":
            individual_names[concept_id] = {
                "original_name": result.get("original_name"),
                "generated_name": result.get("name"),
                "domain": domain,
                "complexity": complexity
            }
            
    # 2. Generate coordinated names for a cluster
    logger.info("Step 2: Generating coordinated names for a cluster...")
    
    # Find a cluster of related concepts
    cluster_concepts = []
    
    for concept_id in concept_ids[:10]:  # Limit search to first 10
        concept = koopman_graph.get_concept_by_id(concept_id)
        if concept and len(concept.edges) >= 3:
            # Get connected concepts
            connected = [target_id for target_id, _ in concept.edges[:3]]
            if len(connected) >= 3:
                # Add focus concept and its connections
                cluster_concepts = [concept_id] + connected
                break
                
    if not cluster_concepts:
        # Fallback if no natural cluster found
        cluster_concepts = concept_ids[:4]
        
    # Generate coordinated names
    cluster_result = synthesizer.generate_names_for_cluster(
        concept_ids=cluster_concepts,
        domain="dynamical_systems",
        complexity="moderate"
    )
    
    elapsed_time = time.time() - start_time
    
    return {
        "status": "success",
        "individual_names": individual_names,
        "cluster_result": cluster_result,
        "elapsed_time": elapsed_time
    }

def run_phase_iv_demo() -> Dict[str, Any]:
    """
    Run a complete demonstration of Phase IV components.
    
    Returns:
        Dictionary with overall demonstration results
    """
    print("\n" + "="*60)
    print(" ALAN Phase IV - Semantic Sovereignty Demonstration ")
    print("="*60 + "\n")
    
    # Ensure directories exist
    ensure_directories()
    
    # Step 1: Generate demo concepts
    print("\n[1] Generating Demo Concepts\n" + "-"*30)
    concepts_result = generate_demo_concepts(count=30)
    
    if concepts_result.get("status") != "success":
        print(f"Error generating concepts: {concepts_result.get('message', 'Unknown error')}")
        return concepts_result
        
    print(f"Generated {concepts_result.get('concept_count')} demo concepts")
    print(f"Created {concepts_result.get('edge_count')} edges")
    print(f"Organized into {concepts_result.get('cluster_count')} main clusters")
    print(f"Created {len(concepts_result.get('unstable_ids', []))} unstable concepts")
    print(f"Created 1 hub concept (ID: {concepts_result.get('hub_id')})")
    
    # Step 2: Demonstrate Memory Sculptor
    print("\n[2] Memory Sculptor Demonstration\n" + "-"*30)
    sculptor_result = demonstrate_memory_sculptor()
    
    if sculptor_result.get("status") != "success":
        print(f"Error demonstrating Memory Sculptor: {sculptor_result.get('message', 'Unknown error')}")
        return sculptor_result
        
    initial_stats = sculptor_result.get("initial_stats", {})
    maintenance_result = sculptor_result.get("maintenance_result", {})
    post_stats = sculptor_result.get("post_stats", {})
    
    # Print initial stats
    print("Initial concept statistics:")
    print(f"Total concepts: {initial_stats.get('total_count', 0)}")
    print(f"Active concepts: {initial_stats.get('active_count', 0)}")
    print("Stability distribution:")
    stability_dist = initial_stats.get("by_stability", {})
    print(f"  Low stability: {stability_dist.get('low', 0)}")
    print(f"  Medium stability: {stability_dist.get('medium', 0)}")
    print(f"  High stability: {stability_dist.get('high', 0)}")
    
    # Print maintenance results
    print("\nMaintenance cycle results:")
    print(f"Pruned concepts: {maintenance_result.get('pruned_count', 0)}")
    print(f"Stabilized clusters: {maintenance_result.get('stabilized_clusters', 0)}")
    print(f"Spawned concepts: {maintenance_result.get('spawned_count', 0)}")
    print(f"Time: {maintenance_result.get('elapsed_time', 0):.2f} seconds")
    
    # Step 3: Demonstrate Ontology Refactoring
    print("\n[3] Ontology Refactoring Demonstration\n" + "-"*30)
    refactor_result = demonstrate_ontology_refactoring()
    
    if refactor_result.get("status") != "success":
        print(f"Error demonstrating Ontology Refactoring: {refactor_result.get('message', 'Unknown error')}")
        return refactor_result
        
    redundant_clusters = refactor_result.get("redundant_clusters", {}).get("redundant_clusters", [])
    ambiguous_concepts = refactor_result.get("ambiguous_concepts", {}).get("ambiguous_concepts", [])
    refactor_cycle = refactor_result.get("refactor_result", {})
    
    # Print redundant clusters
    print("Redundant clusters detected:")
    for i, cluster in enumerate(redundant_clusters):
        print(f"  Cluster {i+1}: {cluster.get('size')} concepts, avg similarity: {cluster.get('avg_similarity', 0):.2f}")
        print(f"    Concepts: {', '.join(cluster.get('concept_names', []))[:100]}...")
        
    # Print ambiguous concepts
    print("\nAmbiguous concepts detected:")
    for i, concept in enumerate(ambiguous_concepts):
        print(f"  {i+1}. {concept.get('name')} (ambiguity: {concept.get('ambiguity_score', 0):.2f})")
        
    # Print refactor cycle results
    print("\nRefactoring cycle results:")
    print(f"Merge operations: {refactor_cycle.get('merge_count', 0)}")
    print(f"Split operations: {refactor_cycle.get('split_count', 0)}")
    print(f"Untangle operations: {refactor_cycle.get('untangle_count', 0)}")
    print(f"Time: {refactor_cycle.get('elapsed_time', 0):.2f} seconds")
    
    # Step 4: Demonstrate Ghost Label Synthesis
    print("\n[4] Ghost Label Synthesis Demonstration\n" + "-"*30)
    synthesis_result = demonstrate_ghost_label_synthesis()
    
    if synthesis_result.get("status") != "success":
        print(f"Error demonstrating Ghost Label Synthesis: {synthesis_result.get('message', 'Unknown error')}")
        return synthesis_result
        
    individual_names = synthesis_result.get("individual_names", {})
    cluster_result = synthesis_result.get("cluster_result", {})
    
    # Print individual names
    print("Individual concept names generated:")
    for concept_id, name_data in individual_names.items():
        print(f"  Original: '{name_data.get('original_name')}'")
        print(f"  Generated: '{name_data.get('generated_name')}'")
        print(f"  Domain: {name_data.get('domain')}, Complexity: {name_data.get('complexity')}")
        print()
        
    # Print cluster names
    print("\nCoordinated cluster names generated:")
    cluster_names = cluster_result.get("names", {})
    for concept_id, name in cluster_names.items():
        concept = get_koopman_phase_graph().get_concept_by_id(concept_id)
        original_name = concept.name if concept else "Unknown"
        print(f"  Original: '{original_name}'")
        print(f"  Generated: '{name}'")
        print()
        
    # Summary
    print("\n[5] Summary\n" + "-"*30)
    print("ALAN Phase IV Demonstration has showcased:")
    print("1. Memory Sculptor - Dynamic concept lifecycle management")
    print("   - Pruning unstable concepts")
    print("   - Stabilizing coherent clusters")
    print("   - Spawning new emergent concepts")
    
    print("\n2. Ontology Refactor Engine - Topological refinement")
    print("   - Finding and merging redundant concepts")
    print("   - Splitting ambiguous concepts")
    print("   - Untangling hub nodes")
    
    print("\n3. Ghost Label Synthesizer - Meaningful concept naming")
    print("   - Generating names from spectral fingerprints")
    print("   - Creating coordinated names for concept clusters")
    print("   - Adapting to different domains and complexity levels")
    
    print("\nTogether, these capabilities enable true semantic sovereignty where")
    print("ALAN's knowledge is not just stored, but actively shaped, structured,")
    print("and meaningfully labeled through phase-coherent processes.")
    
    return {
        "status": "success",
        "concepts_result": concepts_result,
        "sculptor_result": sculptor_result,
        "refactor_result": refactor_result,
        "synthesis_result": synthesis_result
    }

def main():
    """Main entry point for the demonstration."""
    parser = argparse.ArgumentParser(description="ALAN Phase IV Demonstration")
    parser.add_argument('--save-output', action='store_true', 
                        help='Save demonstration output to JSON file')
    
    args = parser.parse_args()
    result = run_phase_iv_demo()
    
    if args.save_output and result.get("status") == "success":
        output_file = f"output/phase_iv_demo_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2, default=str)
        print(f"\nDemonstration output saved to {output_file}")

if __name__ == "__main__":
    main()
