#!/usr/bin/env python3
"""
Minimal test for the ELFIN code action provider.
"""

import logging
import os
from elfin_lsp.providers.code_action import _get_code_actions
from elfin_lsp.protocol import Diagnostic, Range, Position
from pygls.capabilities import types

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MockDocument:
    def __init__(self, source):
        self.source = source

class MockServer:
    def __init__(self):
        self.workspace = type('obj', (object,), {})
        self.workspace.get_document = lambda uri: MockDocument(TEST_CONTENT)
        # Add a mock lsp attribute with diagnostics
        self.lsp = type('obj', (object,), {})
        self.lsp.diagnostics = {}

class MockParams:
    def __init__(self, uri, diagnostics):
        self.textDocument = type('obj', (object,), {'uri': uri})
        self.context = type('obj', (object,), {'diagnostics': diagnostics})

# Test content - using wrapAngle which should trigger the import helper
TEST_CONTENT = """
system TestSystem {
  continuous_state: [x, v];
  inputs: [f];
  
  params {
    m: mass[kg] = 1.0;
    k: spring_const[N/m] = 10.0;
    b: damping[N*s/m] = 0.5;
  }
  
  flow_dynamics {
    # Position derivative
    x_dot = v;
    
    # Using helper function without importing it
    v_dot = wrapAngle(x);
  }
}
"""

def test_code_action():
    """Test the code action provider directly with minimal mocking."""
    try:
        # Create a mock server
        server = MockServer()
        
        # Create a mock diagnostic
        diag = Diagnostic(
            range=Range(Position(0, 10), Position(0, 15)),
            severity=2,
            message="Function 'wrapAngle' is not defined. Consider importing helpers.",
            code="MISSING_HELPER"
        )
        
        # Test URI
        uri = "file:///test.elfin"
        
        # Create mock params with the diagnostic
        params = MockParams(uri, [diag])
        
        # Call the code action helper function directly
        result = _get_code_actions(server, params)
        
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
                                logger.info(f"Edit at {uri}: {text_edit.new_text}")
                                logger.info(f"Final import statement would be added at the beginning of file")
            
            # Verify the import statement
            import_action = next((a for a in result if a.title == "Import Helpers"), None)
            if import_action and import_action.edit and import_action.edit.changes:
                edits = next(iter(import_action.edit.changes.values()))
                if edits and edits[0].new_text and "import Helpers" in edits[0].new_text:
                    print("\nCode action test passed! ✅")
                    return True
            
            print("\nCode action test failed - import statement not found! ❌")
            return False
        else:
            logger.error("FAILURE: No code actions returned")
            print("\nCode action test failed - no actions returned! ❌")
            return False
    except Exception as e:
        logger.error(f"Error in test: {e}")
        import traceback
        traceback.print_exc()
        print("\nCode action test failed with exception! ❌")
        return False

if __name__ == "__main__":
    test_code_action()
