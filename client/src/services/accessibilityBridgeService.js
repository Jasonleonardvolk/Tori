/**
 * Accessibility Bridge Service
 * 
 * Provides a bridge between the UI and automated agents, enabling
 * the IDE to be operated via the accessibility tree.
 * 
 * Part of Sprint 2 - Phase 3 ALAN IDE implementation.
 */

import { throttle } from '../utils/performance';

class AccessibilityBridgeService {
  constructor() {
    this.registry = new Map();
    this.commandHandlers = new Map();
    this.isConnected = false;
    this.socket = null;
    this.logEnabled = false;
    
    // Handle DOM mutations to update the accessibility tree
    this.mutationObserver = null;
    
    // Bidirectional communication channel
    this.messageChannel = {
      incoming: new Map(), // commandId -> callback
      outgoing: new Map(), // commandId -> {resolve, reject}
      lastCommandId: 0
    };
  }
  
  /**
   * Initialize the accessibility bridge.
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} options.enableWebSocket - Whether to enable WebSocket communication
   * @param {string} options.socketUrl - WebSocket URL for agent communication
   * @param {boolean} options.enableLogging - Whether to enable logging
   */
  initialize(options = {}) {
    const {
      enableWebSocket = false,
      socketUrl = 'ws://localhost:3001/agent-bridge',
      enableLogging = false
    } = options;
    
    this.logEnabled = enableLogging;
    
    // Initialize the mutation observer to track UI changes
    this.initializeMutationObserver();
    
    // Set up the command registry
    this.registerCoreCommands();
    
    // Connect to WebSocket if enabled
    if (enableWebSocket) {
      this.connectWebSocket(socketUrl);
    }
    
    this.log('Accessibility Bridge initialized');
    
    // Generate initial UI tree
    this.generateUITree();
    
    return this;
  }
  
