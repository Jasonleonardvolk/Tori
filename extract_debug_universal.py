import os
import io
import sys
from datetime import datetime

# Import our new universal extraction system
from extraction import extract_concepts_from_pdf, extract_pdf_sections, extract_concepts_universal

# --- CONFIG ---
DEBUG_LOG = f"universal_extraction_debug_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

def debug_log(msg):
    print(msg)
    with open(DEBUG_LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def debug_extract_concepts(pdf_file_path_or_bytes):
    debug_log(f"--- Running UNIVERSAL extraction on: {pdf_file_path_or_bytes} ---")
    
    # Step 1: Extract PDF sections (same as our pipeline)
    sections, title = extract_pdf_sections(pdf_file_path_or_bytes)
    debug_log(f"\n=== PDF SECTIONS FOUND ===")
    for section_name, text in sections.items():
        debug_log(f"[{section_name}]: {len(text)} chars")
        debug_log(f"Preview: {text[:300]}...")
        debug_log("-" * 50)
    debug_log(f"Title: {title}")
    
    # Step 2: Run extraction on each section
    all_concepts = []
    for idx, (section, text) in enumerate(sections.items()):
        debug_log(f"\n=== EXTRACTING FROM SECTION: {section} ===")
        concepts = extract_concepts_universal(text, chunk_index=idx, chunk_section=section)
        debug_log(f"Found {len(concepts)} concepts in {section}")
        
        for concept in concepts:
            debug_log(f"  - {concept['name']}: score={concept['score']} methods={concept['source']['methods']}")
            all_concepts.append(concept)
    
    # Step 3: Show final results
    debug_log(f"\n=== TOTAL CONCEPTS EXTRACTED: {len(all_concepts)} ===")
    
    # De-duplicate (same logic as pipeline)
    unique = {}
    for c in all_concepts:
        key = c['name'].lower()
        if key not in unique or c['score'] > unique[key]['score']:
            unique[key] = c
    
    final_concepts = list(unique.values())
    final_concepts.sort(key=lambda x: x['score'], reverse=True)
    
    debug_log(f"\n=== FINAL UNIQUE CONCEPTS: {len(final_concepts)} ===")
    for concept in final_concepts:
        debug_log(f"  {concept['name']}")
        debug_log(f"    Score: {concept['score']}")
        debug_log(f"    Methods: {concept['source']['methods']}")
        debug_log(f"    Sections: {concept['metadata'].get('chunk_sections', [])}")
        debug_log(f"    Method Count: {concept['metadata'].get('method_count', 0)}")
        debug_log("-" * 30)
    
    return final_concepts

def compare_with_original(pdf_path):
    """Compare our new system with what the original debug script would find"""
    debug_log("\n" + "="*60)
    debug_log("COMPARISON WITH ORIGINAL APPROACH")
    debug_log("="*60)
    
    # Run our new universal system
    new_concepts = debug_extract_concepts(pdf_path)
    
    # Also run the direct pipeline call
    pipeline_concepts = extract_concepts_from_pdf(pdf_path)
    
    debug_log(f"\n=== COMPARISON RESULTS ===")
    debug_log(f"Universal Debug: {len(new_concepts)} concepts")
    debug_log(f"Pipeline Direct: {len(pipeline_concepts)} concepts")
    
    # Check if they match
    debug_log(f"\n=== PIPELINE CONCEPTS ===")
    for concept in pipeline_concepts:
        debug_log(f"  {concept['name']}: {concept['score']}")
    
    return new_concepts, pipeline_concepts

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_debug_universal.py path_to_pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    debug_log(f"Starting universal concept extraction debug for: {pdf_path}")
    
    try:
        new_concepts, pipeline_concepts = compare_with_original(pdf_path)
        
        print(f"\n=== SUMMARY ===")
        print(f"Universal Debug Found: {len(new_concepts)} concepts")
        print(f"Pipeline Direct Found: {len(pipeline_concepts)} concepts")
        print(f"\nTop concepts:")
        for i, concept in enumerate(new_concepts[:10]):
            print(f"  {i+1}. {concept['name']} (score: {concept['score']}, methods: {concept['source']['methods']})")
        
        print(f"\nFull debug log saved to: {DEBUG_LOG}")
        
    except Exception as e:
        debug_log(f"ERROR: {str(e)}")
        import traceback
        debug_log(traceback.format_exc())
        print(f"Error occurred - check {DEBUG_LOG} for details")
