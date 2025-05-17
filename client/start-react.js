/**
 * Custom React development server starter
 * This script sets the proper paths for react-scripts to find the public directory
 */

const { spawn } = require('child_process');
const path = require('path');

// Define the path to the client's public directory
process.env.PUBLIC_URL = path.resolve(__dirname, 'public');

console.log('Starting React development server...');
console.log('Public directory:', process.env.PUBLIC_URL);

// Launch react-scripts start with the proper working directory
const reactProcess = spawn(
  'npx', 
  ['react-scripts', 'start'], 
  { 
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      BROWSER: 'none' // Don't open browser automatically
    }
  }
);

reactProcess.on('error', (error) => {
  console.error('Failed to start React development server:', error);
});

// Handle clean exit
process.on('SIGINT', () => {
  console.log('Shutting down React development server...');
  reactProcess.kill();
  process.exit(0);
});
