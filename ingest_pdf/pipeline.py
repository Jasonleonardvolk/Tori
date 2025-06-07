from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional, Set
import numpy as np
import json
import os
import hashlib
import PyPDF2
import logging
from datetime import datetime

# Import all enhanced modules (addresses all Issues #1-#4)
try:
    # Try absolute imports first (when imported as package)
    from extract_blocks import extract_concept_blocks, extract_chunks
    from features import build_feature_matrix
    from spectral import spectral_embed
    from clustering import run_oscillator_clustering, cluster_cohesion
    from scoring import score_clusters, resonance_score, narrative_centrality, build_cluster_adjacency, filter_concepts, apply_confidence_fallback, calculate_concept_confidence
    from keywords import extract_keywords
    from models import ConceptTuple, ConceptExtractionResult, create_concept_tuple_from_dict
    from persistence import save_concepts, save_extraction_result
    from lyapunov import concept_predictability, document_chaos_profile
    from source_validator import validate_source, SourceValidationResult
    from memory_gating import apply_memory_gating
    from phase_walk import PhaseCoherentWalk
    from pipeline_validator import validate_concepts
    from concept_logger import default_concept_logger as concept_logger, log_loop_record, log_concept_summary, warn_empty_segment
    from threshold_config import MIN_CONFIDENCE, FALLBACK_MIN_COUNT, MAX_CONCEPTS_DEFAULT, get_threshold_for_media_type, get_adaptive_threshold, get_fallback_count
    from cognitive_interface import add_concept_diff
    from extractConceptsFromDocument import extractConceptsFromDocument, reset_frequency_counter, track_concept_frequency, get_concept_frequency, concept_frequency_counter
except ImportError:
    # Fallback to relative imports (when imported as module)
    from .extract_blocks import extract_concept_blocks, extract_chunks
    from .features import build_feature_matrix
    from .spectral import spectral_embed
    from .clustering import run_oscillator_clustering, cluster_cohesion
    from .scoring import score_clusters, resonance_score, narrative_centrality, build_cluster_adjacency, filter_concepts, apply_confidence_fallback, calculate_concept_confidence
    from .keywords import extract_keywords
    from .models import ConceptTuple, ConceptExtractionResult, create_concept_tuple_from_dict
    from .persistence import save_concepts, save_extraction_result
    from .lyapunov import concept_predictability, document_chaos_profile
    from .source_validator import validate_source, SourceValidationResult
    from .memory_gating import apply_memory_gating
    from .phase_walk import PhaseCoherentWalk
    from .pipeline_validator import validate_concepts
    from .concept_logger import default_concept_logger as concept_logger, log_loop_record, log_concept_summary, warn_empty_segment
    from .threshold_config import MIN_CONFIDENCE, FALLBACK_MIN_COUNT, MAX_CONCEPTS_DEFAULT, get_threshold_for_media_type, get_adaptive_threshold, get_fallback_count
    from .cognitive_interface import add_concept_diff
    from .extractConceptsFromDocument import extractConceptsFromDocument, reset_frequency_counter, track_concept_frequency, get_concept_frequency, concept_frequency_counter

# Configure logging
logger = logging.getLogger("pdf_ingestion")
logger.setLevel(logging.INFO)

# Feature flags for context extraction
ENABLE_CONTEXT_EXTRACTION = True
ENABLE_FREQUENCY_TRACKING = True
ENABLE_SMART_FILTERING = True

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

