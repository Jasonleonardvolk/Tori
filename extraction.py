"""
Universal Concept Extraction Engine for Prajna Pipeline - ENHANCED
- Cross-domain: Science, Math, Humanities, etc.
- Uses YAKE + KeyBERT + spaCy NER (+ Wikidata linking if available)
- IMPROVED PDF parsing for better content extraction
"""

import os
import logging
from collections import Counter, defaultdict
import re
import io

import fitz  # PyMuPDF
import spacy

from utils.logging import logger

# === Model Globals ===
_yake_extractor = None
_kb_model = None
_nlp = None
_entity_linking = False

def _initialize_models():
    global _yake_extractor, _kb_model, _nlp, _entity_linking
    if _yake_extractor is not None:
        return
    logger.info("Initializing universal concept extraction models...")
    try:
        import yake
        _yake_extractor = yake.KeywordExtractor(
            lan="en", n=3, dedupLim=0.9, top=30  # Increased from 20 to 30
        )
        logger.info("YAKE initialized")
    except Exception as e:
        logger.error(f"Failed to init YAKE: {e}")
        raise
    try:
        from keybert import KeyBERT
        _kb_model = KeyBERT(model='sentence-transformers/all-mpnet-base-v2')
        logger.info("KeyBERT initialized")
    except Exception as e:
        logger.error(f"Failed to init KeyBERT: {e}")
        raise
    try:
        _nlp = spacy.load("en_core_web_lg")
        logger.info("spaCy en_core_web_lg initialized")
        try:
            import spacy_entity_linker
            _nlp.add_pipe("entityLinker", last=True)
            _entity_linking = True
            logger.info("Wikidata entity linker activated")
        except ImportError:
            _entity_linking = False
            logger.info("Entity linker not installed")
    except Exception as e:
        logger.error(f"Failed to init spaCy: {e}")
        raise

# === IMPROVED PDF Section Extraction ===
def extract_pdf_sections(pdf_file_path_or_bytes):
    if isinstance(pdf_file_path_or_bytes, (bytes, io.BytesIO)):
        pdf_doc = fitz.open(stream=pdf_file_path_or_bytes, filetype="pdf")
    else:
        pdf_doc = fitz.open(pdf_file_path_or_bytes)
    
    sections = {}
    full_text = []
    title = ""
    
    # Extract title from first page
    first_page = pdf_doc.load_page(0)
    first_page_text = first_page.get_text()
    lines = first_page_text.split('\n')
    for line in lines:
        line = line.strip()
        if 3 < len(line.split()) < 20 and 10 < len(line) < 200:
            title = line
            break
    
    # Extract all text from all pages
    for page_num, page in enumerate(pdf_doc):
        text = page.get_text()
        full_text.append(text)
    
    # Combine all text
    combined_text = "\n".join(full_text)
    
    # Try to find sections with improved regex patterns
    text_lower = combined_text.lower()
    
    # More robust section extraction
    abstract_match = re.search(r'abstract\s*[:\n](.*?)(?=\n\s*(?:introduction|1\.|background|keywords|index|terms))', text_lower, re.DOTALL | re.IGNORECASE)
    if abstract_match:
        sections["Abstract"] = abstract_match.group(1).strip()
    
    intro_match = re.search(r'(?:introduction|1\.?\s*introduction)\s*[:\n](.*?)(?=\n\s*(?:2\.|method|background|related|approach|problem))', text_lower, re.DOTALL | re.IGNORECASE)
    if intro_match:
        sections["Introduction"] = intro_match.group(1).strip()
    
    # Look for methods/methodology section
    methods_match = re.search(r'(?:method|methodology|approach|2\.)\s*[:\n](.*?)(?=\n\s*(?:3\.|result|experiment|evaluation|discussion))', text_lower, re.DOTALL | re.IGNORECASE)
    if methods_match:
        sections["Methods"] = methods_match.group(1).strip()
    
    # Look for results section
    results_match = re.search(r'(?:result|experiment|evaluation|3\.)\s*[:\n](.*?)(?=\n\s*(?:4\.|discussion|conclusion|related))', text_lower, re.DOTALL | re.IGNORECASE)
    if results_match:
        sections["Results"] = results_match.group(1).strip()
    
    # Look for conclusion section
    conclusion_match = re.search(r'(?:conclusion|discussion|4\.)\s*[:\n](.*?)(?=\n\s*(?:reference|acknowledge|appendix|bibliography))', text_lower, re.DOTALL | re.IGNORECASE)
    if conclusion_match:
        sections["Conclusion"] = conclusion_match.group(1).strip()
    
    # If no sections found, use full text in chunks
    if not sections:
        # Split full text into reasonable chunks
        words = combined_text.split()
        chunk_size = 2000  # words per chunk
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i+chunk_size])
            sections[f"Chunk_{i//chunk_size + 1}"] = chunk
    
    # Ensure we have substantial content
    if not any(len(text) > 100 for text in sections.values()):
        sections["FullText"] = combined_text
    
    pdf_doc.close()
    return sections, title

