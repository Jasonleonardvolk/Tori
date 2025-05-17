/**
 * ψ-Trajectory ELFIN Binding Module
 * 
 * This file implements the integration between the oscillator-based ψ-state and 
 * ELFIN's symbolic representations. It allows concept tags from stable oscillator 
 * patterns to be matched with ELFIN symbols for improved explainability.
 */

const { createHash } = require('crypto');

/**
 * Represents the concept graph interface that both stores oscillator patterns
 * and connects to symbolic representations
 */
class ConceptGraph {
  constructor() {
    this.nodes = new Map();
    this.elfinSymbols = new Map(); // hash -> node_id mapping
  }

  /**
   * Creates a new concept node or returns existing one
   * @param {string} id - Optional ID for the node (generated if not provided)
   * @returns {object} The concept node object
   */
  createNode(id = null) {
    id = id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        meta: new Map(),
        evidence: [],
        psiSignature: null
      });
    }
    
    return this.nodes.get(id);
  }

  /**
   * Ensures a node exists, creating it if necessary
   * @param {string} id - ID for the node
   * @returns {object} The concept node object
   */
  ensureNode(id) {
    return this.createNode(id);
  }

  /**
   * Imports ELFIN symbols from the provided JSON data
   * @param {object} elfinData - The ELFIN symbols data
   */
  importElfin(elfinData) {
    console.log(`Importing ${elfinData.symbols.length} ELFIN symbols...`);
    
    for (const symbol of elfinData.symbols) {
      // Create a node for each symbol
      const node = this.createNode(symbol.hash);
      
      // Store metadata
      this.setMeta(node.id, 'elfin_name', symbol.name);
      this.setMeta(node.id, 'elfin_unit', symbol.unit || '');
      this.setMeta(node.id, 'elfin_type', symbol.type || '');
      
      // Store in hash lookup
      this.elfinSymbols.set(symbol.hash, node.id);
      
      // For quick access by name as well
      this.elfinSymbols.set(symbol.name, node.id);
    }
    
    console.log(`Successfully imported ELFIN symbols into concept graph.`);
  }

  /**
   * Sets metadata on a concept node
   * @param {string} nodeId - ID of the node
   * @param {string} key - Metadata key
   * @param {any} value - Metadata value
   * @returns {object} The updated node
   */
  setMeta(nodeId, key, value) {
    const node = this.ensureNode(nodeId);
    node.meta.set(key, value);
    return node;
  }

  /**
   * Gets metadata from a concept node
   * @param {string} nodeId - ID of the node
   * @param {string} key - Metadata key
   * @returns {any} The metadata value or undefined if not found
   */
  getMeta(nodeId, key) {
    const node = this.nodes.get(nodeId);
    if (!node) return undefined;
    return node.meta.get(key);
  }

  /**
   * Merges two concept nodes
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @returns {object} The merged node
   */
  merge(sourceId, targetId) {
    const sourceNode = this.nodes.get(sourceId);
    const targetNode = this.nodes.get(targetId);
    
    if (!sourceNode || !targetNode) {
      throw new Error(`Cannot merge: node not found`);
    }
    
    console.log(`Merging concept nodes: ${sourceId} into ${targetId}`);
    
    // Merge metadata (target takes precedence for conflicts)
    for (const [key, value] of sourceNode.meta.entries()) {
      if (!targetNode.meta.has(key)) {
        targetNode.meta.set(key, value);
      }
    }
    
    // Merge evidence
    targetNode.evidence = [...targetNode.evidence, ...sourceNode.evidence];
    
    // If source has psi signature but target doesn't, copy it
    if (sourceNode.psiSignature && !targetNode.psiSignature) {
      targetNode.psiSignature = [...sourceNode.psiSignature];
    }
    
    // Remove the source node (optional, could keep for history)
    // this.nodes.delete(sourceId);
    
    return targetNode;
  }

  /**
   * Looks up a concept node by ELFIN hash
   * @param {string} hash - The hash to look up
   * @returns {string|null} The node ID or null if not found
   */
  lookupHash(hash) {
    return this.elfinSymbols.get(hash) || null;
  }
}

/**
 * Global singleton instance of the concept graph
 */
const globalConceptGraph = new ConceptGraph();

/**
 * Calculates SipHash24 compatible with ELFIN's hashing scheme
 * This is a simplified version for the prototype
 * @param {string} data - The data to hash
 * @returns {string} The hash value
 */
