from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import json
import os
import hashlib
import PyPDF2
import logging
from datetime import datetime

# Import all enhanced modules (addresses all Issues #1-#4)
from .extract_blocks import extract_concept_blocks
from .features import build_feature_matrix
from .spectral import spectral_embed
from .clustering import run_oscillator_clustering, cluster_cohesion
from .scoring import (
    score_clusters, resonance_score, narrative_centrality, build_cluster_adjacency, 
    filter_concepts, apply_confidence_fallback, calculate_concept_confidence
)
from .keywords import extract_keywords
from .models import ConceptTuple, ConceptExtractionResult, create_concept_tuple_from_dict
from .persistence import save_concepts, save_extraction_result
from .lyapunov import concept_predictability, document_chaos_profile
from .source_validator import validate_source, SourceValidationResult
from .memory_gating import apply_memory_gating
from .phase_walk import PhaseCoherentWalk
from .pipeline_validator import validate_concepts
from .concept_logger import (
    default_concept_logger as concept_logger, 
    log_loop_record, log_concept_summary, warn_empty_segment
)
from .threshold_config import (
    MIN_CONFIDENCE, FALLBACK_MIN_COUNT, MAX_CONCEPTS_DEFAULT,
    get_threshold_for_media_type, get_adaptive_threshold, get_fallback_count
)
from .cognitive_interface import add_concept_diff  # 🔧 FIXED IMPORT
from .extractConceptsFromDocument import extractConceptsFromDocument  # 🌍 Universal extraction

# Configure logging
logger = logging.getLogger("pdf_ingestion")
logger.setLevel(logging.INFO)

# 🌍 UNIVERSAL CONCEPT DATABASE - Load main database + universal seeds
concept_db_path = Path(__file__).parent / "data" / "concept_database.json"
universal_seed_path = Path(__file__).parent / "data" / "concept_seed_universal.json"
concept_database = []
concept_names = []
concept_scores = {}

def load_universal_concept_database():
    """🌍 Load and merge main concept database with universal seeds"""
    global concept_database, concept_names, concept_scores
    
    # Load main concept database
    main_concepts = []
    try:
        with open(concept_db_path, "r", encoding="utf-8") as f:
            main_concepts = json.load(f)
        logger.info(f"✅ Main concept database loaded: {len(main_concepts)} concepts")
    except Exception as e:
        logger.warning(f"⚠️ Failed to load main concept database: {e}")
        main_concepts = []
    
    # Load universal seed concepts
    universal_seeds = []
    try:
        with open(universal_seed_path, "r", encoding="utf-8") as f:
            universal_seeds = json.load(f)
        logger.info(f"🌍 Universal seed concepts loaded: {len(universal_seeds)} concepts")
    except Exception as e:
        logger.warning(f"⚠️ Failed to load universal seed concepts: {e}")
        universal_seeds = []
    
    # Merge databases (avoid duplicates)
    existing_names = {c["name"].lower() for c in main_concepts}
    merged_concepts = main_concepts.copy()
    
    seeds_added = 0
    for seed in universal_seeds:
        if seed["name"].lower() not in existing_names:
            merged_concepts.append(seed)
            seeds_added += 1
    
    # Update global variables
    concept_database = merged_concepts
    concept_names = [c["name"] for c in concept_database]
    concept_scores = {c["name"]: c["priority"] for c in concept_database}
    
    # Log domain breakdown
    domains = {}
    for concept in concept_database:
        domain = concept.get("category", "general")
        domains[domain] = domains.get(domain, 0) + 1
    
    logger.info(f"🌍 UNIVERSAL DATABASE READY: {len(concept_database)} total concepts")
    logger.info(f"📊 Added {seeds_added} universal seed concepts")
    logger.info(f"📊 Domain coverage: {dict(sorted(domains.items()))}")

# Load the universal database
load_universal_concept_database()

