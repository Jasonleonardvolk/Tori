/**
 * Start Project Script
 * This script starts the ALAN IDE client and server components
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const serverPort = 3003;
const clientPort = 3000;
const rootDir = __dirname;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}========================================${colors.reset}`);
console.log(`${colors.magenta}ALAN IDE Project Starter${colors.reset}`);
console.log(`${colors.cyan}========================================${colors.reset}`);
console.log(`${colors.yellow}Starting project from: ${rootDir}${colors.reset}`);

// Check if .env file exists, create if it doesn't
const envPath = path.join(rootDir, '.env');
if (!fs.existsSync(envPath)) {
  console.log(`${colors.yellow}Creating .env file...${colors.reset}`);
  fs.writeFileSync(envPath, 'PORT=3003\nREACT_APP_WS_PORT=8082\nSKIP_PREFLIGHT_CHECK=true\n');
}

// Check if client/.env file exists, create if it doesn't
const clientEnvPath = path.join(rootDir, 'client', '.env');
if (!fs.existsSync(clientEnvPath)) {
  console.log(`${colors.yellow}Creating client/.env file...${colors.reset}`);
  fs.writeFileSync(clientEnvPath, 'SKIP_PREFLIGHT_CHECK=true\nBROWSER=none\nPORT=3000\n');
}

// Function to start a process with colored output
function startProcess(command, args, options, color, name) {
  console.log(`${color}Starting ${name}...${colors.reset}`);
  
  const proc = spawn(command, args, options);
  
  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${color}[${name}]${colors.reset} ${line}`);
      }
    });
  });
  
  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${colors.red}[${name} ERROR]${colors.reset} ${line}`);
      }
    });
  });
  
  proc.on('close', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}[${name}] Process exited with code ${code}${colors.reset}`);
    } else {
      console.log(`${color}[${name}] Process exited normally${colors.reset}`);
    }
  });
  
  return proc;
}

// Start the server
const serverProc = startProcess(
  'node',
  ['index.js'],
  { cwd: path.join(rootDir, 'server'), env: { ...process.env, PORT: serverPort } },
  colors.green,
  'Server'
);

// Start the client with a delay to ensure server is up first
setTimeout(() => {
  console.log(`${colors.yellow}Starting client with delay...${colors.reset}`);
  
  const clientProc = startProcess(
    'npx',
    ['react-scripts', 'start'],
    { cwd: path.join(rootDir, 'client'), env: { ...process.env, PORT: clientPort } },
    colors.blue,
    'Client'
  );
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(`${colors.magenta}Shutting down all processes...${colors.reset}`);
    serverProc.kill();
    clientProc.kill();
  });
  
  console.log(`${colors.magenta}Both server and client have been started!${colors.reset}`);
  console.log(`${colors.yellow}Server running at: http://localhost:${serverPort}${colors.reset}`);
  console.log(`${colors.yellow}Client running at: http://localhost:${clientPort}${colors.reset}`);
  console.log(`${colors.yellow}WebSocket running at: ws://localhost:8082${colors.reset}`);
  console.log(`${colors.magenta}Press Ctrl+C to stop all processes${colors.reset}`);
}, 2000);

// Setup browser opener
setTimeout(() => {
  console.log(`${colors.green}Opening application in browser...${colors.reset}`);
  const opener = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  spawn(opener, [`http://localhost:${clientPort}`], { shell: true });
}, 5000);