# === Frequency tracking ===
concept_frequency_counter = {}
def reset_frequency_counter():
    global concept_frequency_counter
    concept_frequency_counter = {}
def track_concept_frequency(concept_name, chunk_index):
    global concept_frequency_counter
    if concept_name not in concept_frequency_counter:
        concept_frequency_counter[concept_name] = {"count": 0, "chunks": set()}
    concept_frequency_counter[concept_name]["count"] += 1
    concept_frequency_counter[concept_name]["chunks"].add(chunk_index)
def get_concept_frequency(concept_name):
    return concept_frequency_counter.get(concept_name, {"count": 1, "chunks": {0}})

# === Enhanced Universal Extraction ===
def extract_concepts_universal(chunk, chunk_index=0, chunk_section="body"):
    _initialize_models()
    if not chunk or not isinstance(chunk, str):
        return []
    text = chunk.strip()
    if not text:
        return []
    
    # Skip if text is too short
    if len(text) < 50:
        logger.warning(f"Skipping short text chunk: {len(text)} chars")
        return []
    
    logger.info(f"Extracting concepts from {len(text)} chars, chunk {chunk_index}, section {chunk_section}")
    concepts = {}
    
    # YAKE - Enhanced
    try:
        yake_keywords = _yake_extractor.extract_keywords(text)
        yake_scores = [score for _, score in yake_keywords]
        min_score = min(yake_scores) if yake_scores else 0
        max_score = max(yake_scores) if yake_scores else 0
        range_score = (max_score - min_score) or 1e-6
        for keyword, score in yake_keywords:
            # More lenient filtering - don't skip based on length alone
            norm_score = 1.0 - ((score - min_score) / range_score) if max_score > min_score else 1.0
            weighted_score = 0.3 * norm_score
            name = keyword.strip()
            if not name or len(name) < 2:  # Very minimal filtering
                continue
            name_key = name.lower()
            if name_key not in concepts:
                concepts[name_key] = {
                    "name": name, "score": 0.0, "methods": set(), "metadata": {"chunk_sections": set()}
                }
            concepts[name_key]["score"] += weighted_score
            concepts[name_key]["methods"].add("YAKE")
            concepts[name_key]["metadata"]["chunk_sections"].add(chunk_section)
            track_concept_frequency(name, chunk_index)
    except Exception as e:
        logger.warning(f"YAKE extraction failed: {e}")
    
    # KeyBERT - Enhanced
    try:
        kb_keywords = _kb_model.extract_keywords(
            text, keyphrase_ngram_range=(1, 4), stop_words="english", top_n=30  # Increased ngrams and top_n
        )
        kb_scores = [score for _, score in kb_keywords]
        max_kb = max(kb_scores) if kb_scores else 1
        for keyword, score in kb_keywords:
            norm_score = score / max_kb if max_kb > 0 else 0
            weighted_score = 0.4 * norm_score
            name = keyword.strip()
            if not name or len(name) < 2:
                continue
            name_key = name.lower()
            if name_key not in concepts:
                concepts[name_key] = {
                    "name": name, "score": 0.0, "methods": set(), "metadata": {"chunk_sections": set()}
                }
            concepts[name_key]["score"] += weighted_score
            concepts[name_key]["methods"].add("KeyBERT")
            concepts[name_key]["metadata"]["chunk_sections"].add(chunk_section)
            track_concept_frequency(name, chunk_index)
    except Exception as e:
        logger.warning(f"KeyBERT extraction failed: {e}")
    
    # spaCy NER - Enhanced
    try:
        doc = _nlp(text)
        ent_counts = {}
        
        # Extract named entities
        for ent in doc.ents:
            if not ent.text.strip() or len(ent.text.strip()) < 2:
                continue
            ent_text = ent.text.strip()
            ent_key = ent_text.lower()
            if ent_key not in ent_counts:
                ent_counts[ent_key] = {
                    "text": ent_text, "count": 0, "label": ent.label_
                }
            ent_counts[ent_key]["count"] += 1
        
        # Also extract noun phrases
        for np in doc.noun_chunks:
            if len(np.text.strip()) > 2 and not np.root.is_stop:
                np_text = np.text.strip()
                np_key = np_text.lower()
                if np_key not in ent_counts:
                    ent_counts[np_key] = {
                        "text": np_text, "count": 0, "label": "NOUN_PHRASE"
                    }
                ent_counts[np_key]["count"] += 1
        
        max_freq = max((val["count"] for val in ent_counts.values()), default=1)
        for ent_key, val in ent_counts.items():
            ent_text = val["text"]
            count = val["count"]
            raw_score = 0.5 + 0.5 * (count / max_freq)
            weighted_score = 0.3 * raw_score
            if ent_key not in concepts:
                concepts[ent_key] = {
                    "name": ent_text, "score": 0.0, "methods": set(), "metadata": {"chunk_sections": set()}
                }
            concepts[ent_key]["score"] += weighted_score
            concepts[ent_key]["methods"].add("NER")
            concepts[ent_key]["metadata"]["entity_type"] = val["label"]
            concepts[ent_key]["metadata"]["chunk_sections"].add(chunk_section)
            track_concept_frequency(ent_text, chunk_index)
            
            # Wikidata linking
            if _entity_linking:
                for linked_ent in doc._.linkedEntities:
                    if linked_ent.get_span().text == ent_text:
                        concepts[ent_key]["metadata"]["wikidata_id"] = linked_ent.get_id()
                        concepts[ent_key]["metadata"]["wikidata_url"] = linked_ent.get_url()
                        break
    except Exception as e:
        logger.warning(f"spaCy NER extraction failed: {e}")
    
    # Consensus/Boost/Normalization - More lenient
    for name_key, data in concepts.items():
        method_count = len(data["methods"])
        if method_count > 1:
            bonus_factor = 1.0 + 0.2 * (method_count - 1)  # Increased bonus
            data["score"] *= bonus_factor
    
    # Normalize scores but keep more concepts
    if concepts:
        max_score = max(data["score"] for data in concepts.values())
        for data in concepts.values():
            data["score"] = round(data["score"] / max_score, 4) if max_score else 0.0
        # Sort but don't filter aggressively
        sorted_concepts = sorted(concepts.values(), key=lambda x: x["score"], reverse=True)
    else:
        sorted_concepts = []
    
    formatted_concepts = []
    for concept in sorted_concepts:
        methods_list = sorted(list(concept["methods"]))
        chunk_sections_list = list(concept["metadata"].get("chunk_sections", set()))
        formatted_concept = {
            "name": concept["name"],
            "score": concept["score"],
            "method": f"universal_{'+'.join(methods_list).lower()}",
            "source": {
                "universal_extraction": True,
                "methods": "+".join(methods_list),
                "extraction_methods": methods_list
            },
            "context": f"Universal extraction via {methods_list}",
            "metadata": {
                "extraction_method": "universal_pipeline",
                "universal": True,
                "method_count": len(methods_list),
                "chunk_sections": chunk_sections_list,
                **{k: v for k, v in concept.get("metadata", {}).items() if k != "chunk_sections"}
            }
        }
        formatted_concepts.append(formatted_concept)
    
    logger.info(f"Universal extraction complete: {len(formatted_concepts)} concepts")
    return formatted_concepts

def extract_concepts_from_pdf(pdf_file_path_or_bytes):
    """Extract concepts from PDF file (as path or bytes). Returns concept list."""
    reset_frequency_counter()
    sections, title = extract_pdf_sections(pdf_file_path_or_bytes)
    all_concepts = []
    for idx, (section, text) in enumerate(sections.items()):
        concepts = extract_concepts_universal(text, chunk_index=idx, chunk_section=section)
        all_concepts.extend(concepts)
    # De-duplicate (by name)
    unique = {}
    for c in all_concepts:
        key = c['name'].lower()
        if key not in unique or c['score'] > unique[key]['score']:
            unique[key] = c
    return list(unique.values())

# CLI test entry point
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python extraction.py path_to_pdf")
        exit(1)
    concepts = extract_concepts_from_pdf(sys.argv[1])
    for c in concepts:
        print(f"{c['name']}: score={c['score']} methods={c['source']['methods']}")
