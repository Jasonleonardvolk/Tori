"""demo_phase_reasoning.py - Demonstrates ALAN's phase-coherent reasoning capabilities.

This script provides a demonstration of ALAN's novel approach to logical inference
based on phase synchronization dynamics instead of traditional truth values or
probability theory. The demo shows how valid inferences naturally emerge from stable
phase relationships between concepts without requiring explicit logical rules.

Key demonstrations:
1. Basic inference testing using phase coherence
2. Modal reasoning (necessary vs. possible truths)
3. Integration with ALAN's Phase IV components
"""

import os
import sys
import time
import logging
import numpy as np
import random
import json
from datetime import datetime
import argparse
import math

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("logs/phase_reasoning_demo.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("alan_phase_reasoning_demo")

# Ensure path includes current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import ALAN components
try:
    from ingest_pdf.models import ConceptTuple
    from ingest_pdf.koopman_phase_graph import get_koopman_phase_graph, ConceptNode
    from ingest_pdf.memory_sculptor import get_memory_sculptor
    from ingest_pdf.phase_reasoning import (
        get_phase_reasoner, 
        PremiseNetwork, 
        InferenceResult, 
        PossibleWorld,
        PhaseValidity,
        ReasoningResult,
        ModalResult
    )
except ImportError as e:
    logger.error(f"Failed to import ALAN components: {e}")
    logger.error("Please make sure the ALAN system is properly installed.")
    sys.exit(1)

# Ensure directories exist
def ensure_directories():
    """Create necessary directories."""
    os.makedirs("logs", exist_ok=True)
    os.makedirs("output", exist_ok=True)

# Generate demo concepts
def generate_demo_concepts(count: int = 30, embedding_dim: int = 256) -> dict:
    """
    Generate demo concepts with specific logical relationships for demonstration.
    
    Args:
        count: Total number of concepts to generate
        embedding_dim: Dimension of concept embeddings
        
    Returns:
        Dictionary with concept information
    """
    logger.info(f"Generating {count} demo concepts")
    
    # Get Koopman graph
    koopman_graph = get_koopman_phase_graph()
    
    # Create concepts dict to store information
    concepts = {
        "all": [],  # All concept IDs
        "classes": {},  # Concepts organized by class
        "relations": []  # Logical relations between concepts
    }
    
    # Define concept classes with specific relationships
    class_definitions = [
        # Animals
        {
            "name": "animals",
            "instances": ["Dog", "Cat", "Bird", "Fish", "Horse"],
            "properties": ["Mammal", "HasFur", "CanFly", "HasGills", "HasFeathers"]
        },
        # Shapes
        {
            "name": "shapes",
            "instances": ["Circle", "Square", "Triangle", "Rectangle", "Hexagon"],
            "properties": ["Round", "HasRightAngles", "HasEqualSides", "ThreeSided", "TwoDimensional"]
        },
        # Electronics
        {
            "name": "electronics",
            "instances": ["Computer", "Smartphone", "Television", "Tablet", "Camera"],
            "properties": ["HasScreen", "Portable", "HasProcessor", "HasCamera", "UsesElectricity"]
        }
    ]
    
    # Create base embeddings for each class (to ensure intra-class similarity)
    class_embeddings = {}
    for class_def in class_definitions:
        # Create random base embedding
        base_embedding = np.random.normal(0, 1, size=embedding_dim)
        base_embedding = base_embedding / np.linalg.norm(base_embedding)
        class_embeddings[class_def["name"]] = base_embedding
    
    # Create concepts for each class
    concept_id_map = {}  # Map from name to ID
    
    for class_def in class_definitions:
        class_name = class_def["name"]
        concepts["classes"][class_name] = {
            "instances": [],
            "properties": []
        }
        
        # Get base embedding for this class
        base_embedding = class_embeddings[class_name]
        
        # Create instance concepts
        for instance_name in class_def["instances"]:
            # Add some noise to base embedding
            noise = np.random.normal(0, 0.3, size=embedding_dim)
            instance_embedding = base_embedding + noise
            instance_embedding = instance_embedding / np.linalg.norm(instance_embedding)
            
            # Create concept
            concept = koopman_graph.create_concept_from_embedding(
                name=instance_name,
                embedding=instance_embedding,
                source_document_id=f"demo_{class_name}",
                source_location=f"instance_{instance_name}"
            )
            
            # Store concept ID
            concept_id_map[instance_name] = concept.id
            concepts["all"].append(concept.id)
            concepts["classes"][class_name]["instances"].append(concept.id)
            
        # Create property concepts
        for property_name in class_def["properties"]:
            # Add different noise to base embedding
            noise = np.random.normal(0, 0.3, size=embedding_dim)
            property_embedding = base_embedding + noise
            property_embedding = property_embedding / np.linalg.norm(property_embedding)
            
            # Create concept
            concept = koopman_graph.create_concept_from_embedding(
                name=property_name,
                embedding=property_embedding,
                source_document_id=f"demo_{class_name}",
                source_location=f"property_{property_name}"
            )
            
            # Store concept ID
            concept_id_map[property_name] = concept.id
            concepts["all"].append(concept.id)
            concepts["classes"][class_name]["properties"].append(concept.id)
    
    # Define logical relations between concepts
    logical_relations = [
        # Animal relations
        {"premise": ["Dog"], "conclusion": "Mammal", "valid": True},
        {"premise": ["Cat"], "conclusion": "Mammal", "valid": True},
        {"premise": ["Dog"], "conclusion": "HasFur", "valid": True},
        {"premise": ["Cat"], "conclusion": "HasFur", "valid": True},
        {"premise": ["Bird"], "conclusion": "CanFly", "valid": True},
        {"premise": ["Bird"], "conclusion": "HasFeathers", "valid": True},
        {"premise": ["Fish"], "conclusion": "HasGills", "valid": True},
        {"premise": ["Horse"], "conclusion": "Mammal", "valid": True},
        {"premise": ["Fish"], "conclusion": "Mammal", "valid": False},
        {"premise": ["Bird"], "conclusion": "Mammal", "valid": False},
        {"premise": ["Dog"], "conclusion": "CanFly", "valid": False},
        {"premise": ["Cat"], "conclusion": "HasGills", "valid": False},
        
        # Shape relations
        {"premise": ["Circle"], "conclusion": "Round", "valid": True},
        {"premise": ["Square"], "conclusion": "HasRightAngles", "valid": True},
        {"premise": ["Square"], "conclusion": "HasEqualSides", "valid": True},
        {"premise": ["Triangle"], "conclusion": "ThreeSided", "valid": True},
        {"premise": ["Rectangle"], "conclusion": "HasRightAngles", "valid": True},
        {"premise": ["Hexagon"], "conclusion": "TwoDimensional", "valid": True},
        {"premise": ["Circle"], "conclusion": "HasRightAngles", "valid": False},
        {"premise": ["Triangle"], "conclusion": "Round", "valid": False},
        
        # Electronics relations
        {"premise": ["Computer"], "conclusion": "HasProcessor", "valid": True},
        {"premise": ["Smartphone"], "conclusion": "Portable", "valid": True},
        {"premise": ["Television"], "conclusion": "HasScreen", "valid": True},
        {"premise": ["Tablet"], "conclusion": "HasScreen", "valid": True},
        {"premise": ["Camera"], "conclusion": "HasCamera", "valid": True},
        {"premise": ["Computer", "Smartphone", "Television", "Tablet", "Camera"], 
         "conclusion": "UsesElectricity", "valid": True},
        {"premise": ["Television"], "conclusion": "Portable", "valid": False},
        
        # Cross-category invalid inferences
        {"premise": ["Dog"], "conclusion": "HasProcessor", "valid": False},
        {"premise": ["Circle"], "conclusion": "Mammal", "valid": False},
        {"premise": ["Smartphone"], "conclusion": "CanFly", "valid": False}
    ]
    
    # Convert logical relations to concept IDs
    for relation in logical_relations:
        premise_ids = [concept_id_map[p] for p in relation["premise"]]
        conclusion_id = concept_id_map[relation["conclusion"]]
        
        concepts["relations"].append({
            "premise_ids": premise_ids,
            "conclusion_id": conclusion_id,
            "premise_names": relation["premise"],
            "conclusion_name": relation["conclusion"],
            "valid": relation["valid"]
        })
        
    # Create connections between concepts based on logical relations
    for relation in concepts["relations"]:
        if relation["valid"]:
            # For valid relations, create strong connections in both directions
            for premise_id in relation["premise_ids"]:
                premise_concept = koopman_graph.get_concept_by_id(premise_id)
                conclusion_concept = koopman_graph.get_concept_by_id(relation["conclusion_id"])
                
                # Add edges with weight based on logical validity
                premise_concept.edges.append((relation["conclusion_id"], 0.9))
                conclusion_concept.edges.append((premise_id, 0.8))
        else:
            # For invalid relations, create weak or no connections
            for premise_id in relation["premise_ids"]:
                premise_concept = koopman_graph.get_concept_by_id(premise_id)
                conclusion_concept = koopman_graph.get_concept_by_id(relation["conclusion_id"])
                
                # Add edges with low weights or no edges
                if random.random() < 0.3:  # Only 30% chance of creating weak edges
                    premise_concept.edges.append((relation["conclusion_id"], 0.2))
                    conclusion_concept.edges.append((premise_id, 0.2))
    
    logger.info(f"Generated {len(concepts['all'])} concepts with {len(concepts['relations'])} logical relations")
    return concepts

def demonstrate_basic_inference(demo_concepts: dict) -> None:
    """
    Demonstrate basic inference using phase coherence.
    
    Args:
        demo_concepts: Dictionary with demo concept information
    """
    print("\n" + "="*60)
    print(" Basic Phase-Coherent Inference Demonstration ")
    print("="*60)
    
    # Get phase reasoner
    reasoner = get_phase_reasoner()
    
    # Select a few relations to demonstrate
    demo_relations = []
    valid_count = 0
    invalid_count = 0
    
    for relation in demo_concepts["relations"]:
        if relation["valid"] and valid_count < 5:
            demo_relations.append(relation)
            valid_count += 1
        elif not relation["valid"] and invalid_count < 5:
            demo_relations.append(relation)
            invalid_count += 1
            
        if valid_count >= 5 and invalid_count >= 5:
            break
    
    # Perform and display inferences
    for i, relation in enumerate(demo_relations):
        print(f"\n[{i+1}] Testing: {' & '.join(relation['premise_names'])} → {relation['conclusion_name']}")
        print(f"Expected: {'Valid' if relation['valid'] else 'Invalid'}")
        
        # Perform inference
        result = reasoner.derive_conclusions(
            premises=relation["premise_ids"],
            candidates=[relation["conclusion_id"]],
            context_depth=0
        )
        
        # Get the inference result
        inference = result.inferences.get(relation["conclusion_id"])
        
        if inference:
            print(f"Result: {'Coherent' if inference.is_coherent else 'Incoherent'}")
            print(f"Coherence score: {inference.coherence_score:.3f}")
            print(f"Phase disruption: {inference.phase_disruption:.3f}")
            print(f"Probability analog: {inference.probability_analog:.3f}")
            print(f"Modal status: {inference.modal_status}")
            
            # Get explanation
            explanation = reasoner.explain_inference(inference)
            
            # Show phase validity metrics
            validity = explanation["phase_validity"]
            print("\nPhase Validity Metrics:")
            print(f"  Coherence validity: {validity['coherence_validity']:.3f}")
            print(f"  Resilience validity: {validity['resilience_validity']:.3f}")
            print(f"  Contextual validity: {validity['contextual_validity']:.3f}")
            print(f"  Global validity: {validity['global_validity']:.3f}")
            print(f"  Aggregate score: {validity['aggregate_score']:.3f}")
            
            # Show supporting premises if any
            if explanation["supporting_concepts"]:
                print("\nSupporting premises:")
                for premise_id in explanation["supporting_concepts"]:
                    for premise in explanation["premises"]:
                        if premise["id"] == premise_id:
                            print(f"  - {premise['name']}")
                            break
            
            # Show conflicts if any
            if explanation["conflicts"]:
                print("\nConflicting premise pairs:")
                for premise_id1, premise_id2 in explanation["conflicts"]:
                    name1 = next((p["name"] for p in explanation["premises"] if p["id"] == premise_id1), premise_id1)
                    name2 = next((p["name"] for p in explanation["premises"] if p["id"] == premise_id2), premise_id2)
                    print(f"  - {name1} & {name2}")
                    
        else:
            print("Error: Inference failed")
        
        print("-" * 60)

def demonstrate_modal_reasoning(demo_concepts: dict) -> None:
    """
    Demonstrate modal reasoning (necessary, possible, contingent).
    
    Args:
        demo_concepts: Dictionary with demo concept information
    """
    print("\n" + "="*60)
    print(" Modal Phase-Coherent Reasoning Demonstration ")
    print("="*60)
    
    # Get phase reasoner
    reasoner = get_phase_reasoner()
    modal_reasoner = reasoner.modal_reasoner
    
    # Choose a few concepts from different classes to test
    animal_concepts = demo_concepts["classes"]["animals"]["instances"][:2]
    animal_properties = demo_concepts["classes"]["animals"]["properties"]
    electronics_concepts = demo_concepts["classes"]["electronics"]["instances"][:2]
    electronics_properties = demo_concepts["classes"]["electronics"]["properties"]
    
    # Test modality in animal domain
    print("\n[1] Testing modal properties in Animal domain")
    animal_context = animal_concepts
    print(f"Context: {[k for r in demo_concepts['relations'] for k in r['premise_names'] if r['premise_ids'][0] in animal_context][:2]}")
    
    for property_id in animal_properties:
        property_name = next((r["conclusion_name"] for r in demo_concepts["relations"] 
                             if r["conclusion_id"] == property_id), property_id)
        
        print(f"\nTesting modality of: {property_name}")
        
        # Test modal status
        modal_result = modal_reasoner.identify_modal_status(property_id, animal_context)
        
        print(f"Modal status: {modal_result.status}")
        print(f"Necessity degree: {modal_result.necessity_degree:.3f}")
        print(f"Possibility degree: {modal_result.possibility_degree:.3f}")
        
        # Show compatible contexts if any
        if modal_result.compatible_contexts:
            compatible_names = []
            for context_id in modal_result.compatible_contexts[:3]:  # Show at most 3
                for relation in demo_concepts["relations"]:
                    if context_id in relation["premise_ids"]:
                        name = relation["premise_names"][relation["premise_ids"].index(context_id)]
                        compatible_names.append(name)
                        break
            
            if compatible_names:
                print(f"Compatible with: {', '.join(compatible_names)}")
        
        # Show incompatible contexts if any
        if modal_result.incompatible_contexts:
            incompatible_names = []
            for context_id in modal_result.incompatible_contexts[:3]:  # Show at most 3
                for relation in demo_concepts["relations"]:
                    if context_id in relation["premise_ids"]:
                        name = relation["premise_names"][relation["premise_ids"].index(context_id)]
                        incompatible_names.append(name)
                        break
            
            if incompatible_names:
                print(f"Incompatible with: {', '.join(incompatible_names)}")
                
        print("-" * 40)
    
    # Test modality in electronics domain
    print("\n[2] Testing modal properties in Electronics domain")
    electronics_context = electronics_concepts
    print(f"Context: {[k for r in demo_concepts['relations'] for k in r['premise_names'] if r['premise_ids'][0] in electronics_context][:2]}")
    
    for property_id in electronics_properties:
        property_name = next((r["conclusion_name"] for r in demo_concepts["relations"] 
                             if r["conclusion_id"] == property_id), property_id)
        
        print(f"\nTesting modality of: {property_name}")
        
        # Test modal status
        modal_result = modal_reasoner.identify_modal_status(property_id, electronics_context)
        
        print(f"Modal status: {modal_result.status}")
        print(f"Necessity degree: {modal_result.necessity_degree:.3f}")
        print(f"Possibility degree: {modal_result.possibility_degree:.3f}")
        
        # Show compatible contexts if any
        if modal_result.compatible_contexts:
            compatible_names = []
            for context_id in modal_result.compatible_contexts[:3]:  # Show at most 3
                for relation in demo_concepts["relations"]:
                    if context_id in relation["premise_ids"]:
                        name = relation["premise_names"][relation["premise_ids"].index(context_id)]
                        compatible_names.append(name)
                        break
            
            if compatible_names:
                print(f"Compatible with: {', '.join(compatible_names)}")
        
        # Show incompatible contexts if any
        if modal_result.incompatible_contexts:
            incompatible_names = []
            for context_id in modal_result.incompatible_contexts[:3]:  # Show at most 3
                for relation in demo_concepts["relations"]:
                    if context_id in relation["premise_ids"]:
                        name = relation["premise_names"][relation["premise_ids"].index(context_id)]
                        incompatible_names.append(name)
                        break
            
            if incompatible_names:
                print(f"Incompatible with: {', '.join(incompatible_names)}")
                
        print("-" * 40)

def demonstrate_context_sensitivity(demo_concepts: dict) -> None:
    """
    Demonstrate context-sensitive inference.
    
    Args:
        demo_concepts: Dictionary with demo concept information
    """
    print("\n" + "="*60)
    print(" Context-Sensitive Phase-Coherent Reasoning Demonstration ")
    print("="*60)
    
    # Get phase reasoner
    reasoner = get_phase_reasoner()
    
    # Find relations to test with different context depths
    relation_candidates = [r for r in demo_concepts["relations"] if r["valid"]]
    test_relations = random.sample(relation_candidates, min(3, len(relation_candidates)))
    
    # Test each relation with different context depths
    for i, relation in enumerate(test_relations):
        print(f"\n[{i+1}] Testing: {' & '.join(relation['premise_names'])} → {relation['conclusion_name']}")
        
        # Test with different context depths
        for depth in [0, 1, 2]:
            print(f"\n  Context depth = {depth}:")
            
            # Perform inference
            result = reasoner.derive_conclusions(
                premises=relation["premise_ids"],
                candidates=[relation["conclusion_id"]],
                context_depth=depth
            )
            
            # Get the inference result
            inference = result.inferences.get(relation["conclusion_id"])
            
            if inference:
                print(f"  Result: {'Coherent' if inference.is_coherent else 'Incoherent'}")
                print(f"  Coherence score: {inference.coherence_score:.3f}")
                print(f"  Probability analog: {inference.probability_analog:.3f}")
                
                # Get explanation
                explanation = reasoner.explain_inference(inference)
                
                # Show contextual validity specifically
                validity = explanation["phase_validity"]
                print(f"  Contextual validity: {validity['contextual_validity']:.3f}")
                print(f"  Global validity: {validity['global_validity']:.3f}")
            else:
                print("  Error: Inference failed")
            
        print("-" * 60)
        
def demonstrate_phase_coherent_reasoning() -> None:
    """Run a complete demonstration of phase-coherent reasoning."""
    print("\n" + "="*80)
    print(" ALAN Phase-Coherent Reasoning Demonstration ")
    print(" Logical inference based on oscillator dynamics and phase synchronization ")
    print("="*80 + "\n")
    
    # Ensure directories exist
    ensure_directories()
    
    # Generate demo concepts
    print("\nGenerating demo concepts...")
    demo_concepts = generate_demo_concepts()
    
    # Demonstrate basic phase-coherent inference
    demonstrate_basic_inference(demo_concepts)
    
    # Demonstrate modal reasoning
    demonstrate_modal_reasoning(demo_concepts)
    
    # Demonstrate context sensitivity
    demonstrate_context_sensitivity(demo_concepts)
    
    # Summary
    print("\n" + "="*80)
    print(" Summary ")
    print("="*80)
    print("\nThe Phase-Coherent Reasoning Engine demonstrates how logical inference")
    print("can emerge naturally from dynamical properties rather than being imposed")
    print("through explicit rules or statistical models. Key capabilities shown:")
    print("\n1. Basic inference validation through phase synchronization")
    print("2. Modal reasoning (necessary, possible, contingent truths)")
    print("3. Context-sensitive inference with different depths")
    print("4. Integration with ALAN's Phase IV components")
    print("\nThis approach offers several advantages over traditional reasoning:")
    print("- Natural handling of ambiguity without requiring probability")
    print("- Emergence of logical relations without explicit rules")
    print("- Sensitivity to context and broader knowledge structure")
    print("- Seamless integration with ALAN's phase-based knowledge representation")
    print("\nThe dynamical approach follows a biological-inspired paradigm that's")
    print("more aligned with how the brain might perform inference through neural")
    print("synchronization, rather than through symbolic rule application.")

def main():
    """Main entry point for the demonstration."""
    parser = argparse.ArgumentParser(description="ALAN Phase-Coherent Reasoning Demonstration")
    parser.add_argument('--save-output', action='store_true', 
                        help='Save demonstration output to JSON file')
    
    args = parser.parse_args()
    
    # Redirect stdout to capture output if saving
    if args.save_output:
        output_file = f"output/phase_reasoning_demo_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Create dictionary to store captured output
        captured_output = {
            "title": "ALAN Phase-Coherent Reasoning Demonstration",
            "timestamp": datetime.now().isoformat(),
            "sections": []
        }
        
        # Run demonstration
        old_stdout = sys.stdout
        from io import StringIO
        sys.stdout = mystdout = StringIO()
        
        try:
            demonstrate_phase_coherent_reasoning()
            
            # Process captured output into sections
            output_text = mystdout.getvalue()
            sections = output_text.split("\n" + "="*60)
            
            for i, section in enumerate(sections):
                if i == 0:  # Header section
                    captured_output["introduction"] = section.strip()
                else:
                    # Extract section title and content
                    parts = section.split("\n", 2)
                    title = parts[1].strip() if len(parts) > 1 else f"Section {i}"
                    content = parts[2] if len(parts) > 2 else ""
                    
                    captured_output["sections"].append({
                        "title": title,
                        "content": content.strip()
                    })
            
            # Save to file
            with open(output_file, 'w') as f:
                json.dump(captured_output, f, indent=2)
                
            # Reset stdout
            sys.stdout = old_stdout
            print(f"Demonstration output saved to {output_file}")
            
        except Exception as e:
            sys.stdout = old_stdout
            print(f"Error during demonstration: {e}")
    else:
        # Run demonstration normally
        demonstrate_phase_coherent_reasoning()

if __name__ == "__main__":
    main()
