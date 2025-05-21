#!/usr/bin/env node

/**
 * TORI Chat Build Verification Script
 * 
 * This script checks if the built TORI Chat UI is the correct React application
 * rather than the placeholder redirect page.
 * 
 * Usage:
 *   node verify-tori-build.js [path/to/dist/directory]
 * 
 * If no path is provided, it defaults to ./tori_chat_frontend/dist
 */

const fs = require('fs');
const path = require('path');

// Default path to the dist directory
const defaultDistPath = path.join(__dirname, 'tori_chat_frontend', 'dist');

// Get the dist path from command line arguments or use the default
const distPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultDistPath;
const indexPath = path.join(distPath, 'index.html');

console.log(`\nVerifying TORI Chat build at: ${distPath}\n`);

try {
  // Check if the dist directory exists
  if (!fs.existsSync(distPath)) {
    console.error('\x1b[31mERROR: dist directory not found!\x1b[0m');
    console.error(`The directory ${distPath} does not exist.`);
    console.error('Have you run the build process?');
    process.exit(1);
  }

  // Check if index.html exists
  if (!fs.existsSync(indexPath)) {
    console.error('\x1b[31mERROR: index.html not found in dist directory!\x1b[0m');
    console.error('The build process may have failed or generated files in a different location.');
    process.exit(1);
  }

  // Read the content of index.html
  const content = fs.readFileSync(indexPath, 'utf8');
  const fileSize = Buffer.byteLength(content, 'utf8');
  
  console.log(`index.html size: ${fileSize} bytes`);

  // Check for indicators of the redirect page
  if (content.includes('redirected to the') || 
      content.includes('Go to demo now') ||
      content.includes('being redirected')) {
    console.error('\x1b[31mERROR: Built UI is the redirect placeholder, not the actual TORI Chat interface!\x1b[0m');
    console.error('Check vite.config.js and ensure it has the correct entry point configuration:');
    console.error('  rollupOptions: { input: { main: path.resolve(__dirname, "src/index.html") } }');
    process.exit(1);
  }

  // Check for indicators of a proper React build
  if (!content.includes('/assets/') && 
      !content.includes('script') && 
      fileSize < 1000) {
    console.error('\x1b[33mWARNING: Built UI seems suspicious!\x1b[0m');
    console.error('The index.html file is very small and does not contain references to asset files.');
    console.error('This might not be a proper build of the React application.');
    process.exit(1);
  }

  // Check assets directory
  const assetsDir = path.join(distPath, 'assets');
  if (!fs.existsSync(assetsDir) || fs.readdirSync(assetsDir).length === 0) {
    console.error('\x1b[33mWARNING: No assets directory or it\'s empty!\x1b[0m');
    console.error('A typical React build should have JS/CSS files in the assets directory.');
    console.error('The build may be incomplete or incorrect.');
    process.exit(1);
  }

  console.log('\x1b[32mSUCCESS: The build appears to be the correct TORI Chat interface.\x1b[0m');
  console.log('\nTo verify the application is working correctly:');
  console.log('1. Start the server: node tori_chat_frontend/start-production.cjs');
  console.log('2. Open http://localhost:3000 in your browser');
  console.log('3. Confirm you see the full Chat UI, not a redirect page\n');
  
  process.exit(0);
} catch (error) {
  console.error('\x1b[31mERROR during verification:\x1b[0m', error.message);
  process.exit(1);
}