  /**
   * Initialize mutation observer to track DOM changes.
   */
  initializeMutationObserver() {
    // Throttled callback to update the UI tree when DOM changes
    const handleMutation = throttle(() => {
      this.generateUITree();
    }, 500);
    
    // Create a mutation observer to watch for DOM changes
    this.mutationObserver = new MutationObserver(handleMutation);
    
    // Start observing the document with the configured parameters
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-*', 'role', 'data-testid']
    });
  }
  
  /**
   * Register a UI component in the accessibility registry.
   * 
   * @param {string} id - Unique identifier for the component
   * @param {Object} component - Component reference
   * @param {Object} metadata - Additional metadata about the component
   * @returns {Function} - Function to unregister the component
   */
  register(id, component, metadata = {}) {
    if (this.registry.has(id)) {
      this.log(`Warning: Component with ID ${id} already registered. Overwriting.`);
    }
    
    this.registry.set(id, {
      component,
      metadata,
      commands: new Set(),
      timestamp: Date.now()
    });
    
    this.log(`Registered component: ${id}`);
    
    // Update the UI tree
    this.generateUITree();
    
    // Return a function to unregister
    return () => this.unregister(id);
  }
  
  /**
   * Unregister a component from the registry.
   * 
   * @param {string} id - Component ID to unregister
   * @returns {boolean} - Whether the component was successfully unregistered
   */
  unregister(id) {
    const result = this.registry.delete(id);
    
    if (result) {
      this.log(`Unregistered component: ${id}`);
      this.generateUITree();
    }
    
    return result;
  }
  
  /**
   * Register a command handler for a specific component.
   * 
   * @param {string} componentId - ID of the component to register the command for
   * @param {string} commandName - Name of the command
   * @param {Function} handler - Function to handle the command
   * @param {Object} metadata - Additional metadata about the command
   * @returns {Function} - Function to unregister the command
   */
  registerCommand(componentId, commandName, handler, metadata = {}) {
    const commandId = `${componentId}:${commandName}`;
    
    if (this.commandHandlers.has(commandId)) {
      this.log(`Warning: Command ${commandId} already registered. Overwriting.`);
    }
    
    this.commandHandlers.set(commandId, {
      handler,
      metadata,
      timestamp: Date.now()
    });
    
    // Add to component's available commands
    const component = this.registry.get(componentId);
    if (component) {
      component.commands.add(commandName);
    }
    
    this.log(`Registered command: ${commandId}`);
    
    // Return a function to unregister
    return () => this.unregisterCommand(componentId, commandName);
  }
  
  /**
   * Unregister a command handler.
   * 
   * @param {string} componentId - ID of the component
   * @param {string} commandName - Name of the command
   * @returns {boolean} - Whether the command was successfully unregistered
   */
  unregisterCommand(componentId, commandName) {
    const commandId = `${componentId}:${commandName}`;
    const result = this.commandHandlers.delete(commandId);
    
    // Remove from component's available commands
    const component = this.registry.get(componentId);
    if (component) {
      component.commands.delete(commandName);
    }
    
    if (result) {
      this.log(`Unregistered command: ${commandId}`);
    }
    
    return result;
  }
  
  /**
   * Execute a command on a component.
   * 
   * @param {string} componentId - ID of the component to execute the command on
   * @param {string} commandName - Name of the command to execute
   * @param {Object} args - Arguments to pass to the command handler
   * @returns {Promise<any>} - Promise resolving to the command result
   */
  executeCommand(componentId, commandName, args = {}) {
    const commandId = `${componentId}:${commandName}`;
    const handler = this.commandHandlers.get(commandId);
    
    if (!handler) {
      this.log(`Error: Command ${commandId} not found`);
      return Promise.reject(new Error(`Command ${commandId} not found`));
    }
    
    try {
      this.log(`Executing command: ${commandId}`, args);
      const result = handler.handler(args);
      return Promise.resolve(result);
    } catch (error) {
      this.log(`Error executing command ${commandId}:`, error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Connect to WebSocket for agent communication.
   * 
   * @param {string} url - WebSocket URL
   */
  connectWebSocket(url) {
    if (this.socket) {
      this.socket.close();
    }
    
    try {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        this.isConnected = true;
        this.log('WebSocket connected');
        
        // Send the initial UI tree
        this.sendMessage('ui_tree_update', this.generateUITree());
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleIncomingMessage(message);
        } catch (error) {
          this.log('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = () => {
        this.isConnected = false;
        this.log('WebSocket disconnected');
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (!this.isConnected) {
            this.connectWebSocket(url);
          }
        }, 5000);
      };
      
      this.socket.onerror = (error) => {
        this.log('WebSocket error:', error);
      };
    } catch (error) {
      this.log('Error connecting to WebSocket:', error);
    }
  }
  
  /**
   * Send a message through the WebSocket.
   * 
   * @param {string} type - Message type
   * @param {Object} payload - Message payload
   * @returns {Promise<any>} - Promise resolving to the response
   */
  sendMessage(type, payload = {}) {
    if (!this.isConnected || !this.socket) {
      return Promise.reject(new Error('WebSocket not connected'));
    }
    
    const commandId = this.messageChannel.lastCommandId++;
    
    return new Promise((resolve, reject) => {
      const message = {
        commandId,
        type,
        payload
      };
      
      // Store the promise handlers
      this.messageChannel.outgoing.set(commandId, { resolve, reject });
      
      // Send the message
      this.socket.send(JSON.stringify(message));
      
      // Set a timeout to reject the promise if no response is received
      setTimeout(() => {
        if (this.messageChannel.outgoing.has(commandId)) {
          this.messageChannel.outgoing.delete(commandId);
          reject(new Error(`Command ${commandId} timed out`));
        }
      }, 10000);
    });
  }
  
  /**
   * Handle incoming WebSocket messages.
   * 
   * @param {Object} message - Parsed message object
   */
  handleIncomingMessage(message) {
    const { type, commandId, payload } = message;
    
    this.log('Received message:', message);
    
    // Check if this is a response to a previous command
    if (commandId !== undefined && this.messageChannel.outgoing.has(commandId)) {
      const { resolve, reject } = this.messageChannel.outgoing.get(commandId);
      this.messageChannel.outgoing.delete(commandId);
      
      if (type === 'error') {
        reject(new Error(payload.message || 'Unknown error'));
      } else {
        resolve(payload);
      }
      
      return;
    }
    
    // Otherwise handle as a new command
    switch (type) {
      case 'execute_command':
        this.handleExecuteCommand(message);
        break;
        
      case 'query_ui_tree':
        this.handleQueryUITree(message);
        break;
        
      case 'get_component_info':
        this.handleGetComponentInfo(message);
        break;
        
      default:
        // Check if a handler has been registered for this message type
        const handler = this.messageChannel.incoming.get(type);
        if (handler) {
          try {
            handler(payload, (response) => {
              this.sendResponse(commandId, response);
            });
          } catch (error) {
            this.sendError(commandId, error);
          }
        } else {
          this.sendError(commandId, new Error(`Unknown message type: ${type}`));
        }
    }
  }
  
  /**
   * Handle execute_command message from WebSocket.
   * 
   * @param {Object} message - Message object
   */
  handleExecuteCommand(message) {
    const { commandId, payload } = message;
    const { componentId, commandName, args } = payload;
    
    this.executeCommand(componentId, commandName, args)
      .then((result) => {
        this.sendResponse(commandId, result);
      })
      .catch((error) => {
        this.sendError(commandId, error);
      });
  }
  
  /**
   * Handle query_ui_tree message from WebSocket.
   * 
   * @param {Object} message - Message object
   */
  handleQueryUITree(message) {
    const { commandId } = message;
    this.sendResponse(commandId, this.generateUITree());
  }
  
  /**
   * Handle get_component_info message from WebSocket.
   * 
   * @param {Object} message - Message object
   */
  handleGetComponentInfo(message) {
    const { commandId, payload } = message;
    const { componentId } = payload;
    
    const component = this.registry.get(componentId);
    
    if (!component) {
      return this.sendError(commandId, new Error(`Component ${componentId} not found`));
    }
    
    this.sendResponse(commandId, {
      componentId,
      metadata: component.metadata,
      commands: Array.from(component.commands)
    });
  }
  
  /**
   * Send a response to a WebSocket command.
   * 
   * @param {number} commandId - ID of the command to respond to
   * @param {any} result - Response payload
   */
  sendResponse(commandId, result) {
    if (!this.isConnected || !this.socket) {
      return;
    }
    
    this.socket.send(JSON.stringify({
      commandId,
      type: 'response',
      payload: result
    }));
  }
  
  /**
   * Send an error response to a WebSocket command.
   * 
   * @param {number} commandId - ID of the command that failed
   * @param {Error} error - Error object
   */
  sendError(commandId, error) {
    if (!this.isConnected || !this.socket) {
      return;
    }
    
    this.socket.send(JSON.stringify({
      commandId,
      type: 'error',
      payload: {
        message: error.message,
        stack: error.stack
      }
    }));
  }
  
  /**
   * Generate a tree representation of the UI for agents.
   * 
   * @returns {Object} - UI tree object
   */
  generateUITree() {
    const tree = {
      type: 'root',
      id: 'alan-ide-root',
      children: [],
      timestamp: Date.now()
    };
    
    // Add registered components to the tree
    this.registry.forEach((component, id) => {
      const { metadata, commands } = component;
      
      tree.children.push({
        type: 'component',
        id,
        metadata,
        commands: Array.from(commands),
        // Find accessible properties of the component
        accessibility: this.getAccessibilityInfo(id)
      });
    });
    
    // Also scan the DOM for accessibility nodes
    const domNodes = this.scanDOMForAccessibility();
    tree.children.push(...domNodes);
    
    // If connected to WebSocket, send the updated tree
    if (this.isConnected && this.socket) {
      this.socket.send(JSON.stringify({
        type: 'ui_tree_update',
        payload: tree
      }));
    }
    
    return tree;
  }
  
  /**
   * Get accessibility information for a registered component.
   * 
   * @param {string} componentId - Component ID
   * @returns {Object} - Accessibility information
   */
  getAccessibilityInfo(componentId) {
    const component = this.registry.get(componentId);
    
    if (!component || !component.component) {
      return {};
    }
    
    // Try to find the DOM element
    let element = null;
    
    if (component.component.current && component.component.current instanceof Element) {
      element = component.component.current;
    } else if (component.component instanceof Element) {
      element = component.component;
    }
    
    if (!element) {
      return {};
    }
    
    // Extract accessibility attributes
    const attributes = {};
    
    for (const attr of element.attributes) {
      if (attr.name.startsWith('aria-') || attr.name === 'role' || 
          attr.name === 'tabindex' || attr.name === 'alt' || 
          attr.name === 'title' || attr.name === 'data-testid') {
        attributes[attr.name] = attr.value;
      }
    }
    
    return {
      role: element.getAttribute('role') || '',
      label: element.getAttribute('aria-label') || element.getAttribute('alt') || element.textContent || '',
      attributes
    };
  }
  
  /**
   * Scan the DOM for accessibility nodes.
   * 
   * @returns {Array} - Array of accessibility nodes
   */
  scanDOMForAccessibility() {
    const nodes = [];
    
    // Find elements with roles, aria-* attributes, or data-testid
    const elements = document.querySelectorAll('[role], [aria-label], [data-testid]');
    
    for (const element of elements) {
      // Skip elements that are already in the registry
      const registered = Array.from(this.registry.values()).some(comp => {
        return (comp.component.current === element) || (comp.component === element);
      });
      
      if (registered) {
        continue;
      }
      
      // Extract attributes
      const attributes = {};
      
      for (const attr of element.attributes) {
        if (attr.name.startsWith('aria-') || attr.name === 'role' || 
            attr.name === 'tabindex' || attr.name === 'alt' || 
            attr.name === 'title' || attr.name === 'data-testid') {
          attributes[attr.name] = attr.value;
        }
      }
      
      // Generate an ID based on attributes or position
      const id = element.getAttribute('id') || 
                element.getAttribute('data-testid') || 
                `dom-element-${element.tagName.toLowerCase()}-${nodes.length}`;
      
      nodes.push({
        type: 'dom',
        id,
        tagName: element.tagName.toLowerCase(),
        accessibility: {
          role: element.getAttribute('role') || '',
          label: element.getAttribute('aria-label') || element.getAttribute('alt') || element.textContent || '',
          attributes
        }
      });
    }
    
    return nodes;
  }
  
  /**
   * Register core commands for the accessibility bridge.
   */
  registerCoreCommands() {
    // Command for triggering a UI refresh
    this.registerCommand('alan-ide-root', 'refresh', () => {
      return this.generateUITree();
    }, {
      description: 'Refresh the UI tree'
    });
    
    // Command for navigation
    this.registerCommand('alan-ide-root', 'navigate', ({ componentId }) => {
      const component = this.registry.get(componentId);
      
      if (!component) {
        throw new Error(`Component ${componentId} not found`);
      }
      
      // If it's a DOM element, focus and scroll to it
      if (component.component instanceof Element) {
        component.component.focus();
        component.component.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return { success: true, navigatedTo: componentId };
      }
      
      if (component.component.current && component.component.current instanceof Element) {
        component.component.current.focus();
        component.component.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return { success: true, navigatedTo: componentId };
      }
      
      throw new Error(`Cannot navigate to component ${componentId}`);
    }, {
      description: 'Navigate to a component'
    });
  }
  
  /**
   * Log a message to the console.
   * 
   * @param  {...any} args - Arguments to log
   */
  log(...args) {
    if (this.logEnabled) {
      console.log('[Accessibility Bridge]', ...args);
    }
  }
}

// Create a singleton instance
const accessibilityBridgeService = new AccessibilityBridgeService();

export default accessibilityBridgeService;