def analyze_concept_purity(all_concepts: List[Dict[str, Any]], doc_name: str = "") -> List[Dict[str, Any]]:
    """
    🏆 CONCEPT PURITY ANALYSIS - Extract the "truth" based on quality, not quantity
    """
    logger.info(f"🔬 CONCEPT PURITY ANALYSIS for {doc_name}")
    logger.info(f"📊 Analyzing {len(all_concepts)} raw concepts")
    
    # Categories for analysis
    consensus_concepts = []
    high_confidence = []
    database_boosted = []
    single_method = []
    rejected_concepts = []
    
    # Generic terms to filter - expanded list
    GENERIC_TERMS = {
        'document', 'paper', 'analysis', 'method', 'approach', 'study',
        'research', 'results', 'data', 'figure', 'table', 'section',
        'abstract', 'introduction', 'conclusion', 'pdf document', 
        'academic paper', 'page', 'text', 'content', 'information',
        'system', 'model', 'based', 'using', 'used', 'new', 'proposed',
        'specific', 'general', 'various', 'different', 'particular',
        'important', 'significant', 'relevant', 'related', 'similar',
        'technical method', 'artificial intelligence', 'computer science',
        'pdf', 'file', 'scholarsphere document'
    }
    
    # Analyze each concept
    for concept in all_concepts:
        name = concept['name']
        score = concept.get('score', 0)
        method = concept.get('method', '')
        source = concept.get('source', {})
        metadata = concept.get('metadata', {})
        
        # Calculate purity metrics
        methods_in_name = method.count('+') + 1 if '+' in method else 1
        is_consensus = '+' in method or metadata.get('cross_reference_boost', False)
        is_boosted = 'database_boosted' in method or 'boost' in method
        has_cross_ref = metadata.get('cross_reference_boost', False)
        word_count = len(name.split())
        char_count = len(name)
        
        # Enhanced consensus detection
        consensus_indicators = []
        if '+' in method:
            consensus_indicators.append('multi_method')
        if has_cross_ref:
            consensus_indicators.append('cross_reference')
        if is_boosted and score > 0.7:
            consensus_indicators.append('database_validated')
        
        # Purity score calculation
        purity_score = score
        purity_reasons = []
        
        if len(consensus_indicators) >= 2:
            purity_score *= 1.5
            purity_reasons.append(f"consensus({len(consensus_indicators)})")
            is_consensus = True
        
        if has_cross_ref:
            purity_score *= 1.3
            purity_reasons.append("cross-ref")
        
        if is_boosted and score > 0.8:
            purity_score *= 1.1
            purity_reasons.append("db-boost")
        
        if methods_in_name >= 2:
            purity_score *= 1.2
            purity_reasons.append(f"multi-method({methods_in_name})")
        
        # Decision logic with detailed reasoning
        decision = "REJECTED"
        rejection_reason = ""
        
        # Check rejections first
        name_lower = name.lower().strip()
        if name_lower in GENERIC_TERMS:
            rejection_reason = "generic_term"
        elif char_count < 3:
            rejection_reason = "too_short"
        elif word_count > 6:
            rejection_reason = "too_specific" 
        elif score < 0.2:
            rejection_reason = "very_low_score"
        elif any(bad in name_lower for bad in ['document', 'paper', 'file', 'pdf', 'text']):
            rejection_reason = "document_metadata"
        elif len(name_lower.replace(' ', '').replace('-', '')) < 4:
            rejection_reason = "insufficient_content"
        else:
            # Acceptance criteria - quality-based hierarchy
            if is_consensus and score >= 0.6:
                decision = "CONSENSUS"
                consensus_concepts.append(concept)
            elif score >= 0.8:
                decision = "HIGH_CONF"
                high_confidence.append(concept)
            elif is_boosted and score >= 0.7:
                decision = "DB_BOOST"
                database_boosted.append(concept)
            elif score >= 0.5 and word_count <= 4 and word_count >= 1:
                decision = "ACCEPTED"
                single_method.append(concept)
            else:
                rejection_reason = "below_quality_threshold"
        
        # Enhanced concept with purity metrics
        concept['purity_metrics'] = {
            'purity_score': round(purity_score, 3),
            'purity_reasons': purity_reasons,
            'decision': decision,
            'rejection_reason': rejection_reason,
            'methods_count': methods_in_name,
            'word_count': word_count,
            'char_count': char_count,
            'is_consensus': is_consensus,
            'is_boosted': is_boosted,
            'has_cross_ref': has_cross_ref,
            'consensus_indicators': consensus_indicators
        }
        
        if decision == "REJECTED":
            rejected_concepts.append((concept, rejection_reason))
    
    # Log detailed analysis
    logger.info("=" * 70)
    logger.info("🏆 CONCEPT PURITY REPORT")
    logger.info("=" * 70)
    
    # Log consensus concepts (most important)
    if consensus_concepts:
        logger.info(f"\n🤝 CONSENSUS CONCEPTS ({len(consensus_concepts)}) - The Most 'True':")
        for i, c in enumerate(consensus_concepts[:15], 1):
            metrics = c['purity_metrics']
            indicators = '+'.join(metrics['consensus_indicators'])
            logger.info(f"  {i:2d}. {c['name']:<35} score:{c['score']:.3f} "
                       f"purity:{metrics['purity_score']:.3f} "
                       f"methods:{metrics['methods_count']} "
                       f"indicators:[{indicators}]")
        if len(consensus_concepts) > 15:
            logger.info(f"      ... and {len(consensus_concepts) - 15} more consensus concepts")
    
    # Log high confidence
    if high_confidence:
        logger.info(f"\n⭐ HIGH CONFIDENCE ({len(high_confidence)}) - Statistically Significant:")
        for i, c in enumerate(high_confidence[:10], 1):
            metrics = c['purity_metrics']
            method_short = c.get('method', 'unknown')[:30]
            logger.info(f"  {i:2d}. {c['name']:<35} score:{c['score']:.3f} "
                       f"purity:{metrics['purity_score']:.3f} "
                       f"method:{method_short}")
        if len(high_confidence) > 10:
            logger.info(f"      ... and {len(high_confidence) - 10} more high-confidence concepts")
    
    # Log database boosted
    if database_boosted:
        logger.info(f"\n🚀 DATABASE BOOSTED ({len(database_boosted)}) - Domain Validated:")
        for i, c in enumerate(database_boosted[:8], 1):
            domain = c.get('source', {}).get('domain', c.get('metadata', {}).get('category', 'unknown'))
            logger.info(f"  {i:2d}. {c['name']:<35} score:{c['score']:.3f} "
                       f"domain:{domain}")
        if len(database_boosted) > 8:
            logger.info(f"      ... and {len(database_boosted) - 8} more database-boosted concepts")
    
    # Log single method accepted
    if single_method:
        logger.info(f"\n✅ SINGLE METHOD ACCEPTED ({len(single_method)}) - Quality Threshold Met:")
        for i, c in enumerate(single_method[:5], 1):
            method_short = c.get('method', 'unknown')[:20]
            logger.info(f"  {i:2d}. {c['name']:<35} score:{c['score']:.3f} "
                       f"method:{method_short}")
        if len(single_method) > 5:
            logger.info(f"      ... and {len(single_method) - 5} more single-method concepts")
    
    # Log rejection summary
    rejection_summary = {}
    for concept, reason in rejected_concepts:
        rejection_summary[reason] = rejection_summary.get(reason, 0) + 1
    
    logger.info(f"\n❌ REJECTIONS ({len(rejected_concepts)} total) - Quality Control:")
    for reason, count in sorted(rejection_summary.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(all_concepts)) * 100
        logger.info(f"  - {reason}: {count} concepts ({percentage:.1f}%)")
    
    # Sample rejected concepts for transparency
    if rejected_concepts:
        logger.info("\n📝 Sample rejected concepts (for transparency):")
        rejection_samples = {}
        for concept, reason in rejected_concepts:
            if reason not in rejection_samples:
                rejection_samples[reason] = []
            if len(rejection_samples[reason]) < 2:
                rejection_samples[reason].append(concept)
        
        for reason, samples in rejection_samples.items():
            logger.info(f"  {reason}:")
            for concept in samples:
                logger.info(f"    - '{concept['name']}' (score: {concept.get('score', 0):.3f})")
    
    # Combine accepted concepts in quality order
    pure_concepts = consensus_concepts + high_confidence + database_boosted + single_method
    
    # Remove duplicates while preserving quality order
    seen = set()
    unique_pure = []
    for c in pure_concepts:
        name_lower = c['name'].lower().strip()
        if name_lower not in seen:
            seen.add(name_lower)
            unique_pure.append(c)
    
    # Sort by purity score (quality-first)
    unique_pure.sort(key=lambda x: x['purity_metrics']['purity_score'], reverse=True)
    
    # Natural quality breakpoint detection
    natural_cutoff = len(unique_pure)
    if len(unique_pure) > 20:
        scores = [c['purity_metrics']['purity_score'] for c in unique_pure]
        for i in range(15, min(len(scores)-1, 80)):
            if scores[i] < scores[i-1] * 0.65:  # 35% quality drop
                natural_cutoff = i
                logger.info(f"\n📉 NATURAL QUALITY BREAKPOINT detected at position {i}")
                logger.info(f"   Quality drop: {scores[i-1]:.3f} → {scores[i]:.3f} "
                           f"({(1-scores[i]/scores[i-1])*100:.1f}% drop)")
                logger.info(f"   Keeping top {i} highest-quality concepts")
                break
    
    # Apply natural cutoff
    unique_pure = unique_pure[:natural_cutoff]
    
    # Log final summary
    logger.info("\n" + "=" * 70)
    logger.info(f"📊 FINAL PURITY SUMMARY:")
    logger.info(f"  - Raw concepts extracted: {len(all_concepts)}")
    logger.info(f"  - Consensus concepts (most true): {len(consensus_concepts)}")
    logger.info(f"  - High confidence: {len(high_confidence)}")
    logger.info(f"  - Database boosted: {len(database_boosted)}")
    logger.info(f"  - Single method accepted: {len(single_method)}")
    logger.info(f"  - Total rejected: {len(rejected_concepts)} ({(len(rejected_concepts)/len(all_concepts)*100):.1f}%)")
    logger.info(f"  - Natural quality cutoff: {natural_cutoff}")
    logger.info(f"  - 🏆 FINAL PURE CONCEPTS: {len(unique_pure)}")
    
    # Log top pure concepts for visibility
    if unique_pure:
        logger.info(f"\n🏆 TOP 10 PUREST CONCEPTS:")
        for i, c in enumerate(unique_pure[:10], 1):
            metrics = c['purity_metrics']
            reasons_str = ','.join(metrics['purity_reasons']) if metrics['purity_reasons'] else 'single'
            logger.info(f"  {i:2d}. {c['name']:<35} purity:{metrics['purity_score']:.3f} "
                       f"({metrics['decision'].lower()}) [{reasons_str}]")
    
    logger.info("=" * 70)
    
    return unique_pure

