#!/usr/bin/env node

/**
 * TORI Chat Port Checker
 * 
 * This script checks if a port is already in use before starting the server.
 * It can be used as part of the deployment process to avoid EADDRINUSE errors.
 * 
 * Usage:
 *   node check-port.js [port]          # Check if port is available
 *   node check-port.js [port] --kill   # Check and offer to kill the process if port is in use
 * 
 * If no port is provided, it defaults to 3000.
 */

const net = require('net');
const { execSync } = require('child_process');
const readline = require('readline');

// Process command line arguments
const args = process.argv.slice(2);
const port = args[0] && !args[0].startsWith('--') ? parseInt(args[0], 10) : 3000;
const killFlag = args.includes('--kill');

// Create readline interface if we might need to prompt the user
const rl = killFlag ? readline.createInterface({
  input: process.stdin,
  output: process.stdout
}) : null;

console.log(`\nChecking if port ${port} is available...\n`);

// Function to find the process using a port
function findProcessUsingPort(port) {
  try {
    let cmd, pidExtractRegex;
    
    if (process.platform === 'win32') {
      cmd = `netstat -ano | findstr :${port}`;
      pidExtractRegex = /(\s+)([0-9]+)$/;
    } else {
      cmd = `lsof -i :${port} | grep LISTEN`;
      pidExtractRegex = /\s+(\d+)\s+/;
    }
    
    const output = execSync(cmd, { encoding: 'utf8' });
    const lines = output.split('\n').filter(Boolean);
    
    if (lines.length === 0) {
      return null;
    }
    
    // Extract PID from the first matching line
    const match = lines[0].match(pidExtractRegex);
    return match ? match[match.length - 1].trim() : null;
  } catch (error) {
    console.error(`Error finding process: ${error.message}`);
    return null;
  }
}

// Function to kill a process
function killProcess(pid) {
  try {
    const cmd = process.platform === 'win32'
      ? `taskkill /F /PID ${pid}`
      : `kill -9 ${pid}`;
    
    execSync(cmd, { encoding: 'utf8' });
    return true;
  } catch (error) {
    console.error(`Error killing process: ${error.message}`);
    return false;
  }
}

// Create a server to test if the port is in use
const server = net.createServer();

server.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\x1b[31mERROR: Port ${port} is already in use!\x1b[0m`);
    console.error('This could be from a previous server instance that is still running.');
    
    if (killFlag) {
      const pid = findProcessUsingPort(port);
      
      if (pid) {
        console.log(`\nFound process using port ${port}: PID ${pid}`);
        rl.question('\nDo you want to terminate this process? (y/n): ', (answer) => {
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            console.log(`Attempting to kill process ${pid}...`);
            if (killProcess(pid)) {
              console.log(`\x1b[32mProcess ${pid} has been terminated.\x1b[0m`);
              console.log(`Port ${port} should now be available. Restart your server.`);
              rl.close();
              process.exit(0);
            } else {
              console.error(`\x1b[31mFailed to terminate process ${pid}.\x1b[0m`);
              rl.close();
              process.exit(1);
            }
          } else {
            console.log('\nProcess not terminated.');
            rl.close();
            process.exit(1);
          }
        });
        return;
      } else {
        console.log('\nCould not identify the process using this port.');
      }
    }
    
    console.error('\nTo fix this:');
    console.error(`1. Find the process using port ${port}:`);
    console.error('   - Windows: netstat -ano | findstr :' + port);
    console.error('   - Mac/Linux: lsof -i :' + port);
    console.error('2. Terminate the process:');
    console.error('   - Windows: taskkill /F /PID <PID>');
    console.error('   - Mac/Linux: kill -9 <PID>');
    console.error('\nAlternatively, you can use a different port by setting the PORT environment variable:');
    console.error('   set PORT=3001 && node start-production.cjs\n');
    
    if (!killFlag) {
      process.exit(1);
    }
  } else {
    console.error(`\x1b[31mERROR checking port: ${err.message}\x1b[0m`);
    if (rl) rl.close();
    process.exit(1);
  }
});

server.once('listening', () => {
  // If we get here, the port is available
  server.close();
  console.log(`\x1b[32mPort ${port} is available.\x1b[0m`);
  if (rl) rl.close();
  process.exit(0);
});

server.listen(port);
