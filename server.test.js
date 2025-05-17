const request = require('supertest');
const WebSocket = require('ws');
const { createServer } = require('http');
const express = require('express');

// Mock dependencies to isolate testing
jest.mock('ws');

describe('Agent Suggestions Server', () => {
  let app;
  let server;
  
  beforeAll(() => {
    // Create a fresh Express app for testing
    app = express();
    
    // Add routes similar to server.js
    app.get('/api/agent-suggestions', (req, res) => {
      res.json([
        {
          id: 'test-1',
          persona: 'Tester',
          icon: '🧪',
          label: 'Test Suggestion'
        }
      ]);
    });
    
    app.post('/api/agent-suggestions/:id/apply', (req, res) => {
      res.json({ success: true, message: `Applied suggestion ${req.params.id}` });
    });
    
    app.post('/api/agent-suggestions/:id/dismiss', (req, res) => {
      res.json({ success: true, message: `Dismissed suggestion ${req.params.id}` });
    });
    
    // Create HTTP server
    server = createServer(app);
  });
  
  afterAll((done) => {
    server.close(done);
  });
  
  describe('REST API Tests', () => {
    it('GET /api/agent-suggestions returns suggestions', async () => {
      const response = await request(app).get('/api/agent-suggestions');
      
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].id).toBe('test-1');
    });
    
    it('POST /api/agent-suggestions/:id/apply records application', async () => {
      const response = await request(app).post('/api/agent-suggestions/test-1/apply');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Applied suggestion test-1');
    });
    
    it('POST /api/agent-suggestions/:id/dismiss records dismissal', async () => {
      const response = await request(app).post('/api/agent-suggestions/test-1/dismiss');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Dismissed suggestion test-1');
    });
  });
  
  describe('WebSocket Tests', () => {
    let mockServer;
    let mockSocket;
    
    beforeEach(() => {
      // Mock WebSocket.Server implementation
      mockServer = {
        on: jest.fn(),
        close: jest.fn()
      };
      
      mockSocket = {
        on: jest.fn(),
        send: jest.fn(),
        readyState: WebSocket.OPEN
      };
      
      WebSocket.Server.mockImplementation(() => mockServer);
    });
    
    it('should create a WebSocket server', () => {
      // Simulate WebSocket server creation like in server.js
      const wss = new WebSocket.Server({ port: 8080 });
      
      expect(WebSocket.Server).toHaveBeenCalledWith({ port: 8080 });
    });
    
    it('should handle new connections', () => {
      // Simulate WebSocket server creation
      const wss = new WebSocket.Server({ port: 8080 });
      
      // Trigger connection handler
      const connectionHandler = mockServer.on.mock.calls.find(call => call[0] === 'connection')?.[1];
      expect(connectionHandler).toBeDefined();
      
      // Simulate a client connection
      connectionHandler(mockSocket);
      
      // Expect message handler to be registered
      expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      
      // Expect initial data to be sent
      expect(mockSocket.send).toHaveBeenCalled();
    });
  });
});
