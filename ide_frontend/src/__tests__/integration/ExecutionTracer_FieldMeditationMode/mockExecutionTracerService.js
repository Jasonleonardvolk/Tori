/**
 * Mock ExecutionTracerService for tests
 */
import { EventEmitter } from 'events';

// Create a mock execution tracer service with necessary methods for testing
class MockExecutionTracerService extends EventEmitter {
  constructor() {
    super();
    this.connected = false;
    this.executionState = {
      status: 'idle',
      currentNode: null,
      currentPhase: null,
      events: [],
      divergences: []
    };
    
    // Create Jest mock functions
    this.connect = jest.fn(async () => {
      this.connected = true;
      this.emit('connected');
      return true;
    });
    
    this.disconnect = jest.fn(() => {
      this.connected = false;
      this.emit('disconnected');
      return true;
    });
    
    this.executeCode = jest.fn(async (code) => {
      this.handleExecutionStart({});
      setTimeout(() => this.simulateExecution(), 100);
      return true;
    });
    
    this.executePythonCode = jest.fn(async (code) => {
      return this.executeCode(code);
    });
    
    this.handleExecutionEvent = jest.fn((event) => {
      this.executionState.events.push(event);
      this.executionState.currentNode = event.nodeId;
      this.executionState.currentPhase = event.phase;
      this.emit('executionEvent', event);
      this.emitTraceUpdate();
    });
    
    this.handleExecutionStart = jest.fn((event) => {
      this.executionState.status = 'running';
      this.executionState.events = [];
      this.emit('executionStart', event);
      this.emitTraceUpdate();
    });
    
    this.handleExecutionEnd = jest.fn((event) => {
      this.executionState.status = 'completed';
      this.emit('executionEnd', event);
      this.emitTraceUpdate();
    });
    
    this.detectDivergences = jest.fn(() => {
      // Simple mock implementation that always detects a divergence
      // on the current node if one exists
      if (this.executionState.currentNode) {
        const divergence = {
          type: 'phase_divergence',
          nodeId: this.executionState.currentNode,
          nodeName: `Node ${this.executionState.currentNode}`,
          severity: 'warning',
          expectedPhase: 0.8,
          actualPhase: this.executionState.currentPhase
        };
        
        this.executionState.divergences.push(divergence);
        this.emit('divergenceDetected', divergence);
        this.emitTraceUpdate();
        return [divergence];
      }
      return [];
    });
    
    this.emitTraceUpdate = jest.fn(() => {
      this.emit('traceUpdate', this.executionState);
    });
    
    // Add subscribe method to work with component
    this.subscribe = jest.fn((event, callback) => {
      this.on(event, callback);
      return () => this.off(event, callback);
    });
  }
  
  // Helper methods for testing
  
  simulateExecution() {
    // Simulate execution events
    const events = [
      { nodeId: 'node_1', phase: 0.2, timestamp: Date.now() },
      { nodeId: 'node_2', phase: 0.5, timestamp: Date.now() + 100 },
      { nodeId: 'node_3', phase: 0.8, timestamp: Date.now() + 200 }
    ];
    
    // Process events with delays
    setTimeout(() => {
      this.handleExecutionEvent(events[0]);
      
      setTimeout(() => {
        this.handleExecutionEvent(events[1]);
        
        setTimeout(() => {
          this.handleExecutionEvent(events[2]);
          
          setTimeout(() => {
            this.handleExecutionEnd({ timestamp: Date.now() + 300 });
          }, 100);
        }, 100);
      }, 100);
    }, 100);
  }
}

// Export a singleton instance
const mockExecutionTracerService = new MockExecutionTracerService();
export default mockExecutionTracerService;
