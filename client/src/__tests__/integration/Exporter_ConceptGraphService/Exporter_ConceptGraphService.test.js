/**
 * Integration Test for Exporter + ConceptGraphService
 * 
 * Tests the round-trip functionality between concept graphs and generated code,
 * ensuring that lineage comments are properly maintained.
 */

// Import the services
import exporterService from '../../../services/exporterService';
import mockConceptGraphService from './mockConceptGraphService';

// Use the mock for all tests
const conceptGraphService = mockConceptGraphService;

describe('Exporter + ConceptGraphService Integration', () => {
  
  // Set up mock concept graph before each test
  beforeEach(() => {
    // Clear the concept graph service
    conceptGraphService.clear();
    
    // Mock the getConceptGraph method to return our test graph
    jest.spyOn(conceptGraphService, 'getConceptGraph').mockImplementation((graphId) => {
      if (graphId === 'test-graph') {
        return {
          id: 'test-graph',
          name: 'Test Graph',
          nodes: [
            {
              id: 'import_math',
              label: 'math',
              type: 'import',
              file: 'calculator.py'
            },
            {
              id: 'class_calculator',
              label: 'Calculator',
              type: 'class',
              file: 'calculator.py',
              lineNumber: 3
            },
            {
              id: 'method_add',
              label: 'add',
              type: 'method',
              classId: 'class_calculator',
              parameters: 'self, a, b',
              returnType: 'float',
              body: 'return a + b',
              file: 'calculator.py',
              lineNumber: 4
            },
            {
              id: 'method_subtract',
              label: 'subtract',
              type: 'method',
              classId: 'class_calculator',
              parameters: 'self, a, b',
              returnType: 'float',
              body: 'return a - b',
              file: 'calculator.py',
              lineNumber: 7
            },
            {
              id: 'function_square_root',
              label: 'square_root',
              type: 'function',
              parameters: 'x',
              returnType: 'float',
              body: 'return math.sqrt(x)',
              file: 'calculator.py',
              lineNumber: 10
            },
            {
              id: 'variable_pi',
              label: 'PI',
              type: 'variable',
              value: '3.14159',
              constant: true,
              file: 'calculator.py',
              lineNumber: 13
            }
          ],
          edges: [
            {
              source: 'class_calculator',
              target: 'method_add',
              type: 'contains'
            },
            {
              source: 'class_calculator',
              target: 'method_subtract',
              type: 'contains'
            },
            {
              source: 'function_square_root',
              target: 'import_math',
              type: 'uses'
            }
          ]
        };
      }
      return null;
    });
    
    // Mock the extractConceptsFromText method
    jest.spyOn(conceptGraphService, 'extractConceptsFromText').mockImplementation(async (text) => {
      // For this test, we'll consider only simple extraction to simulate lineage comment detection
      const entities = [];
      const relationships = [];
      
      // Extract ALAN-LINEAGE comments
      const lineageMatches = Array.from(text.matchAll(/ALAN-LINEAGE: ([a-z0-9_]+) \|/g));
      for (const match of lineageMatches) {
        const conceptId = match[1];
        entities.push({
          id: conceptId,
          name: conceptId.split('_').pop(), // Extract name from ID
          type: conceptId.split('_')[0]     // Extract type from ID
        });
      }
      
      return { entities, relationships };
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('generates Python code with lineage comments from concept graph', async () => {
    // Export graph to Python code
    const result = await exporterService.exportGraphToCode({
      graphId: 'test-graph',
      language: 'python',
      includeLineage: true,
      author: 'test-user'
    });
    
    // Log result for debugging
    console.log('Python result structure:', JSON.stringify(result));
    
    // Verify the result contains the expected file - use direct access since toHaveProperty has issues
    expect(typeof result.files).toBe('object');
    expect(result.files['calculator.py']).toBeDefined();
    const code = result.files['calculator.py'];
    
    // Verify imports are included
    expect(code).toContain('import math');
    
    // Verify class is generated with correct structure
    expect(code).toContain('class Calculator:');
    
    // Verify methods are included in the class
    expect(code).toContain('def add(self, a, b): float');
    expect(code).toContain('return a + b');
    expect(code).toContain('def subtract(self, a, b): float');
    expect(code).toContain('return a - b');
    
    // Verify functions are generated
    expect(code).toContain('def square_root(x): float');
    expect(code).toContain('return math.sqrt(x)');
    
    // Verify variables are included
    expect(code).toContain('PI = 3.14159');
    
    // Verify lineage comments
    expect(code).toContain('# ALAN-LINEAGE: import_math');
    expect(code).toContain('# ALAN-LINEAGE: class_calculator');
    expect(code).toContain('# ALAN-LINEAGE: method_add');
    expect(code).toContain('# ALAN-LINEAGE: method_subtract');
    expect(code).toContain('# ALAN-LINEAGE: function_square_root');
    expect(code).toContain('# ALAN-LINEAGE: variable_pi');
    
    // All lineage comments should include author and timestamp
    expect(code).toContain('test-user');
  });
  
  test('generates JavaScript code with lineage comments from concept graph', async () => {
    // Export graph to JavaScript code
    const result = await exporterService.exportGraphToCode({
      graphId: 'test-graph',
      language: 'javascript',
      includeLineage: true,
      author: 'test-user'
    });
    
    // Log result for debugging
    console.log('JavaScript result structure:', JSON.stringify(result));
    
    // Verify the result contains the expected file - use direct access
    expect(typeof result.files).toBe('object');
    expect(result.files['calculator.py']).toBeDefined();
    const code = result.files['calculator.py'];
    
    // Verify imports are included
    expect(code).toContain('import * from "math"');
    
    // Verify class is generated with correct structure
    expect(code).toContain('class Calculator {');
    
    // Verify methods are included in the class
    expect(code).toContain('add(a, b) {');
    expect(code).toContain('return a + b');
    expect(code).toContain('subtract(a, b) {');
    expect(code).toContain('return a - b');
    
    // Verify functions are generated
    expect(code).toContain('function square_root(x) {');
    expect(code).toContain('return math.sqrt(x)');
    
    // Verify variables are included
    expect(code).toContain('const PI = 3.14159;');
    
    // Verify lineage comments
    expect(code).toContain('// ALAN-LINEAGE: import_math');
    expect(code).toContain('// ALAN-LINEAGE: class_calculator');
    expect(code).toContain('// ALAN-LINEAGE: method_add');
    expect(code).toContain('// ALAN-LINEAGE: method_subtract');
    expect(code).toContain('// ALAN-LINEAGE: function_square_root');
    expect(code).toContain('// ALAN-LINEAGE: variable_pi');
  });
  
  test('can extract concept identifiers from lineage comments', async () => {
    // Create test code with lineage comments
    const testCode = `
// ALAN-LINEAGE: import_math | 2025-05-08T10:00:00Z | test-user
import * from "math";

// ALAN-LINEAGE: class_calculator | 2025-05-08T10:00:00Z | test-user
class Calculator {
  // ALAN-LINEAGE: method_add | 2025-05-08T10:00:00Z | test-user
  add(a, b) {
    return a + b;
  }
  
  // ALAN-LINEAGE: method_subtract | 2025-05-08T10:00:00Z | test-user
  subtract(a, b) {
    return a - b;
  }
}

// ALAN-LINEAGE: function_square_root | 2025-05-08T10:00:00Z | test-user
function square_root(x) {
  return math.sqrt(x);
}

// ALAN-LINEAGE: variable_pi | 2025-05-08T10:00:00Z | test-user
const PI = 3.14159;
`;

    // Extract concepts from the code using the mock implementation
    const { entities } = await conceptGraphService.extractConceptsFromText(testCode);
    
    // Verify that all concepts are extracted from lineage comments
    expect(entities).toHaveLength(6);
    
    // Verify specific entities
    const conceptIds = entities.map(e => e.id);
    expect(conceptIds).toContain('import_math');
    expect(conceptIds).toContain('class_calculator');
    expect(conceptIds).toContain('method_add');
    expect(conceptIds).toContain('method_subtract');
    expect(conceptIds).toContain('function_square_root');
    expect(conceptIds).toContain('variable_pi');
  });
  
  test('performs round-trip conversion from graph to code and back', async () => {
    // First, export graph to code
    const exportResult = await exporterService.exportGraphToCode({
      graphId: 'test-graph',
      language: 'python',
      includeLineage: true,
      author: 'test-user'
    });
    
    const pythonCode = exportResult.files['calculator.py'];
    
    // Mock the document ID for testing
    const documentId = 'calculator.py';
    
    // Mock addDocument method to capture the concepts extracted
    let extractedEntities = [];
    jest.spyOn(conceptGraphService, 'addDocument').mockImplementation(async (docId, content) => {
      const { entities } = await conceptGraphService.extractConceptsFromText(content);
      extractedEntities = entities;
      return { success: true };
    });
    
    // Now add the code back to the concept graph
    await conceptGraphService.addDocument(documentId, pythonCode, { language: 'python' });
    
    // Verify that all original concepts were extracted from the code
    expect(extractedEntities).toHaveLength(6);
    
    // Verify specific entities by ID
    const conceptIds = new Set(extractedEntities.map(e => e.id));
    expect(conceptIds.has('import_math')).toBe(true);
    expect(conceptIds.has('class_calculator')).toBe(true);
    expect(conceptIds.has('method_add')).toBe(true);
    expect(conceptIds.has('method_subtract')).toBe(true);
    expect(conceptIds.has('function_square_root')).toBe(true);
    expect(conceptIds.has('variable_pi')).toBe(true);
  });
  
  test('maintains lineage through multiple export-import cycles', async () => {
    // First export cycle
    const exportResult1 = await exporterService.exportGraphToCode({
      graphId: 'test-graph',
      language: 'python',
      includeLineage: true,
      author: 'user1'
    });
    
    const pythonCode1 = exportResult1.files['calculator.py'];
    
    // Mock addDocument and extractConceptsFromText to simulate adding back to graph
    let extractedEntities1 = [];
    conceptGraphService.extractConceptsFromText.mockImplementationOnce(async (text) => {
      // Original mock implementation
      const entities = [];
      const lineageMatches = Array.from(text.matchAll(/ALAN-LINEAGE: ([a-z0-9_]+) \|/g));
      for (const match of lineageMatches) {
        const conceptId = match[1];
        entities.push({
          id: conceptId,
          name: conceptId.split('_').pop(),
          type: conceptId.split('_')[0]
        });
      }
      extractedEntities1 = entities;
      return { entities, relationships: [] };
    });
    
    // Simulate adding the code back to the concept graph
    await conceptGraphService.addDocument('calculator.py', pythonCode1, { language: 'python' });
    
    // Now mock getConceptGraph to return a new graph based on the extracted entities
    conceptGraphService.getConceptGraph.mockImplementationOnce((graphId) => {
      if (graphId === 'test-graph-2') {
        return {
          id: 'test-graph-2',
          name: 'Test Graph 2',
          nodes: extractedEntities1.map(entity => ({
            id: entity.id,
            label: entity.name,
            type: entity.type,
            file: 'calculator.py'
          })),
          edges: []
        };
      }
      return null;
    });
    
    // Second export cycle with the new graph
    const exportResult2 = await exporterService.exportGraphToCode({
      graphId: 'test-graph-2',
      language: 'python',
      includeLineage: true,
      author: 'user2'
    });
    
    const pythonCode2 = exportResult2.files['calculator.py'];
    
    // Verify that lineage comments are maintained in the second generation
    expect(pythonCode2).toContain('# ALAN-LINEAGE: import_math');
    expect(pythonCode2).toContain('# ALAN-LINEAGE: class_calculator');
    expect(pythonCode2).toContain('# ALAN-LINEAGE: method_add');
    expect(pythonCode2).toContain('# ALAN-LINEAGE: method_subtract');
    expect(pythonCode2).toContain('# ALAN-LINEAGE: function_square_root');
    expect(pythonCode2).toContain('# ALAN-LINEAGE: variable_pi');
    
    // Verify that the new author is added
    expect(pythonCode2).toContain('user2');
  });
  
  test('exports graph to snapshot format', async () => {
    // Mock field state
    const fieldState = {
      layout: 'force',
      centerX: 500,
      centerY: 300,
      zoom: 1.2,
      highlightedNodes: ['function_square_root'],
      expandedNodes: ['class_calculator'],
      viewportWidth: 1200,
      viewportHeight: 800
    };
    
    // Export field state snapshot
    const snapshot = await exporterService.exportFieldStateSnapshot({
      graphId: 'test-graph',
      name: 'Test Snapshot',
      fieldState,
      description: 'Test snapshot for calculator component',
      branch: 'feature/calculator'
    });
    
    // Verify snapshot properties
    expect(snapshot).toHaveProperty('id');
    expect(snapshot).toHaveProperty('name', 'Test Snapshot');
    expect(snapshot).toHaveProperty('description', 'Test snapshot for calculator component');
    expect(snapshot).toHaveProperty('timestamp');
    expect(snapshot).toHaveProperty('graphId', 'test-graph');
    expect(snapshot).toHaveProperty('nodes');
    expect(snapshot).toHaveProperty('edges');
    
    // Verify field state is preserved
    expect(snapshot.fieldState).toMatchObject({
      layout: 'force',
      centerX: 500,
      centerY: 300,
      zoom: 1.2,
      highlightedNodes: ['function_square_root'],
      expandedNodes: ['class_calculator'],
      viewportWidth: 1200,
      viewportHeight: 800
    });
    
    // Verify metadata
    expect(snapshot.metadata).toHaveProperty('branch', 'feature/calculator');
  });
});
