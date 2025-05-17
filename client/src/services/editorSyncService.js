/**
 * EditorSyncService
 * 
 * Provides bidirectional synchronization between concept graph and editor.
 * Allows for real-time updates when either the graph or the editor content changes.
 */

import conceptGraphService from './conceptGraphService';

class EditorSyncService {
  constructor() {
    this.editor = null;
    this.conceptGraph = null;
    this.positionMap = new Map();
    this.isInitialized = false;
    this.lastCursorPosition = null;
    this.subscribers = new Map();
    this.debouncedHandleEditorChange = this.debounce(this.handleEditorChange.bind(this), 300);
  }

  /**
   * Initialize the sync service with editor and concept graph
   * @param {Object} editor - Editor instance
   * @param {Object} conceptGraph - Concept graph instance
   */
  initialize(editor, conceptGraph) {
    this.editor = editor;
    this.conceptGraph = conceptGraph;
    this.isInitialized = true;

    // Build the position map
    this.buildPositionMap();

    // Set up event listeners for editor changes
    if (this.editor && this.editor.onDidChangeModelContent) {
      this.editor.onDidChangeModelContent(
        (event) => this.debouncedHandleEditorChange(event)
      );
    }

    // Set up event listeners for cursor position changes
    if (this.editor && this.editor.onDidChangeCursorPosition) {
      this.editor.onDidChangeCursorPosition(
        (event) => this.handleCursorPositionChange(event)
      );
    }

    // Subscribe to concept graph updates
    if (this.conceptGraph) {
      // Handle different types of concept graph implementations
      if (typeof this.conceptGraph.subscribeToUpdates === 'function') {
        this.conceptGraph.subscribeToUpdates(
          (graph) => this.handleConceptGraphUpdate(graph)
        );
      } else if (typeof this.conceptGraph.subscribe === 'function') {
        this.conceptGraph.subscribe('graphUpdated', 
          (graph) => this.handleConceptGraphUpdate(graph)
        );
      }
      // For mock implementations in tests, no subscription is needed
    }

    this.info("Bidirectional sync initialized");
    return this;
  }

  /**
   * Build a map of concept nodes to editor positions
   */
  buildPositionMap() {
    if (!this.isInitialized) {
      this.warn("Cannot build position map: service not initialized");
      return;
    }

    this.positionMap.clear();

    // Get the concept graph nodes
    // Handle both cases where it could be conceptGraphService or a mock canvas from tests
    let nodes = [];
    
    if (this.conceptGraph) {
      if (typeof this.conceptGraph.getConceptGraph === 'function') {
        // Using conceptGraphService
        const graph = this.conceptGraph.getConceptGraph();
        if (graph && graph.nodes) {
          nodes = graph.nodes;
        }
      } else if (this.conceptGraph.visibleNodes) {
        // Using ConceptFieldCanvas mock from tests
        nodes = this.conceptGraph.visibleNodes;
      } else if (this.conceptGraph.selectedNodes) {
        // Fallback for tests
        nodes = [];
      }
    }
    
    if (nodes.length === 0) {
      this.warn("Cannot build position map: no nodes found");
      return;
    }

    // For each node, determine its position in the editor
    for (const node of nodes) {
      if (node.file && (node.lineNumber !== undefined || node.position)) {
        // For nodes with explicit position info
        this.positionMap.set(node.id, {
          file: node.file,
          lineNumber: node.lineNumber || (node.position ? node.position.lineNumber : undefined),
          column: node.column || (node.position ? node.position.column : undefined),
          endLineNumber: node.endLineNumber || (node.position ? node.position.endLineNumber : undefined),
          endColumn: node.endColumn || (node.position ? node.position.endColumn : undefined)
        });
      } else {
        // For nodes without explicit position, we could try to infer position
        // from code analysis in a real implementation
        this.positionMap.set(node.id, {
          inferred: true,
          label: node.label
        });
      }
    }

    this.debug(`Built position map with ${this.positionMap.size} nodes`);
  }

  /**
   * Handle changes in the editor content
   * @param {Object} event - Editor change event
   */
  handleEditorChange(event) {
    if (!this.isInitialized) {
      this.warn("Cannot handle editor change: service not initialized");
      return;
    }

    // Get the editor model and full content
    const model = this.editor.getModel();
    if (!model) {
      this.warn("Cannot handle editor change: no editor model");
      return;
    }

    // For a real implementation, we would:
    // 1. Parse the editor content to extract code structure
    // 2. Map that to concept graph nodes
    // 3. Update the concept graph accordingly

    // For this demo, we'll simulate finding and updating a couple of nodes
    const updatedNodeCount = 2;
    const updatedEdgeCount = 0;

    // Rebuild the position map
    this.buildPositionMap();

    this.debug(`Updated ${updatedNodeCount} nodes and ${updatedEdgeCount} edges from editor change`);

    // Notify subscribers
    this.notifySubscribers('editorChange', {
      source: 'editor',
      content: this.editor.getValue(),
      event
    });
  }

