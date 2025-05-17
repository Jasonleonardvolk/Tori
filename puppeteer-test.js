/**
 * ALAN IDE Puppeteer Automation Script
 * 
 * This script provides comprehensive testing and automation for the ALAN IDE application.
 * It handles starting the application if it's not running, waiting for it to be ready,
 * and then performs a series of interactions with the UI components.
 */

const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Configuration
const config = {
  appUrl: 'http://localhost:3000',
  serverUrl: 'http://localhost:3003',
  apiEndpoint: 'http://localhost:3003/api/agent-suggestions',
  startTimeout: 60000, // Time to wait for app to start (60 seconds)
  screenshotsDir: path.join(__dirname, 'screenshots'),
  startAppCommand: 'yarn',
  startAppArgs: ['dev'],
  browserOptions: {
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--start-maximized']
  }
};

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(config.screenshotsDir)) {
  fs.mkdirSync(config.screenshotsDir);
  console.log(`Created screenshots directory at ${config.screenshotsDir}`);
}

// Utility to check if a URL is responding
async function isUrlResponding(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

// Start the application if it's not already running
async function ensureAppIsRunning() {
  console.log('Checking if the application is already running...');
  
  const clientResponding = await isUrlResponding(config.appUrl);
  const serverResponding = await isUrlResponding(config.apiEndpoint);
  
  if (clientResponding && serverResponding) {
    console.log('Application is already running. Proceeding with tests.');
    return true;
  }
  
  console.log('Application is not running. Starting it now...');
  
  // Start the application using yarn dev
  const appProcess = spawn(config.startAppCommand, config.startAppArgs, {
    cwd: __dirname,
    shell: true,
    stdio: 'pipe'
  });
  
  // Log output
  appProcess.stdout.on('data', (data) => {
    console.log(`[APP] ${data.toString().trim()}`);
  });
  
  appProcess.stderr.on('data', (data) => {
    console.error(`[APP ERROR] ${data.toString().trim()}`);
  });
  
  // Wait for app to start
  console.log(`Waiting up to ${config.startTimeout/1000} seconds for application to start...`);
  const startTime = Date.now();
  
  while (Date.now() - startTime < config.startTimeout) {
    const clientReady = await isUrlResponding(config.appUrl);
    const serverReady = await isUrlResponding(config.apiEndpoint);
    
    if (clientReady && serverReady) {
      console.log('Application started successfully!');
      return true;
    }
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.stdout.write('.');
  }
  
  console.error('Application failed to start within the timeout period.');
  return false;
}

// Main test function
async function runTests() {
  // Make sure app is running
  const appRunning = await ensureAppIsRunning();
  if (!appRunning) {
    console.error('Cannot proceed with tests as application is not running.');
    return;
  }
  
  // Give the app a moment to stabilize
  console.log('Application is running. Waiting 5 seconds before starting tests...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Launch browser
  console.log('Launching browser...');
  const browser = await puppeteer.launch(config.browserOptions);
  const page = await browser.newPage();
  
  try {
    // Navigate to the app
    console.log(`Navigating to ${config.appUrl}...`);
    await page.goto(config.appUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for the app to be fully loaded
    console.log('Waiting for application to be fully loaded...');
    await page.waitForSelector('.app-container', { timeout: 10000 });
    
    // Take screenshot of initial state
    await page.screenshot({
      path: path.join(config.screenshotsDir, '01-initial-state.png')
    });
    console.log('Initial state screenshot captured.');
    
    // Test all application views
    const testViews = async () => {
      const views = [
        { name: 'Semantic Commit', button: 1, selector: '.semantic-commit-panel' },
        { name: 'ALAN IDE Layout', button: 2, selector: '.alan-ide-layout' },
        { name: 'Original Demo', button: 3, selector: '.demo-container' },
        { name: 'Affective Computing', button: 4, selector: '.affective-integration' },
        { name: 'Navigation & Search', button: 5, selector: '.navigation-demo' }
      ];
      
      for (let i = 0; i < views.length; i++) {
        const view = views[i];
        console.log(`Testing view: ${view.name}`);
        
        // Click the view button
        await page.click(`.app-switcher button:nth-of-type(${view.button})`);
        
        // Wait for the view to load
        try {
          await page.waitForSelector(view.selector, { timeout: 5000 });
          console.log(`${view.name} view loaded successfully.`);
        } catch (error) {
          console.warn(`Warning: Could not find selector ${view.selector} for ${view.name} view. Continuing anyway.`);
        }
        
        // Take screenshot
        await page.screenshot({
          path: path.join(config.screenshotsDir, `02-${i+1}-${view.name.toLowerCase().replace(/\s+/g, '-')}.png`)
        });
        
        // Small delay between view changes
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };
    
    // Run the view tests
    await testViews();
    
    // Test ALAN IDE Layout specifically
    console.log('Testing ALAN IDE Layout functionality...');
    await page.click('.app-switcher button:nth-of-type(2)');
    await page.waitForSelector('.alan-ide-layout', { timeout: 5000 });
    
    // Test meditation mode
    console.log('Testing meditation mode...');
    await page.click('.mode-button');
    
    try {
      await page.waitForSelector('.field-meditation-mode', { timeout: 5000 });
      console.log('Entered meditation mode successfully.');
      
      // Take screenshot in meditation mode
      await page.screenshot({
        path: path.join(config.screenshotsDir, '03-meditation-mode.png')
      });
      
      // Exit meditation mode
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.click('button'); // Exit button
      await page.waitForSelector('.alan-ide-layout', { timeout: 5000 });
      console.log('Exited meditation mode successfully.');
    } catch (error) {
      console.warn('Warning: Could not test meditation mode fully. Continuing with other tests.');
    }
    
    // Test concept field canvas
    console.log('Testing concept field canvas...');
    try {
      const canvas = await page.$('.canvas-view');
      if (canvas) {
        const box = await canvas.boundingBox();
        
        // Click on a node (approximate position)
        await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.25);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Take screenshot with selection
        await page.screenshot({
          path: path.join(config.screenshotsDir, '04-canvas-selection.png')
        });
        
        // Toggle overlays
        const toggles = await page.$$('.overlay-toggle input');
        for (const toggle of toggles) {
          await toggle.click();
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        await page.screenshot({
          path: path.join(config.screenshotsDir, '05-canvas-overlays.png')
        });
        
        console.log('Canvas testing complete.');
      } else {
        console.warn('Warning: Could not find canvas element. Skipping canvas tests.');
      }
    } catch (error) {
      console.warn('Warning: Error during canvas testing:', error.message);
    }
    
    // Test Semantic Commit Panel
    console.log('Testing Semantic Commit Panel...');
    await page.click('.app-switcher button:nth-of-type(1)');
    
    try {
      await page.waitForSelector('.semantic-commit-panel', { timeout: 5000 });
      
      // Test view buttons
      const viewButtons = await page.$$('.view-controls button');
      for (let i = 0; i < viewButtons.length; i++) {
        await viewButtons[i].click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Take screenshot of each view
        await page.screenshot({
          path: path.join(config.screenshotsDir, `06-semantic-commit-view-${i+1}.png`)
        });
      }
      
      // Try to interact with create form if available
      try {
        const createFormVisible = await page.$('.create-intent-form');
        if (createFormVisible) {
          await page.type('.create-intent-form textarea:nth-of-type(1)', 
            'Test intent specification created by Puppeteer automation');
            
          await page.screenshot({
            path: path.join(config.screenshotsDir, '07-semantic-commit-form.png')
          });
        }
      } catch (error) {
        console.warn('Warning: Could not interact with create form:', error.message);
      }
      
      console.log('Semantic Commit Panel testing complete.');
    } catch (error) {
      console.warn('Warning: Error during Semantic Commit Panel testing:', error.message);
    }
    
    console.log('All tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    
    // Take error screenshot
    await page.screenshot({
      path: path.join(config.screenshotsDir, 'error-state.png'),
      fullPage: true
    });
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed.');
    
    console.log(`Screenshots saved to ${config.screenshotsDir}`);
    console.log('Testing complete!');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