def auto_prefill_concept_db(extracted_concepts: List[Dict[str, Any]], document_name: str = "") -> int:
    """
    🧬 AUTO-PREFILL CONCEPT DATABASE - Now with purity-based selection
    """
    global concept_database, concept_names, concept_scores
    
    logger.info(f"📥 PURITY-BASED AUTO-PREFILL: Analyzing {len(extracted_concepts)} pure concepts from {document_name}")
    
    # Get existing concept names (case-insensitive)
    existing_names = {c["name"].lower() for c in concept_database}
    
    new_concepts = []
    prefill_threshold = 0.6  # Higher threshold for pure concepts
    
    for concept in extracted_concepts:
        concept_name = concept.get("name", "")
        concept_score = concept.get("score", 0.0)
        concept_method = concept.get("method", "")
        purity_metrics = concept.get("purity_metrics", {})
        
        # Skip debug/fallback concepts
        if "debug" in concept_method or "fallback" in concept_method:
            continue
            
        # Skip if already exists
        if concept_name.lower() in existing_names:
            continue
        
        # Higher standards for auto-prefill - only consensus and high-confidence
        decision = purity_metrics.get("decision", "")
        if decision in ["CONSENSUS", "HIGH_CONF"] and concept_score >= prefill_threshold:
            
            # Determine category based on method and content
            category = "auto_discovered"
            
            # Enhanced domain detection
            name_lower = concept_name.lower()
            if any(term in name_lower for term in ["quantum", "particle", "field", "wave", "energy", "relativity"]):
                category = "Physics"
            elif any(term in name_lower for term in ["gene", "dna", "protein", "cell", "evolution", "biology"]):
                category = "Biology"
            elif any(term in name_lower for term in ["algorithm", "computing", "neural", "machine", "ai", "learning"]):
                category = "Computer Science"
            elif any(term in name_lower for term in ["philosophy", "epistemology", "ontology", "phenomenology"]):
                category = "Philosophy"
            elif any(term in name_lower for term in ["literature", "narrative", "poetry", "novel", "literary"]):
                category = "Literature"
            elif any(term in name_lower for term in ["art", "painting", "sculpture", "aesthetic", "visual"]):
                category = "Art"
            elif any(term in name_lower for term in ["music", "harmony", "rhythm", "composition", "musical"]):
                category = "Music"
            elif any(term in name_lower for term in ["mathematical", "theorem", "proof", "algebra", "geometry"]):
                category = "Mathematics"
            elif "universal" in concept_method:
                category = "universal_extraction"
            
            # Generate meaningful aliases
            aliases = []
            name_parts = concept_name.lower().split()
            if len(name_parts) > 1:
                # Add abbreviated forms
                if len(name_parts) == 2:
                    abbrev = f"{name_parts[0][0]}{name_parts[1][0]}".upper()
                    if len(abbrev) >= 2:
                        aliases.append(abbrev)
                
                # Add individual significant words
                for part in name_parts:
                    if len(part) > 4 and part not in ["theory", "method", "analysis", "study"]:
                        aliases.append(part)
            
            # Higher boost multiplier for pure concepts
            boost_multiplier = 1.3  # Higher default for pure concepts
            if "keybert" in concept_method.lower():
                boost_multiplier = 1.35
            if "ner" in concept_method.lower():
                boost_multiplier = 1.4
            if decision == "CONSENSUS":
                boost_multiplier = 1.5  # Highest for consensus
            
            new_concept = {
                "name": concept_name,
                "priority": min(0.97, concept_score),  # Higher cap for pure concepts
                "category": category,
                "aliases": aliases,
                "boost_multiplier": boost_multiplier,
                "source": {
                    "auto_prefill": True,
                    "purity_based": True,
                    "purity_decision": decision,
                    "universal_extraction": True,
                    "document": document_name,
                    "extraction_method": concept_method,
                    "original_score": concept_score,
                    "purity_score": purity_metrics.get("purity_score", concept_score),
                    "discovery_date": datetime.now().isoformat(),
                    "domain_detected": category
                }
            }
            
            new_concepts.append(new_concept)
            logger.info(f"📥 PURE PREFILL CANDIDATE: {concept_name} (score: {concept_score:.3f}, "
                       f"purity: {purity_metrics.get('purity_score', concept_score):.3f}, "
                       f"decision: {decision}, domain: {category})")
    
    # Add new concepts to database
    if new_concepts:
        concept_database.extend(new_concepts)
        
        # Update in-memory indexes
        concept_names.extend([c["name"] for c in new_concepts])
        concept_scores.update({c["name"]: c["priority"] for c in new_concepts})
        
        # Write updated database back to disk
        try:
            with open(concept_db_path, "w", encoding="utf-8") as f:
                json.dump(concept_database, f, indent=2, ensure_ascii=False)
            
            logger.info(f"📥 PURITY-BASED AUTO-PREFILL SUCCESS: Added {len(new_concepts)} pure concepts to database")
            logger.info(f"📊 Database now contains {len(concept_database)} total concepts")
            
            # Log domain breakdown of new concepts
            new_domains = {}
            for concept in new_concepts:
                domain = concept.get("category", "general")
                new_domains[domain] = new_domains.get(domain, 0) + 1
            
            logger.info(f"📊 New pure concepts by domain: {new_domains}")
            
            # Log sample new concepts for visibility
            for i, concept in enumerate(new_concepts[:5], 1):
                purity_score = concept["source"]["purity_score"]
                decision = concept["source"]["purity_decision"]
                logger.info(f"  ✅ {i}. {concept['name']} (purity: {purity_score:.3f}, "
                           f"decision: {decision}, domain: {concept['category']})")
            if len(new_concepts) > 5:
                logger.info(f"  ... and {len(new_concepts) - 5} more")
                
        except Exception as e:
            logger.error(f"❌ PURITY-BASED AUTO-PREFILL FAILED: Could not write to concept database: {e}")
            # Rollback in-memory changes
            concept_database = concept_database[:-len(new_concepts)]
            for c in new_concepts:
                if c["name"] in concept_names:
                    concept_names.remove(c["name"])
                if c["name"] in concept_scores:
                    del concept_scores[c["name"]]
            return 0
            
    else:
        logger.info(f"📥 PURITY-BASED AUTO-PREFILL: No pure concepts met prefill criteria (threshold: {prefill_threshold})")
    
    return len(new_concepts)

