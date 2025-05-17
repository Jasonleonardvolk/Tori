/**
 * Website Analyzer with Puppeteer
 * This script analyzes a website and generates a report about its structure, performance, and SEO
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function analyzeWebsite(url) {
  console.log(`Starting website analysis for: ${url}`);
  
  // Launch a browser
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1366, height: 768 }
  });
  
  console.log('Browser launched successfully');
  
  // Create a new page
  const page = await browser.newPage();
  
  // Enable measurement of performance metrics
  await page.setRequestInterception(true);
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      resourceType: request.resourceType(),
      method: request.method(),
      time: Date.now()
    });
    request.continue();
  });
  
  // Configure performance metrics
  await page.setCacheEnabled(false);
  
  // Navigate to the URL
  console.log(`Navigating to ${url}...`);
  const response = await page.goto(url, { 
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  
  // Take a full-page screenshot
  console.log('Taking screenshot...');
  await page.screenshot({ 
    path: 'site-analysis.png',
    fullPage: true 
  });
  
  // Collect basic page information
  const title = await page.title();
  const status = response.status();
  const contentType = response.headers()['content-type'];
  
  // Extract meta tags
  const metaTags = await page.evaluate(() => {
    const tags = {};
    document.querySelectorAll('meta').forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      if (name) {
        tags[name] = meta.getAttribute('content');
      }
    });
    return tags;
  });
  
  // Extract links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.innerText.trim().substring(0, 50),
      href: a.getAttribute('href'),
      rel: a.getAttribute('rel')
    }));
  });
  
  // Check for SEO indicators
  const seoAnalysis = await page.evaluate(() => {
    const h1Count = document.querySelectorAll('h1').length;
    const h1Text = document.querySelector('h1') ? document.querySelector('h1').innerText : '';
    const imgAltTags = Array.from(document.querySelectorAll('img')).filter(img => !img.getAttribute('alt')).length;
    const totalImages = document.querySelectorAll('img').length;
    
    return {
      h1Count,
      h1Text,
      imgAltTags: `${totalImages - imgAltTags}/${totalImages} images have alt tags`,
      hasCanonical: !!document.querySelector('link[rel="canonical"]'),
      hasStructuredData: !!document.querySelector('script[type="application/ld+json"]')
    };
  });
  
  // Analyze accessibility
  const accessibilityAnalysis = await page.evaluate(() => {
    const hasAriaLabels = document.querySelectorAll('[aria-label]').length > 0;
    const hasRoles = document.querySelectorAll('[role]').length > 0;
    const formLabels = document.querySelectorAll('form label').length;
    const formInputs = document.querySelectorAll('form input').length;
    
    return {
      hasAriaLabels,
      hasRoles,
      formInputRatio: `${formLabels}/${formInputs} form inputs have labels`
    };
  });
  
  // Calculate performance metrics
  const totalRequestSize = requests.reduce((total, req) => {
    if (req.resourceType === 'stylesheet' || req.resourceType === 'script' || req.resourceType === 'image') {
      return total + 1;
    }
    return total;
  }, 0);
  
  // Simulate mobile view and take screenshot
  console.log('Taking mobile screenshot...');
  await page.setViewport({
    width: 375,
    height: 667,
    isMobile: true,
    hasTouch: true
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.screenshot({ 
    path: 'site-analysis-mobile.png',
    fullPage: true 
  });
  
  // Check mobile friendliness
  const mobileFriendly = await page.evaluate(() => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    const hasMobileViewport = document.querySelector('meta[name="viewport"]') !== null;
    const horizontalScroll = document.documentElement.scrollWidth > viewport.width;
    
    return {
      hasMobileViewport,
      horizontalScroll,
      tapTargets: 'Analysis requires manual review' // Complex to automate
    };
  });
  
  // Prepare report data
  const report = {
    url,
    title,
    status,
    contentType,
    metaTags,
    links: links.slice(0, 20), // Limit to first 20 links
    seoAnalysis,
    accessibilityAnalysis,
    performanceMetrics: {
      totalRequests: requests.length,
      totalAssetsLoaded: totalRequestSize
    },
    mobileFriendly,
    timestamp: new Date().toISOString()
  };
  
  // Save the report to a JSON file
  fs.writeFileSync('site-analysis-report.json', JSON.stringify(report, null, 2));
  
  // Generate a simple HTML report
  const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Analysis for ${url}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .report-section {
      margin-bottom: 30px;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 5px;
    }
    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
    }
    .stat-box {
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
      min-width: 200px;
    }
    .screenshots {
      display: flex;
      gap: 20px;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    .screenshot {
      max-width: 100%;
      border: 1px solid #ddd;
    }
    .screenshot img {
      max-width: 100%;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    table, th, td {
      border: 1px solid #ddd;
    }
    th, td {
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    .good {
      color: green;
    }
    .warning {
      color: orange;
    }
    .bad {
      color: red;
    }
  </style>
</head>
<body>
  <h1>Website Analysis Report</h1>
  <p>Analysis for: <a href="${url}" target="_blank">${url}</a></p>
  <p>Generated on: ${new Date().toLocaleString()}</p>
  
  <div class="report-section">
    <h2>Basic Information</h2>
    <div class="stats">
      <div class="stat-box">
        <h3>Page Title</h3>
        <p>${title}</p>
      </div>
      <div class="stat-box">
        <h3>HTTP Status</h3>
        <p class="${status === 200 ? 'good' : 'bad'}">${status}</p>
      </div>
      <div class="stat-box">
        <h3>Content Type</h3>
        <p>${contentType || 'Not detected'}</p>
      </div>
    </div>
  </div>
  
  <div class="report-section">
    <h2>Screenshots</h2>
    <div class="screenshots">
      <div class="screenshot">
        <h3>Desktop View</h3>
        <img src="site-analysis.png" alt="Desktop screenshot">
      </div>
      <div class="screenshot">
        <h3>Mobile View</h3>
        <img src="site-analysis-mobile.png" alt="Mobile screenshot">
      </div>
    </div>
  </div>
  
  <div class="report-section">
    <h2>SEO Analysis</h2>
    <div class="stats">
      <div class="stat-box">
        <h3>H1 Headings</h3>
        <p class="${seoAnalysis.h1Count === 1 ? 'good' : 'warning'}">${seoAnalysis.h1Count} heading(s)</p>
        <p>${seoAnalysis.h1Text}</p>
      </div>
      <div class="stat-box">
        <h3>Image Alt Tags</h3>
        <p>${seoAnalysis.imgAltTags}</p>
      </div>
      <div class="stat-box">
        <h3>Canonical Link</h3>
        <p class="${seoAnalysis.hasCanonical ? 'good' : 'warning'}">${seoAnalysis.hasCanonical ? 'Present' : 'Missing'}</p>
      </div>
      <div class="stat-box">
        <h3>Structured Data</h3>
        <p class="${seoAnalysis.hasStructuredData ? 'good' : 'warning'}">${seoAnalysis.hasStructuredData ? 'Present' : 'Missing'}</p>
      </div>
    </div>
    
    <h3>Meta Tags</h3>
    <table>
      <tr>
        <th>Name</th>
        <th>Content</th>
      </tr>
      ${Object.entries(metaTags).map(([name, content]) => `
      <tr>
        <td>${name}</td>
        <td>${content}</td>
      </tr>
      `).join('')}
    </table>
  </div>
  
  <div class="report-section">
    <h2>Accessibility</h2>
    <div class="stats">
      <div class="stat-box">
        <h3>ARIA Labels</h3>
        <p class="${accessibilityAnalysis.hasAriaLabels ? 'good' : 'warning'}">${accessibilityAnalysis.hasAriaLabels ? 'Present' : 'Missing'}</p>
      </div>
      <div class="stat-box">
        <h3>ARIA Roles</h3>
        <p class="${accessibilityAnalysis.hasRoles ? 'good' : 'warning'}">${accessibilityAnalysis.hasRoles ? 'Present' : 'Missing'}</p>
      </div>
      <div class="stat-box">
        <h3>Form Labels</h3>
        <p>${accessibilityAnalysis.formInputRatio}</p>
      </div>
    </div>
  </div>
  
  <div class="report-section">
    <h2>Mobile Friendliness</h2>
    <div class="stats">
      <div class="stat-box">
        <h3>Mobile Viewport</h3>
        <p class="${mobileFriendly.hasMobileViewport ? 'good' : 'bad'}">${mobileFriendly.hasMobileViewport ? 'Present' : 'Missing'}</p>
      </div>
      <div class="stat-box">
        <h3>Horizontal Scrolling</h3>
        <p class="${!mobileFriendly.horizontalScroll ? 'good' : 'bad'}">${!mobileFriendly.horizontalScroll ? 'None (Good)' : 'Present (Bad)'}</p>
      </div>
      <div class="stat-box">
        <h3>Tap Targets</h3>
        <p>${mobileFriendly.tapTargets}</p>
      </div>
    </div>
  </div>
  
  <div class="report-section">
    <h2>Performance</h2>
    <div class="stats">
      <div class="stat-box">
        <h3>Total Requests</h3>
        <p>${report.performanceMetrics.totalRequests}</p>
      </div>
      <div class="stat-box">
        <h3>Assets Loaded</h3>
        <p>${report.performanceMetrics.totalAssetsLoaded}</p>
      </div>
    </div>
  </div>
  
  <div class="report-section">
    <h2>Links (First 20)</h2>
    <table>
      <tr>
        <th>Text</th>
        <th>URL</th>
        <th>Rel Attribute</th>
      </tr>
      ${links.slice(0, 20).map(link => `
      <tr>
        <td>${link.text || '[No text]'}</td>
        <td>${link.href || '[No URL]'}</td>
        <td>${link.rel || ''}</td>
      </tr>
      `).join('')}
    </table>
  </div>
  
  <p>For a complete report, see the site-analysis-report.json file.</p>
</body>
</html>
  `;
  
  fs.writeFileSync('site-analysis-report.html', htmlReport);
  
  // Close the browser
  console.log('Closing browser...');
  await browser.close();
  
  console.log('Analysis completed!');
  console.log('Reports saved to:');
  console.log('- site-analysis-report.json');
  console.log('- site-analysis-report.html');
  console.log('Screenshots saved to:');
  console.log('- site-analysis.png');
  console.log('- site-analysis-mobile.png');
}

// URL to analyze (default Google, but can be changed)
const urlToAnalyze = process.argv[2] || 'https://www.google.com';

// Run the analyzer
analyzeWebsite(urlToAnalyze).catch(error => {
  console.error('Error during website analysis:', error);
});
