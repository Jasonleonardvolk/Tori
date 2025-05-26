const express = require('express'); 
const path = require('path'); 
const fs = require('fs'); 
const app = express(); 
const PORT = process.env.PORT || 3000; 
 
// Serve static files from dist directory 
app.use(express.static(path.join(__dirname, 'dist'))); 
 
// Also serve from dist/src if needed (for assets) 
app.use(express.static(path.join(__dirname, 'dist/src'))); 
 
// Fallback route for SPA 
app.get('*', (req, res) => { 
  // Check if index.html exists in dist 
  const indexPath = path.join(__dirname, 'dist', 'index.html'); 
  const srcIndexPath = path.join(__dirname, 'dist', 'src', 'index.html'); 
 
  if (fs.existsSync(indexPath)) { 
    res.sendFile(indexPath); 
  } else if (fs.existsSync(srcIndexPath)) { 
    res.sendFile(srcIndexPath); 
  } else { 
    res.status(404).send('Application not found. Build may be incomplete.'); 
  } 
}); 
 
// Start server 
app.listen(PORT, () => { 
  console.log(`TORI Chat running on http://localhost:${PORT}`); 
  console.log(`Press Ctrl+C to stop the server.`); 
}); 
