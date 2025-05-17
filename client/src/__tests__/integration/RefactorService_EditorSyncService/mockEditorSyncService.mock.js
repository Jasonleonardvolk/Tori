/**
 * Mock EditorSyncService for tests
 */
import { EventEmitter } from 'events';

// Create a mock editor sync service with necessary methods for testing
class MockEditorSyncService extends EventEmitter {
  constructor() {
    super();
    this.positionMap = new Map();
    this.editor = null;
    this.conceptGraph = null;
    this.isInitialized = false;
    this.subscribers = new Map();
    
    // Create Jest mock functions for the methods we want to spy on
    this.handleEditorChange = jest.fn();
    this.handleConceptChange = jest.fn();
    this.buildPositionMap = jest.fn();
    this.handleCursorPositionChange = jest.fn();
    this.handleEditorSelectionChange = jest.fn();
  }

  /**
   * Initialize the service with editor and concept graph
   */
  initialize(editor, conceptGraph) {
    this.editor = editor;
    this.conceptGraph = conceptGraph;
    this.isInitialized = true;
    
    // Build position map
    this.buildPositionMap();
    
    // Return this for chaining
    return this;
  }

  /**
   * Subscribe to events
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    
    this.subscribers.get(event).add(callback);
    
    return () => {
      if (this.subscribers.has(event)) {
        this.subscribers.get(event).delete(callback);
      }
    };
  }

  /**
   * Notify subscribers
   */
  notifySubscribers(event, data) {
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
  }

  /**
   * Log methods
   */
  debug(message) {
    console.debug(`[MockEditorSyncService] ${message}`);
  }
  
  info(message) {
    console.info(`[MockEditorSyncService] ${message}`);
  }
  
  warn(message) {
    console.warn(`[MockEditorSyncService] ${message}`);
  }
  
  error(message, error) {
    console.error(`[MockEditorSyncService] ${message}`, error);
  }
}

// Export a singleton instance
const mockEditorSyncService = new MockEditorSyncService();
export default mockEditorSyncService;
