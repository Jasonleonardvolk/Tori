/**
 * Custom React starter script for ALAN IDE
 * 
 * This script configures and starts the React development server
 * with the correct paths and environment variables.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if .env file exists, create it if not
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file with needed configurations...');
  fs.writeFileSync(envPath, 'SKIP_PREFLIGHT_CHECK=true\nPORT=3001\n');
} else {
  console.log('.env file exists, ensuring it has required settings...');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  if (!envContent.includes('SKIP_PREFLIGHT_CHECK=true')) {
    envContent += '\nSKIP_PREFLIGHT_CHECK=true';
  }
  
  if (!envContent.includes('PORT=3001')) {
    envContent += '\nPORT=3001';
  }
  
  fs.writeFileSync(envPath, envContent);
}

// Set up public directory path
const publicDir = path.join(__dirname, 'public');
console.log('Public directory:', publicDir);

// Spawn react-scripts start with proper environment
const env = Object.assign({}, process.env, {
  PUBLIC_URL: './public',
  SKIP_PREFLIGHT_CHECK: 'true',
  PORT: '3001'
});

console.log('Starting React development server...');
const reactProcess = spawn('npx', ['react-scripts', 'start'], {
  env,
  stdio: 'inherit',
  shell: true
});

reactProcess.on('error', (err) => {
  console.error('Failed to start React development server:', err);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping React development server...');
  reactProcess.kill('SIGINT');
  process.exit();
});
