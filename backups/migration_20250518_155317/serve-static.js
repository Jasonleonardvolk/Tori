/**
 * Simple static file server for the React app
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = 3002;

// Serve static files from the client's public directory
app.use(express.static(path.join(__dirname, 'client/public')));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Static file server running at http://localhost:${PORT}`);
  console.log(`Serving files from: ${path.join(__dirname, 'client/public')}`);
});