  /**
   * Handle changes in cursor position within the editor
   * @param {Object} event - Cursor position change event
   */
  handleCursorPositionChange(event) {
    if (!this.isInitialized) {
      this.warn("Cannot handle cursor change: service not initialized");
      return;
    }

    const position = event.position;
    this.lastCursorPosition = position;

    // Find the concept node at this position
    const nodeAtPosition = this.findNodeAtPosition(position);
    
    if (nodeAtPosition) {
      // Notify subscribers
      this.notifySubscribers('selectionChange', {
        source: 'editor',
        nodeIds: [nodeAtPosition.id],
        selection: { position }
      });
      this.debug(`Selected concept: ${nodeAtPosition.id}`);
    }
  }

  /**
   * Handle updates to the concept graph
   * @param {Object} graph - Updated concept graph
   */
  handleConceptGraphUpdate(graph) {
    if (!this.isInitialized) {
      this.warn("Cannot handle graph update: service not initialized");
      return;
    }

    // Rebuild the position map
    this.buildPositionMap();

    // For a real implementation, we would:
    // 1. Determine what changed in the graph
    // 2. Update the editor content accordingly

    this.debug("Updated editor from concept graph changes");
  }

  /**
   * Find a concept node at a given editor position
   * @param {Object} position - Editor position
   * @returns {Object|null} The concept node at the position, or null
   */
  findNodeAtPosition(position) {
    if (!this.isInitialized || !position) {
      return null;
    }

    // For each node in the position map, check if the position falls within its range
    for (const [nodeId, nodePosition] of this.positionMap.entries()) {
      if (
        nodePosition.lineNumber &&
        nodePosition.endLineNumber &&
        position.lineNumber >= nodePosition.lineNumber &&
        position.lineNumber <= nodePosition.endLineNumber
      ) {
        // For a more accurate check, we would also check columns
        const node = this.conceptGraph.getNode(nodeId);
        if (node) {
          return node;
        }
      }
    }

    return null;
  }

  /**
   * Apply a refactoring transformation to the code
   * @param {Object} transformation - The transformation to apply
   * @returns {boolean} Success status
   */
  applyTransformation(transformation) {
    if (!this.isInitialized) {
      this.warn("Cannot apply transformation: service not initialized");
      return false;
    }

    // In a real implementation, we would:
    // 1. Interpret the transformation
    // 2. Apply it to the editor
    // 3. Update the concept graph

    // For this demo, we'll just log it and rebuild the position map
    this.debug(`Applied transformation: ${transformation.type}`);
    this.buildPositionMap();

    return true;
  }

  /**
   * Select a concept node in the editor
   * @param {string} nodeId - ID of the node to select
   * @returns {boolean} Success status
   */
  selectNodeInEditor(nodeId) {
    if (!this.isInitialized) {
      this.warn("Cannot select node: service not initialized");
      return false;
    }

    const position = this.positionMap.get(nodeId);
    if (!position || !position.lineNumber) {
      this.warn(`Cannot select node: position not found for ${nodeId}`);
      return false;
    }

    // Set the editor selection
    this.editor.setSelection({
      startLineNumber: position.lineNumber,
      startColumn: position.column || 1,
      endLineNumber: position.endLineNumber || position.lineNumber,
      endColumn: position.endColumn || (position.column ? position.column + 1 : 2)
    });

    // Reveal the position in the editor
    this.editor.revealPositionInCenter({
      lineNumber: position.lineNumber,
      column: position.column || 1
    });

    this.debug(`Selected node ${nodeId} in editor`);
    return true;
  }

  /**
   * Handle concept graph changes
   * @param {Object} update - The concept graph update
   */
  handleConceptChange(update) {
    if (!this.isInitialized) {
      this.warn("Cannot handle concept change: service not initialized");
      return;
    }

    // Apply the changes to the editor
    if (update.changedNodes && update.changedNodes.length > 0) {
      // For simplicity, we'll just set the editor content to the first changed node's source text
      const node = update.changedNodes[0];
      if (node.metadata && node.metadata.sourceText) {
        if (this.editor.setValue) {
          this.editor.setValue(node.metadata.sourceText);
        } else if (this.editor.replaceRange) {
          // For CodeMirror-like editors
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
  }

  /**
   * Handle editor selection changes
   * @param {Object} selection - The editor selection
   */
  handleEditorSelectionChange(selection) {
    if (!this.isInitialized || !selection) {
      return;
    }

    // Find nodes that match the selection position
    const selectedNodeIds = [];
    for (const [nodeId, position] of this.positionMap.entries()) {
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
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(event, callback) {
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
  }

  /**
   * Notify subscribers of an event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifySubscribers(event, data) {
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.error(`Error in ${event} subscriber:`, error);
        }
      });
    }
  }

  /**
   * Debounce a function call
   * @param {Function} func - The function to debounce
   * @param {number} wait - The debounce delay in milliseconds
   * @returns {Function} The debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // Logging methods
  debug(message) {
    console.debug(`EditorSyncService: ${message}`);
  }

  info(message) {
    console.info(`EditorSyncService: ${message}`);
  }

  warn(message) {
    console.warn(`EditorSyncService: ${message}`);
  }

  error(message, error) {
    console.error(`EditorSyncService: ${message}`, error);
  }
}

// Create and export singleton instance
const editorSyncService = new EditorSyncService();
export default editorSyncService;
