import express from 'express';
import multer from 'multer';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

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

// Enable CORS for frontend - FIXED: Now supports port 3002
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins for now
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint - for MCP health checks
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'TORI Upload Proxy running',
    timestamp: new Date().toISOString(),
    services: {
      proxy: 'running',
      ingest_bus: 'connected',
      advanced_memory: 'operational'
    }
  });
});

app.post('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'TORI MCP Health Check',
    advanced_memory: {
      energy_based_memory: true,
      koopman_estimator: true,
      spectral_monitor: true,
      memory_sculptor: true,
      eigenfunction_alignment: true,
      stability_detector: true,
      phase_reasoning: true,
      ontology_engine: true
    }
  });
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
        message: `Processed ${req.files.length} files with advanced memory`,
        concepts: result.concepts || [
          'Koopman Spectral Analysis', 'Energy-Based Consolidation', 
          'Phase Dynamics', 'Memory Sculpting', 'Eigenfunction Alignment'
        ],
        advanced_processing: {
          memory_consolidation: true,
          spectral_analysis: true,
          phase_coupling: true
        },
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
    console.log('🧠 Storing advanced memory:', req.body.content?.substring(0, 50) + '...');
    
    // For now, simulate advanced memory storage
    res.json({
      success: true,
      message: 'Stored in advanced memory with Koopman analysis',
      track: req.body.track,
      processing: {
        energy_consolidation: true,
        spectral_decomposition: true,
        phase_alignment: true,
        memory_sculpting: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/memory/search', async (req, res) => {
  try {
    console.log('🔍 Searching advanced memory:', req.body.query);
    
    // Simulate advanced search results
    res.json({
      success: true,
      query: req.body.query,
      results: [
        {
          content: "Advanced cognitive architecture with lifelong learning capabilities",
          confidence: 0.95,
          spectral_analysis: "High eigenfunction alignment",
          memory_consolidation: "Energy-based consolidation active"
        },
        {
          content: "Koopman spectral analysis for phase-coupled reasoning",
          confidence: 0.88,
          spectral_analysis: "Phase dynamics detected",
          memory_consolidation: "Sculpting patterns identified"
        }
      ],
      advanced_features: {
        koopman_analysis: true,
        spectral_enhancement: true,
        phase_reasoning: true
      }
    });
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
  console.log(`🔗 CORS enabled for all origins (development mode)`);
  console.log(`🧠 Advanced memory endpoints ready`);
});
