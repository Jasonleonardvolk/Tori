# Puppeteer Automation Guide

This guide explains how to use Puppeteer for browser automation in two ways:
1. Using the Puppeteer MCP server with Claude
2. Running Puppeteer scripts locally on your computer

## 1. Using Puppeteer MCP Server with Claude

The Puppeteer MCP server allows Claude to control a browser directly. This is useful when you want Claude to help you automate browser tasks without writing code.

### Available Tools

- **puppeteer_navigate**: Navigate to a URL
  ```
  {
    "url": "https://www.example.com"
  }
  ```

- **puppeteer_screenshot**: Take a screenshot
  ```
  {
    "name": "example_screenshot",
    "width": 1200,
    "height": 800
  }
  ```

- **puppeteer_click**: Click an element
  ```
  {
    "selector": "#button-id"
  }
  ```

- **puppeteer_fill**: Fill a form field
  ```
  {
    "selector": "input[name='search']",
    "value": "search term"
  }
  ```

- **puppeteer_evaluate**: Execute JavaScript
  ```
  {
    "script": "document.title"
  }
  ```

### Other Available Tools

- puppeteer_hover
- puppeteer_select

### Available Resources

- **console://logs**: View browser console logs

### Example Usage with Claude

You can ask Claude to perform browser tasks like:

"Navigate to Google and search for 'puppeteer automation'"

Claude will use the Puppeteer MCP server to execute this task.

## 2. Running Puppeteer Scripts Locally

For more complex or repeatable automation tasks, you can run Puppeteer scripts directly on your computer.

### Demo Script

We've created a simple demo script that shows Puppeteer's capabilities:

1. Run the demo by double-clicking `run-puppeteer-demo.bat` or running it from the command line
2. The script will:
   - Open a browser window
   - Navigate to Google
   - Take a screenshot
   - Search for "Puppeteer automation"
   - Take another screenshot of the results
   - Extract search result statistics
   - Close the browser

### Creating Your Own Scripts

You can create your own Puppeteer scripts by modifying `puppeteer-demo.js`. Here are some things you can do:

- Navigate to websites
- Fill out forms
- Click buttons
- Take screenshots
- Extract data from pages
- Automate repetitive tasks

### Basic Puppeteer Code Structure

```javascript
const puppeteer = require('puppeteer');

async function run() {
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false
  });
  
  // Create new page
  const page = await browser.newPage();
  
  // Navigate to URL
  await page.goto('https://example.com');
  
  // Interact with the page
  await page.type('#search', 'example');
  await page.click('#submit-button');
  
  // Wait for navigation
  await page.waitForSelector('#results');
  
  // Extract data
  const data = await page.evaluate(() => {
    return document.querySelector('#results').textContent;
  });
  
  console.log(data);
  
  // Close browser
  await browser.close();
}

run();
```

## Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [Puppeteer GitHub](https://github.com/puppeteer/puppeteer)
