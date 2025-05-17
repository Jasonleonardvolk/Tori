#!/usr/bin/env python3
"""
Test script for the ELFIN LSP code actions functionality.

This script tests the "Import Helpers" code action feature by:
1. Starting the ELFIN LSP server
2. Processing a document with a missing helper function
3. Requesting code actions at the position of the missing helper
4. Applying the code action to add the import statement
5. Verifying the result

Usage:
  python test_import_helpers.py
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from pygls.protocol import LanguageServerProtocol
from elfin_lsp.server import ELFIN_LS, process_document

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# File paths
TEST_FILE = "examples/system_with_missing_helper.elfin"
TEST_URI = f"file://{os.path.abspath(TEST_FILE)}"

async def test_import_helpers():
    """Test the import helpers code action."""
    try:
        # Read the test file
        with open(TEST_FILE, 'r') as f:
            content = f.read()
        
        logger.info(f"Read test file: {TEST_FILE}")
        
        # Process the document
        process_document(ELFIN_LS, TEST_URI, content)
        
        logger.info("Processed document")
        
        # Get diagnostics
        if not hasattr(ELFIN_LS, 'lsp') or not hasattr(ELFIN_LS.lsp, 'diagnostics'):
            logger.error("LSP server does not have diagnostics attribute")
            return
        
        diagnostics = ELFIN_LS.lsp.diagnostics.get(TEST_URI, [])
        logger.info(f"Found {len(diagnostics)} diagnostics")
        
        # Find MISSING_HELPER diagnostic
        missing_helper_diags = [d for d in diagnostics if hasattr(d, 'code') and d.code == "MISSING_HELPER"]
        
        if not missing_helper_diags:
            logger.error("No MISSING_HELPER diagnostics found")
            return
        
        logger.info(f"Found {len(missing_helper_diags)} MISSING_HELPER diagnostics")
        
        # Get the first missing helper diagnostic
        diag = missing_helper_diags[0]
        
        # Create code action request parameters
        code_action_params = {
            "textDocument": {"uri": TEST_URI},
            "range": {
                "start": {"line": diag.range.start.line, "character": diag.range.start.character},
                "end": {"line": diag.range.end.line, "character": diag.range.end.character}
            },
            "context": {
                "diagnostics": [
                    {
                        "range": {
                            "start": {"line": diag.range.start.line, "character": diag.range.start.character},
                            "end": {"line": diag.range.end.line, "character": diag.range.end.character}
                        },
                        "severity": diag.severity,
                        "code": diag.code,
                        "message": diag.message
                    }
                ]
            }
        }
        
        # Request code actions
        if not hasattr(ELFIN_LS.lsp, '_endpoint') or not hasattr(ELFIN_LS.lsp._endpoint, 'request'):
            logger.error("LSP server does not have _endpoint.request attribute")
            direct_test()
            return
        
        code_actions = await ELFIN_LS.lsp._endpoint.request(
            "textDocument/codeAction", 
            code_action_params
        )
        
        logger.info(f"Received {len(code_actions)} code actions")
        
        if not code_actions:
            logger.error("No code actions were returned")
            direct_test()
            return
        
        # Find the "Import Helpers" code action
        import_helpers_action = None
        for action in code_actions:
            if action.get('title') == "Import Helpers":
                import_helpers_action = action
                break
        
        if not import_helpers_action:
            logger.error("'Import Helpers' code action not found")
            direct_test()
            return
        
        logger.info("Found 'Import Helpers' code action")
        
        # Apply the code action edit
        edit = import_helpers_action.get('edit')
        if not edit:
            logger.error("Code action does not contain edit")
            return
        
        # Print the edit
        logger.info(f"Edit: {json.dumps(edit, indent=2)}")
        
        # The edit should be a workspace edit with changes to the TEST_URI
        changes = edit.get('changes', {})
        if not changes or TEST_URI not in changes:
            logger.error(f"No changes for {TEST_URI} in edit")
            return
        
        # Get the text edits for the file
        text_edits = changes[TEST_URI]
        if not text_edits:
            logger.error("No text edits in changes")
            return
        
        # Apply the edits to the content
        # Sort by start position in reverse order to avoid position shifts
        text_edits.sort(key=lambda e: (e['range']['start']['line'], e['range']['start']['character']), reverse=True)
        
        lines = content.splitlines()
        for edit in text_edits:
            start_line = edit['range']['start']['line']
            start_char = edit['range']['start']['character']
            end_line = edit['range']['end']['line']
            end_char = edit['range']['end']['character']
            new_text = edit['newText']
            
            if start_line == end_line:
                # Single line edit
                line = lines[start_line]
                lines[start_line] = line[:start_char] + new_text + line[end_char:]
            else:
                # Multi-line edit
                first_line = lines[start_line]
                last_line = lines[end_line]
                
                # Combine the start of the first line, the new text, and the end of the last line
                new_content = first_line[:start_char] + new_text + last_line[end_char:]
                
                # Split the new content into lines
                new_lines = new_content.splitlines()
                
                # Replace the affected lines
                lines[start_line:end_line+1] = new_lines
        
        # Combine the lines back into content
        new_content = '\n'.join(lines)
        
        # Write the new content to a temp file
        temp_file = f"{TEST_FILE}.new"
        with open(temp_file, 'w') as f:
            f.write(new_content)
        
        logger.info(f"Applied edits and wrote new content to {temp_file}")
        logger.info(f"Original content:\n{content}")
        logger.info(f"New content:\n{new_content}")
        
        # Check if the import statement was added
        if "import Helpers" in new_content:
            logger.info("SUCCESS: Import Helpers statement was added")
        else:
            logger.error("FAILURE: Import Helpers statement was not added")
        
        return True
    except Exception as e:
        logger.error(f"Error in test: {e}")
        import traceback
        traceback.print_exc()
        return False

def direct_test():
    """Test the code action provider directly."""
    try:
        from elfin_lsp.providers.code_action import code_action
        
        logger.info("Testing code action provider directly")
        
        # Read the test file
        with open(TEST_FILE, 'r') as f:
            content = f.read()
        
        # Create a mock diagnostic
        from elfin_lsp.protocol import Diagnostic, Range, Position
        diag = Diagnostic(
            range=Range(Position(9, 10), Position(9, 15)),
            severity=2,
            message="Function 'hAbs' is not defined. Consider importing helpers.",
            code="MISSING_HELPER"
        )
        
        # Create mock document
        class MockDocument:
            def __init__(self, source):
                self.source = source
        
        # Add mock document to workspace
        if not hasattr(ELFIN_LS, 'workspace'):
            logger.error("LSP server does not have workspace attribute")
            return
        
        ELFIN_LS.workspace._documents[TEST_URI] = MockDocument(content)
        
        # Create mock params
        class MockParams:
            def __init__(self, uri, range, diagnostics):
                self.textDocument = type('obj', (object,), {'uri': uri})
                self.range = range
                self.context = type('obj', (object,), {'diagnostics': diagnostics})
        
        params = MockParams(
            TEST_URI, 
            Range(Position(9, 10), Position(9, 15)),
            [diag]
        )
        
        # Call the code action provider directly
        import asyncio
        result = asyncio.run(code_action(ELFIN_LS, params))
        
        logger.info(f"Direct test result: {result}")
        
        if result and len(result) > 0:
            logger.info(f"SUCCESS: Found {len(result)} code actions")
            for i, action in enumerate(result):
                logger.info(f"Action {i+1}: {action.title}")
                if hasattr(action, 'edit') and action.edit:
                    logger.info(f"  Edit: {action.edit}")
        else:
            logger.error("FAILURE: No code actions returned from direct test")
    
    except Exception as e:
        logger.error(f"Error in direct test: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Main entry point."""
    logger.info("Starting ELFIN code action test")
    
    # Print versions
    import pygls
    logger.info(f"pygls version: {getattr(pygls, '__version__', 'unknown')}")
    
    # Initialize the server
    if not hasattr(ELFIN_LS, 'lsp'):
        logger.error("LSP server does not have lsp attribute, server may not be initialized")
        direct_test()
        return
    
    # Run the async test
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    result = loop.run_until_complete(test_import_helpers())
    
    if result:
        logger.info("Test completed successfully")
    else:
        logger.error("Test failed")
        direct_test()

if __name__ == "__main__":
    main()
