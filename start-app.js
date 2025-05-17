/**
 * Start both the backend server and React development server
 * This script runs both servers concurrently
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('\n=== Starting ALAN IDE Application ===\n');

// Start the backend Express server
console.log('Starting backend server on port 3000...');
const backendProcess = spawn(
  'node', 
  ['server.js'], 
  { 
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  }
);

backendProcess.on('error', (error) => {
  console.error('Failed to start backend server:', error);
});

// Wait a short moment to let backend initialize
setTimeout(() => {
  // Start the React development server
  console.log('\nStarting frontend React app (this may take a moment)...');
  const reactProcess = spawn(
    'node', 
    ['start-react.js'], 
    { 
      cwd: path.join(__dirname, 'client'),
      stdio: 'inherit',
      shell: true
    }
  );

  reactProcess.on('error', (error) => {
    console.error('Failed to start React development server:', error);
  });

  // Handle clean exit
  process.on('SIGINT', () => {
    console.log('\nShutting down all servers...');
    reactProcess.kill();
    backendProcess.kill();
    process.exit(0);
  });
}, 2000);

console.log('\nWhen started:');
console.log('- Backend API will be available at: http://localhost:3000/api/agent-suggestions');
console.log('- Frontend app will be available at: http://localhost:3001\n');
