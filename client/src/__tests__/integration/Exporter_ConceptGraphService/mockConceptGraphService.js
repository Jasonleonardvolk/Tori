/**
 * Mock ConceptGraphService for Exporter tests
 */

// Create a mock conceptGraphService with a clear method
const mockConceptGraphService = {
  conceptGraphs: new Map(),
  
  // Mock clear method
  clear: jest.fn(() => {
    mockConceptGraphService.conceptGraphs.clear();
  }),
  
  // Mock getConceptGraph
  getConceptGraph: jest.fn((graphId = 'default') => {
    return mockConceptGraphService.conceptGraphs.get(graphId) || { nodes: [], edges: [] };
  }),
  
  // Mock getNode method
  getNode: jest.fn((nodeId) => {
    for (const graph of mockConceptGraphService.conceptGraphs.values()) {
      const node = graph.nodes.find(n => n.id === nodeId);
      if (node) return node;
    }
    return null;
  }),
  
  // Mock extractConceptsFromText method
  extractConceptsFromText: jest.fn(async (text) => {
    // Default mock implementation
    const entities = [];
    const relationships = [];
    
    // Extract ALAN-LINEAGE comments
    const lineageMatches = Array.from(text.matchAll(/ALAN-LINEAGE: ([a-z0-9_]+)/g));
    for (const match of lineageMatches) {
      const conceptId = match[1];
      entities.push({
        id: conceptId,
        name: conceptId.split('_').pop(), // Extract name from ID
        type: conceptId.split('_')[0]     // Extract type from ID
      });
    }
    
    return { entities, relationships };
  }),
  
  // Mock addDocument method
  addDocument: jest.fn(async (docId, content, options = {}) => {
    // Mock implementation that extracts concepts from content
    const { entities } = await mockConceptGraphService.extractConceptsFromText(content);
    
    // Add as a new concept graph
    mockConceptGraphService.conceptGraphs.set(docId, {
      id: docId,
      nodes: entities.map(e => ({
        id: e.id,
        label: e.name,
        type: e.type,
        file: docId
      })),
      edges: []
    });
    
    return { success: true };
  }),
  
  // Mock updateFromSource method
  updateFromSource: jest.fn(() => Promise.resolve({
    updatedNodes: [],
    updatedEdges: []
  })),
  
  // Mock subscribe method
  subscribe: jest.fn(() => {
    return () => {}; // Return unsubscribe function
  })
};

export default mockConceptGraphService;
