"""
mesh_proposal_client.py — Template for External Modules
------------------------------------------------------
REFACTOR GUIDE: Replace all direct mesh writes with HTTP POSTs to Prajna API.

Use this template to convert any module that currently calls mesh methods directly.
"""

import requests
import json
from datetime import datetime
from typing import Dict, Any, Optional

# Prajna API endpoint for mesh proposals
PRAJNA_PROPOSAL_URL = "http://localhost:8001/api/prajna/propose"

def propose_to_mesh(concept: str, context: str, provenance: Optional[Dict[str, Any]] = None) -> Optional[Dict]:
    """
    Send concept proposal to Prajna API (ONLY allowed mesh write method).
    
    Args:
        concept: The concept name/title
        context: Source context or description
        provenance: Origin metadata (source, timestamp, etc.)
    
    Returns:
        Response from Prajna API or None if failed
    """
    if provenance is None:
        provenance = {
            "source": "external_module",
            "timestamp": datetime.utcnow().isoformat(),
            "method": "proposal"
        }
    
    proposal = {
        "concept": concept,
        "context": context,
        "provenance": provenance
    }
    
    try:
        response = requests.post(
            PRAJNA_PROPOSAL_URL, 
            json=proposal,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        response.raise_for_status()
        result = response.json()
        
        print(f"✅ Concept proposal successful: {concept}")
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to propose concept '{concept}': {e}")
        return None

# REFACTORING EXAMPLES:

def refactor_example_1():
    """
    BEFORE (FORBIDDEN):
    mesh.add_node("quantum entanglement", "Physics concept", {"source": "physics_paper"})
    
    AFTER (REQUIRED):
    """
    result = propose_to_mesh(
        concept="quantum entanglement",
        context="Physics concept from research paper",
        provenance={
            "source": "physics_paper",
            "paper_id": "arXiv:2401.12345",
            "extraction_method": "semantic_analysis"
        }
    )
    return result

def refactor_example_2():
    """
    BEFORE (FORBIDDEN):
    from cognitive_interface import add_concept_diff
    add_concept_diff({"concept": "neural oscillations", "context": "..."})
    
    AFTER (REQUIRED):
    """
    result = propose_to_mesh(
        concept="neural oscillations",
        context="Extracted from neuroscience research",
        provenance={
            "source": "cognitive_interface_migration",
            "original_method": "add_concept_diff",
            "migrated_at": datetime.utcnow().isoformat()
        }
    )
    return result

def batch_proposal_example(concepts_list):
    """
    Example: Process multiple concepts through the lockdown API
    """
    results = []
    
    for concept_data in concepts_list:
        result = propose_to_mesh(
            concept=concept_data["concept"],
            context=concept_data.get("context", ""),
            provenance={
                "source": "batch_processor",
                "batch_id": concept_data.get("batch_id"),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        if result:
            results.append(result)
        else:
            print(f"⚠️ Failed to process: {concept_data['concept']}")
    
    return results

# Test the proposal system
if __name__ == "__main__":
    print("🧪 Testing mesh proposal system...")
    
    # Test single proposal
    test_result = propose_to_mesh(
        concept="test concept",
        context="Testing mesh lockdown system",
        provenance={
            "source": "test_client",
            "test_run": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    
    if test_result:
        print("✅ Mesh proposal system working!")
        print(f"📊 Result: {test_result}")
    else:
        print("❌ Mesh proposal system failed!")
        print("🔍 Check that Prajna API is running on localhost:8001")
        print("🔍 Check that /api/prajna/propose endpoint is available")
