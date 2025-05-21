const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Handle all routes by sending the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'standalone.html'));
});

app.listen(port, () => {
  console.log(`
  ┌───────────────────────────────────────────────────┐
  │                                                   │
  │   TORI Chat Demo running at http://localhost:${port}  │
  │                                                   │
  │   This is a simple preview of the UI components.  │
  │   For a full development setup, use:              │
  │   npm install && npm run dev                      │
  │                                                   │
  └───────────────────────────────────────────────────┘
  `);
});
