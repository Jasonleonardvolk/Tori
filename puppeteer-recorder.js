/**
 * ALAN IDE Puppeteer Interaction Recorder
 * 
 * This script provides a way to record your interactions with the ALAN IDE
 * application and generates a Puppeteer script that can replay those interactions.
 * 
 * It opens the application in a browser controlled by Puppeteer and records
 * clicks, typing, and navigation, then generates a script to replay these actions.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const config = {
  appUrl: 'http://localhost:3000',
  outputScriptPath: path.join(__dirname, 'recorded-script.js'),
  screenshotsDir: path.join(__dirname, 'recorded-screenshots'),
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

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Recorded actions
let recordedActions = [];
let screenshotCounter = 1;

// Helper function to ask questions
function askQuestion(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// Main function
async function recordInteractions() {
  console.log('======================================');
  console.log('  ALAN IDE Puppeteer Interaction Recorder');
  console.log('======================================');
  console.log('\nThis tool will record your interactions with the ALAN IDE application');
  console.log('and generate a Puppeteer script that can replay those interactions.\n');
  
  const sessionName = await askQuestion('Enter a name for this recording session: ');
  
  console.log('\nStarting recording session...');
  console.log('A browser window will open and your interactions will be recorded.');
  console.log('Press Ctrl+C in this console window to stop recording.\n');
  
  // Add initial script boilerplate
  recordedActions.push(
    '/**',
    ` * ALAN IDE Puppeteer Script - ${sessionName}`,
    ' * ',
    ` * Generated on ${new Date().toLocaleString()}`,
    ' * This script replays recorded interactions with the ALAN IDE application',
    ' */',
    '',
    'const puppeteer = require(\'puppeteer\');',
    'const path = require(\'path\');',
    'const fs = require(\'fs\');',
    '',
    '// Create screenshots directory if it doesn\'t exist',
    'const screenshotsDir = path.join(__dirname, \'replay-screenshots\');',
    'if (!fs.existsSync(screenshotsDir)) {',
    '  fs.mkdirSync(screenshotsDir);',
    '}',
    '',
    '// Main function',
    'async function replayInteractions() {',
    '  const browser = await puppeteer.launch({',
    '    headless: false,',
    '    defaultViewport: { width: 1280, height: 800 },',
    '    args: [\'--start-maximized\']',
    '  });',
    '  ',
    '  const page = await browser.newPage();',
    '  let screenshotCounter = 1;',
    '  ',
    '  try {',
    `    // Navigate to the application`,
    `    console.log('Navigating to ${config.appUrl}...');`,
    `    await page.goto('${config.appUrl}', {`,
    '      waitUntil: \'networkidle2\',',
    '      timeout: 30000',
    '    });',
    '    ',
    '    // Wait for the application to be ready',
    '    await page.waitForSelector(\'.app-container\', { timeout: 10000 });',
    '    console.log(\'Application loaded.\');',
    '    ',
    '    // Take initial screenshot',
    '    await page.screenshot({',
    '      path: path.join(screenshotsDir, `${String(screenshotCounter++).padStart(2, \'0\')}-initial.png`)',
    '    });',
    ''
  );
  
  // Launch browser
  const browser = await puppeteer.launch(config.browserOptions);
  const page = await browser.newPage();
  
  // Setup event listeners
  await page.exposeFunction('saveAction', (action, selector, value) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Recorded: ${action} ${selector || ''} ${value || ''}`);
    
    let code = '';
    
    switch (action) {
      case 'click':
        code = `    // Click on element: ${selector}\n    await page.click('${selector}');\n    await new Promise(r => setTimeout(r, 500));`;
        break;
      case 'type':
        code = `    // Type text: "${value}"\n    await page.type('${selector}', '${value.replace(/'/g, "\\'")}');\n    await new Promise(r => setTimeout(r, 200));`;
        break;
      case 'navigation':
        code = `    // Navigation: ${value}\n    await page.goto('${value}', { waitUntil: 'networkidle2' });\n    await new Promise(r => setTimeout(r, 1000));`;
        break;
      case 'screenshot':
        code = `    // Take screenshot\n    await page.screenshot({\n      path: path.join(screenshotsDir, \`\${String(screenshotCounter++).padStart(2, '0')}-${value}.png\`)\n    });\n`;
        break;
    }
    
    recordedActions.push(code);
  });
  
  // Add custom commands to page
  await page.evaluateOnNewDocument(() => {
    // Override click events
    const originalClick = HTMLElement.prototype.click;
    HTMLElement.prototype.click = function() {
      const selector = getSelector(this);
      if (selector) {
        window.saveAction('click', selector);
      }
      return originalClick.apply(this, arguments);
    };
    
    // Track user clicks
    document.addEventListener('click', function(e) {
      const selector = getSelector(e.target);
      if (selector) {
        window.saveAction('click', selector);
      }
    }, true);
    
    // Track input events
    document.addEventListener('input', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const selector = getSelector(e.target);
        if (selector) {
          window.saveAction('type', selector, e.target.value);
        }
      }
    }, true);
    
    // Track navigation events
    const originalPushState = history.pushState;
    history.pushState = function() {
      window.saveAction('navigation', '', window.location.href);
      return originalPushState.apply(this, arguments);
    };
    
    // Helper to generate CSS selector
    function getSelector(element) {
      if (!element || !element.tagName) return null;
      
      // Try to get ID
      if (element.id) {
        return `#${element.id}`;
      }
      
      // Try to get a unique class
      if (element.className) {
        const classes = element.className.trim().split(/\s+/);
        for (const cls of classes) {
          if (cls && document.querySelectorAll(`.${cls}`).length === 1) {
            return `.${cls}`;
          }
        }
      }
      
      // Try tag with position
      const tag = element.tagName.toLowerCase();
      const elements = document.querySelectorAll(tag);
      if (elements.length === 1) {
        return tag;
      }
      
      // Find tag position
      const index = Array.from(elements).indexOf(element) + 1;
      if (index > 0) {
        return `${tag}:nth-of-type(${index})`;
      }
      
      // Fallback to XPath
      let xpath = '';
      let currentElement = element;
      
      while (currentElement && currentElement.nodeType === 1) {
        let currentTag = currentElement.tagName.toLowerCase();
        const siblings = Array.from(currentElement.parentNode.children).filter(c => c.tagName === currentElement.tagName);
        
        if (siblings.length > 1) {
          const index = siblings.indexOf(currentElement) + 1;
          currentTag += `:nth-of-type(${index})`;
        }
        
        xpath = currentTag + (xpath ? ' > ' + xpath : '');
        currentElement = currentElement.parentNode;
        
        if (currentElement === document.body) {
          xpath = 'body > ' + xpath;
          break;
        }
      }
      
      return xpath;
    }
  });
  
  // Add keyboard shortcut for screenshots
  await page.keyboard.down('Control');
  await page.keyboard.down('Alt');
  await page.keyboard.press('X');
  await page.keyboard.up('Alt');
  await page.keyboard.up('Control');
  
  console.log('\nSpecial commands:');
  console.log('  Ctrl+Alt+X: Take a screenshot');
  console.log('  Ctrl+C in console: Stop recording\n');
  
  // Navigate to app
  await page.goto(config.appUrl, {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  
  // Take initial screenshot
  const screenshotPath = path.join(config.screenshotsDir, `${String(screenshotCounter++).padStart(2, '0')}-initial.png`);
  await page.screenshot({ path: screenshotPath });
  recordedActions.push(`    // Take initial screenshot\n    await page.screenshot({\n      path: path.join(screenshotsDir, \`\${String(screenshotCounter++).padStart(2, '0')}-initial.png\`)\n    });\n`);
  
  // Setup keyboard screenshot shortcut
  await page.keyboard.down('Control');
  await page.keyboard.down('Alt');
  
  page.on('keydown', async (e) => {
    if (e.key === 'x' && e.ctrlKey && e.altKey) {
      const name = await askQuestion('Enter a name for this screenshot: ');
      const screenshotPath = path.join(config.screenshotsDir, `${String(screenshotCounter++).padStart(2, '0')}-${name}.png`);
      await page.screenshot({ path: screenshotPath });
      await saveAction('screenshot', '', name);
      console.log(`Screenshot saved: ${screenshotPath}`);
    }
  });
  
  // Wait for user to finish
  await new Promise(resolve => {
    process.on('SIGINT', async () => {
      console.log('\nRecording stopped. Generating script...');
      
      // Add closing code to script
      recordedActions.push(
        '    console.log(\'Replay completed successfully.\');',
        '  } catch (error) {',
        '    console.error(\'Error during replay:\', error);',
        '    ',
        '    // Take error screenshot',
        '    await page.screenshot({',
        '      path: path.join(screenshotsDir, \'error-state.png\')',
        '    });',
        '  } finally {',
        '    // Close browser',
        '    await browser.close();',
        '    console.log(\'Browser closed.\');',
        '  }',
        '}',
        '',
        '// Run the replay',
        'replayInteractions().catch(error => {',
        '  console.error(\'Fatal error:\', error);',
        '  process.exit(1);',
        '});'
      );
      
      // Write script to file
      fs.writeFileSync(config.outputScriptPath, recordedActions.join('\n'));
      console.log(`\nScript generated: ${config.outputScriptPath}`);
      console.log(`Screenshots saved: ${config.screenshotsDir}`);
      
      // Clean up
      await browser.close();
      rl.close();
      resolve();
    });
  });
}

// Run the recorder
recordInteractions().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
