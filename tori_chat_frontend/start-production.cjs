// Production server startup script for TORI Chat
// This script ensures proper CommonJS compatibility

const path = require('path');
const { spawn } = require('child_process');

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || 3000;

console.log(`
╔═══════════════════════════════════════╗
║    Starting TORI Chat Production      ║
║         Soliton Memory Active         ║
╚═══════════════════════════════════════╝
`);

// Start the server
const serverPath = path.join(__dirname, 'server.js');
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down TORI Chat...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
  process.exit(0);
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code}`);
  }
  process.exit(code);
});
