# Using Puppeteer with ALAN IDE

This guide explains how to use Puppeteer to automate and test the ALAN IDE application.

## Prerequisites

1. The ALAN IDE application must be running:
   - Client on port 3000
   - Server on port 3003
   - WebSocket on port 8082

## Starting the Application

Before using Puppeteer, start the application using one of these methods:

### Method 1: Using the batch file
```bash
# Run this in Command Prompt or PowerShell
run-yarn-dev.bat
```

### Method 2: Using Node.js directly
```bash
# Run this in Command Prompt or PowerShell
node run-yarn-dev.js
```

### Method 3: Using Yarn directly
```bash
# Run this in the project root directory
yarn dev
```

## Waiting for Application Startup

The application typically takes 30-60 seconds to fully start. You can confirm it's running by:

1. Opening the monitor.html file in a browser
2. Checking http://localhost:3000 in a browser
3. Checking http://localhost:3003/api/agent-suggestions in a browser
4. Checking http://localhost:8088/status for the status server

## Sample Puppeteer Script

Here's a basic Puppeteer script to interact with the ALAN IDE application:

```javascript
const puppeteer = require('puppeteer');

(async () => {
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    defaultViewport: { width: 1280, height: 800 },
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Navigate to the application
  console.log('Opening application...');
  await page.goto('http://localhost:3000', {
    waitUntil: 'networkidle2',
    timeout: 60000 // Longer timeout for initial load
  });
  
  console.log('Application loaded');
  
  // Wait for specific element to confirm app is loaded
  await page.waitForSelector('.app-container', { timeout: 10000 });
  
  // Example: Click on the ALAN IDE Layout button
  console.log('Clicking on ALAN IDE Layout button');
  await page.click('button:nth-of-type(2)');
  
  // Wait for the layout to render
  await page.waitForSelector('.alan-ide-layout', { timeout: 5000 });
  console.log('ALAN IDE Layout loaded');
  
  // Example: Toggle meditation mode
  await page.click('.mode-button');
  console.log('Toggled meditation mode');
  
  // Wait and exit meditation mode
  await new Promise(r => setTimeout(r, 3000));
  await page.click('button');
  console.log('Exited meditation mode');
  
  // Take a screenshot
  await page.screenshot({ path: 'alan-ide-screenshot.png' });
  console.log('Screenshot taken');
  
  // Close browser
  await browser.close();
  console.log('Test completed');
})();
```

## Useful Selectors for Automation

Here are some useful CSS selectors for interacting with the application:

### Main App Navigation
```
// App switching
.app-switcher button:nth-of-type(1) - Semantic Commit button
.app-switcher button:nth-of-type(2) - ALAN IDE Layout button
.app-switcher button:nth-of-type(3) - Original Demo button
.app-switcher button:nth-of-type(4) - Affective Computing button
.app-switcher button:nth-of-type(5) - Navigation & Search button
```

### ALAN IDE Layout
```
.alan-ide-layout - Main layout container
.mode-button - Field Meditation toggle button
.alan-ide-canvas-container - Canvas container
.alan-ide-panel-container - Agent panel container
.alan-ide-logo - The logo in the header
```

### Concept Field Canvas
```
.concept-field-canvas-container - Canvas container
.canvas-view - The main canvas view
.concept-node - A concept node in the canvas
.edge-connection - Edge connection between nodes
.overlay-toggle-checkbox - Overlay toggle checkboxes
.canvas-tooltip - Node tooltip that appears on hover
.group-selection - Selection rectangle when selecting nodes
```

### Canvas Controls
```
.canvas-controls - Main controls container
.geometry-selector - Geometry selection dropdown
.parameter-control - Parameter slider control
.morph-controls - Morphing controls section
.execute-morph-button - Button to execute morphing
.metrics-display - Display area for metrics
```

### Field Meditation Mode
```
.field-meditation-mode - Main meditation mode container
.meditation-background - Background element
.meditation-controls - Controls for meditation mode
.exit-meditation-button - Button to exit meditation mode
.meditation-visualizer - Visualization component
```

### Agent Panel
```
.agent-panel - Main agent panel container
.agent-list - List of available agents
.agent-item - Individual agent item
.agent-item.selected - Selected agent
.agent-controls - Agent control buttons
.suggestion-list - List of agent suggestions
.suggestion-item - Individual suggestion
.suggestion-item.highlighted - Highlighted suggestion
.apply-button - Button to apply a suggestion
.dismiss-button - Button to dismiss a suggestion
```

### Semantic Commit Panel
```
.semantic-commit-panel - Main commit panel container
.panel-header - Panel header
.view-controls - View control buttons
.panel-content - Main content area
.intent-list - List of intents
.intent-item - Individual intent item
.intent-item.selected - Selected intent
.create-intent-form - Form for creating new intents
.form-group - Form input group
.form-actions - Form action buttons
```

## Automation Strategies