function siphash24(data) {
  // For prototype, we'll use SHA-256 and truncate to simulate SipHash
  // In production, this would be the actual SipHash24 implementation
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Attempts to bind a ψ-cluster to an ELFIN symbol
 * Called when a new attractor is promoted to a stable concept
 * @param {string} nodeId - The concept node ID
 * @param {number[]} psiSignature - The spectral signature of the ψ-state
 * @returns {boolean} True if binding was successful
 */
function tryBindToElfin(nodeId, psiSignature) {
  // Format the psi signature with 3 decimal places
  const formattedSignature = psiSignature.map(v => v.toFixed(3)).toString();
  
  // Hash the formatted signature
  const hash = siphash24(formattedSignature);
  console.log(`Looking up hash ${hash} for node ${nodeId}...`);
  
  // Look up in ELFIN symbols
  const elfinId = globalConceptGraph.lookupHash(hash);
  
  if (elfinId) {
    // Found a match! Merge the nodes
    console.log(`Found matching ELFIN symbol with ID ${elfinId}`);
    globalConceptGraph.merge(nodeId, elfinId);
    globalConceptGraph.setMeta(nodeId, 'source', 'ELFIN');
    return true;
  }
  
  // Optional fallback: cosine similarity search if direct hash lookup fails
  // (not implemented in this prototype)
  
  return false;
}

/**
 * Called by the ψ-sync monitor when an attractor is promoted to a concept
 * @param {string} nodeId - The concept node ID
 * @param {number[]} signature - The spectral signature
 */
function onAttractorPromoted(nodeId, signature) {
  console.log(`Attractor promoted to concept: ${nodeId}`);
  tryBindToElfin(nodeId, signature);
  // Additional existing stability bookkeeping would go here
}

/**
 * Validates binding with a test case
 * Creates a mock signature that should map to a specific ELFIN symbol
 * @param {string} targetSymbolName - The expected symbol name
 * @returns {boolean} True if the test passed
 */
function validateBindingWithMockCase(targetSymbolName = 'wheelDiameter') {
  console.log(`Running validation test for binding to ${targetSymbolName}...`);
  
  // Create mock ELFIN data with known symbols
  const mockElfinData = {
    symbols: [
      {
        name: 'wheelDiameter',
        hash: 'a1b2c3d4e5f6a7b8',
        unit: 'meter',
        type: 'real'
      },
      {
        name: 'maxVelocity',
        hash: 'b2c3d4e5f6a7b8c9',
        unit: 'meter/second',
        type: 'real'
      }
    ]
  };
  
  // Import the mock data
  globalConceptGraph.importElfin(mockElfinData);
  
  // Create a concept node
  const nodeId = 'test_node_1';
  const node = globalConceptGraph.createNode(nodeId);
  
  // Create a mock signature that would hash to the wheelDiameter hash
  // For demonstration, we'll fake this by creating a signature and then
  // overriding the hash function for just this test
  const mockSignature = [0.123, 0.456, 0.789];
  
  // Save original function
  const originalHashFn = siphash24;
  
  // Override hash function for test
  global.siphash24 = function(data) {
    return 'a1b2c3d4e5f6a7b8';  // Known hash for wheelDiameter
  };
  
  // Try to bind the mock signature
  onAttractorPromoted(nodeId, mockSignature);
  
  // Restore original hash function
  global.siphash24 = originalHashFn;
  
  // Check if binding worked
  const boundName = globalConceptGraph.getMeta(nodeId, 'elfin_name');
  const source = globalConceptGraph.getMeta(nodeId, 'source');
  
  const success = boundName === targetSymbolName && source === 'ELFIN';
  
  console.log(`Binding test ${success ? 'PASSED' : 'FAILED'}`);
  console.log(`Node bound to: ${boundName || 'none'}`);
  
  return success;
}

/**
 * Loads ELFIN symbol table from a JSON file
 * @param {string} path - Path to the ELFIN symbols JSON file
 * @returns {Promise<object>} The loaded symbols
 */
async function loadElfinSymbols(path) {
  try {
    // In a browser environment we'd use fetch
    // In Node.js we'd use fs.readFile
    // For this prototype, we'll assume browser
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ELFIN symbols: ${response.statusText}`);
    }
    
    const data = await response.json();
    globalConceptGraph.importElfin(data);
    return data;
  } catch (error) {
    console.error('Error loading ELFIN symbols:', error);
    throw error;
  }
}

/**
 * Initializes the binding system
 * @param {string} symbolsPath - Path to the ELFIN symbols JSON file
 */
async function initializeElfinBinding(symbolsPath = '/elfin_symbols.json') {
  console.log('Initializing ELFIN binding system...');
  
  try {
    await loadElfinSymbols(symbolsPath);
    console.log('ELFIN binding system initialized successfully');
    
    // Run validation tests
    validateBindingWithMockCase();
  } catch (error) {
    console.error('Failed to initialize ELFIN binding:', error);
  }
}

// Export functions and classes for use in other modules
module.exports = {
  initializeElfinBinding,
  ConceptGraph: globalConceptGraph,
  onAttractorPromoted,
  tryBindToElfin,
  validateBindingWithMockCase
};