def extract_title_abstract_safe(chunks: List[Any], pdf_path: str) -> Tuple[str, str]:
    """Safely extract title and abstract from document"""
    title_text = ""
    abstract_text = ""
    
    try:
        # Get first chunk text
        if chunks and len(chunks) > 0:
            first_chunk = chunks[0]
            if isinstance(first_chunk, dict):
                first_text = first_chunk.get("text", "")
            else:
                first_text = str(first_chunk)
            
            # Try to extract title (first non-empty line)
            lines = [ln.strip() for ln in first_text.splitlines() if ln.strip()]
            if lines:
                candidate = lines[0]
                # Validate it looks like a title
                if 10 < len(candidate) < 150 and not candidate.endswith('.'):
                    title_text = candidate
            
            # Extract abstract
            lower_text = first_text.lower()
            if "abstract" in lower_text:
                idx = lower_text.index("abstract")
                abstract_start = idx + len("abstract")
                # Skip punctuation
                while abstract_start < len(first_text) and first_text[abstract_start] in ": \n\r\t":
                    abstract_start += 1
                abstract_text = first_text[abstract_start:].strip()
                
                # Stop at Introduction if found
                intro_pos = abstract_text.lower().find("introduction")
                if intro_pos > 0:
                    abstract_text = abstract_text[:intro_pos].strip()
                
                # Limit abstract length
                abstract_text = abstract_text[:1000]  # Safety limit
        
        # Fallback: use filename
        if not title_text:
            filename = Path(pdf_path).stem
            if len(filename) > 10 and not filename.replace('_', '').replace('-', '').isdigit():
                title_text = filename.replace('_', ' ').replace('-', ' ')
    
    except Exception as e:
        logger.debug(f"Could not extract title/abstract: {e}")
    
    return title_text, abstract_text

def is_rogue_concept_contextual(name: str, concept: dict) -> tuple[bool, str]:
    """Detect rogue concepts using all available context"""
    name_lower = name.lower()
    
    # Get metadata with safe defaults
    frequency = concept.get('metadata', {}).get('frequency', 1)
    sections = concept.get('metadata', {}).get('sections', ['body'])
    score = concept.get('score', 0)
    
    # Known peripheral patterns
    PERIPHERAL_PATTERNS = {
        'puzzle', 'example', 'case study', 'illustration', 'exercise', 
        'problem set', 'quiz', 'test case', 'figure', 'table', 
        'equation', 'listing', 'algorithm', 'lemma', 'theorem'
    }
    
    # Generic terms to filter
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
    
    # Check if it's likely peripheral
    for pattern in PERIPHERAL_PATTERNS:
        if pattern in name_lower:
            # Keep if high frequency or in important sections
            if frequency >= 3:
                return False, ""
            if any(sec in ['abstract', 'introduction', 'conclusion'] for sec in sections):
                return False, ""
            # Keep if database boosted (suggests importance)
            if concept.get('source', {}).get('database_matched'):
                return False, ""
            return True, "peripheral_pattern"
    
    # References-only concepts are suspect
    if sections == ['references'] and frequency <= 2:
        return True, "references_only"
    
    # Single occurrence in non-critical section
    if frequency == 1 and not any(sec in ['abstract', 'introduction'] for sec in sections):
        if score < 0.7:  # Low confidence single mention
            return True, "single_peripheral_mention"
    
    # Very generic terms with low frequency
    if name_lower in GENERIC_TERMS and frequency < 3:
        return True, "generic_low_frequency"
    
    return False, ""

def merge_near_duplicates_smart(concepts: List[Dict]) -> List[Dict]:
    """Merge duplicates preferring high-frequency, multi-section concepts"""
    merged = []
    processed = set()
    
    for i, concept in enumerate(concepts):
        if i in processed:
            continue
            
        name = concept['name']
        name_lower = name.lower()
        name_words = set(name_lower.split())
        
        # Find all related concepts
        related = [concept]
        variants = []
        
        for j, other in enumerate(concepts[i+1:], i+1):
            if j in processed:
                continue
                
            other_name = other['name']
            other_lower = other_name.lower()
            other_words = set(other_lower.split())
            
            # Check relationships
            if (name_words.issubset(other_words) or 
                other_words.issubset(name_words) or
                (len(name_words & other_words) / min(len(name_words), len(other_words)) > 0.6)):
                related.append(other)
                processed.add(j)
                variants.append(other_name)
        
        # Choose best representative based on context
        if len(related) > 1:
            # Sort by: frequency desc, section diversity desc, length desc, score desc
            related.sort(key=lambda x: (
                -x.get('metadata', {}).get('frequency', 1),
                -len(x.get('metadata', {}).get('sections', ['body'])),
                -len(x['name'].split()),
                -x['score']
            ))
            best = related[0]
            
            # Merge metadata
            merged_frequency = sum(c.get('metadata', {}).get('frequency', 1) for c in related)
            merged_sections = set()
            for c in related:
                merged_sections.update(c.get('metadata', {}).get('sections', ['body']))
            
            best['metadata']['merged_variants'] = variants
            best['metadata']['merged_count'] = len(related)
            best['metadata']['frequency'] = merged_frequency
            best['metadata']['sections'] = list(merged_sections)
            
            # Boost score for strong consensus
            best['score'] = min(0.99, best['score'] * (1 + 0.05 * len(related)))
            best['purity_metrics']['decision'] = 'MERGED_CONSENSUS'
            
            logger.info(f"🔄 Smart merge: {best['name']} ← {variants} (freq: {merged_frequency})")
        else:
            best = concept
            
        merged.append(best)
        processed.add(i)
    
    return merged

