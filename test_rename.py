#!/usr/bin/env python3
"""
Simple test for the ELFIN rename provider.
"""

import logging
import os
from elfin_lsp.providers.rename import symbol_at, rename_symbol
from elfin_lsp.protocol import Position, Range, TextDocumentIdentifier
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
        self.lines = source.splitlines()

class MockWorkspace:
    def __init__(self, document):
        self.document = document
        
    def get_document(self, uri):
        return self.document

class MockServer:
    def __init__(self, document):
        self.workspace = MockWorkspace(document)

# Test content with variables that can be renamed
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
    
    # Velocity derivative
    v_dot = (-k * x - b * v + f) / m;
  }
}
"""

async def test_rename():
    """Test the rename provider."""
    try:
        # Create the mock document and server
        document = MockDocument(TEST_CONTENT)
        server = MockServer(document)
        
        # Define a position pointing to a variable that appears multiple times
        # Adjust position to account for actual line numbers (test content starts with a newline)
        position = Position(line=2, character=25)  # Points to 'v' in 'continuous_state: [x, v];'
        
        # Get the symbol at this position
        symbol = symbol_at(server, "test:///document.elfin", position)
        logger.info(f"Symbol at position: {symbol}")
        
        # Create rename parameters
        # Adjust parameter names based on pygls version
        params = types.RenameParams(
            text_document=TextDocumentIdentifier(uri="test:///document.elfin"),
            position=position,
            new_name="velocity"
        )
        
        # Rename the symbol
        edit = await rename_symbol(server, params)
        
        if edit and edit.changes:
            uri = "test:///document.elfin"
            edits = edit.changes.get(uri, [])
            
            logger.info(f"Found {len(edits)} edits to rename '{symbol}' to 'velocity'")
            
            # Print each edit
            for i, text_edit in enumerate(edits):
                logger.info(f"Edit {i+1}:")
                logger.info(f"  Range: {text_edit.range.start.line}:{text_edit.range.start.character} - {text_edit.range.end.line}:{text_edit.range.end.character}")
                logger.info(f"  New text: {text_edit.new_text}")
            
            # Apply the edits to the document
            lines = document.lines.copy()
            
            # Sort edits in reverse order to avoid position shifts
            sorted_edits = sorted(
                edits, 
                key=lambda e: (e.range.start.line, e.range.start.character),
                reverse=True
            )
            
            for edit in sorted_edits:
                line = edit.range.start.line
                start_char = edit.range.start.character
                end_char = edit.range.end.character
                
                # Replace the text
                if line < len(lines):
                    lines[line] = (
                        lines[line][:start_char] + 
                        edit.new_text + 
                        lines[line][end_char:]
                    )
            
            # Create the new document
            new_content = "\n".join(lines)
            
            logger.info("\nOriginal document:")
            logger.info("-" * 40)
            logger.info(TEST_CONTENT)
            logger.info("-" * 40)
            
            logger.info("\nModified document:")
            logger.info("-" * 40)
            logger.info(new_content)
            logger.info("-" * 40)
            
            # Check that all occurrences were renamed
            if "velocity" in new_content and "velocity_dot" in new_content:
                print("\nRename test passed! ✅")
                return True
            else:
                logger.error("Failed to properly rename all occurrences")
                print("\nRename test failed! ❌")
                return False
        else:
            logger.error("No edits returned from rename operation")
            print("\nRename test failed! ❌")
            return False
    except Exception as e:
        logger.error(f"Error in rename test: {e}")
        import traceback
        traceback.print_exc()
        print("\nRename test failed with exception! ❌")
        return False

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_rename())
