/**
 * Execution Tracer Service
 * 
 * Connects Field Meditation Mode to actual Python execution, capturing
 * phase-state events during runtime and detecting divergences.
 * 
 * Part of Sprint 3 - Phase 3 ALAN IDE implementation.
 */

import { debounce, throttle } from '../utils/performance';
import conceptGraphService from './conceptGraphService';

class ExecutionTracerService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isTracing = false;
    this.traceBuffer = [];
    this.executionState = {
      currentNode: null,
      currentPhase: 0,
      callStack: [],
      variables: {},
      timestamp: 0,
      divergences: []
    };
    
    this.listeners = {
      traceUpdate: [],
      traceComplete: [],
      divergenceDetected: [],
      connectionChange: []
    };
    
    // Debounced updates to avoid overwhelming the UI
    this.emitTraceUpdateDebounced = debounce(this.emitTraceUpdate.bind(this), 50);
    
    // Throttled state check to detect divergences
    this.checkStateDivergences = throttle(this.detectDivergences.bind(this), 200);
  }
  
  /**
   * Initialize the execution tracer.
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.serverUrl - WebSocket URL for Python execution server
   * @param {boolean} options.autoConnect - Whether to connect automatically
   * @returns {ExecutionTracerService} - This instance for chaining
   */
  initialize(options = {}) {
    const { 
      serverUrl = 'ws://localhost:3002/execution-trace',
      autoConnect = false
    } = options;
    
    this.serverUrl = serverUrl;
    
    if (autoConnect) {
      this.connect();
    }
    
    return this;
  }
  
  /**
   * Connect to the Python execution server.
   * 
   * @returns {Promise<boolean>} - Promise resolving to connection status
   */
  connect() {
    if (this.isConnected) {
      return Promise.resolve(true);
    }
    
    return new Promise((resolve, reject) => {
      try {
        // Close any existing connection
        if (this.socket) {
          this.socket.close();
        }
        
        this.socket = new WebSocket(this.serverUrl);
        
        this.socket.onopen = () => {
          this.isConnected = true;
          this.notifyListeners('connectionChange', { connected: true });
          console.log('Execution tracer connected to Python server');
          resolve(true);
        };
        
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error processing tracer message:', error);
          }
        };
        
        this.socket.onclose = () => {
          this.isConnected = false;
          this.notifyListeners('connectionChange', { connected: false });
          console.log('Execution tracer disconnected from Python server');
          
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (!this.isConnected) {
              this.connect();
            }
          }, 5000);
        };
        
        this.socket.onerror = (error) => {
          console.error('Execution tracer WebSocket error:', error);
          this.isConnected = false;
          this.notifyListeners('connectionChange', { connected: false, error });
          reject(error);
        };
      } catch (error) {
        console.error('Error connecting to execution tracer server:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the Python execution server.
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.notifyListeners('connectionChange', { connected: false });
  }
  
  /**
   * Handle incoming messages from the Python execution server.
   * 
   * @param {Object} message - The message to handle
   */
  handleMessage(message) {
    const { type, payload } = message;
    
    switch (type) {
      case 'execution_event':
        this.handleExecutionEvent(payload);
        break;
        
      case 'execution_start':
        this.handleExecutionStart(payload);
        break;
        
      case 'execution_end':
        this.handleExecutionEnd(payload);
        break;
        
      case 'execution_error':
        this.handleExecutionError(payload);
        break;
        
      case 'variable_update':
        this.handleVariableUpdate(payload);
        break;
        
      case 'state_snapshot':
        this.handleStateSnapshot(payload);
        break;
        
      default:
        console.warn('Unknown execution tracer message type:', type);
    }
  }
  
  /**
   * Handle execution event from Python.
   * 
   * @param {Object} event - Execution event data
   */
  handleExecutionEvent(event) {
    const { node_id, phase, timestamp, context } = event;
    
    // Get node information from concept graph
    const node = conceptGraphService.getNode(node_id);
    
    // Create trace event
    const traceEvent = {
      nodeId: node_id,
      nodeName: node ? node.label : 'Unknown',
      nodeType: node ? node.type : 'unknown',
      phase,
      timestamp,
      context: context || {},
      executionState: { ...this.executionState }
    };
    
    // Update current state
    this.executionState.currentNode = node_id;
    this.executionState.currentPhase = phase;
    this.executionState.timestamp = timestamp;
    
    // Update call stack if needed
    if (context && context.callStack) {
      this.executionState.callStack = context.callStack;
    }
    
    // Add event to buffer
    this.traceBuffer.push(traceEvent);
    
    // Check for divergences
    this.checkStateDivergences();
    
    // Emit update
    this.emitTraceUpdateDebounced();
  }
  
  /**
   * Handle execution start event.
   * 
   * @param {Object} data - Start event data
   */
  handleExecutionStart(data) {
    // Reset state
    this.executionState = {
      currentNode: null,
      currentPhase: 0,
      callStack: [],
      variables: {},
      timestamp: data.timestamp || Date.now(),
      divergences: []
    };
    
    // Clear buffer
    this.traceBuffer = [];
    
    // Set tracing active
    this.isTracing = true;
    
    // Notify listeners
    this.notifyListeners('traceUpdate', {
      isTracing: true,
      event: 'start',
      executionState: { ...this.executionState },
      metadata: data
    });
  }
  
  /**
   * Handle execution end event.
   * 
   * @param {Object} data - End event data
   */
  handleExecutionEnd(data) {
    // Set tracing inactive
    this.isTracing = false;
    
    // Notify listeners
    this.notifyListeners('traceComplete', {
      traceBuffer: [...this.traceBuffer],
      executionState: { ...this.executionState },
      metadata: data
    });
  }
  
  /**
   * Handle execution error event.
   * 
   * @param {Object} error - Error data
   */
  handleExecutionError(error) {
    // Add error to execution state
    this.executionState.error = error;
    
    // Set tracing inactive
    this.isTracing = false;
    
    // Notify listeners
    this.notifyListeners('traceComplete', {
      traceBuffer: [...this.traceBuffer],
      executionState: { ...this.executionState },
      hasError: true,
      error
    });
  }
  
  /**
   * Handle variable update event.
   * 
   * @param {Object} update - Variable update data
   */
  handleVariableUpdate(update) {
    const { variables } = update;
    
    // Update variables in execution state
    this.executionState.variables = {
      ...this.executionState.variables,
      ...variables
    };
    
    // Check for divergences
    this.checkStateDivergences();
    
    // Emit update
    this.emitTraceUpdateDebounced();
  }
  
  /**
   * Handle state snapshot event.
   * 
   * @param {Object} snapshot - State snapshot data
   */
  handleStateSnapshot(snapshot) {
    // Update execution state with snapshot
    this.executionState = {
      ...this.executionState,
      ...snapshot,
      timestamp: snapshot.timestamp || Date.now()
    };
    
    // Check for divergences
    this.checkStateDivergences();
    
    // Emit update
    this.emitTraceUpdateDebounced();
  }
  
  /**
   * Detect divergences in the execution state.
   */
  detectDivergences() {
    if (!this.isTracing) return;
    
    const divergences = [];
    
    // Get current concept graph
    const graph = conceptGraphService.getConceptGraph();
    if (!graph || !graph.nodes) return;
    
    // Check current node against expected
    const currentNode = graph.nodes.find(n => n.id === this.executionState.currentNode);
    if (currentNode) {
      // Compare expected phase with actual phase
      if (currentNode.phase !== undefined && 
          Math.abs(currentNode.phase - this.executionState.currentPhase) > 0.2) {
        divergences.push({
          type: 'phase_divergence',
          nodeId: currentNode.id,
          nodeName: currentNode.label,
          expectedPhase: currentNode.phase,
          actualPhase: this.executionState.currentPhase,
          timestamp: Date.now(),
          severity: 'warning'
        });
      }
      
      // Check for resonance divergence
      if (currentNode.resonance !== undefined && 
          this.executionState.variables._resonance !== undefined &&
          Math.abs(currentNode.resonance - this.executionState.variables._resonance) > 0.3) {
        divergences.push({
          type: 'resonance_divergence',
          nodeId: currentNode.id,
          nodeName: currentNode.label,
          expectedResonance: currentNode.resonance,
          actualResonance: this.executionState.variables._resonance,
          timestamp: Date.now(),
          severity: 'warning'
        });
      }
    }
    
    // Add to execution state
    if (divergences.length > 0) {
      this.executionState.divergences = [
        ...this.executionState.divergences,
        ...divergences
      ];
      
      // Notify listeners
      divergences.forEach(divergence => {
        this.notifyListeners('divergenceDetected', divergence);
      });
    }
  }
  
  /**
   * Emit trace update event to listeners.
   */
  emitTraceUpdate() {
    this.notifyListeners('traceUpdate', {
      isTracing: this.isTracing,
      currentEvent: this.traceBuffer.length > 0 ? this.traceBuffer[this.traceBuffer.length - 1] : null,
      executionState: { ...this.executionState },
      bufferLength: this.traceBuffer.length
    });
  }
  
  /**
   * Inject instrumentation into Python code.
   * 
   * @param {string} code - Python code to instrument
   * @returns {string} - Instrumented Python code
   */
  instrumentCode(code) {
    // Helper to generate unique IDs for nodes
    const generateNodeId = (name, lineNo) => {
      return `node_${name.replace(/[^a-zA-Z0-9]/g, '_')}_${lineNo}`;
    };
    
    // Split into lines
    const lines = code.split('\n');
    
    // Add imports
    const header = [
      'import json',
      'import time',
      'import threading',
      'import websocket',
      'import random',
      '',
      '# Execution tracer setup',
      '_tracer_ws = None',
      '_tracer_lock = threading.Lock()',
      '',
      'def _connect_tracer():',
      '    global _tracer_ws',
      '    try:',
      '        _tracer_ws = websocket.create_connection("ws://localhost:3002/execution-trace")',
      '        _tracer_ws.send(json.dumps({"type": "execution_start", "payload": {"timestamp": time.time()}}))',
      '    except Exception as e:',
      '        print(f"Error connecting to execution tracer: {e}")',
      '',
      'def _send_event(node_id, phase, context=None):',
      '    if _tracer_ws is None:',
      '        _connect_tracer()',
      '    try:',
      '        with _tracer_lock:',
      '            _tracer_ws.send(json.dumps({',
      '                "type": "execution_event",',
      '                "payload": {',
      '                    "node_id": node_id,',
      '                    "phase": phase,',
      '                    "timestamp": time.time(),',
      '                    "context": context or {}',
      '                }',
      '            }))',
      '    except Exception as e:',
      '        print(f"Error sending execution event: {e}")',
      '',
      'def _update_vars(**kwargs):',
      '    if _tracer_ws is None:',
      '        _connect_tracer()',
      '    try:',
      '        with _tracer_lock:',
      '            _tracer_ws.send(json.dumps({',
      '                "type": "variable_update",',
      '                "payload": {',
      '                    "variables": kwargs,',
      '                    "timestamp": time.time()',
      '                }',
      '            }))',
      '    except Exception as e:',
      '        print(f"Error updating variables: {e}")',
      '',
      'def _end_trace():',
      '    if _tracer_ws is not None:',
      '        try:',
      '            with _tracer_lock:',
      '                _tracer_ws.send(json.dumps({',
      '                    "type": "execution_end",',
      '                    "payload": {',
      '                        "timestamp": time.time()',
      '                    }',
      '                }))',
      '                _tracer_ws.close()',
      '        except:',
      '            pass',
      '',
      '# Initialize tracer',
      '_connect_tracer()',
      '',
      '# Register cleanup',
      'import atexit',
      'atexit.register(_end_trace)',
      '',
    ].join('\n');
    
    // Add instrumentation to function definitions
    const instrumentedLines = lines.map((line, i) => {
      const lineNo = i + 1;
      
      // Function definition
      if (line.match(/^(\s*)def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/)) {
        const indent = RegExp.$1;
        const funcName = RegExp.$2;
        const nodeId = generateNodeId(funcName, lineNo);
        
        return [
          line,
          `${indent}    _send_event("${nodeId}", random.random(), {"type": "function_entry", "name": "${funcName}", "line": ${lineNo}})`
        ].join('\n');
      }
      
      // Class definition
      if (line.match(/^(\s*)class\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(?/)) {
        const indent = RegExp.$1;
        const className = RegExp.$2;
        const nodeId = generateNodeId(className, lineNo);
        
        return [
          line,
          `${indent}    _send_event("${nodeId}", random.random(), {"type": "class_definition", "name": "${className}", "line": ${lineNo}})`
        ].join('\n');
      }
      
      return line;
    });
    
    // Add footer
    const footer = [
      '',
      '# Send final event',
      '_send_event("program_end", 1.0, {"type": "program_end"})',
      '_end_trace()'
    ].join('\n');
    
    // Combine everything
    return [header, instrumentedLines.join('\n'), footer].join('\n');
  }
  
  /**
   * Start execution tracing for a Python file.
   * 
   * @param {string} pythonCode - Python code to execute
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} - Promise resolving to execution result
   */
  startTracing(pythonCode, options = {}) {
    if (!this.isConnected) {
      return this.connect().then(() => this.startTracing(pythonCode, options));
    }
    
    // Instrument the code
    const instrumentedCode = this.instrumentCode(pythonCode);
    
    // Reset state
    this.executionState = {
      currentNode: null,
      currentPhase: 0,
      callStack: [],
      variables: {},
      timestamp: Date.now(),
      divergences: []
    };
    
    // Clear buffer
    this.traceBuffer = [];
    
    // Set tracing active
    this.isTracing = true;
    
    // Send execution request
    const message = {
      type: 'execute_python',
      payload: {
        code: instrumentedCode,
        options
      }
    };
    
    this.socket.send(JSON.stringify(message));
    
    // Return a promise that resolves when execution is complete
    return new Promise((resolve, reject) => {
      const completeListener = (data) => {
        // Remove listener
        this.unsubscribe('traceComplete', completeListener);
        
        if (data.hasError) {
          reject(data.error);
        } else {
          resolve(data);
        }
      };
      
      // Add listener for completion
      this.subscribe('traceComplete', completeListener);
    });
  }
  
  /**
   * Get the current execution state.
   * 
   * @returns {Object} - Current execution state
   */
  getExecutionState() {
    return { ...this.executionState };
  }
  
  /**
   * Get the execution trace buffer.
   * 
   * @returns {Array} - Execution trace buffer
   */
  getTraceBuffer() {
    return [...this.traceBuffer];
  }
  
  /**
   * Check if execution tracing is active.
   * 
   * @returns {boolean} - True if tracing is active
   */
  isActive() {
    return this.isTracing;
  }
  
  /**
   * Subscribe to execution tracer events.
   * 
   * @param {string} event - Event type
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback);
    
    return () => this.unsubscribe(event, callback);
  }
  
  /**
   * Unsubscribe from execution tracer events.
   * 
   * @param {string} event - Event type
   * @param {Function} callback - Callback function
   */
  unsubscribe(event, callback) {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
  
  /**
   * Notify listeners of an event.
   * 
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in execution tracer listener for ${event}:`, error);
      }
    });
  }
}

// Create singleton instance
const executionTracerService = new ExecutionTracerService();

export default executionTracerService;