def boost_known_concepts(chunk: str) -> List[Dict[str, Any]]:
    """🚀 QUALITY-FOCUSED UNIVERSAL CONCEPT BOOSTING"""
    boosted = []
    chunk_lower = chunk.lower()
    
    # Quality-focused limits
    MAX_BOOSTS = 25  # Allow more for quality concepts
    MAX_CHECKS = 300  # Check more high-priority concepts
    
    logger.info(f"🚀 QUALITY BOOST: Checking top {MAX_CHECKS} priority concepts (max {MAX_BOOSTS} quality matches)")
    
    # Sort by priority and only check highest-priority concepts
    sorted_concepts = sorted(
        concept_database, 
        key=lambda c: c.get("priority", 0), 
        reverse=True
    )[:MAX_CHECKS]
    
    domain_matches = {}
    
    for concept in sorted_concepts:
        if len(boosted) >= MAX_BOOSTS:
            logger.info(f"🛑 Quality boost limit reached ({MAX_BOOSTS} concepts)")
            break
            
        name = concept["name"]
        aliases = concept.get("aliases", [])
        
        # Skip very short names to avoid false matches
        if len(name) < 4:
            continue
        
        # Enhanced matching with word boundaries
        all_terms = [name.lower()] + [alias.lower() for alias in aliases]
        matched_terms = []
        
        for term in all_terms:
            # Precise word boundary matching
            if (f" {term} " in f" {chunk_lower} " or 
                chunk_lower.startswith(f"{term} ") or 
                chunk_lower.endswith(f" {term}") or
                chunk_lower == term):
                matched_terms.append(term)
                break
        
        if matched_terms:
            # Calculate enhanced boost score
            base_score = concept_scores.get(name, 0.5)
            boost_multiplier = concept.get("boost_multiplier", 1.2)
            boosted_score = min(0.98, base_score * boost_multiplier)
            
            # Additional boosts for quality indicators
            if concept.get("source", {}).get("purity_based", False):
                boosted_score = min(0.99, boosted_score * 1.1)  # Purity bonus
            if concept.get("source", {}).get("universal_seed", False):
                boosted_score = min(0.99, boosted_score * 1.05)  # Seed bonus
            
            category = concept.get("category", "general")
            domain_matches[category] = domain_matches.get(category, 0) + 1
            
            boosted.append({
                "name": name,
                "score": boosted_score,
                "method": "quality_focused_database_boosted",
                "source": {
                    "database_matched": True,
                    "matched_terms": matched_terms,
                    "quality_boost": True,
                    "priority_rank": len(boosted) + 1,
                    "domain": category
                },
                "context": f"Quality database boost: '{matched_terms[0]}' found in text",
                "metadata": {
                    "category": category,
                    "aliases": aliases,
                    "boost_multiplier": boost_multiplier,
                    "original_score": base_score,
                    "boosted_score": boosted_score,
                    "matched_terms": matched_terms,
                    "priority_concept": True,
                    "purity_based": concept.get("source", {}).get("purity_based", False)
                }
            })
    
    if domain_matches:
        logger.info(f"🌍 Quality boost domain matches: {domain_matches}")
    
    logger.info(f"🚀 Quality-focused boost complete: {len(boosted)} high-priority concepts found")
    
    return boosted

