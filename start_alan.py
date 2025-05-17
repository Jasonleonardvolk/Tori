"""start_alan.py - Main entry point for ALAN's pure emergent cognition system.

This script initializes and starts ALAN's system for knowledge acquisition and reasoning
without relying on pretrained data. It implements the five commitments:

1. No Pretraining: Only curated canonical sources
2. No Token Imitation: Koopman eigenflows for reasoning, not predictive language modeling
3. No Memory Bloat: Entropy-gated memory with concept resonance
4. No Opaque Models: Full provenance and transparency
5. No Blind Inference: Phase-coherent reasoning

Usage:
  python start_alan.py init          # Initialize ALAN's cognitive system
  python start_alan.py ingest <path> # Ingest a PDF file or directory
  python start_alan.py stats         # Show system statistics
  python start_alan.py explore       # Explore ingested knowledge
  python start_alan.py reset         # Reset the system (caution!)
"""

import os
import sys
import argparse
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Union

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("logs/alan.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("alan")

# Import ALAN components
try:
    from ingest_pdf.models import ConceptTuple
    from ingest_pdf.koopman_phase_graph import get_koopman_phase_graph
    from ingest_pdf.canonical_ingestion import (
        get_active_ingestion_manager, 
        batch_ingest_pdfs, 
        ingest_pdf_file, 
        validate_and_ingest_pdf
    )
    from ingest_pdf.spectral_monitor import get_cognitive_spectral_monitor
    from ingest_pdf.reasoning_coherence import get_reasoning_coherence_manager
    from ingest_pdf.expert_router import get_expert_routing_manager
    from ingest_pdf.phase_walk import get_phase_walker
except ImportError as e:
    logger.error(f"Failed to import ALAN components: {e}")
    logger.error("Please make sure you're running from the correct directory and all dependencies are installed.")
    sys.exit(1)

# Ensure data directories exist
def ensure_directories():
    """Create necessary directories for ALAN's operation."""
    os.makedirs("data", exist_ok=True)
    os.makedirs("data/canonical_sources", exist_ok=True)
    os.makedirs("data/koopman_phase_graph", exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    os.makedirs("output", exist_ok=True)

# System initialization
def initialize_system(embedding_dim: int = 768) -> Dict[str, Any]:
    """
    Initialize all components of ALAN's cognitive system.
    
    Args:
        embedding_dim: Dimension for concept embeddings
        
    Returns:
        Dictionary with initialization results
    """
    logger.info("Initializing ALAN cognitive system...")
    start_time = time.time()
    
    # Ensure directories exist
    ensure_directories()
    
    # Initialize core components
    logger.info("Initializing Koopman phase graph...")
    koopman_graph = get_koopman_phase_graph(embedding_dim)
    
    logger.info("Initializing spectral monitor...")
    spectral_monitor = get_cognitive_spectral_monitor()
    
    logger.info("Initializing reasoning coherence manager...")
    reasoning_manager = get_reasoning_coherence_manager()
    
    logger.info("Initializing expert routing system...")
    routing_manager = get_expert_routing_manager(embedding_dim)
    
    logger.info("Initializing phase walker...")
    phase_walker = get_phase_walker()
    
    logger.info("Initializing active ingestion manager...")
    ingestion_manager = get_active_ingestion_manager(embedding_dim)
    
    # Check for existing system state
    has_existing_state = False
    
    if os.path.exists("data/canonical_sources/registry.json"):
        logger.info("Found existing source registry. Loading...")
        has_existing_state = True
        try:
            load_result = ingestion_manager.load_state("data")
            logger.info(f"System state loaded: {load_result.get('status')}")
        except Exception as e:
            logger.error(f"Failed to load existing state: {e}")
            logger.info("Continuing with fresh initialization")
    
    elapsed_time = time.time() - start_time
    
    # Save initial system state
    if not has_existing_state:
        save_result = ingestion_manager.save_state("data")
        logger.info(f"Initial system state saved: {save_result.get('status')}")
    
    # Return initialization results
    return {
        "status": "success",
        "initialization_time": elapsed_time,
        "embedding_dim": embedding_dim,
        "sources_loaded": len(ingestion_manager.source_curator.canonical_sources),
        "concepts_loaded": len(koopman_graph.concepts) if hasattr(koopman_graph, "concepts") else 0,
        "has_existing_state": has_existing_state,
        "timestamp": datetime.now().isoformat()
    }

# Ingest a file or directory
def process_ingest_command(path: str, recursive: bool = False, domain: Optional[str] = None) -> Dict[str, Any]:
    """
    Process ingest command for a file or directory.
    
    Args:
        path: Path to PDF file or directory
        recursive: Whether to recursively process directories
        domain: Optional domain override
        
    Returns:
        Dictionary with ingestion results
    """
    if not os.path.exists(path):
        return {
            "status": "error", 
            "message": f"Path not found: {path}"
        }
    
    # Check if it's a directory or file
    if os.path.isdir(path):
        logger.info(f"Processing directory: {path} (recursive={recursive})")
        result = batch_ingest_pdfs(
            directory_path=path,
            recursive=recursive,
            domain=domain or "general"
        )
    else:
        # Assume it's a file
        if not path.lower().endswith('.pdf'):
            return {
                "status": "error",
                "message": f"Not a PDF file: {path}"
            }
            
        logger.info(f"Processing file: {path}")
        result = validate_and_ingest_pdf(
            pdf_path=path,
            domain=domain
        )
    
    # Save updated state
    ingestion_manager = get_active_ingestion_manager()
    save_result = ingestion_manager.save_state("data")
    
    # Add save result to the return
    result["save_result"] = save_result
    
    return result

# Get system statistics
def get_system_stats() -> Dict[str, Any]:
    """
    Get comprehensive statistics about ALAN's state.
    
    Returns:
        Dictionary with system statistics
    """
    try:
        # Get core components
        koopman_graph = get_koopman_phase_graph()
        ingestion_manager = get_active_ingestion_manager()
        
        # Get ingestion statistics
        ingestion_stats = ingestion_manager.get_ingestion_statistics()
        
        # Get concept statistics
        concept_count = len(koopman_graph.concepts) if hasattr(koopman_graph, "concepts") else 0
        
        # Get phase cluster statistics
        phase_clusters = koopman_graph.phase_clusters if hasattr(koopman_graph, "phase_clusters") else []
        cluster_sizes = [len(cluster) for cluster in phase_clusters]
        
        # Get source statistics
        sources = ingestion_manager.source_curator.canonical_sources
        domains = {}
        
        for source in sources.values():
            if source.domain not in domains:
                domains[source.domain] = 0
            domains[source.domain] += 1
        
        # Create comprehensive statistics
        stats = {
            "timestamp": datetime.now().isoformat(),
            "sources": {
                "total": len(sources),
                "by_domain": domains,
                "rejected": ingestion_stats.get("sources_rejected", 0)
            },
            "concepts": {
                "total": concept_count,
                "ingested": ingestion_stats.get("total_ingested", 0),
                "rejected": ingestion_stats.get("total_rejected", 0),
                "by_domain": ingestion_stats.get("by_domain", {})
            },
            "phase_clusters": {
                "count": len(phase_clusters),
                "sizes": cluster_sizes,
                "largest": max(cluster_sizes) if cluster_sizes else 0,
                "average_size": sum(cluster_sizes) / len(cluster_sizes) if cluster_sizes else 0
            }
        }
        
        return stats
    except Exception as e:
        logger.error(f"Error getting system statistics: {e}")
        return {"status": "error", "message": str(e)}

# Explore ingested knowledge
def explore_knowledge(query: Optional[str] = None, top_k: int = 5) -> Dict[str, Any]:
    """
    Explore the knowledge ingested into ALAN.
    
    Args:
        query: Optional query string (simple text matching)
        top_k: Number of results to return
        
    Returns:
        Dictionary with exploration results
    """
    try:
        # Get koopman graph
        koopman_graph = get_koopman_phase_graph()
        
        # If no query, show most recent concepts
        if not query:
            # Get all concepts
            all_concepts = list(koopman_graph.concepts.values()) if hasattr(koopman_graph, "concepts") else []
            
            # Sort by creation time (newest first)
            sorted_concepts = sorted(
                all_concepts, 
                key=lambda c: c.creation_time, 
                reverse=True
            )
            
            # Take top k
            recent_concepts = sorted_concepts[:top_k]
            
            # Prepare result
            concept_entries = []
            for concept in recent_concepts:
                # Get source document
                source_id = concept.source_document_id
                source_doc = None
                
                try:
                    source_doc = koopman_graph.sources.get(source_id)
                except:
                    # Source info might be stored elsewhere
                    pass
                
                # Create concept entry
                entry = {
                    "id": concept.id,
                    "name": concept.name,
                    "source_id": source_id,
                    "source_title": source_doc.title if source_doc else "Unknown",
                    "creation_time": concept.creation_time.isoformat(),
                    "resonance_score": concept.resonance_score,
                    "location": concept.source_location
                }
                
                concept_entries.append(entry)
                
            return {
                "status": "success",
                "type": "recent_concepts",
                "count": len(concept_entries),
                "concepts": concept_entries
            }
        else:
            # Simple text search in concept names
            matching_concepts = []
            
            if hasattr(koopman_graph, "concepts"):
                for concept in koopman_graph.concepts.values():
                    if query.lower() in concept.name.lower():
                        matching_concepts.append(concept)
            
            # Sort by relevance (exact match first, then by resonance)
            sorted_matches = sorted(
                matching_concepts,
                key=lambda c: (
                    -1 if c.name.lower() == query.lower() else 0,  # Exact matches first
                    c.resonance_score  # Then by resonance
                ),
                reverse=True
            )
            
            # Take top k
            top_matches = sorted_matches[:top_k]
            
            # Prepare result
            concept_entries = []
            for concept in top_matches:
                entry = {
                    "id": concept.id,
                    "name": concept.name,
                    "source_id": concept.source_document_id,
                    "creation_time": concept.creation_time.isoformat(),
                    "resonance_score": concept.resonance_score
                }
                
                concept_entries.append(entry)
                
            return {
                "status": "success",
                "type": "search_results",
                "query": query,
                "count": len(concept_entries),
                "concepts": concept_entries
            }
    except Exception as e:
        logger.error(f"Error exploring knowledge: {e}")
        return {"status": "error", "message": str(e)}

# Reset the system
def reset_system(confirm: bool = False) -> Dict[str, Any]:
    """
    Reset ALAN's system, removing all ingested knowledge.
    
    Args:
        confirm: Whether the reset is confirmed
        
    Returns:
        Dictionary with reset results
    """
    if not confirm:
        return {
            "status": "error",
            "message": "Reset operation requires confirmation"
        }
        
    try:
        # Move existing data to backup
        backup_dir = f"data_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if os.path.exists("data"):
            import shutil
            os.makedirs(backup_dir, exist_ok=True)
            shutil.move("data", backup_dir)
            
        # Create fresh directories
        ensure_directories()
        
        # Initialize new system
        init_result = initialize_system()
        
        return {
            "status": "success",
            "backup_dir": backup_dir,
            "initialization": init_result
        }
    except Exception as e:
        logger.error(f"Error resetting system: {e}")
        return {"status": "error", "message": str(e)}

# Command-line interface
def main():
    """Main entry point for the ALAN system."""
    parser = argparse.ArgumentParser(description="ALAN - Pure Emergent Cognition System")
    
    # Create subparsers for commands
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Init command
    init_parser = subparsers.add_parser('init', help='Initialize ALAN system')
    init_parser.add_argument('--embed-dim', type=int, default=768, 
                            help='Embedding dimension')
    
    # Ingest command
    ingest_parser = subparsers.add_parser('ingest', help='Ingest PDF document(s)')
    ingest_parser.add_argument('path', type=str, help='Path to PDF file or directory')
    ingest_parser.add_argument('--recursive', '-r', action='store_true', 
                              help='Recursively process directories')
    ingest_parser.add_argument('--domain', '-d', type=str, 
                              help='Domain classification override')
    
    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Get system statistics')
    stats_parser.add_argument('--output', '-o', type=str, 
                             help='Output file for stats (JSON)')
    
    # Explore command
    explore_parser = subparsers.add_parser('explore', help='Explore ingested knowledge')
    explore_parser.add_argument('--query', '-q', type=str, 
                               help='Search query (optional)')
    explore_parser.add_argument('--top', '-k', type=int, default=5,
                               help='Number of results to return')
    
    # Reset command
    reset_parser = subparsers.add_parser('reset', help='Reset the system')
    reset_parser.add_argument('--confirm', action='store_true',
                             help='Confirm system reset (required)')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Ensure directories
    ensure_directories()
    
    # Process commands
    if args.command == 'init':
        result = initialize_system(embedding_dim=args.embed_dim)
        print(f"Initialization {'successful' if result['status'] == 'success' else 'failed'}")
        print(f"Embedding dimension: {result['embedding_dim']}")
        if result['has_existing_state']:
            print(f"Loaded existing state: {result['sources_loaded']} sources, {result['concepts_loaded']} concepts")
        else:
            print("Initialized fresh system state")
            
    elif args.command == 'ingest':
        result = process_ingest_command(
            path=args.path,
            recursive=args.recursive,
            domain=args.domain
        )
        
        if result['status'] == 'error':
            print(f"Error: {result['message']}")
        elif result['status'] == 'invalid':
            print(f"Document invalid: {result['message']}")
        elif os.path.isdir(args.path):
            print(f"Directory processed: {args.path}")
            print(f"Total files: {result.get('total_files', 0)}")
            print(f"Successfully ingested: {result.get('successful', 0)}")
            print(f"Rejected: {result.get('rejected', 0)}")
            print(f"Errors: {result.get('errors', 0)}")
        else:
            print(f"File processed: {args.path}")
            ingestion_result = result.get('ingestion_result', {})
            if ingestion_result.get('status') == 'success':
                print(f"Successfully ingested: {args.path}")
                print(f"Concepts extracted: {ingestion_result.get('concepts_extracted', 0)}")
                print(f"Concepts ingested: {ingestion_result.get('concepts_ingested', 0)}")
                print(f"Concepts rejected: {ingestion_result.get('concepts_rejected', 0)}")
            else:
                print(f"Failed to ingest: {args.path}")
            
    elif args.command == 'stats':
        stats = get_system_stats()
        
        if 'status' in stats and stats['status'] == 'error':
            print(f"Error getting statistics: {stats['message']}")
        else:
            print("\n=== ALAN System Statistics ===")
            print(f"Sources: {stats['sources']['total']} total, {stats['sources']['rejected']} rejected")
            print(f"Concepts: {stats['concepts']['total']} total, {stats['concepts']['ingested']} ingested, {stats['concepts']['rejected']} rejected")
            print(f"Phase clusters: {stats['phase_clusters']['count']} clusters, largest: {stats['phase_clusters']['largest']} concepts")
            
            print("\nSources by domain:")
            for domain, count in stats['sources'].get('by_domain', {}).items():
                print(f"  {domain}: {count}")
                
            print("\nConcepts by domain:")
            for domain, count in stats['concepts'].get('by_domain', {}).items():
                print(f"  {domain}: {count}")
                
            # Output to file if requested
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(stats, f, indent=2)
                print(f"\nStatistics saved to {args.output}")
                
    elif args.command == 'explore':
        results = explore_knowledge(query=args.query, top_k=args.top)
        
        if results['status'] == 'error':
            print(f"Error exploring knowledge: {results['message']}")
        else:
            if args.query:
                print(f"\n=== Search Results for '{args.query}' ===")
            else:
                print("\n=== Recent Concepts ===")
                
            print(f"Found {results['count']} results:")
            
            for i, concept in enumerate(results['concepts'], 1):
                print(f"\n{i}. {concept['name']}")
                print(f"   ID: {concept['id']}")
                print(f"   Source: {concept.get('source_title', 'Unknown')} ({concept['source_id']})")
                print(f"   Created: {concept['creation_time']}")
                print(f"   Resonance: {concept['resonance_score']:.2f}")
                
    elif args.command == 'reset':
        if not args.confirm:
            print("Reset requires confirmation. Use --confirm to proceed.")
            print("WARNING: This will erase all ingested knowledge!")
        else:
            result = reset_system(confirm=True)
            
            if result['status'] == 'error':
                print(f"Error resetting system: {result['message']}")
            else:
                print("System reset successful.")
                print(f"Previous data backed up to {result['backup_dir']}")
                
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
