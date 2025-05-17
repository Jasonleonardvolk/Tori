/**
 * Simple Puppeteer Demo Script
 * This demonstrates basic browser automation with Puppeteer
 */

const puppeteer = require('puppeteer');

async function runDemo() {
  console.log('Starting Puppeteer demo...');
  
  // Launch a browser
  const browser = await puppeteer.launch({
    headless: false, // Show the browser window
    defaultViewport: { width: 1200, height: 800 }
  });
  
  console.log('Browser launched successfully');
  
  // Create a new page
  const page = await browser.newPage();
  
  // Navigate to a website
  console.log('Navigating to Google...');
  await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
  
  // Take a screenshot
  console.log('Taking a screenshot...');
  await page.screenshot({ path: 'google-homepage.png' });
  
  // Get the page title
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  // Type something in the search box
  console.log('Typing in search box...');
  // Make sure the element exists before trying to type in it
  await page.waitForSelector('textarea[name="q"]', { timeout: 5000 });
  await page.type('textarea[name="q"]', 'Puppeteer automation');
  
  // Wait a bit to see the typing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Press Enter to search
  console.log('Performing search...');
  await page.keyboard.press('Enter');
  
  // Wait for results page to load
  await page.waitForSelector('#search');
  
  // Take a screenshot of the results
  console.log('Taking screenshot of search results...');
  await page.screenshot({ path: 'search-results.png' });
  
  // Extract some data from the page
  const resultsStats = await page.evaluate(() => {
    const element = document.querySelector('#result-stats');
    return element ? element.textContent : 'No stats found';
  });
  
  console.log(`Search results: ${resultsStats}`);
  
  // Wait a moment before closing
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Close the browser
  console.log('Closing browser...');
  await browser.close();
  
  console.log('Demo completed! Screenshots saved to:');
  console.log('- google-homepage.png');
  console.log('- search-results.png');
}

// Run the demo
runDemo().catch(error => {
  console.error('Error running demo:', error);
});