def extract_and_boost_concepts(chunk: str, threshold: float = 0.0) -> List[Dict[str, Any]]:
    """🌍 UNIVERSAL EXTRACT AND BOOST - Preparing for purity analysis"""
    logger.info(f"🔧 🌍 UNIVERSAL EXTRACT AND BOOST: threshold: {threshold}")
    logger.info(f"🔬 Chunk length: {len(chunk)} chars")
    
    # Extract concepts using universal method
    logger.info("🔬 STEP 1: Calling universal extractConceptsFromDocument...")
    semantic_hits = extractConceptsFromDocument(chunk, threshold=threshold)
    logger.info(f"📊 UNIVERSAL SEMANTIC EXTRACTION RESULT: {len(semantic_hits)} concepts")
    
    # Apply quality-focused universal database boosting
    logger.info("🔬 STEP 2: Calling quality-focused boost_known_concepts...")
    boosted = boost_known_concepts(chunk)
    logger.info(f"🚀 QUALITY-FOCUSED DATABASE BOOST RESULT: {len(boosted)} concepts")
    
    # Combine results (purity analysis will handle deduplication)
    combined = semantic_hits + boosted
    logger.info(f"🔧 UNIVERSAL COMBINED RESULT: {len(combined)} total concepts (before purity analysis)")
    
    # Add cross-reference boost metadata for concepts found by both methods
    concept_name_counts = {}
    for concept in combined:
        name_lower = concept["name"].lower()
        concept_name_counts[name_lower] = concept_name_counts.get(name_lower, 0) + 1
    
    # Mark concepts with cross-reference potential
    for concept in combined:
        name_lower = concept["name"].lower()
        if concept_name_counts[name_lower] > 1:
            concept.setdefault("metadata", {})["cross_reference_boost"] = True
            concept.setdefault("metadata", {})["methods_found"] = concept_name_counts[name_lower]
    
    return combined

def extract_chunks(pdf_path: str) -> List[str]:
    """Extract text chunks from PDF for processing with debugging"""
    try:
        chunks = extract_concept_blocks(pdf_path)
        logger.info(f"📄 Extracted {len(chunks)} chunks from {Path(pdf_path).name}")
        
        # 🔬 DEBUG: Log chunk sizes and sample content
        for i, chunk in enumerate(chunks[:3], 1):  # Show first 3 chunks
            logger.info(f"🔬 Chunk {i}: {len(chunk)} chars, preview: {chunk[:100]}...")
        
        return chunks
    except Exception as e:
        logger.error(f"Failed to extract chunks from {pdf_path}: {e}")
        return []

def extract_pdf_metadata(pdf_path: str) -> Dict[str, Any]:
    """Extract comprehensive metadata from PDF file for source provenance tracking."""
    metadata = {
        "filename": Path(pdf_path).name,
        "file_path": pdf_path,
        "extraction_timestamp": datetime.now().isoformat(),
        "extractor_version": "purity_based_pipeline_v1.0"
    }
    
    try:
        with open(pdf_path, "rb") as f:
            file_content = f.read()
            metadata["sha256"] = hashlib.sha256(file_content).hexdigest()
            metadata["file_size_bytes"] = len(file_content)
    except Exception as e:
        logger.warning(f"Could not calculate file hash: {e}")

    try:
        with open(pdf_path, "rb") as f:
            pdf = PyPDF2.PdfReader(f)
            if pdf.metadata:
                metadata["pdf_metadata"] = {
                    k.lower().replace('/', ''): str(v)
                    for k, v in pdf.metadata.items() if k and v
                }
            metadata["page_count"] = len(pdf.pages)
    except Exception as e:
        logger.warning(f"Could not extract PDF metadata: {e}")
    
    return metadata

