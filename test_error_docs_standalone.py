#!/usr/bin/env python3
"""
Standalone test for error documentation completeness.

This script verifies that documentation exists for all error codes
without relying on imports from the ELFIN framework.
"""

import pathlib
import os
import sys


def check_error_docs_exist(doc_dir: pathlib.Path, error_codes: list) -> tuple:
    """
    Check if documentation exists for all given error codes.
    
    Args:
        doc_dir: Path to documentation directory
        error_codes: List of error codes to check
        
    Returns:
        Tuple of (success, missing_docs)
    """
    missing_docs = []
    
    for code in error_codes:
        # Normalize error code
        if code.startswith("E-"):
            code = code[2:]
            
        # Check if documentation exists
        # Replace underscore with hyphen for the filename
        filename = f"E-{code.replace('_', '-')}.md"
        doc_file = doc_dir / filename
        if not doc_file.exists():
            missing_docs.append(code)
    
    return len(missing_docs) == 0, missing_docs


def main():
    """Main function."""
    # Get the documentation directory
    docs_dir = pathlib.Path("docs") / "errors"
    if not docs_dir.exists():
        print(f"Error: Documentation directory not found: {docs_dir}")
        return 1
    
    # Known error codes that should have documentation
    # This list should be kept in sync with VerificationError.ERROR_CODES
    known_error_codes = [
        "LYAP_001",
        "LYAP_002",
        "LYAP_003",
        "VERIF_001",
        "VERIF_002",
        "PARAM_001",
    ]
    
    # Check if documentation exists
    success, missing_docs = check_error_docs_exist(docs_dir, known_error_codes)
    
    if success:
        print("✅ All error documentation exists")
        return 0
    else:
        print("⚠️ Missing documentation for error codes:")
        for code in missing_docs:
            print(f"  - E-{code}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
