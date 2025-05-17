#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

console.log(`${colors.blue}=== Agent Suggestions System Setup ===${colors.reset}\n`);

// Create project directories
const createDirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    console.log(`${colors.yellow}Creating directory: ${dir}${colors.reset}`);
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Create the necessary directories
createDirIfNotExists('client');
createDirIfNotExists('client/src');
createDirIfNotExists('client/src/components');
createDirIfNotExists('client/src/components/QuickActionsBar');
createDirIfNotExists('client/src/components/QuickActionsPanel');
createDirIfNotExists('client/src/services');
createDirIfNotExists('client/public');

// Move client-package.json to client/package.json
console.log(`${colors.yellow}Setting up client package.json...${colors.reset}`);
if (fs.existsSync('client-package.json')) {
  fs.copyFileSync('client-package.json', path.join('client', 'package.json'));
  console.log(`${colors.green}✓ Moved client-package.json to client/package.json${colors.reset}`);
} else {
  console.log(`${colors.red}✗ client-package.json not found!${colors.reset}`);
}

// Install server dependencies without trying to install client dependencies
console.log(`\n${colors.green}Installing server dependencies...${colors.reset}`);
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Server dependencies installed successfully${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error installing server dependencies:${colors.reset}`, error.message);
}

console.log(`\n${colors.yellow}Skipping automatic client dependency installation.${colors.reset}`);
console.log(`${colors.yellow}Please run 'cd client && npm install' manually after setup is complete.${colors.reset}`);

console.log(`\n${colors.green}Setup complete!${colors.reset}`);
console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
console.log(`1. ${colors.blue}cd client && npm install${colors.reset} - Install client dependencies`);
console.log(`2. ${colors.blue}npm run dev:server${colors.reset} - Start the server in one terminal`);
console.log(`3. ${colors.blue}cd client && npm start${colors.reset} - Start the client in another terminal`);
