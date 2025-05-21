/**
 * Mock MCPClientService for integration tests
 * 
 * Simulates MCP client service behavior for testing the integration with DebugAgent
 */
import { EventEmitter } from 'events';

class MockMCPClientService extends EventEmitter {
  constructor() {
    super();
    this.connectedServers = new Map();
    this.activeConnections = new Map();
    this.debugTraces = [];
    this.maxTraces = 100;
  }
  
  /**
   * Connect to an MCP server
   * @param {Object} serverConfig - Server configuration
   * @returns {Promise<Object>} - Connected server info
   */
  async connectServer(serverConfig) {
    const serverId = serverConfig.id || `server-${Date.now()}`;
    
    const serverInfo = {
      id: serverId,
      name: serverConfig.name || serverId,
      url: serverConfig.url,
      status: 'connected',
      metadata: serverConfig.metadata || {},
      tools: serverConfig.tools || [],
      resources: serverConfig.resources || [],
      connectionTime: Date.now(),
      lastActive: Date.now()
    };
    
    // Store server info
    this.connectedServers.set(serverId, serverInfo);
    this.activeConnections.set(serverId, true);
    
    // Emit connection event
    this.emit('serverConnected', {
      serverId,
      serverInfo
    });
    
    return serverInfo;
  }
  
  /**
   * Disconnect from an MCP server
   * @param {string} serverId - Server ID
   * @returns {Promise<boolean>} - Success status
   */
  async disconnectServer(serverId) {
    if (!this.connectedServers.has(serverId)) {
      return false;
    }
    
    // Update status
    const serverInfo = this.connectedServers.get(serverId);
    serverInfo.status = 'disconnected';
    this.activeConnections.delete(serverId);
    
    // Emit disconnection event
    this.emit('serverDisconnected', {
      serverId,
      timestamp: Date.now()
    });
    
    return true;
  }
  
  /**
   * Execute a tool on an MCP server
   * @param {string} serverId - Server ID
   * @param {string} toolName - Tool name
   * @param {Object} args - Tool arguments
   * @returns {Promise<Object>} - Tool result
   */
  async executeTool(serverId, toolName, args) {
    if (!this.connectedServers.has(serverId) || !this.activeConnections.has(serverId)) {
      throw new Error(`Server ${serverId} not connected`);
    }
    
    // Update last active time
    const serverInfo = this.connectedServers.get(serverId);
    serverInfo.lastActive = Date.now();
    
    // Simulate tool execution result
    const result = {
      status: 'success',
      data: { message: `Executed ${toolName} on ${serverId}` },
      timestamp: Date.now()
    };
    
    // Create execution record
    const executionRecord = {
      serverId,
      toolName,
      args,
      result,
      timestamp: Date.now()
    };
    
    // Add to debug traces, respecting maximum
    this._addDebugTrace({
      type: 'tool_execution',
      ...executionRecord
    });
    
    // Emit tool execution event
    this.emit('toolExecuted', executionRecord);
    
    return result;
  }
  
  /**
   * Access a resource on an MCP server
   * @param {string} serverId - Server ID
   * @param {string} resourceUri - Resource URI
   * @returns {Promise<Object>} - Resource data
   */
  async accessResource(serverId, resourceUri) {
    if (!this.connectedServers.has(serverId) || !this.activeConnections.has(serverId)) {
      throw new Error(`Server ${serverId} not connected`);
    }
    
    // Update last active time
    const serverInfo = this.connectedServers.get(serverId);
    serverInfo.lastActive = Date.now();
    
    // Simulate resource data
    const data = {
      id: resourceUri,
      content: `Resource content for ${resourceUri}`,
      metadata: {
        contentType: 'text/plain',
        timestamp: Date.now()
      }
    };
    
    // Create access record
    const accessRecord = {
      serverId,
      resourceUri,
      data,
      timestamp: Date.now()
    };
    
    // Add to debug traces, respecting maximum
    this._addDebugTrace({
      type: 'resource_access',
      ...accessRecord
    });
    
    // Emit resource access event
    this.emit('resourceAccessed', accessRecord);
    
    return data;
  }
  
  /**
   * Add a debug trace, respecting the maximum number of traces
   * @private
   * @param {Object} trace - Debug trace
   */
  _addDebugTrace(trace) {
    this.debugTraces.push(trace);
    this.trimDebugTraces();
  }
  
  /**
   * Ensure debug traces don't exceed the maximum
   * This method is needed to fix the test that directly adds traces
   */
  trimDebugTraces() {
    // Trim if exceeding max traces
    if (this.debugTraces.length > this.maxTraces) {
      this.debugTraces = this.debugTraces.slice(this.debugTraces.length - this.maxTraces);
    }
  }
  
  /**
   * Subscribe to events
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(event, callback) {
    this.on(event, callback);
    return () => this.off(event, callback);
  }
}

// Export singleton instance
const mockMcpClientService = new MockMCPClientService();
export default mockMcpClientService;
