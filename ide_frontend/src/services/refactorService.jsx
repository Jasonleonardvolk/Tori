/**
 * RefactorService
 * 
 * Provides refactoring operations for code transformation and security improvements.
 * Works with EditorSyncService to maintain bidirectional sync between code and concept graph.
 */

import { VaultService } from './vaultService';
import editorSyncService from './editorSyncService';
import conceptGraphService from './conceptGraphService';

class RefactorService {
  constructor() {
    this.vaultService = new VaultService();
    this.transformers = {
      renameSymbol: this.renameSymbol.bind(this),
      extractFunction: this.extractFunction.bind(this),
      inlineFunction: this.inlineFunction.bind(this),
      secureSecrets: this.secureSecrets.bind(this)
    };
  }

  /**
   * Apply a refactoring transformation
   * @param {string} transformationType - Type of transformation to apply
   * @param {string} nodeId - ID of the node to transform
   * @param {Object} options - Transformation options
   * @returns {Promise<Object>} Result of the transformation
   */
  async applyTransformation(transformationType, nodeId, options = {}) {
    if (!this.transformers[transformationType]) {
      throw new Error(`Unknown transformation type: ${transformationType}`);
    }

    // Get the node to transform
    const node = conceptGraphService.getNode(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    try {
      // Apply the transformation
      const result = await this.transformers[transformationType](node, options);

      // Notify EditorSyncService of the change
      const update = {
        changedNodes: [result.updatedNode],
        changedEdges: result.updatedEdges || []
      };
      
      editorSyncService.handleConceptChange(update);

      return result;
    } catch (error) {
      console.error(`Error applying ${transformationType} to ${nodeId}:`, error);
      throw error;
    }
  }

  /**
   * Rename a symbol (function, variable, class, etc.)
   * @param {Object} node - The node to rename
   * @param {Object} options - Rename options
   * @returns {Promise<Object>} Result with updated node
   */
  async renameSymbol(node, options) {
    const { newName } = options;
    if (!newName) {
      throw new Error('New name is required for renameSymbol transformation');
    }

    // In a real implementation, this would analyze the codebase to find all references
    // For this demo, we'll just update the node's properties

    // Create a copy of the node with the new name
    const updatedNode = {
      ...node,
      label: newName,
      metadata: {
        ...(node.metadata || {}),
        sourceText: node.metadata?.sourceText?.replace(node.label, newName)
      }
    };

    return {
      updatedNode,
      updatedEdges: []
    };
  }

  /**
   * Extract a section of code into a new function
   * @param {Object} node - The node containing code to extract
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Result with updated nodes and edges
   */
  async extractFunction(node, options) {
    const { functionName, startLine, endLine } = options;
    if (!functionName || startLine === undefined || endLine === undefined) {
      throw new Error('Function name and code range are required for extractFunction transformation');
    }

    // In a real implementation, this would analyze the code and extract it
    // For this demo, we'll just simulate the extraction

    // Create a new function node
    const extractedNode = {
      id: `function_${functionName}_${Date.now()}`,
      label: functionName,
      type: 'function',
      phase: node.phase,
      metadata: {
        ...node.metadata,
        extractedFrom: node.id,
        sourceText: `function ${functionName}() {\n  // Extracted code\n}`
      }
    };

    // Update the original node to call the new function
    const updatedNode = {
      ...node,
      metadata: {
        ...node.metadata,
        sourceText: node.metadata?.sourceText?.replace(
          /\/\/ Code to extract/,
          `${functionName}(); // Extracted code call`
        )
      }
    };

    return {
      updatedNode,
      newNodes: [extractedNode],
      updatedEdges: [{
        source: node.id,
        target: extractedNode.id,
        type: 'calls'
      }]
    };
  }

  /**
   * Inline a function into its call sites
   * @param {Object} node - The function node to inline
   * @param {Object} options - Inlining options
   * @returns {Promise<Object>} Result with updated nodes
   */
  async inlineFunction(node, options) {
    if (node.type !== 'function') {
      throw new Error('Only function nodes can be inlined');
    }

    // In a real implementation, this would find all calls to the function and inline them
    // For this demo, we'll just update the function node

    // Create updated node with "inlined" marker
    const updatedNode = {
      ...node,
      metadata: {
        ...node.metadata,
        inlined: true,
        sourceText: `// Function ${node.label} has been inlined at all call sites\n// Original implementation:\n${node.metadata?.sourceText}`
      }
    };

    return {
      updatedNode,
      updatedEdges: []
    };
  }

  /**
   * Secure secrets in the code by moving them to a vault
   * @param {Object} node - The node containing secrets
   * @param {Object} options - Security options
   * @returns {Promise<Object>} Result with updated node
   */
  async secureSecrets(node, options) {
    // Find secrets in the source text
    const secretRegex = /"([^"]*(?:key|token|secret|password|api)[^"]*)"/gi;
    const sourceText = node.metadata?.sourceText || '';
    
    let updatedSourceText = sourceText;
    let match;
    
    while ((match = secretRegex.exec(sourceText)) !== null) {
      const fullMatch = match[0];
      const secretValue = match[1];
      
      // Skip if it's already using environment variables
      if (updatedSourceText.includes('process.env.')) {
        continue;
      }
      
      // Create a normalized key name
      const keyName = `API_KEY_${Math.floor(Math.random() * 1000)}`;
      
      // Store in vault
      this.vaultService.storeSecret(keyName, secretValue);
      
      // Replace in source text with environment variable
      updatedSourceText = updatedSourceText.replace(
        fullMatch,
        `process.env.${keyName} /* Vault: API_KEY */`
      );
    }
    
    // If no changes were made, return the original node
    if (updatedSourceText === sourceText) {
      return { updatedNode: node, updatedEdges: [] };
    }
    
    // Create updated node with secured secrets
    const updatedNode = {
      ...node,
      metadata: {
        ...node.metadata,
        sourceText: updatedSourceText,
        hasSecuredSecrets: true
      }
    };
    
    return {
      updatedNode,
      updatedEdges: []
    };
  }
}

// Create and export singleton instance
const refactorService = new RefactorService();
export default refactorService;
