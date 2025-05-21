/**
 * Mock MCP Client Service for use in tests
 */

// Mock implementation of MCPClientService
const mockMcpClientService = {
  // Connected servers and their metadata
  connectedServers: new Map(),
  
  // Active connections
  activeConnections: new Map(),
  
  // Debug traces for tool execution and resource access
  debugTraces: [],
  
  // Maximum number of debug traces to keep
  maxTraces: 5,
  
  // Event subscribers
  subscribers: new Map(),
  
  /**
   * Execute a tool on an MCP server
   */
  executeTool: jest.fn(async (serverId, toolName, args = {}) => {
    // Always add a trace
    const trace = {
      type: 'tool_execution',
      serverId,
      toolName,
      args,
      result: { status: 'success' },
      timestamp: Date.now()
    };
    
    // Add to debug traces
    mockMcpClientService._addTrace(trace);
    
    // Notify subscribers
    mockMcpClientService._notifySubscribers('toolExecuted', {
      serverId,
      toolName,
      args,
      result: { status: 'success' }
    });
    
    return { status: 'success' };
  }),
  
  /**
   * Access a resource on an MCP server
   */
  accessResource: jest.fn(async (serverId, resourceUri) => {
    // Always add a trace
    const trace = {
      type: 'resource_access',
      serverId,
      resourceUri,
      data: { content: 'Mock content' },
      timestamp: Date.now()
    };
    
    // Add to debug traces
    mockMcpClientService._addTrace(trace);
    
    // Notify subscribers
    mockMcpClientService._notifySubscribers('resourceAccessed', {
      serverId,
      resourceUri,
      data: { content: 'Mock content' }
    });
    
    return { content: 'Mock content' };
  }),
  
  /**
   * Disconnect from an MCP server
   */
  disconnectServer: jest.fn(async (serverId) => {
    mockMcpClientService.activeConnections.set(serverId, false);
    
    mockMcpClientService._notifySubscribers('serverDisconnected', { 
      serverId, 
      server: mockMcpClientService.connectedServers.get(serverId)
    });
    
    return { success: true };
  }),
  
  /**
   * Check connection status
   */
  checkConnection: jest.fn(async () => {
    return mockMcpClientService.activeConnections.size > 0;
  }),
  
  /**
   * Send a message
   */
  sendMessage: jest.fn(async (message, options) => {
    mockMcpClientService._notifySubscribers('messageSent', {
      message,
      options,
      result: { status: 'success' }
    });
    
    return { status: 'success' };
  }),
  
  /**
   * Subscribe to events
   */
  subscribe: jest.fn((eventType, callback) => {
    if (!mockMcpClientService.subscribers.has(eventType)) {
      mockMcpClientService.subscribers.set(eventType, new Set());
    }
    
    mockMcpClientService.subscribers.get(eventType).add(callback);
    
    return () => {
      const subscribers = mockMcpClientService.subscribers.get(eventType);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }),
  
  /**
   * Add a trace to the debug traces
   * @private
   */
  _addTrace: (trace) => {
    mockMcpClientService.debugTraces.push(trace);
    
    // Trim traces if they exceed the maximum
    if (mockMcpClientService.debugTraces.length > mockMcpClientService.maxTraces) {
      mockMcpClientService.debugTraces = mockMcpClientService.debugTraces.slice(
        mockMcpClientService.debugTraces.length - mockMcpClientService.maxTraces
      );
    }
  },
  
  /**
   * Notify subscribers of an event
   * @private
   */
  _notifySubscribers: jest.fn((eventType, data) => {
    const subscribers = mockMcpClientService.subscribers.get(eventType);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventType} subscriber:`, error);
        }
      });
    }
  }),
  
  // Reset the mock state for testing
  __resetMockState: () => {
    mockMcpClientService.connectedServers.clear();
    mockMcpClientService.activeConnections.clear();
    mockMcpClientService.debugTraces = [];
    mockMcpClientService.subscribers.clear();
    
    // Add a default server for testing
    const testServer = {
      id: 'test-server',
      name: 'Test Server',
      url: 'http://localhost:8080/mcp',
      status: 'connected',
      metadata: {
        tools: [{ name: 'test_tool', description: 'Test tool' }],
        resources: [{ uri: 'test://resource', description: 'Test resource' }]
      },
      tools: [{ name: 'test_tool', description: 'Test tool' }],
      resources: [{ uri: 'test://resource', description: 'Test resource' }],
      connectionTime: Date.now(),
      lastActive: Date.now()
    };
    
    mockMcpClientService.connectedServers.set('test-server', testServer);
    mockMcpClientService.activeConnections.set('test-server', true);
  }
};

// Initialize the mock with default state
mockMcpClientService.__resetMockState();

export default mockMcpClientService;
