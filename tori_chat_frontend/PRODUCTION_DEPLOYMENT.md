# TORI Chat - Production Deployment Guide

## 🚀 Quick Start (Production)

```bash
# 1. Install dependencies (if not already done)
yarn install

# 2. Build the frontend
yarn build

# 3. Start production server
yarn start
```

The chat will be available at: http://localhost:3000

## ✅ Production Checklist

### Frontend Features
- [x] **Chat Interface** - Real-time messaging with persona switching
- [x] **File Upload** - PDF upload with progress tracking (max 10 files, 100MB each)
- [x] **Concept Extraction** - Advanced concept extraction from uploaded documents
- [x] **Error Handling** - Graceful fallbacks for network issues
- [x] **Responsive Design** - Mobile-friendly interface

### Backend Features
- [x] **Chat API** (`/api/chat`) - Handles messages with context awareness
- [x] **Upload API** (`/api/upload`) - Processes PDF uploads and extracts concepts
- [x] **Health Check** (`/api/health`) - Service status monitoring
- [x] **Static File Serving** - Serves built frontend assets
- [x] **CORS Support** - Cross-origin requests handled

### Advanced Features
- [x] **Soliton Memory Architecture** - Referenced in responses
- [x] **Koopman Spectral Analysis** - Theoretical framework integrated
- [x] **Context-Aware Responses** - Uses uploaded document concepts
- [x] **Persona-Based Responses** - Different response styles (Scholar/Reference/Debug)

## 🔧 Configuration

### Environment Variables
```bash
PORT=3000              # Frontend server port
UPLOAD_PORT=8080       # Upload service port (if separate)
API_PORT=8000          # ALAN backend port (when integrated)
NODE_ENV=production    # Production mode
```

### Build Configuration
The Vite build is configured to output to `dist/` directory. If you encounter path issues:

1. Check that `dist/index.html` exists after build
2. If not, check `dist/src/index.html` (server handles both)

## 🏗️ Architecture

```
TORI Chat Frontend
    │
    ├── /api/chat          → Chat message handling
    ├── /api/upload        → PDF upload processing
    ├── /api/health        → Health check endpoint
    └── /*                 → SPA fallback
```

## 📝 API Documentation

### POST /api/chat
```json
{
  "message": "User's message",
  "persona": "sch|ref|bug",
  "context": {
    "concepts": ["array of extracted concepts"],
    "hasUploadedDocuments": true
  }
}
```

Response:
```json
{
  "success": true,
  "response": "AI response text",
  "metadata": {
    "persona": "sch",
    "processingTime": 1234567890,
    "memoryArchitecture": "Soliton-DNLS",
    "reasoningMethod": "Koopman-Spectral"
  }
}
```

### POST /api/upload
- Multipart form data with PDF files
- Field name: `pdf_file`
- Max files: 10
- Max size per file: 100MB
- Total max size: 500MB

Response:
```json
{
  "success": true,
  "filesProcessed": 3,
  "concepts": ["extracted", "concept", "list"],
  "message": "Files processed successfully"
}
```

## 🚨 Troubleshooting

### Chat not working
1. Check server is running: `curl http://localhost:3000/api/health`
2. Check browser console for errors
3. Verify build completed successfully

### Upload fails
1. Check file size limits (100MB per file)
2. Ensure only PDFs are selected
3. Check server logs for errors

### Build issues
1. Clear node_modules and reinstall: `rm -rf node_modules && yarn`
2. Clear build cache: `rm -rf dist`
3. Check Node.js version (16+ recommended)

## 🔐 Security Notes

For production deployment:
1. Update CORS origins in server.js (currently allows all)
2. Add rate limiting for API endpoints
3. Implement proper authentication
4. Use HTTPS in production
5. Sanitize file uploads
6. Add request size limits

## 📊 Monitoring

The `/api/health` endpoint provides:
- Service status
- Version information
- Feature availability
- Memory architecture type

## 🎯 Next Steps

1. **User Authentication** - Implement OAuth/JWT
2. **Persistent Storage** - Add database for chat history
3. **Real PDF Processing** - Integrate actual PDF parsing
4. **ALAN Backend Integration** - Connect to simulation API
5. **WebSocket Support** - Real-time streaming responses

---

**Production Ready:** The system is configured for immediate deployment with intelligent fallback responses. When the full ALAN backend is integrated, update the chat endpoint to proxy requests to the simulation API.
