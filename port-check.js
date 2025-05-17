/**
 * Port availability checker for ITORI IDE
 * 
 * This script checks if the configured ports are available before starting
 * the development server. It will throw an error if the ports are in use,
 * preventing server startup errors.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '.env.development');
const env = dotenv.config({ path: envPath }).parsed || {};

// Get configured ports
const API_PORT = env.VITE_ITORI_API_PORT || 3003;
const WS_PORT = env.VITE_ITORI_WS_PORT || 8000;

/**
 * Check if a port is in use
 * @param {number} port Port to check
 * @returns {Promise<boolean>} True if port is free, false if in use
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const platform = process.platform;
    let command;
    
    if (platform === 'win32') {
      // Windows command
      command = `netstat -ano | findstr :${port} | findstr LISTENING`;
    } else {
      // Unix/Mac command
      command = `lsof -i :${port} -sTCP:LISTEN`;
    }
    
    exec(command, (error, stdout, stderr) => {
      // If there's an error or no output, the port is free
      if (error || !stdout.trim()) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * Main function to check all ports
 */
async function checkPorts() {
  console.log('Checking port availability for ITORI IDE...');
  
  // Check API port
  const apiPortFree = await isPortFree(API_PORT);
  if (!apiPortFree) {
    console.error(`❌ API Port ${API_PORT} is already in use!`);
    console.error('   Please either:');
    console.error(`   1. Stop the process using port ${API_PORT}`);
    console.error(`   2. Change VITE_ITORI_API_PORT in .env.development`);
    process.exit(1);
  }
  
  // Check WebSocket port
  const wsPortFree = await isPortFree(WS_PORT);
  if (!wsPortFree) {
    console.error(`❌ WebSocket Port ${WS_PORT} is already in use!`);
    console.error('   Please either:');
    console.error(`   1. Stop the process using port ${WS_PORT}`);
    console.error(`   2. Change VITE_ITORI_WS_PORT in .env.development`);
    process.exit(1);
  }
  
  console.log(`✅ Port ${API_PORT} (API) is available`);
  console.log(`✅ Port ${WS_PORT} (WebSocket) is available`);
  console.log('🚀 All ports are available, ready to start development server');
}

// Run the port check
checkPorts().catch(err => {
  console.error('Error checking ports:', err);
  process.exit(1);
});