def analyze_concept_purity(all_concepts: List[Dict[str, Any]], doc_name: str = "", title_text: str = "", abstract_text: str = "") -> List[Dict[str, Any]]:
    """
    🏆 CONCEPT PURITY ANALYSIS - Extract the "truth" based on quality, not quantity
    Now with context awareness and smart filtering
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
            # Check for rogue concepts with context
            if ENABLE_SMART_FILTERING:
                is_rogue, rogue_reason = is_rogue_concept_contextual(name, concept)
                if is_rogue:
                    rejection_reason = rogue_reason
                    decision = "REJECTED"
            
            if rejection_reason == "":  # Not rejected yet
                # Get frequency and section data with safe fallbacks
                frequency = concept.get('metadata', {}).get('frequency', 1)
                sections = concept.get('metadata', {}).get('sections', ['body'])
                in_title = concept.get('metadata', {}).get('in_title', False)
                in_abstract = concept.get('metadata', {}).get('in_abstract', False)
                
                # Enhanced acceptance criteria with context awareness
                method_count = method.count('+') + 1 if '+' in method else 1
                
                if method_count >= 3:  # Triple consensus - ALWAYS ACCEPT
                    decision = "TRIPLE_CONSENSUS"
                    consensus_concepts.append(concept)
                elif method_count == 2 and score >= 0.5:  # Double consensus
                    decision = "DOUBLE_CONSENSUS"
                    consensus_concepts.append(concept)
                elif is_boosted and score >= 0.75:  # Relaxed from 0.8
                    decision = "DB_BOOST"
                    database_boosted.append(concept)
                elif (in_title or in_abstract) and score >= 0.7:  # Title/Abstract boost
                    decision = "TITLE_ABSTRACT_BOOST"
                    high_confidence.append(concept)
                elif score >= 0.85 and word_count <= 3:  # Relaxed from 0.9
                    decision = "HIGH_CONF"
                    high_confidence.append(concept)
                elif score >= 0.75 and word_count <= 2:  # Relaxed from 0.8
                    decision = "ACCEPTED"
                    single_method.append(concept)
                elif frequency >= 3 and score >= 0.65:  # Frequency boost for borderline
                    decision = "FREQUENCY_BOOST"
                    single_method.append(concept)
                else:
                    rejection_reason = "below_relaxed_thresholds"
        
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
    
    logger.info(f"🏆 FINAL PURE CONCEPTS: {len(unique_pure)}")
    
    return unique_pure

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
                    "priority_concept": True
                }
            })
    
    logger.info(f"🚀 Quality-focused boost complete: {len(boosted)} high-priority concepts found")
    
    return boosted

def extract_and_boost_concepts(chunk: str, threshold: float = 0.0, chunk_index: int = 0, chunk_section: str = "body", title_text: str = "", abstract_text: str = "") -> List[Dict[str, Any]]:
    """🌍 UNIVERSAL EXTRACT AND BOOST - Enhanced with context and frequency"""
    logger.info(f"🔧 🌍 UNIVERSAL EXTRACT AND BOOST: threshold: {threshold}")
    logger.info(f"🔬 Chunk length: {len(chunk)} chars, index: {chunk_index}, section: {chunk_section}")
    
    # Extract concepts using universal method with chunk context
    logger.info("🔬 STEP 1: Calling universal extractConceptsFromDocument...")
    semantic_hits = extractConceptsFromDocument(chunk, threshold=threshold, chunk_index=chunk_index, chunk_section=chunk_section)
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
    
    # Mark concepts with cross-reference potential and add context
    for concept in combined:
        name = concept['name']
        name_lower = name.lower()
        
        # Cross-reference marking
        if concept_name_counts[name_lower] > 1:
            concept.setdefault("metadata", {})["cross_reference_boost"] = True
            concept.setdefault("metadata", {})["methods_found"] = concept_name_counts[name_lower]
        
        # Add frequency data from global counter
        freq_data = get_concept_frequency(name)
        concept.setdefault('metadata', {})['frequency'] = freq_data['count']
        
        # Add section data if not already present
        if 'sections' not in concept.get('metadata', {}):
            if 'chunk_sections' in concept.get('metadata', {}):
                # Convert from extractConceptsFromDocument format
                concept['metadata']['sections'] = list(concept['metadata']['chunk_sections'])
            else:
                concept['metadata']['sections'] = [chunk_section]
        
        # Add title/abstract flags
        concept['metadata']['in_title'] = bool(title_text and name_lower in title_text.lower())
        concept['metadata']['in_abstract'] = bool(abstract_text and name_lower in abstract_text.lower())
    
    return combined

def extract_pdf_metadata(pdf_path: str) -> Dict[str, Any]:
    """Extract comprehensive metadata from PDF file for source provenance tracking."""
    metadata = {
        "filename": Path(pdf_path).name,
        "file_path": pdf_path,
        "extraction_timestamp": datetime.now().isoformat(),
        "extractor_version": "context_aware_purity_pipeline_v2.0"
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

def get_dynamic_limits(file_size_mb: float) -> tuple:
    """Dynamic limits based on file size to optimize performance"""
    if file_size_mb < 1:  # Small files (<1MB) 
        max_chunks = 300
        max_concepts = 200
        logger.info(f"📏 Small file ({file_size_mb:.1f}MB): {max_chunks} chunks, {max_concepts} max concepts")
    elif file_size_mb < 5:  # Medium files (1-5MB)
        max_chunks = 500
        max_concepts = 500
        logger.info(f"📏 Medium file ({file_size_mb:.1f}MB): {max_chunks} chunks, {max_concepts} max concepts")
    else:  # Large files (>5MB)
        max_chunks = 800
        max_concepts = 800
        logger.info(f"📏 Large file ({file_size_mb:.1f}MB): {max_chunks} chunks, {max_concepts} max concepts")
    
    return max_chunks, max_concepts

def ingest_pdf_clean(pdf_path: str, doc_id: str = None, extraction_threshold: float = 0.0) -> Dict[str, Any]:
    """
    🏆 CONTEXT-AWARE PURITY-BASED UNIVERSAL PDF INGESTION PIPELINE
    
    Now with section detection, frequency tracking, and smart filtering!
    """
    start_time = datetime.now()
    
    if doc_id is None:
        doc_id = Path(pdf_path).stem
    
    # 🚨 DYNAMIC PERFORMANCE LIMITS based on file size
    file_size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
    MAX_CHUNKS, MAX_TOTAL_CONCEPTS = get_dynamic_limits(file_size_mb)
    
    logger.info(f"🏆 🌍 CONTEXT-AWARE PURITY-BASED UNIVERSAL PDF INGESTION: {Path(pdf_path).name}")
    logger.info(f"🔬 ZERO THRESHOLD MODE: {extraction_threshold} (maximum coverage)")
    logger.info("🌍 UNIVERSAL PIPELINE: Cross-domain concept extraction enabled")
    logger.info("📍 CONTEXT EXTRACTION: Section detection and frequency tracking enabled")
    logger.info(f"📊 Database ready: {len(concept_database)} concepts across all domains")
    logger.info("🏆 PURITY-BASED: Quality over quantity - extracting the 'truth'")
    logger.info(f"🚨 DYNAMIC PERFORMANCE LIMITS: Max {MAX_CHUNKS} chunks, stop at {MAX_TOTAL_CONCEPTS} concepts")
    
    try:
        # Extract metadata for provenance
        doc_metadata = extract_pdf_metadata(pdf_path)
        
        # Reset frequency counter for this document
        if ENABLE_FREQUENCY_TRACKING:
            reset_frequency_counter()
        
        # Extract chunks from PDF with section context
        chunks = extract_chunks(pdf_path)  # Now returns enhanced chunks
        if not chunks:
            logger.warning(f"⚠️ No chunks extracted from {pdf_path}")
            return {
                "filename": Path(pdf_path).name,
                "concept_count": 0,
                "status": "empty",
                "processing_time_seconds": (datetime.now() - start_time).total_seconds()
            }
        
        # Extract title and abstract safely
        title_text, abstract_text = "", ""
        if ENABLE_CONTEXT_EXTRACTION:
            title_text, abstract_text = extract_title_abstract_safe(chunks, pdf_path)
            logger.info(f"📄 Title: {title_text[:50]}..." if title_text else "📄 No title extracted")
            logger.info(f"📄 Abstract: {len(abstract_text)} chars" if abstract_text else "📄 No abstract found")
        
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
        sections_encountered = set()
        
        for i, chunk_data in enumerate(chunks_to_process):
            # Handle enhanced chunk format
            if isinstance(chunk_data, dict):
                chunk_text = chunk_data.get("text", "")
                chunk_index = chunk_data.get("index", i)
                chunk_section = chunk_data.get("section", "body")
            else:
                # Fallback for old format
                chunk_text = chunk_data
                chunk_index = i
                chunk_section = "body"
            
            sections_encountered.add(chunk_section)
            
            logger.info(f"🔬 =============== UNIVERSAL CHUNK {i+1}/{len(chunks_to_process)} ===============")
            logger.info(f"📊 Processing chunk {i+1}/{len(chunks_to_process)} ({len(chunk_text)} chars) - Section: {chunk_section}")
            
            # 🌍 Apply universal extraction + boosting with context
            enhanced_concepts = extract_and_boost_concepts(
                chunk_text, 
                threshold=extraction_threshold,
                chunk_index=chunk_index,
                chunk_section=chunk_section,
                title_text=title_text,
                abstract_text=abstract_text
            )
            
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
        
        # 🏆 APPLY CONTEXT-AWARE PURITY ANALYSIS
        logger.info(f"🔬 Raw extraction complete: {len(all_extracted_concepts)} concepts")
        logger.info("🏆 APPLYING CONTEXT-AWARE PURITY ANALYSIS - Extracting the 'truth'...")
        
        initial_concept_count = len(all_extracted_concepts)
        pure_concepts = analyze_concept_purity(all_extracted_concepts, Path(pdf_path).name, title_text, abstract_text)
        
        # Use pure concepts for the rest of the pipeline
        all_extracted_concepts = pure_concepts
        
        logger.info(f"🏆 Using {len(pure_concepts)} PURE concepts for final output")
        logger.info(f"🔥 Purity filter efficiency: {len(pure_concepts)}/{initial_concept_count} = "
                   f"{(len(pure_concepts)/initial_concept_count)*100:.1f}% kept")
        
        # Update counts for pure concepts
        pure_semantic_count = len([c for c in pure_concepts if "universal" in c.get("method", "")])
        pure_boosted_count = len([c for c in pure_concepts if "boost" in c.get("method", "")])
        cross_reference_boosted = len([c for c in pure_concepts if c.get("metadata", {}).get("cross_reference_boost", False)])
        title_abstract_boosted = len([c for c in pure_concepts if c.get('purity_metrics', {}).get('decision') == 'TITLE_ABSTRACT_BOOST'])
        frequency_boosted = len([c for c in pure_concepts if c.get('purity_metrics', {}).get('decision') == 'FREQUENCY_BOOST'])
        
        # 🧠 CONCEPTMESH INTEGRATION
        logger.info(f"🔬 INJECTING {len(all_extracted_concepts)} PURE CONCEPTS INTO CONCEPTMESH")
        
        concept_diff_data = {
            "type": "document",
            "title": Path(pdf_path).name,
            "concepts": all_extracted_concepts,
            "summary": f"Context-aware purity-based extraction found {len(all_extracted_concepts)} pure concepts from {initial_concept_count} raw extractions",
            "metadata": {
                "source": "context_aware_purity_based_universal_pdf_ingest",
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
                "title_abstract_boosted": title_abstract_boosted,
                "frequency_boosted": frequency_boosted,
                "extraction_threshold": extraction_threshold,
                "extraction_timestamp": datetime.now().isoformat(),
                "processing_time_seconds": (datetime.now() - start_time).total_seconds(),
                "universal_pipeline": True,
                "purity_based": True,
                "context_aware": True,
                "universal_methods": list(universal_methods),
                "domain_distribution": domain_distribution,
                "sections_identified": list(sections_encountered),
                "title_extracted": bool(title_text),
                "abstract_extracted": bool(abstract_text)
            }
        }
        
        add_concept_diff(concept_diff_data)
        
        # Final summary
        processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"✅ 🏆 CONTEXT-AWARE PURITY-BASED UNIVERSAL PDF INGESTION COMPLETE: {Path(pdf_path).name}")
        logger.info(f"📊 FINAL RESULTS: {len(all_extracted_concepts)} pure concepts (from {initial_concept_count} raw)")
        logger.info(f"   🚨 Performance: {len(chunks_to_process)}/{len(chunks)} chunks processed in {processing_time:.1f}s")
        logger.info(f"   📍 Sections identified: {list(sections_encountered)}")
        logger.info(f"⏱️ Total processing time: {processing_time:.2f}s")
        
        # Response data
        response_data = {
            "filename": Path(pdf_path).name,
            "concept_count": len(all_extracted_concepts),
            "concept_names": [c["name"] for c in all_extracted_concepts],
            "semantic_concepts": pure_semantic_count,
            "boosted_concepts": pure_boosted_count,
            "cross_reference_boosted": cross_reference_boosted,
            "title_abstract_boosted": title_abstract_boosted,
            "frequency_boosted": frequency_boosted,
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
            "extraction_method": "context_aware_purity_based_universal_pipeline",
            "universal_pipeline": True,
            "purity_based": True,
            "context_aware": True,
            "database_size": len(concept_database),
            "status": "success",
            "context_extraction": {
                "title_extracted": bool(title_text),
                "abstract_extracted": bool(abstract_text),
                "sections_identified": list(sections_encountered),
            },
            "filtering_stats": {
                "title_abstract_boosted": title_abstract_boosted,
                "frequency_boosted": frequency_boosted
            },
            "purity_analysis": {
                "raw_concepts": initial_concept_count,
                "pure_concepts": len(all_extracted_concepts),
                "purity_efficiency": f"{(len(all_extracted_concepts)/initial_concept_count)*100:.1f}%",
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
                        "reasons": c.get('purity_metrics', {}).get('purity_reasons', []),
                        "frequency": c.get('metadata', {}).get('frequency', 1),
                        "sections": c.get('metadata', {}).get('sections', ['body'])
                    }
                    for c in all_extracted_concepts[:10]
                ]
            }
        }
        
        return response_data
        
    except Exception as e:
        logger.exception(f"❌ Error during context-aware purity-based universal PDF ingestion: {str(e)}")
        return {
            "filename": Path(pdf_path).name,
            "concept_count": 0,
            "status": "error",
            "error_message": str(e),
            "processing_time_seconds": (datetime.now() - start_time).total_seconds()
        }

# Export functions
__all__ = [
    'ingest_pdf_clean',
    'extract_and_boost_concepts',
    'boost_known_concepts',
    'load_universal_concept_database',
    'extractConceptsFromDocument',
    'analyze_concept_purity',
    'extract_title_abstract_safe',
    'is_rogue_concept_contextual',
    'merge_near_duplicates_smart'
]

logger.info(f"🏆 🧬 CONTEXT-AWARE PURITY-BASED UNIVERSAL PDF PIPELINE LOADED")
logger.info(f"🏆 Purity-based analysis: Quality over quantity - extracting the 'truth'")
logger.info(f"📍 Context extraction: Section detection, frequency tracking, and smart filtering")
logger.info(f"🌍 {len(concept_database)} concepts ready: Science, Humanities, Arts, Philosophy, Mathematics, and more!")
