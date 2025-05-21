/**
 * Mock EditorSyncService for RefactorService tests
 */
import conceptGraphService from '../../../services/conceptGraphService';

// Create mock editor sync service
const mockEditorSyncService = {
  editor: null,
  conceptGraph: null,
  positionMap: new Map(),
  isInitialized: false,
  lastCursorPosition: null,
  subscribers: new Map(),

  // Mock initialize method
  initialize: jest.fn(function(editor, conceptGraph) {
    this.editor = editor;
    this.conceptGraph = conceptGraph;
    this.isInitialized = true;
    this.buildPositionMap();
    return this;
  }),

  // Mock buildPositionMap method
  buildPositionMap: jest.fn(function() {
    this.positionMap.clear();
    // If there's a concept graph available, use it to build the position map
    if (this.conceptGraph && this.conceptGraph.getNode) {
      // For testing, we'll manually add node positions that match our test data
      this.positionMap.set('node1', { 
        line: 0, ch: 0, 
        endLine: 5, endCh: 2 
      });
      this.positionMap.set('node2', { 
        line: 7, ch: 0, 
        endLine: 12, endCh: 2 
      });
      this.positionMap.set('node3', { 
        line: 14, ch: 0, 
        endLine: 14, endCh: 35 
      });
    }
  }),

  // Mock handleEditorChange method - make it immediately sync with concept graph
  handleEditorChange: jest.fn(function(event) {
    // Update the concept graph
    if (this.editor) {
      const content = this.editor.getValue();
      // For synchronous testing, call updateFromSource directly
      conceptGraphService.updateFromSource(content);
    }
    
    // Notify subscribers
    this.notifySubscribers('editorChange', {
      source: 'editor',
      content: this.editor ? this.editor.getValue() : '',
      event
    });
  }),
  
  // Add a debounce function - for testing, just execute immediately
  debounce: jest.fn(function(func) {
    return func;
  }),

  // Mock handleConceptChange method - make sure it updates the editor content for testing
  handleConceptChange: jest.fn(function(update) {
    // Apply the changes to the editor
    if (update.changedNodes && update.changedNodes.length > 0) {
      const node = update.changedNodes[0];
      if (node.metadata && node.metadata.sourceText && this.editor) {
        if (typeof this.editor.setValue === 'function') {
          this.editor.setValue(node.metadata.sourceText);
        } else if (typeof this.editor.replaceRange === 'function') {
          this.editor.replaceRange(
            node.metadata.sourceText,
            { line: 0, ch: 0 },
            { line: this.editor.getValue().split('\n').length, ch: 0 }
          );
        }
      }
    }

    // Rebuild the position map
    this.buildPositionMap();

    // Notify subscribers of concept change
    this.notifySubscribers('conceptChange', update);
  }),

  // Mock handleEditorSelectionChange method - specific implementation for the tests
  handleEditorSelectionChange: jest.fn(function(selection) {
    if (!this.isInitialized || !selection) {
      return;
    }

    // For testing, check if selection matches the positions in the map directly
    const selectedNodeIds = [];
    for (const [nodeId, position] of this.positionMap.entries()) {
      // Match if the selection is within the node's range
      if (
        position.line <= selection.anchor.line &&
        position.endLine >= selection.head.line
      ) {
        selectedNodeIds.push(nodeId);
      }
    }

    if (selectedNodeIds.length > 0) {
      // Update concept graph selection if available
      if (this.conceptGraph && this.conceptGraph.selectNodes) {
        this.conceptGraph.selectNodes(selectedNodeIds);
      }

      // Notify subscribers
      this.notifySubscribers('selectionChange', {
        source: 'editor',
        nodeIds: selectedNodeIds,
        selection
      });
    }
  }),

  // Mock subscribe method
  subscribe: jest.fn(function(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    
    this.subscribers.get(event).add(callback);
    
    return () => {
      const eventSubscribers = this.subscribers.get(event);
      if (eventSubscribers) {
        eventSubscribers.delete(callback);
      }
    };
  }),

  // Mock notifySubscribers method
  notifySubscribers: jest.fn(function(event, data) {
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} subscriber:`, error);
        }
      });
    }
  })
};

export default mockEditorSyncService;
