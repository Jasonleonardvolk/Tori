/**
 * ALAN IDE Puppeteer Viewer
 * 
 * This script automates viewing and interacting with the ALAN IDE application using Puppeteer.
 * It handles starting the necessary services if they're not already running, and provides
 * a convenient way to take screenshots and test the application.
 */

const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Configuration
const config = {
  screenshotsDir: path.join(__dirname, 'puppeteer-screenshots'),
  serverPort: 3003,
  clientPort: 3000,
  waitTimeout: 60000,
  startupDelay: 5000,
  browserOptions: {
    headless: false,
    defaultViewport: { width: 1600, height: 900 },
    args: ['--start-maximized']
  }
};

// Create screenshots directory
if (!fs.existsSync(config.screenshotsDir)) {
  fs.mkdirSync(config.screenshotsDir);
}

// Check if a service is running
async function isServiceRunning(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, () => {
      resolve(true);
    }).on('error', () => {
      resolve(false);
    });
    req.setTimeout(1000, () => {
      req.abort();
      resolve(false);
    });
  });
}

// Start a service if it's not already running
async function ensureServiceRunning(serviceName, port, startCommand) {
  console.log(`Checking if ${serviceName} is running on port ${port}...`);
  
  if (await isServiceRunning(port)) {
    console.log(`${serviceName} is already running.`);
    return true;
  }
  
  console.log(`Starting ${serviceName}...`);
  
  const [command, ...args] = startCommand.split(' ');
  const proc = spawn(command, args, {
    cwd: __dirname,
    shell: true,
    stdio: 'pipe'
  });
  
  proc.stdout.on('data', (data) => {
    console.log(`[${serviceName}] ${data.toString().trim()}`);
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`[${serviceName} ERROR] ${data.toString().trim()}`);
  });
  
  // Wait for service to start
  let attempts = 20; // 20 seconds max wait time
  while (attempts > 0) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (await isServiceRunning(port)) {
      console.log(`${serviceName} successfully started!`);
      return true;
    }
    attempts--;
  }
  
  console.error(`Failed to start ${serviceName} within timeout period.`);
  return false;
}

// Take screenshots of different components
async function captureScreenshots(page) {
  console.log('Taking screenshots of application components...');
  
  // Create a timestamped folder for this run
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const runDir = path.join(config.screenshotsDir, timestamp);
  fs.mkdirSync(runDir, { recursive: true });
  
  // Screenshot initial state
  await page.screenshot({ path: path.join(runDir, '01-initial-state.png'), fullPage: true });
  console.log('Captured initial state');
  
  // Screenshot each app view
  const views = [
    { name: 'semantic-commit', button: 1, title: 'Semantic Commit Panel' },
    { name: 'alan-ide', button: 2, title: 'ALAN IDE Layout' },
    { name: 'original-demo', button: 3, title: 'Original Demo' },
    { name: 'affective', button: 4, title: 'Affective Computing' },
    { name: 'navigation', button: 5, title: 'Navigation Demo' }
  ];
  
  for (const [index, view] of views.entries()) {
    try {
      console.log(`Switching to ${view.title} view...`);
      await page.click(`.app-switcher button:nth-of-type(${view.button})`);
      await page.waitForTimeout(1000); // Wait for view to render
      await page.screenshot({ 
        path: path.join(runDir, `0${index + 2}-${view.name}.png`), 
        fullPage: true 
      });
      console.log(`Captured ${view.title} view`);
    } catch (error) {
      console.error(`Error capturing ${view.title} view:`, error.message);
    }
  }
  
  // Additional screenshots for specific components
  try {
    // Switch to the Semantic Commit view
    await page.click(`.app-switcher button:nth-of-type(1)`);
    await page.waitForTimeout(1000);
    
    // Try to capture the create form
    console.log('Switching to create intent form...');
    await page.click('.view-controls button:nth-of-type(2)'); // Create button
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: path.join(runDir, '07-create-intent-form.png'), 
      fullPage: true 
    });
    console.log('Captured create intent form');
    
    // Try to capture the conflicts view
    console.log('Switching to conflicts view...');
    await page.click('.view-controls button:nth-of-type(3)'); // Conflicts button
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: path.join(runDir, '08-conflicts-view.png'), 
      fullPage: true 
    });
    console.log('Captured conflicts view');
    
    // Switch to ALAN IDE Layout
    await page.click(`.app-switcher button:nth-of-type(2)`);
    await page.waitForTimeout(1000);
    
    // Try to capture the meditation mode
    console.log('Activating meditation mode...');
    try {
      await page.click('.mode-button');
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: path.join(runDir, '09-meditation-mode.png'), 
        fullPage: true 
      });
      console.log('Captured meditation mode');
      
      // Exit meditation mode
      await page.click('button'); // Exit button
      await page.waitForTimeout(1000);
    } catch (error) {
      console.error('Error capturing meditation mode:', error.message);
    }
  } catch (error) {
    console.error('Error during additional screenshots:', error.message);
  }
  
  console.log(`All screenshots saved to: ${runDir}`);
}

// Main function
async function viewWithPuppeteer() {
  console.log('ALAN IDE Puppeteer Viewer');
  console.log('=========================');
  
  // Ensure server is running
  const serverRunning = await ensureServiceRunning(
    'Server', 
    config.serverPort, 
    'cd server && node dev-server.js'
  );
  
  if (!serverRunning) {
    console.error('Cannot proceed without the server running.');
    return;
  }
  
  // Ensure client is running
  const clientRunning = await ensureServiceRunning(
    'Client', 
    config.clientPort, 
    'cd client && set NODE_OPTIONS=--openssl-legacy-provider && npx react-scripts start'
  );
  
  if (!clientRunning) {
    console.error('Cannot proceed without the client running.');
    return;
  }
  
  console.log('Both client and server are running.');
  console.log(`Waiting ${config.startupDelay / 1000} seconds for services to fully initialize...`);
  await new Promise(resolve => setTimeout(resolve, config.startupDelay));
  
  // Launch browser
  console.log('Launching browser...');
  const browser = await puppeteer.launch(config.browserOptions);
  const page = await browser.newPage();
  
  try {
    // Navigate to application
    console.log('Navigating to application...');
    await page.goto(`http://localhost:${config.clientPort}`, {
      waitUntil: 'networkidle2',
      timeout: config.waitTimeout
    });
    
    console.log('Application loaded successfully.');
    
    // Take application screenshots
    await captureScreenshots(page);
    
    // Keep browser open for manual interaction
    console.log('\nBrowser window is open for manual testing.');
    console.log('Press Ctrl+C in this console to close the browser.');
    
    // Wait for user to manually close
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\nClosing browser...');
        resolve();
      });
    });
  } catch (error) {
    console.error('Error during Puppeteer automation:', error);
    
    // Take error screenshot
    await page.screenshot({ 
      path: path.join(config.screenshotsDir, 'error-state.png'),
      fullPage: true
    });
  } finally {
    // Close browser
    await browser.close();
    console.log('Browser closed.');
  }
}

// Check for Puppeteer installation
try {
  require.resolve('puppeteer');
  viewWithPuppeteer().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('Puppeteer is not installed. Please run: npm install puppeteer');
  console.log('After installing puppeteer, run this script again.');
}
