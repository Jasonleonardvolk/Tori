// MCP Client Library for TORI Chat
// This creates window.mcp() function to communicate with MCP servers

class MCPClient {
  constructor() {
    this.baseUrl = 'http://localhost:8080'; // Ingest Bus API
  }

  async call(method, params = {}) {
    try {
      // Map MCP method calls to appropriate endpoints
      const endpoint = this.getEndpoint(method);
      const url = `${this.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`MCP call failed: ${method}`, error);
      throw error;
    }
  }

  getEndpoint(method) {
    // Map MCP methods to API endpoints
    const methodMap = {
      'memory.health': '/health',
      'memory.put': '/memory/store',
      'kb.search': '/memory/search',
      'memory.consolidate': '/memory/consolidate',
      'spectral.status': '/spectral/status',
      // Add more mappings as needed
    };

    return methodMap[method] || `/${method.replace('.', '/')}`;
  }
}

// Initialize MCP client and attach to window
window.mcp = function(method, params) {
  if (!window.mcpClient) {
    window.mcpClient = new MCPClient();
  }
  return window.mcpClient.call(method, params);
};

// Also provide direct access to the client
window.mcpClient = new MCPClient();

console.log('✅ MCP Client initialized - window.mcp() is ready!');