def ingest_pdf_clean(pdf_path: str, doc_id: str = None, extraction_threshold: float = 0.0) -> Dict[str, Any]:
    """
    🏆 PURITY-BASED UNIVERSAL PDF INGESTION PIPELINE - WITH CRITICAL PERFORMANCE LIMITS
    
    Extracts the "truth" based on concept quality, not arbitrary quantity limits.
    """
    start_time = datetime.now()
    
    if doc_id is None:
        doc_id = Path(pdf_path).stem
    
    # 🚨 CRITICAL PERFORMANCE LIMITS to prevent "Beautiful Overkill"
    MAX_CHUNKS = 5  # Only process first 5 chunks!
    MAX_TOTAL_CONCEPTS = 500  # Stop if we have enough raw concepts
    
    logger.info(f"🏆 🌍 PURITY-BASED UNIVERSAL PDF INGESTION: {Path(pdf_path).name}")
    logger.info(f"🔬 ZERO THRESHOLD MODE: {extraction_threshold} (maximum coverage)")
    logger.info("🌍 UNIVERSAL PIPELINE: Cross-domain concept extraction enabled")
    logger.info(f"📊 Database ready: {len(concept_database)} concepts across all domains")
    logger.info("🏆 PURITY-BASED: Quality over quantity - extracting the 'truth'")
    logger.info(f"🚨 CRITICAL PERFORMANCE LIMITS: Max {MAX_CHUNKS} chunks, stop at {MAX_TOTAL_CONCEPTS} concepts")
    
    try:
        # Extract metadata for provenance
        doc_metadata = extract_pdf_metadata(pdf_path)
        
        # Extract chunks from PDF
        chunks = extract_chunks(pdf_path)
        if not chunks:
            logger.warning(f"⚠️ No chunks extracted from {pdf_path}")
            return {
                "filename": Path(pdf_path).name,
                "concept_count": 0,
                "status": "empty",
                "processing_time_seconds": (datetime.now() - start_time).total_seconds()
            }
        
        # 🚨 CRITICAL: Limit chunks to prevent overkill
        chunks_to_process = chunks[:MAX_CHUNKS]
        logger.info(f"🚨 PERFORMANCE LIMITING: Processing {len(chunks_to_process)} of {len(chunks)} total chunks")
        logger.info(f"🚨 Skipping {len(chunks) - len(chunks_to_process)} chunks to prevent Beautiful Overkill")
        
        # 🌍 PERFORMANCE-LIMITED UNIVERSAL PROCESSING LOOP
        all_extracted_concepts = []
        semantic_count = 0
        boosted_count = 0
        universal_methods = set()
        domain_distribution = {}
        
        for i, chunk in enumerate(chunks_to_process):  # ✅ FIXED: Use limited chunks
            logger.info(f"🔬 =============== UNIVERSAL CHUNK {i+1}/{len(chunks_to_process)} ===============")
            logger.info(f"📊 Processing chunk {i+1}/{len(chunks_to_process)} ({len(chunk)} chars)")
            
            # 🌍 Apply universal extraction + boosting (no limits - purity will filter)
            enhanced_concepts = extract_and_boost_concepts(chunk, threshold=extraction_threshold)
            
            # Count extraction types and track domains
            chunk_semantic = 0
            chunk_boosted = 0
            
            for c in enhanced_concepts:
                method = c.get("method", "")
                if "universal" in method:
                    chunk_semantic += 1
                    # Track universal extraction methods
                    if "yake" in method:
                        universal_methods.add("YAKE")
                    if "keybert" in method:
                        universal_methods.add("KeyBERT")
                    if "ner" in method:
                        universal_methods.add("NER")
                
                if "database_boosted" in method or "boost" in method:
                    chunk_boosted += 1
                
                # Track domain distribution
                domain = (c.get("source", {}).get("domain") or 
                         c.get("metadata", {}).get("category") or 
                         "unknown")
                domain_distribution[domain] = domain_distribution.get(domain, 0) + 1
            
            semantic_count += chunk_semantic
            boosted_count += chunk_boosted
            
            logger.info(f"🔬 CHUNK {i+1} RAW RESULTS: {len(enhanced_concepts)} concepts")
            logger.info(f"   🌍 {chunk_semantic} universal extraction, 🚀 {chunk_boosted} database boosted")
            
            all_extracted_concepts.extend(enhanced_concepts)
            
            # 🚨 CRITICAL: Early exit if we have enough concepts
            if len(all_extracted_concepts) >= MAX_TOTAL_CONCEPTS:
                logger.info(f"🛑 CONCEPT LIMIT REACHED: {len(all_extracted_concepts)} concepts (stopping at chunk {i+1})")
                logger.info(f"🛑 This prevents processing {len(chunks_to_process) - (i+1)} remaining chunks")
                break
            
            logger.info(f"🔬 Total concepts so far: {len(all_extracted_concepts)}")
            logger.info(f"🔬 =============== END CHUNK {i+1} ===============")
        
        if not all_extracted_concepts:
            logger.error("🔬 ❌ CRITICAL: NO CONCEPTS EXTRACTED WITH UNIVERSAL PIPELINE!")
            return {
                "filename": Path(pdf_path).name,
                "concept_count": 0,
                "status": "critical_failure",
                "processing_time_seconds": (datetime.now() - start_time).total_seconds()
            }
        
        # 🏆 APPLY PURITY ANALYSIS - This is where the magic happens!
        logger.info(f"🔬 Raw extraction complete: {len(all_extracted_concepts)} concepts")
        logger.info("🏆 APPLYING PURITY ANALYSIS - Extracting the 'truth'...")
        
        initial_concept_count = len(all_extracted_concepts)
        pure_concepts = analyze_concept_purity(all_extracted_concepts, Path(pdf_path).name)
        
        # Use pure concepts for the rest of the pipeline
        all_extracted_concepts = pure_concepts
        
        logger.info(f"🏆 Using {len(pure_concepts)} PURE concepts for final output")
        logger.info(f"🔥 Purity filter efficiency: {len(pure_concepts)}/{initial_concept_count} = "
                   f"{(len(pure_concepts)/initial_concept_count)*100:.1f}% kept")
        
        # Update counts for pure concepts
        pure_semantic_count = len([c for c in pure_concepts if "universal" in c.get("method", "")])
        pure_boosted_count = len([c for c in pure_concepts if "boost" in c.get("method", "")])
        cross_reference_boosted = len([c for c in pure_concepts if c.get("metadata", {}).get("cross_reference_boost", False)])
        
        # 🌍 PURITY-BASED AUTO-PREFILL
        logger.info("📥 RUNNING PURITY-BASED AUTO-PREFILL ANALYSIS...")
        prefill_count = auto_prefill_concept_db(all_extracted_concepts, Path(pdf_path).name)
        
        # 🧠 CONCEPTMESH INTEGRATION
        logger.info(f"🔬 INJECTING {len(all_extracted_concepts)} PURE CONCEPTS INTO CONCEPTMESH")
        
        concept_diff_data = {
            "type": "document",
            "title": Path(pdf_path).name,
            "concepts": all_extracted_concepts,
            "summary": f"Performance-limited purity-based extraction found {len(all_extracted_concepts)} pure concepts from {initial_concept_count} raw extractions",
            "metadata": {
                "source": "performance_limited_purity_based_universal_pdf_ingest",
                "filename": Path(pdf_path).name,
                "chunks_available": len(chunks),
                "chunks_processed": len(chunks_to_process),
                "performance_limited": True,
                "max_chunks_limit": MAX_CHUNKS,
                "max_concepts_limit": MAX_TOTAL_CONCEPTS,
                "raw_concepts": initial_concept_count,
                "pure_concepts": len(all_extracted_concepts),
                "purity_efficiency": f"{(len(all_extracted_concepts)/initial_concept_count)*100:.1f}%",
                "semantic_concepts": pure_semantic_count,
                "boosted_concepts": pure_boosted_count,
                "cross_reference_boosted": cross_reference_boosted,
                "auto_prefilled_concepts": prefill_count,
                "extraction_threshold": extraction_threshold,
                "extraction_timestamp": datetime.now().isoformat(),
                "processing_time_seconds": (datetime.now() - start_time).total_seconds(),
                "universal_pipeline": True,
                "purity_based": True,
                "universal_methods": list(universal_methods),
                "domain_distribution": domain_distribution
            }
        }
        
        add_concept_diff(concept_diff_data)
        
        # Generate purity distribution for frontend
        purity_distribution = {
            "consensus": len([c for c in all_extracted_concepts if c.get('purity_metrics', {}).get('decision') == 'CONSENSUS']),
            "high_confidence": len([c for c in all_extracted_concepts if c.get('purity_metrics', {}).get('decision') == 'HIGH_CONF']),
            "database_boosted": len([c for c in all_extracted_concepts if c.get('purity_metrics', {}).get('decision') == 'DB_BOOST']),
            "single_method": len([c for c in all_extracted_concepts if c.get('purity_metrics', {}).get('decision') == 'ACCEPTED'])
        }
        
        # Final summary
        processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"✅ 🏆 PERFORMANCE-LIMITED PURITY-BASED UNIVERSAL PDF INGESTION COMPLETE: {Path(pdf_path).name}")
        logger.info(f"📊 FINAL RESULTS: {len(all_extracted_concepts)} pure concepts (from {initial_concept_count} raw)")
        logger.info(f"   🚨 Performance: {len(chunks_to_process)}/{len(chunks)} chunks processed in {processing_time:.1f}s")
        logger.info(f"   🤝 {purity_distribution['consensus']} consensus concepts (most true)")
        logger.info(f"   ⭐ {purity_distribution['high_confidence']} high confidence concepts")
        logger.info(f"   🚀 {purity_distribution['database_boosted']} database boosted concepts")
        logger.info(f"   ✅ {purity_distribution['single_method']} single method accepted")
        logger.info(f"   📥 {prefill_count} pure concepts auto-prefilled to database")
        logger.info(f"   🧬 Universal methods used: {list(universal_methods)}")
        logger.info(f"⏱️ Total processing time: {processing_time:.2f}s (vs estimated {len(chunks) * 4:.0f}s without limits)")
        logger.info(f"📊 Database now contains: {len(concept_database)} total concepts")
        
        return {
            "filename": Path(pdf_path).name,
            "concept_count": len(all_extracted_concepts),
            "concept_names": [c["name"] for c in all_extracted_concepts],
            "semantic_concepts": pure_semantic_count,
            "boosted_concepts": pure_boosted_count,
            "cross_reference_boosted": cross_reference_boosted,
            "auto_prefilled_concepts": prefill_count,
            "universal_methods": list(universal_methods),
            "domain_distribution": domain_distribution,
            "chunks_available": len(chunks),
            "chunks_processed": len(chunks_to_process),
            "performance_limited": True,
            "processing_time_seconds": processing_time,
            "extraction_threshold": extraction_threshold,
            "average_score": sum(c["score"] for c in all_extracted_concepts) / len(all_extracted_concepts) if all_extracted_concepts else 0,
            "high_confidence_concepts": sum(1 for c in all_extracted_concepts if c["score"] > 0.8),
            "concept_mesh_injected": True,
            "extraction_method": "performance_limited_purity_based_universal_pipeline",
            "universal_pipeline": True,
            "purity_based": True,
            "database_size": len(concept_database),
            "status": "success",
            "purity_analysis": {
                "raw_concepts": initial_concept_count,
                "pure_concepts": len(all_extracted_concepts),
                "purity_efficiency": f"{(len(all_extracted_concepts)/initial_concept_count)*100:.1f}%",
                "distribution": purity_distribution,
                "performance_limits_applied": {
                    "max_chunks": MAX_CHUNKS,
                    "chunks_available": len(chunks),
                    "chunks_processed": len(chunks_to_process),
                    "max_concepts": MAX_TOTAL_CONCEPTS,
                    "concepts_extracted": initial_concept_count
                },
                "top_pure_concepts": [
                    {
                        "name": c['name'],
                        "score": c['score'],
                        "purity_score": c.get('purity_metrics', {}).get('purity_score', c['score']),
                        "decision": c.get('purity_metrics', {}).get('decision', 'unknown'),
                        "reasons": c.get('purity_metrics', {}).get('purity_reasons', [])
                    }
                    for c in all_extracted_concepts[:10]
                ]
            }
        }
        
    except Exception as e:
        logger.exception(f"❌ Error during performance-limited purity-based universal PDF ingestion: {str(e)}")
        return {
            "filename": Path(pdf_path).name,
            "concept_count": 0,
            "status": "error",
            "error_message": str(e),
            "processing_time_seconds": (datetime.now() - start_time).total_seconds()
        }

