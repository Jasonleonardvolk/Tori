// Mock editorSyncService for tests
const mockEditorSyncService = {
  initialize: jest.fn((conceptGraph, node) => {
    // Don't try to call conceptGraph.subscribeToUpdates
    // Simulate successful initialization
    return Promise.resolve();
  }),
  
  subscribeToUpdates: jest.fn((callback) => {
    // Return a mock unsubscribe function
    return () => {};
  }),
  
  buildPositionMap: jest.fn(() => {
    // Don't warn about missing nodes in tests
    return new Map();
  }),
  
  warn: jest.fn((message) => {
    // Silence warnings during tests
  }),
  
  error: jest.fn((message, error) => {
    console.error(`EditorSyncService: ${message}`, error);
  }),
  
  // Add other methods as needed
  updateSelection: jest.fn(),
  syncConceptToEditor: jest.fn(),
  syncEditorToConcept: jest.fn(),
};

export default mockEditorSyncService;