### Waiting for Elements
Always use `waitForSelector` to ensure elements are available before interacting with them:

```javascript
// Wait for the canvas to load
await page.waitForSelector('.canvas-view', { timeout: 5000 });

// Wait for agent suggestions to load
await page.waitForSelector('.suggestion-list .suggestion-item', { timeout: 5000 });
```

### Handling Animations
The app uses animations for transitions. Add small delays to ensure animations complete:

```javascript
// Click then wait for animation
await page.click('.mode-button');
await new Promise(r => setTimeout(r, 500)); // Short delay for animation
```

### Working with Canvas Elements
For canvas interactions, use coordinates to click on specific areas:

```javascript
// Get canvas dimensions
const canvasElement = await page.$('.canvas-view');
const boundingBox = await canvasElement.boundingBox();

// Click at specific coordinates within the canvas
await page.mouse.click(
  boundingBox.x + boundingBox.width / 2,  // Center X
  boundingBox.y + boundingBox.height / 2  // Center Y
);
```

### Handling WebSocket Updates
The application receives real-time updates via WebSocket. After actions that trigger WebSocket updates, add a delay:

```javascript
// After an action that triggers a WebSocket message
await page.click('.apply-button');
await new Promise(r => setTimeout(r, 1000)); // Wait for WebSocket update
```

### Testing Full Application Flow

Here's an example of testing a complete application flow:

```javascript
// Navigate between different views
await page.click('.app-switcher button:nth-of-type(1)'); // Semantic Commit
await page.waitForSelector('.semantic-commit-panel', { timeout: 5000 });
await page.screenshot({ path: 'semantic-commit.png' });

await page.click('.app-switcher button:nth-of-type(2)'); // ALAN IDE Layout
await page.waitForSelector('.alan-ide-layout', { timeout: 5000 });
await page.screenshot({ path: 'alan-ide-layout.png' });

// Interact with the canvas
await page.click('.overlay-toggle:nth-of-type(4) input'); // Toggle Koopman overlay
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'koopman-overlay.png' });

// Interact with agent panel
const agentPanel = await page.$('.agent-panel');
const agentBounds = await agentPanel.boundingBox();
await page.mouse.click(
  agentBounds.x + agentBounds.width / 2,
  agentBounds.y + 100
);
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'agent-interaction.png' });
```

## Complete Testing Script

Here's a comprehensive script that tests all the main components of the application:

```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

(async () => {
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  console.log('Browser launched');
  
  try {
    // Navigate to the application
    console.log('Opening application...');
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('Application loaded');
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-initial-load.png')
    });
    
    // Test 1: Semantic Commit Panel
    console.log('Testing Semantic Commit Panel...');
    await page.click('.app-switcher button:nth-of-type(1)');
    await page.waitForSelector('.semantic-commit-panel', { timeout: 5000 });
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-semantic-commit.png')
    });
    
    // Test form interaction
    await page.click('.view-controls button:nth-of-type(2)'); // Create button
    await page.waitForSelector('.create-intent-form', { timeout: 5000 });
    await page.type('.create-intent-form textarea:nth-of-type(1)', 
      'Test intent specification for automated testing');
    await page.type('.create-intent-form textarea:nth-of-type(2)', 
      'test.js, TestComponent.jsx');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-create-intent.png')
    });
    
    // Test 2: ALAN IDE Layout
    console.log('Testing ALAN IDE Layout...');
    await page.click('.app-switcher button:nth-of-type(2)');
    await page.waitForSelector('.alan-ide-layout', { timeout: 5000 });
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-alan-ide-layout.png')
    });
    
    // Test canvas interactions
    console.log('Testing canvas interactions...');
    const canvasElement = await page.$('.canvas-view');
    const boundingBox = await canvasElement.boundingBox();
    
    // Click on a node (using approximate positioning)
    await page.mouse.click(
      boundingBox.x + 150,
      boundingBox.y + 150
    );
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ 
      path: path.join(screenshotsDir, '05-node-selection.png')
    });
    
    // Toggle overlays
    console.log('Testing overlay toggles...');
    const toggles = await page.$$('.overlay-toggle input');
    for (let i = 0; i < toggles.length; i++) {
      await toggles[i].click();
      await new Promise(r => setTimeout(r, 300));
    }
    await page.screenshot({ 
      path: path.join(screenshotsDir, '06-overlays-toggled.png')
    });
    
    // Test meditation mode
    console.log('Testing meditation mode...');
    await page.click('.mode-button');
    await page.waitForSelector('.field-meditation-mode', { timeout: 5000 });
    await page.screenshot({ 
      path: path.join(screenshotsDir, '07-meditation-mode.png')
    });
    
    // Exit meditation mode
    await new Promise(r => setTimeout(r, 2000));
    await page.click('button'); // Exit button
    await page.waitForSelector('.alan-ide-layout', { timeout: 5000 });
    
    // Test 3: Original Demo
    console.log('Testing Original Demo...');
    await page.click('.app-switcher button:nth-of-type(3)');
    await page.waitForSelector('.demo-container', { timeout: 5000 });
    await page.screenshot({ 
      path: path.join(screenshotsDir, '08-original-demo.png')
    });
    
    // Test 4: Affective Computing
    console.log('Testing Affective Computing...');
    await page.click('.app-switcher button:nth-of-type(4)');
    await page.waitForSelector('.affective-integration', { timeout: 5000 });
    await page.screenshot({ 
      path: path.join(screenshotsDir, '09-affective-computing.png')
    });
    
    // Test 5: Navigation Features
    console.log('Testing Navigation Features...');
    await page.click('.app-switcher button:nth-of-type(5)');
    await page.waitForSelector('.navigation-demo', { timeout: 5000 });
    await page.screenshot({ 
      path: path.join(screenshotsDir, '10-navigation-features.png')
    });
    
    console.log('All tests completed successfully!');
    console.log(`Screenshots saved to ${screenshotsDir}`);
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'error-state.png')
    });
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
})();
```

