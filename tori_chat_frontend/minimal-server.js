// This is a minimal fallback server for emergencies
// It has NO dependencies and uses only Node.js built-in modules
// Run with: node minimal-server.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// Basic MIME type mapping
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf'
};

// Check if dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: dist directory not found!');
  console.log('\x1b[33m%s\x1b[0m', 'Please run "npm run build" before starting the server.');
  process.exit(1);
}

// Create the server
const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Get the file path
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err) {
      // File not found or is a directory, serve index.html (for SPA routing)
      filePath = path.join(DIST_DIR, 'index.html');
    } else if (stats.isDirectory()) {
      // If it's a directory, look for index.html
      filePath = path.join(filePath, 'index.html');
    }
    
    // Get the file extension
    const extname = path.extname(filePath);
    
    // Set content type
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Read and serve the file
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error loading ${filePath}: ${err.code}`);
        console.error(`Error loading ${filePath}: ${err}`);
        return;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    });
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`
  ┌───────────────────────────────────────────────────┐
  │                                                   │
  │   TORI Chat Minimal Server running on port ${PORT}   │
  │                                                   │
  │   This is a fallback server with no dependencies. │
  │   Navigate to http://localhost:${PORT}              │
  │                                                   │
  └───────────────────────────────────────────────────┘
  `);
});
