const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3003;
const wsPort = process.env.REACT_APP_WS_PORT || 8082;

// Enable CORS for all routes
app.use(cors());

// Add JSON parsing middleware
app.use(express.json());

// Sample data for agent suggestions
const sampleSuggestions = [
  {
    id: 'refactor-1',
    persona: 'Refactorer',
    icon: '🔧',
    color: '#2563eb',
    label: 'Optimize loop',
    explanation: 'Refactorer: This loop can be optimized by using map() instead of a for loop',
    filePath: 'src/components/App.jsx',
    rangeStart: { line: 25, ch: 0 },
    rangeEnd: { line: 28, ch: 1 },
    diff: {
      old: 'for (let i = 0; i < items.length; i++) {\n  const item = items[i];\n  results.push(transform(item));\n}',
      new: 'const results = items.map(item => transform(item));'
    },
    group: 'Performance',
    timestamp: new Date().toISOString()
  },
  {
    id: 'security-1',
    persona: 'Security',
    icon: '🔒',
    color: '#dc2626',
    label: 'Fix XSS vulnerability',
    explanation: 'Security: This code is vulnerable to XSS attacks. Use proper encoding.',
    filePath: 'src/components/Form.jsx',
    rangeStart: { line: 42, ch: 2 },
    rangeEnd: { line: 42, ch: 32 },
    diff: {
      old: 'element.innerHTML = userInput;',
      new: 'element.textContent = userInput;'
    },
    group: 'Security',
    timestamp: new Date().toISOString()
  },
  {
    id: 'performance-1',
    persona: 'Performance',
    icon: '⚡',
    color: '#f59e0b',
    label: 'Memoize expensive calculation',
    explanation: 'Performance: This calculation is expensive and could be memoized to improve rendering speed.',
    filePath: 'src/components/DataVisualizer.jsx',
    rangeStart: { line: 57, ch: 2 },
    rangeEnd: { line: 57, ch: 55 },
    diff: {
      old: 'const result = expensiveCalculation(props.value);',
      new: 'const result = useMemo(() => expensiveCalculation(props.value), [props.value]);'
    },
    group: 'Performance',
    timestamp: new Date().toISOString()
  }
];

// REST API routes
app.get('/api/agent-suggestions', (req, res) => {
  console.log('Agent suggestions requested');
  res.json(sampleSuggestions);
});

app.post('/api/agent-suggestions/:id/apply', (req, res) => {
  const id = req.params.id;
  console.log(`Applying suggestion: ${id}`);
  res.json({ success: true, message: `Applied suggestion ${id}` });
});

app.post('/api/agent-suggestions/:id/dismiss', (req, res) => {
  const id = req.params.id;
  console.log(`Dismissing suggestion: ${id}`);
  res.json({ success: true, message: `Dismissed suggestion ${id}` });
});

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Start the Express server
const expressServer = app.listen(port, () => {
  console.log(`API server running on port ${port}`);
  console.log(`Try these endpoints:`);
  console.log(`  - http://localhost:${port}/api/health`);
  console.log(`  - http://localhost:${port}/api/agent-suggestions`);
});

// Create WebSocket server
const wss = new WebSocket.Server({ port: wsPort });

console.log(`WebSocket server started on port ${wsPort}`);

// Store connected clients
const clients = new Set();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('Client connected to WebSocket');
  
  // Add client to our set
  clients.add(ws);
  
  // Send initial suggestions to the new client
  ws.send(JSON.stringify(sampleSuggestions));
  
  // Generate a new suggestion every 10 seconds for demonstration
  const intervalId = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      // Generate a new random suggestion
      const newSuggestion = {
        id: `suggestion-${Date.now()}`,
        persona: ['Refactorer', 'Security', 'Performance', 'Scholar'][Math.floor(Math.random() * 4)],
        icon: ['🔧', '🔒', '⚡', '📖'][Math.floor(Math.random() * 4)],
        color: ['#2563eb', '#dc2626', '#f59e0b', '#10b981'][Math.floor(Math.random() * 4)],
        label: `New suggestion ${new Date().toLocaleTimeString()}`,
        explanation: 'A new suggestion has been generated',
        filePath: 'src/App.jsx',
        rangeStart: { line: Math.floor(Math.random() * 50), ch: 0 },
        rangeEnd: { line: Math.floor(Math.random() * 50) + 5, ch: 0 },
        diff: {
          old: '// Old code',
          new: '// New improved code'
        },
        group: ['Performance', 'Security', 'Documentation', 'Refactoring'][Math.floor(Math.random() * 4)],
        timestamp: new Date().toISOString()
      };
      
      // Update our sample suggestions 
      sampleSuggestions.push(newSuggestion);
      
      // Send updated suggestions to all clients
      ws.send(JSON.stringify(sampleSuggestions));
    }
  }, 10000); // Every 10 seconds
  
  // Handle client messages
  ws.on('message', (message) => {
    console.log('Received message from client:', message);
    try {
      const data = JSON.parse(message.toString());
      console.log('Parsed data:', data);
      // Handle client messages here
    } catch (error) {
      console.error('Error parsing client message:', error);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
    clients.delete(ws);
    clearInterval(intervalId);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing servers');
  expressServer.close(() => {
    console.log('Express server closed');
  });
  wss.close(() => {
    console.log('WebSocket server closed');
  });
});

console.log('Server initialization complete');
