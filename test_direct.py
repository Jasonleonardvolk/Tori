#!/usr/bin/env python3
"""
Simple direct test for the ELFIN code action provider.
"""

import logging
import os
import asyncio
from elfin_lsp.server import ELFIN_LS
from elfin_lsp.providers.code_action import code_action
from elfin_lsp.protocol import Diagnostic, Range, Position
from alan_backend.elfin.standalone_parser import parse

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# File paths
TEST_FILE = "examples/system_with_missing_helper.elfin"
TEST_URI = f"file://{os.path.abspath(TEST_FILE)}"

class MockDocument:
    def __init__(self, source):
        self.source = source

class MockParams:
    def __init__(self, uri, range, diagnostics):
        self.textDocument = type('obj', (object,), {'uri': uri})
        self.range = range
        self.context = type('obj', (object,), {'diagnostics': diagnostics})

async def main():
    try:
        # Read the test file
        with open(TEST_FILE, 'r') as f:
            content = f.read()
        
        logger.info(f"Read test file: {TEST_FILE}")
        
        # Instead of calling process_document, we'll do the minimal setup needed
        # to test the code action functionality
        # Parse the file to get diagnostics
        ast = parse(content)
        
        logger.info("Processed document")
        
        # Create a mock diagnostic
        diag = Diagnostic(
            range=Range(Position(9, 10), Position(9, 15)),
            severity=2,
            message="Function 'hAbs' is not defined. Consider importing helpers.",
            code="MISSING_HELPER"
        )
        
        # Add mock document to workspace
        ELFIN_LS.workspace._documents[TEST_URI] = MockDocument(content)
        
        # Create mock params
        params = MockParams(
            TEST_URI, 
            Range(Position(9, 10), Position(9, 15)),
            [diag]
        )
        
        # Call the code action provider directly
        result = await code_action(ELFIN_LS, params)
        
        if result and len(result) > 0:
            logger.info(f"SUCCESS: Found {len(result)} code actions")
            for i, action in enumerate(result):
                logger.info(f"Action {i+1}: {action.title}")
                if hasattr(action, 'edit') and action.edit:
                    # Get the edit details
                    edit = action.edit
                    if hasattr(edit, 'changes') and edit.changes:
                        for uri, text_edits in edit.changes.items():
                            for text_edit in text_edits:
                                logger.info(f"Edit at {uri}: {text_edit.newText}")
        else:
            logger.error("FAILURE: No code actions returned")
    except Exception as e:
        logger.error(f"Error in test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
