import re
from typing import List
import PyPDF2

def extract_concept_blocks(pdf_path: str, min_len: int = 30) -> List[str]:
    """Return list of non-trivial text blocks (≥min_len chars)."""
    reader = PyPDF2.PdfReader(str(pdf_path))
    blocks: List[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        for blk in re.split(r"\n\s*\n", text):
            blk = blk.strip()
            if len(blk) >= min_len:
                blocks.append(blk)
    return blocks
