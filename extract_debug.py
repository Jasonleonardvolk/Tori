import os
import io
import fitz  # PyMuPDF
import spacy
from collections import Counter, defaultdict
import re
import sys
from datetime import datetime

# --- CONFIG ---
DEBUG_LOG = f"concept_extraction_debug_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

# Try to load spaCy English NLP model.
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = None

DEFAULT_STOPWORDS = set([
    "the", "and", "of", "to", "in", "for", "a", "is", "on", "that", "with", "as",
    "by", "an", "be", "are", "from", "at", "this", "or", "which", "it", "we",
    "can", "not", "have", "has", "was", "were", "but", "all", "also", "their",
    "they", "will", "one", "our", "may", "more", "such", "these", "using",
])

def debug_log(msg):
    print(msg)
    with open(DEBUG_LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def extract_pdf_sections(pdf_file_path_or_bytes):
    if isinstance(pdf_file_path_or_bytes, (bytes, io.BytesIO)):
        pdf_doc = fitz.open(stream=pdf_file_path_or_bytes, filetype="pdf")
    else:
        pdf_doc = fitz.open(pdf_file_path_or_bytes)

    sections = {}
    full_text = []
    title = ""

    # Log every page's raw text
    for page_num, page in enumerate(pdf_doc):
        page_text = page.get_text()
        debug_log(f"\n=== [PAGE {page_num+1}] ===\n{page_text[:2000]}")
        full_text.append(page_text)
        lower = page_text.lower()
        if "abstract" in lower:
            match = re.search(r'abstract(.*?)(\n|introduction)', lower, re.DOTALL)
            if match:
                sections["Abstract"] = match.group(1).strip()
        if "introduction" in lower:
            match = re.search(r'introduction(.*?)(\n|methods|background|results|discussion)', lower, re.DOTALL)
            if match:
                sections["Introduction"] = match.group(1).strip()

    # Heuristic for title: first non-trivial line on page 1
    first_page = pdf_doc.load_page(0)
    lines = first_page.get_text().split('\n')
    for line in lines:
        if 3 < len(line.split()) < 15 and 5 < len(line) < 100:
            title = line.strip()
            break

    if not sections:
        sections["FullText"] = "\n".join(full_text)
    pdf_doc.close()
    debug_log(f"\n=== SECTION MAP ===\n{sections}\n=== TITLE ===\n{title}\n")
    return sections, title

def extract_concepts(pdf_file_path_or_bytes):
    debug_log(f"--- Running extraction on: {pdf_file_path_or_bytes} ---")
    text_sections, title = extract_pdf_sections(pdf_file_path_or_bytes)
    all_text = "\n".join(text_sections.values())
    debug_log(f"\n=== RAW TEXT DUMP ===\n{all_text[:3000]}\n=== END RAW TEXT ===")

    results = []
    candidates = []

    if nlp:
        debug_log("--- Using spaCy for NLP extraction ---")
        for section, text in text_sections.items():
            doc = nlp(text)
            for chunk in doc.noun_chunks:
                candidates.append((chunk.text.strip(), section, "noun_chunk"))
            for ent in doc.ents:
                candidates.append((ent.text.strip(), section, f"ent:{ent.label_}"))
            for token in doc:
                if token.is_alpha and token.is_title and not token.is_stop:
                    candidates.append((token.text.strip(), section, "proper_noun"))
    else:
        debug_log("--- spaCy not available, using regex fallback ---")
        for section, text in text_sections.items():
            phrases = re.findall(r'\b([A-Z][a-z]+(?: [A-Z][a-z]+)+)\b', text)
            for p in phrases:
                candidates.append((p.strip(), section, "regex_phrase"))
            singles = re.findall(r'\b([A-Z][a-z]{3,})\b', text)
            for s in singles:
                candidates.append((s.strip(), section, "regex_single"))

    debug_log("\n=== CANDIDATE CONCEPTS ===")
    for c in candidates:
        debug_log(f" - {c}")
    debug_log("=== END CANDIDATES ===\n")

    concept_meta = defaultdict(lambda: {
        "frequency": 0,
        "sections": set(),
        "title_match": False,
        "boosted": False,
        "context_snippet": "",
        "sources": set()
    })

    title_words = set([w.lower() for w in title.split()]) if title else set()

    for phrase, section, method in candidates:
        norm = phrase.strip()
        if not norm or norm.lower() in DEFAULT_STOPWORDS or len(norm) < 2:
            continue
        meta = concept_meta[norm]
        meta["frequency"] += 1
        meta["sections"].add(section)
        meta["sources"].add(method)
        if title and norm.lower() in title.lower():
            meta["title_match"] = True
            meta["boosted"] = True
        if meta["frequency"] > 2:
            meta["boosted"] = True

    for norm, meta in concept_meta.items():
        found = re.search(re.escape(norm), all_text, re.IGNORECASE)
        if found:
            start = max(0, found.start() - 30)
            end = min(len(all_text), found.end() + 30)
            meta["context_snippet"] = all_text[start:end]
        else:
            meta["context_snippet"] = ""

    for concept, meta in concept_meta.items():
        results.append({
            "name": concept,
            "frequency": meta["frequency"],
            "sections": ", ".join(meta["sections"]),
            "boosted": meta["boosted"],
            "title_match": meta["title_match"],
            "sources": ", ".join(meta["sources"]),
            "context_snippet": meta["context_snippet"]
        })

    results.sort(key=lambda x: (x["boosted"], x["frequency"]), reverse=True)

    if not results:
        debug_log("!!! No concepts extracted by main logic. Fallback to most frequent 5+ char words.")
        words = [w for w in re.findall(r'\b\w{5,}\b', all_text) if w.lower() not in DEFAULT_STOPWORDS]
        counter = Counter(words)
        for word, count in counter.most_common(20):
            results.append({
                "name": word,
                "frequency": count,
                "sections": "FullText",
                "boosted": False,
                "title_match": False,
                "sources": "fallback",
                "context_snippet": ""
            })

    debug_log(f"=== FINAL CONCEPTS ({len(results)}) ===")
    for r in results:
        debug_log(str(r))
    debug_log("=== END FINAL CONCEPTS ===\n")
    return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_debug.py path_to_pdf")
        sys.exit(1)
    concepts = extract_concepts(sys.argv[1])
    print("\n\n=== CONCEPTS EXTRACTED ===")
    for c in concepts:
        print(f"{c['name']} (freq={c['frequency']}): {c['context_snippet'][:60]}")
    print(f"\nFull log saved to: {DEBUG_LOG}")
