const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Check if the dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: dist directory not found!');
  console.log('\x1b[33m%s\x1b[0m', 'Please run "npm run build" before starting the production server.');
  process.exit(1);
}

// Check if index.html exists in the dist directory
if (!fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: index.html not found in dist directory!');
  console.log('\x1b[33m%s\x1b[0m', 'The build process may have failed. Check for errors during build.');
  process.exit(1);
}

// Serve static files from the dist directory (production build)
app.use(express.static(path.join(__dirname, 'dist')));

// For any route, serve the index.html from the dist directory (for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`
  ┌───────────────────────────────────────────────────┐
  │                                                   │
  │   TORI Chat Production running on port ${port}       │
  │                                                   │
  │   This is serving the optimized production build. │
  │   Make sure you've run 'npm run build' first.     │
  │                                                   │
  └───────────────────────────────────────────────────┘
  `);
});
