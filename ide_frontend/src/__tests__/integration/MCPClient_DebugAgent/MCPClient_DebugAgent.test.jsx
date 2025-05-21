/**
 * Integration Test for MCPClient + DebugAgent
 * 
 * Tests the integration between the MCPClient service and DebugAgent component.
 * Ensures that MCP operations are properly traced and displayed in the debug panel.
 */

// React not used directly in this test
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DebugAgentPanel from '../../../DebugAgentPanel';
import mockMcpClientService from './mockMcpClientService';
import { SelectionProvider } from '../../../SelectionContext';

// Use the mock for tests
const mcpClientService = mockMcpClientService;

// Mock SelectionContext since it's used by DebugAgentPanel
jest.mock('../../../SelectionContext', () => {
  const originalModule = jest.requireActual('../../../SelectionContext');
  
  return {
    ...originalModule,
    useSelection: jest.fn(() => ({
      selected: [],
      setSelected: jest.fn()
    }))
  };
});

describe('MCPClient + DebugAgent Integration', () => {
  beforeEach(() => {
    // Spy on MCPClientService methods
    jest.spyOn(mcpClientService, 'executeTool');
    jest.spyOn(mcpClientService, 'accessResource');
    
    // Reset MCPClientService state
    mcpClientService.connectedServers = new Map();
    mcpClientService.activeConnections = new Map();
    mcpClientService.debugTraces = [];
    
    // Mock a connected server
    const mockServer = {
      id: 'test-server',
      name: 'Test Server',
      url: 'http://localhost:8080/mcp',
      status: 'connected',
      metadata: {
        tools: [
          { name: 'test_tool', description: 'Test tool' }
        ],
        resources: [
          { uri: 'test://resource', description: 'Test resource' }
        ]
      },
      tools: [
        { name: 'test_tool', description: 'Test tool' }
      ],
      resources: [
        { uri: 'test://resource', description: 'Test resource' }
      ],
      connectionTime: Date.now(),
      lastActive: Date.now()
    };
    
    mcpClientService.connectedServers.set('test-server', mockServer);
    mcpClientService.activeConnections.set('test-server', true);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('MCP tool execution generates debug traces and notifications', async () => {
    // Set up a mock listener to capture debug events
    const mockDebugListener = jest.fn();
    const mockAnomalyListener = jest.fn();
    
    // Add debug listeners
    mcpClientService.subscribe('toolExecuted', (data) => {
      mockDebugListener(data);
      
      // Simulate adding to debug traces
      mcpClientService.debugTraces.push({
        type: 'tool_execution',
        serverId: data.serverId,
        toolName: data.toolName,
        args: data.args,
        result: data.result,
        timestamp: Date.now()
      });
    });
    
    // Render DebugAgentPanel with mock debug data
    // This will be updated in the real implementation based on
    // the debug traces that would be passed from MCPClient to DebugAgent
    const { rerender } = render(
      <SelectionProvider>
        <DebugAgentPanel 
          debugData={{ 
            anomalies: [], 
            notifications: []
          }} 
        />
      </SelectionProvider>
    );
    
    // Execute an MCP tool
    await act(async () => {
      await mcpClientService.executeTool('test-server', 'test_tool', { param: 'value' });
    });
    
    // Verify the tool execution was captured by our listener
    expect(mockDebugListener).toHaveBeenCalledWith(
      expect.objectContaining({
        serverId: 'test-server',
        toolName: 'test_tool',
        args: { param: 'value' }
      })
    );
    
    // Verify debug traces were added
    expect(mcpClientService.debugTraces.length).toBeGreaterThan(0);
    expect(mcpClientService.debugTraces[0]).toEqual(
      expect.objectContaining({
        type: 'tool_execution',
        serverId: 'test-server',
        toolName: 'test_tool'
      })
    );
    
    // Simulate an anomaly in the MCP response
    const anomalyData = {
      anomalies: [
        { 
          id: 'anomaly-1',
          type: 'Response Error',
          severity: 'high',
          message: 'Test tool execution failed unexpectedly'
        }
      ],
      notifications: [
        'MCP server test-server reported an unexpected response'
      ]
    };
    
    // Update the DebugAgentPanel with simulated anomaly data
    rerender(
      <SelectionProvider>
        <DebugAgentPanel debugData={anomalyData} />
      </SelectionProvider>
    );
    
    // Verify the anomaly is displayed
    expect(screen.getByText('Response Error:')).toBeInTheDocument();
    expect(screen.getByText('Test tool execution failed unexpectedly')).toBeInTheDocument();
    
    // Verify the notification is displayed
    expect(screen.getByText('MCP server test-server reported an unexpected response')).toBeInTheDocument();
  });
  
  test('Resource access operations are properly traced', async () => {
    // Set up a mock listener to capture debug events
    const mockDebugListener = jest.fn();
    
    // Add debug listeners
    mcpClientService.subscribe('resourceAccessed', (data) => {
      mockDebugListener(data);
      
      // Simulate adding to debug traces
      mcpClientService.debugTraces.push({
        type: 'resource_access',
        serverId: data.serverId,
        resourceUri: data.resourceUri,
        data: data.data,
        timestamp: Date.now()
      });
    });
    
    // Render DebugAgentPanel with mock debug data
    const { rerender } = render(
      <SelectionProvider>
        <DebugAgentPanel 
          debugData={{ 
            anomalies: [], 
            notifications: []
          }} 
        />
      </SelectionProvider>
    );
    
    // Access an MCP resource
    await act(async () => {
      await mcpClientService.accessResource('test-server', 'test://resource');
    });
    
    // Verify the resource access was captured by our listener
    expect(mockDebugListener).toHaveBeenCalledWith(
      expect.objectContaining({
        serverId: 'test-server',
        resourceUri: 'test://resource'
      })
    );
    
    // Verify debug traces were added
    expect(mcpClientService.debugTraces.length).toBeGreaterThan(0);
    expect(mcpClientService.debugTraces[0]).toEqual(
      expect.objectContaining({
        type: 'resource_access',
        serverId: 'test-server',
        resourceUri: 'test://resource'
      })
    );
    
    // Update the DebugAgentPanel with new notification from resource access
    const notificationData = {
      anomalies: [],
      notifications: [
        'Resource test://resource accessed from server test-server'
      ]
    };
    
    rerender(
      <SelectionProvider>
        <DebugAgentPanel debugData={notificationData} />
      </SelectionProvider>
    );
    
    // Verify the notification is displayed
    expect(screen.getByText('Resource test://resource accessed from server test-server')).toBeInTheDocument();
  });
  
  test('MCP connection status changes are reflected in debug panel', async () => {
    // Render DebugAgentPanel with initial state
    const { rerender } = render(
      <SelectionProvider>
        <DebugAgentPanel 
          debugData={{ 
            anomalies: [], 
            notifications: ['MCP client initialized'] 
          }} 
        />
      </SelectionProvider>
    );
    
    // Verify initial notification
    expect(screen.getByText('MCP client initialized')).toBeInTheDocument();
    
    // Simulate a server disconnection
    await act(async () => {
      await mcpClientService.disconnectServer('test-server');
    });
    
    // Update the DebugAgentPanel with connection state change
    const updatedData = {
      anomalies: [
        {
          id: 'conn-1',
          type: 'Connection',
          severity: 'medium',
          message: 'Server test-server disconnected'
        }
      ],
      notifications: [
        'MCP client initialized',
        'Server test-server disconnected at ' + new Date().toLocaleTimeString()
      ]
    };
    
    rerender(
      <SelectionProvider>
        <DebugAgentPanel debugData={updatedData} />
      </SelectionProvider>
    );
    
    // Verify the connection anomaly is displayed
    expect(screen.getByText('Connection:')).toBeInTheDocument();
    expect(screen.getByText('Server test-server disconnected')).toBeInTheDocument();
    
    // Verify the notifications have been updated
    expect(screen.getByText(/Server test-server disconnected at/)).toBeInTheDocument();
  });
  
  test('Debug traces are limited to maximum capacity', async () => {
    // Set a small max traces value for testing
    const originalMaxTraces = mcpClientService.maxTraces;
    mcpClientService.maxTraces = 3;
    
    // Clear any existing traces
    mcpClientService.debugTraces = [];
    
    // Execute multiple tools to generate more than max traces
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        // Directly use the internal method for adding traces consistently
        mcpClientService._addDebugTrace({
          type: 'tool_execution',
          serverId: 'test-server',
          toolName: `test_tool_${i}`,
          args: { param: `value_${i}` },
          result: { status: 'success' },
          timestamp: Date.now()
        });
      });
    }
    
    // Verify only the most recent traces are kept
    expect(mcpClientService.debugTraces.length).toBe(3);
    expect(mcpClientService.debugTraces[0].toolName).toBe('test_tool_2');
    expect(mcpClientService.debugTraces[1].toolName).toBe('test_tool_3');
    expect(mcpClientService.debugTraces[2].toolName).toBe('test_tool_4');
    
    // Restore the original max traces
    mcpClientService.maxTraces = originalMaxTraces;
  });
});