def batch_ingest_pdfs_clean(pdf_directory: str, extraction_threshold: float = 0.0) -> List[Dict[str, Any]]:
    """
    🏆 PURITY-BASED UNIVERSAL BATCH PROCESSING
    """
    pdf_dir = Path(pdf_directory)
    if not pdf_dir.exists():
        logger.error(f"PDF directory not found: {pdf_directory}")
        return []
    
    pdf_files = list(pdf_dir.glob("*.pdf"))
    if not pdf_files:
        logger.warning(f"No PDF files found in {pdf_directory}")
        return []
    
    logger.info(f"🏆 🌍 PURITY-BASED UNIVERSAL BATCH PROCESSING: {len(pdf_files)} PDFs")
    logger.info(f"📊 Universal database: {len(concept_database)} concepts ready")
    logger.info("🏆 Purity-based processing: Quality over quantity")
    
    results = []
    total_concepts = 0
    total_raw_concepts = 0
    total_consensus = 0
    total_high_conf = 0
    total_prefilled = 0
    all_domains = {}
    all_methods = set()
    
    for i, pdf_path in enumerate(pdf_files):
        logger.info(f"📄 🏆 PURITY-BASED PDF {i+1}/{len(pdf_files)}: {pdf_path.name}")
        
        result = ingest_pdf_clean(str(pdf_path), extraction_threshold=extraction_threshold)
        result["batch_index"] = i + 1
        result["batch_total"] = len(pdf_files)
        
        # Track totals
        if result.get("status") == "success":
            total_concepts += result.get("concept_count", 0)
            total_prefilled += result.get("auto_prefilled_concepts", 0)
            
            purity_analysis = result.get("purity_analysis", {})
            total_raw_concepts += purity_analysis.get("raw_concepts", 0)
            
            purity_dist = purity_analysis.get("distribution", {})
            total_consensus += purity_dist.get("consensus", 0)
            total_high_conf += purity_dist.get("high_confidence", 0)
            
            # Aggregate domain distribution
            doc_domains = result.get("domain_distribution", {})
            for domain, count in doc_domains.items():
                all_domains[domain] = all_domains.get(domain, 0) + count
            
            # Aggregate methods
            doc_methods = result.get("universal_methods", [])
            all_methods.update(doc_methods)
        
        results.append(result)
        
        # Progress logging
        status = result.get("status", "unknown")
        concept_count = result.get("concept_count", 0)
        raw_count = result.get("purity_analysis", {}).get("raw_concepts", 0)
        prefill_count = result.get("auto_prefilled_concepts", 0)
        efficiency = result.get("purity_analysis", {}).get("purity_efficiency", "0%")
        processing_time = result.get("processing_time_seconds", 0)
        
        logger.info(f"✅ 🏆 Progress: {i+1}/{len(pdf_files)} - {status} - "
                   f"{concept_count} pure concepts (from {raw_count} raw, {efficiency} efficiency, "
                   f"prefilled: {prefill_count}, time: {processing_time:.1f}s)")
    
    successful = [r for r in results if r.get('status') == 'success']
    
    logger.info(f"🎯 🏆 PURITY-BASED UNIVERSAL BATCH COMPLETE:")
    logger.info(f"   📊 {len(successful)}/{len(pdf_files)} PDFs processed successfully")
    logger.info(f"   🏆 {total_concepts} total pure concepts extracted")
    logger.info(f"   📊 {total_raw_concepts} total raw concepts analyzed")
    logger.info(f"   🔥 Overall purity efficiency: {(total_concepts/total_raw_concepts)*100:.1f}%" if total_raw_concepts > 0 else "   🔥 No raw concepts to analyze")
    logger.info(f"   🤝 {total_consensus} consensus concepts (most true)")
    logger.info(f"   ⭐ {total_high_conf} high confidence concepts")
    logger.info(f"   📥 {total_prefilled} pure concepts auto-prefilled to database")
    logger.info(f"   🌍 Universal methods used: {list(all_methods)}")
    logger.info(f"   🌍 Domain distribution: {dict(sorted(all_domains.items()))}")
    logger.info(f"   📊 Final database size: {len(concept_database)} concepts")
    
    return results

