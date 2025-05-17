#!/usr/bin/env python3
"""
Simple test for the ELFIN formatter provider.
"""

import logging
import os
from elfin_lsp.providers.formatter import _format_elfin_text

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# File path for the unformatted file
TEST_FILE = "examples/unformatted.elfin"

def main():
    """Format an ELFIN file using the formatter."""
    try:
        # Read the file content
        with open(TEST_FILE, 'r') as f:
            content = f.read()
        
        logger.info("Original file content:")
        print("=" * 40)
        print(content)
        print("=" * 40)
        
        # Format the content
        formatted_content = _format_elfin_text(content)
        
        logger.info("Formatted file content:")
        print("=" * 40)
        print(formatted_content)
        print("=" * 40)
        
        # Write the formatted content to a new file
        output_file = f"{TEST_FILE}.formatted"
        with open(output_file, 'w') as f:
            f.write(formatted_content)
        
        logger.info(f"Formatted content written to {output_file}")
        
        # Print a summary of the changes
        original_lines = content.splitlines()
        formatted_lines = formatted_content.splitlines()
        
        logger.info("Formatting changes:")
        logger.info(f"Original: {len(original_lines)} lines")
        logger.info(f"Formatted: {len(formatted_lines)} lines")
        
        # Show line-by-line differences
        for i, (orig, fmt) in enumerate(zip(original_lines, formatted_lines)):
            if orig != fmt:
                logger.info(f"Line {i+1}:")
                logger.info(f"  Original: '{orig}'")
                logger.info(f"  Formatted: '{fmt}'")
        
        return True
    except Exception as e:
        logger.error(f"Error in formatter test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if main():
        print("\nFormatter test completed successfully! ✅")
    else:
        print("\nFormatter test failed! ❌")