## Puppeteer Config for Continuous Integration

If you want to use Puppeteer in a CI environment, use this configuration:

```javascript
// puppeteer-config.js
module.exports = {
  launch: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ],
    defaultViewport: {
      width: 1280,
      height: 800
    }
  },
  // How long to wait for the page to load
  navigationTimeout: 30000,
  // Default timeout for selectors
  defaultTimeout: 5000
};
```

Then use it in your scripts:

```javascript
const puppeteer = require('puppeteer');
const config = require('./puppeteer-config');

(async () => {
  const browser = await puppeteer.launch(config.launch);
  const page = await browser.newPage();
  page.setDefaultTimeout(config.defaultTimeout);
  
  await page.goto('http://localhost:3000', {
    waitUntil: 'networkidle2',
    timeout: config.navigationTimeout
  });
  
  // ... rest of test
})();
```

## Performance Testing with Puppeteer

You can also use Puppeteer to measure performance metrics:

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true
  });
  
  const page = await browser.newPage();
  
  // Enable performance metrics
  await page.setCacheEnabled(false);
  const client = await page.target().createCDPSession();
  await client.send('Performance.enable');
  
  // Navigate to the application
  console.log('Measuring performance...');
  await page.goto('http://localhost:3000', {
    waitUntil: 'networkidle2'
  });
  
  // Get metrics
  const performanceMetrics = await client.send('Performance.getMetrics');
  
  // Calculate First Contentful Paint
  const fcp = performanceMetrics.metrics.find(m => m.name === 'FirstContentfulPaint');
  const navigationStart = performanceMetrics.metrics.find(m => m.name === 'NavigationStart');
  const fcpTime = (fcp.value - navigationStart.value) / 1000;
  
  console.log(`First Contentful Paint: ${fcpTime.toFixed(2)} seconds`);
  
  // Measure time to interactive
  await page.click('.app-switcher button:nth-of-type(2)');
  const startTime = Date.now();
  await page.waitForSelector('.alan-ide-layout', { timeout: 10000 });
  const endTime = Date.now();
  const timeToInteractive = (endTime - startTime) / 1000;
  
  console.log(`Time to interactive: ${timeToInteractive.toFixed(2)} seconds`);
  
  await browser.close();
})();
```

## Troubleshooting

If you encounter issues with Puppeteer automation:

1. **Element not found**: Ensure the application is fully loaded and the element exists
   ```javascript
   // Increase timeout and use visible option
   await page.waitForSelector('.element', { 
     timeout: 10000,
     visible: true 
   });
   ```

2. **Click not working**: Try different click methods
   ```javascript
   // Method 1: Standard click
   await page.click('.element');
   
   // Method 2: Using evaluate
   await page.evaluate(() => {
     document.querySelector('.element').click();
   });
   
   // Method 3: Using mouse
   const element = await page.$('.element');
   const box = await element.boundingBox();
   await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
   ```

3. **Application not ready**: Ensure the server is running before tests
   ```javascript
   // Check if server is running before starting tests
   const checkServer = async () => {
     try {
       const response = await fetch('http://localhost:3003/api/agent-suggestions');
       return response.ok;
     } catch {
       return false;
     }
   };
   
   // Wait until server is ready
   let serverReady = false;
   while (!serverReady) {
     console.log('Waiting for server...');
     serverReady = await checkServer();
     if (!serverReady) {
       await new Promise(r => setTimeout(r, 1000));
     }
   }
   ```

4. **Screenshot debugging**: Take screenshots during test steps for debugging
   ```javascript
   // Take screenshot at each step
   const debugScreenshot = async (step) => {
     await page.screenshot({ 
       path: `debug-${step}.png`,
       fullPage: true
     });
   };
   
   // Use in your script
   await debugScreenshot('before-click');
   await page.click('.element');
   await debugScreenshot('after-click');
   ```