# Legacy compatibility functions - updated for purity-based universal pipeline
def ingest_pdf_and_update_index(
    pdf_path: str,
    index_path: str,
    max_concepts: int = None,
    dim: int = 16,
    json_out: str = None,
    min_quality_score: float = 0.6,
    apply_gating: bool = True,
    coherence_threshold: float = 0.7,
    use_enhanced_extraction: bool = True,
    use_adaptive_thresholds: bool = True,
    save_full_results: bool = True,
    diagnostic_mode: bool = False,
    extraction_threshold: float = 0.0  # Universal: Zero threshold
) -> dict:
    """
    Legacy function - forwards to purity-based universal pipeline implementation.
    """
    logger.info(f"🔄 🏆 Legacy function called - forwarding to PURITY-BASED UNIVERSAL PIPELINE")
    result = ingest_pdf_clean(pdf_path, extraction_threshold=extraction_threshold)
    
    # Add legacy-expected fields
    result["extraction_method"] = "purity_based_universal_pipeline"
    result["universal_pipeline_applied"] = True
    result["purity_based_applied"] = True
    result["concept_database_updated"] = result.get("auto_prefilled_concepts", 0) > 0
    
    return result

# Export functions
__all__ = [
    'ingest_pdf_clean',
    'batch_ingest_pdfs_clean', 
    'extract_and_boost_concepts',
    'boost_known_concepts',
    'auto_prefill_concept_db',
    'load_universal_concept_database',
    'extractConceptsFromDocument',
    'analyze_concept_purity',
    'ingest_pdf_and_update_index'  # Legacy compatibility
]

logger.info(f"🏆 🧬 PURITY-BASED UNIVERSAL PDF PIPELINE LOADED")
logger.info(f"📥 Cross-domain auto-discovery enabled across all academic fields")
logger.info(f"🏆 Purity-based analysis: Quality over quantity - extracting the 'truth'")
logger.info(f"🌍 {len(concept_database)} concepts ready: Science, Humanities, Arts, Philosophy, Mathematics, and more!")
