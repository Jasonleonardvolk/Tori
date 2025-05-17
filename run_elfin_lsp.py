#!/usr/bin/env python3
"""
Runner script for the ELFIN Language Server.

This script launches the ELFIN Language Server directly, bypassing
potential PATH issues.
"""

import sys
import logging

# Try to import the elfin_lsp module
try:
    from elfin_lsp import cli
except ImportError:
    print("Error: elfin_lsp module not found.")
    print("Make sure you have installed the package with:")
    print("  pip install -e elfin_lsp/")
    sys.exit(1)

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        filename="elfin_lsp.log",
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )
    
    # Run the CLI main function
    sys.exit(cli.main(["run"]))
