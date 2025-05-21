// Mock exporterService for tests
const mockExporterService = {
  // Mock for exportGraphToCode
  exportGraphToCode: jest.fn(async (options) => {
    const { graphId, language, includeLineage } = options;
    
    // Generate mock code based on language
    let code = '';
    if (language === 'python') {
      code = `# Generated Python code for graph: ${graphId}
# Lineage included: ${includeLineage}

# CONCEPT[concept_a] (id: concept_a)
def process_data():
    pass

# CONCEPT[concept_b] (id: concept_b)
def transform_data():
    pass

# CONCEPT[concept_c] (id: concept_c)
def save_results():
    pass
`;
    } else if (language === 'javascript') {
      code = `// Generated JavaScript code for graph: ${graphId}
// Lineage included: ${includeLineage}

// CONCEPT[concept_a] (id: concept_a)
function processData() {
  // Implementation
}

// CONCEPT[concept_b] (id: concept_b)
function transformData() {
  // Implementation
}

// CONCEPT[concept_c] (id: concept_c)
function saveResults() {
  // Implementation
}
`;
    }
    
    return {
      success: true,
      code,
      metadata: {
        graphId,
        language,
        conceptIds: ['concept_a', 'concept_b', 'concept_c'],
        lineage: includeLineage ? {
          links: [
            { source: 'concept_a', target: 'concept_b' },
            { source: 'concept_b', target: 'concept_c' }
          ]
        } : null
      }
    };
  }),
  
  // Mock for extractConceptIdentifiers
  extractConceptIdentifiers: jest.fn((code) => {
    // Extract concept identifiers from code
    const matches = code.match(/CONCEPT\[([^\]]+)\]/g) || [];
    return matches.map(match => {
      const conceptId = match.match(/CONCEPT\[([^\]]+)\]/)[1];
      return {
        conceptId,
        startPosition: code.indexOf(match),
        endPosition: code.indexOf(match) + match.length
      };
    });
  }),
  
  // Mock for importCodeToGraph
  importCodeToGraph: jest.fn(async (options) => {
    const { graphId, code, language } = options;
    
    // Simulate importing code back to graph
    const concepts = mockExporterService.extractConceptIdentifiers(code);
    
    return {
      success: true,
      graphId,
      importedConcepts: concepts.map(c => ({
        id: c.conceptId,
        type: 'imported',
        position: { x: 0, y: 0 },
        metadata: {
          source: 'import',
          language
        }
      })),
      metadata: {
        language,
        originalCode: code
      }
    };
  }),
  
  // Mock for exportFieldStateSnapshot
  exportFieldStateSnapshot: jest.fn(async (options) => {
    const { graphId, name, fieldState } = options;
    
    return {
      success: true,
      snapshotId: `snapshot_${Date.now()}`,
      graphId,
      name,
      data: {
        nodes: fieldState.nodes || [],
        links: fieldState.links || [],
        kappa: fieldState.kappa || null,
        alpha: fieldState.alpha || 0,
        epsilon: fieldState.epsilon || 0,
        timestamp: new Date().toISOString()
      },
      metadata: {
        version: '1.0',
        createdAt: new Date().toISOString(),
        nodeCount: (fieldState.nodes || []).length,
        linkCount: (fieldState.links || []).length
      }
    };
  }),
  
  // Mock for importFieldStateSnapshot
  importFieldStateSnapshot: jest.fn(async (options) => {
    const { snapshotId, graphId } = options;
    
    return {
      success: true,
      graphId,
      snapshot: {
        id: snapshotId,
        nodes: [
          { id: 'concept_a', label: 'Concept A', type: 'function' },
          { id: 'concept_b', label: 'Concept B', type: 'data' },
          { id: 'concept_c', label: 'Concept C', type: 'flow' }
        ],
        links: [
          { source: 'concept_a', target: 'concept_b' },
          { source: 'concept_b', target: 'concept_c' }
        ],
        metadata: {
          importedAt: new Date().toISOString(),
          originalCreatedAt: new Date().toISOString()
        }
      }
    };
  })
};

export default mockExporterService;
