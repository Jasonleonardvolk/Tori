const express = require('express');
const multer = require('multer');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

const app = express();
const PORT = 3001; // Use 3001 to avoid conflict with frontend

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 10 // Max 10 files
  }
});

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TORI Upload Proxy running' });
});

// PDF upload endpoint
app.post('/upload', upload.array('pdf_file', 10), async (req, res) => {
  try {
    console.log(`📄 Received ${req.files.length} files for processing`);
    
    // Forward files to ingest-bus
    const formData = new FormData();
    
    // Add each file to the form data
    for (const file of req.files) {
      formData.append('pdf_file', fs.createReadStream(file.path), {
        filename: file.originalname,
        contentType: file.mimetype
      });
    }
    
    // Forward to ingest-bus
    const response = await fetch('http://localhost:8080/upload', {
      method: 'POST',
      body: formData
    });
    
    // Clean up temporary files
    for (const file of req.files) {
      fs.unlinkSync(file.path);
    }
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Files processed successfully');
      res.json({
        success: true,
        message: `Processed ${req.files.length} files`,
        concepts: result.concepts || [],
        details: result
      });
    } else {
      throw new Error(`Ingest-bus returned ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Upload processing failed:', error);
    
    // Clean up files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Upload processing failed'
    });
  }
});

// MCP proxy endpoints
app.use(express.json());

// Memory operations
app.post('/memory/store', async (req, res) => {
  try {
    const response = await fetch('http://localhost:8080/memory/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/memory/search', async (req, res) => {
  try {
    const response = await fetch('http://localhost:8080/memory/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(PORT, () => {
  console.log(`🚀 TORI Upload Proxy running on http://localhost:${PORT}`);
  console.log(`📄 PDF uploads will be forwarded to ingest-bus on port 8080`);
  console.log(`🔗 CORS enabled for frontend on port 3000`);
});
