"""
PDF Reader script for extracting text content from PDFs,
with special handling for mathematical content.
"""

import os
import sys
import fitz  # PyMuPDF
import re

def extract_text_with_layout(pdf_path):
    """Extract text while preserving layout structure."""
    doc = fitz.open(pdf_path)
    text_content = []
    
    print(f"\n{'='*40}")
    print(f"DOCUMENT: {os.path.basename(pdf_path)}")
    print(f"Pages: {len(doc)}")
    print(f"{'='*40}\n")
    
    for page_num, page in enumerate(doc):
        # Get text with layout preservation
        text = page.get_text("text")
        text_content.append(f"--- PAGE {page_num+1} ---\n{text}")
        
        # Look for potential mathematical formulas (simple heuristic)
        math_patterns = [
            r'\$[^$]+\$',             # Inline LaTeX: $formula$
            r'\$\$[^$]+\$\$',         # Display LaTeX: $$formula$$
            r'\\begin\{equation\}.*?\\end\{equation\}',  # LaTeX equations
            r'\\frac\{.*?\}\{.*?\}',  # Fractions
            r'\\sum_',                # Summations
            r'\\int_',                # Integrals
            r'[a-z]\^[0-9]',          # Simple superscripts
            r'[a-z]_[0-9]'            # Simple subscripts
        ]
        
        # Identify potential math regions
        math_content = []
        for pattern in math_patterns:
            matches = re.findall(pattern, text, re.DOTALL)
            math_content.extend(matches)
        
        # Report math content found
        if math_content:
            text_content.append(f"\n--- MATH CONTENT ON PAGE {page_num+1} ---")
            for i, formula in enumerate(math_content):
                text_content.append(f"Formula {i+1}: {formula}")
    
    return "\n".join(text_content)

def analyze_for_code_blocks(text):
    """Identify potential Python code blocks."""
    code_patterns = [
        r'def\s+\w+\s*\(.*?\):',              # Function definitions
        r'class\s+\w+(\s*\(.*?\))?:',          # Class definitions
        r'import\s+\w+|from\s+\w+\s+import',   # Import statements
        r'for\s+\w+\s+in\s+.+:',               # For loops
        r'if\s+.+:',                          # If statements
        r'while\s+.+:',                       # While loops
        r'try:.*?except.*?:',                 # Try/except blocks
        r'with\s+.+:',                        # With statements
    ]
    
    code_blocks = []
    lines = text.split('\n')
    in_block = False
    current_block = []
    indentation = 0
    
    for line in lines:
        # Check if line appears to be Python code
        is_code_line = False
        
        # Check for patterns that indicate Python code
        for pattern in code_patterns:
            if re.search(pattern, line):
                is_code_line = True
                if not in_block:
                    in_block = True
                    indentation = len(line) - len(line.lstrip())
                current_block.append(line)
                break
        
        # Continue collecting indented lines as part of code block
        if in_block and not is_code_line:
            line_indentation = len(line) - len(line.lstrip())
            if line.strip() == "" or line_indentation > indentation:
                current_block.append(line)
            else:
                # End of code block
                if current_block:
                    code_blocks.append("\n".join(current_block))
                    current_block = []
                    in_block = False
    
    # Add any remaining block
    if current_block:
        code_blocks.append("\n".join(current_block))
    
    return code_blocks

def extract_and_analyze_pdf(pdf_path):
    """Extract text and analyze content from PDF."""
    # Extract text content with layout preservation
    content = extract_text_with_layout(pdf_path)
    
    # Look for Python code blocks
    code_blocks = analyze_for_code_blocks(content)
    
    if code_blocks:
        print(f"\n{'-'*40}")
        print(f"DETECTED CODE BLOCKS: {len(code_blocks)}")
        print(f"{'-'*40}")
        for i, block in enumerate(code_blocks[:5]):  # Show first 5 blocks
            print(f"\nCode Block {i+1}:")
            print(f"{'-'*20}")
            print(block)
        
        if len(code_blocks) > 5:
            print(f"\n... and {len(code_blocks) - 5} more code blocks")
    
    return content

def main():
    """Main function to process PDF files."""
    # Check command line arguments
    if len(sys.argv) < 2:
        print("Usage: python pdf_reader.py <pdf_file1> [pdf_file2 ...]")
        return
    
    # Process each PDF file
    for pdf_path in sys.argv[1:]:
        if not os.path.exists(pdf_path):
            print(f"File not found: {pdf_path}")
            continue
        
        try:
            content = extract_and_analyze_pdf(pdf_path)
            
            # Save extracted content to text file
            output_path = pdf_path.rsplit('.', 1)[0] + '.txt'
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"\nExtracted content saved to: {output_path}")
            
        except Exception as e:
            print(f"Error processing {pdf_path}: {str(e)}")

if __name__ == "__main__":
    main()
