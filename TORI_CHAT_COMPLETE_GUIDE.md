# TORI Chat System - Complete Functionality Guide

## 🏗️ System Architecture

The TORI Chat system consists of multiple integrated components working together to provide advanced AI-powered chat with memory and reasoning capabilities:

### 1. **Chat Frontend (Port 3000)**
- React-based UI with persona switching (Scholar/Reference/Debug)
- PDF upload with drag-and-drop support
- Real-time concept extraction display
- WebSocket-ready for streaming responses

### 2. **PDF Upload Server (Port 5000)**
- Processes PDF documents for concept extraction
- Uses the `ingest_pdf` pipeline for semantic analysis
- Validates document quality before processing
- Stores concepts in NPZ format for efficient retrieval

### 3. **ALAN Backend (Port 8000)**
- Advanced reasoning using Koopman spectral analysis
- Phase-coupled oscillator networks for memory
- Soliton dynamics for stable memory storage
- Real-time simulation capabilities

### 4. **Main Backend API (Port 8000)**
- iTori platform services
- Bucket access and personas management
- Coherence metrics and monitoring

## 🚀 Quick Start

### Option 1: Start Chat Only
```bash
cd C:\Users\jason\Desktop\tori\kha\tori_chat_frontend
yarn install
yarn build
yarn start
```

### Option 2: Start All Services (Full Production)
```bash
cd C:\Users\jason\Desktop\tori\kha
# Windows Command Prompt
start-tori-production.bat all

# Or PowerShell
.\start-tori-production.ps1 -All
```

## 💬 Chat Functionality

### Core Features

1. **Intelligent Responses**
   - Context-aware reasoning based on uploaded documents
   - Persona-based response styles
   - Integration with ALAN's spectral analysis
   - Fallback to sophisticated local reasoning

2. **PDF Processing**
   - Upload multiple PDFs (max 10 files, 100MB each)
   - Real-time concept extraction
   - Quality validation before processing
   - Persistent concept memory across chat sessions

3. **Memory Architecture**
   - Soliton-based memory storage (topologically protected)
   - DNLS (Discrete Nonlinear Schrödinger) dynamics
   - Koopman eigenfunction analysis
   - Phase-coupled reasoning networks

### How the Chat Works

1. **User Message Flow**
   ```
   User Input → Chat API → ALAN Backend (if available)
                         ↓
                    Spectral Analysis
                         ↓
                    Phase Coupling
                         ↓
                 Eigenfunction Alignment
                         ↓
                  Intelligent Response
   ```

2. **PDF Upload Flow**
   ```
   PDF Upload → Validation → Concept Extraction
                          ↓
                   Update Memory State
                          ↓
                 Context-Aware Responses
   ```

3. **Concept Integration**
   - Extracted concepts become part of the active memory
   - Each concept has an activation level
   - Concepts influence response generation
   - Persistent across the session

## 🔧 API Endpoints

### Chat Endpoint: `POST /api/chat`
```json
{
  "message": "User's question",
  "persona": "sch|ref|bug",
  "context": {
    "concepts": ["array of active concepts"],
    "hasUploadedDocuments": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Intelligent response text",
  "metadata": {
    "persona": "sch",
    "processingTime": 1234567890,
    "memoryArchitecture": "Soliton-DNLS",
    "reasoningMethod": "Koopman-Spectral",
    "alanMetrics": {
      "coherence": 0.92,
      "eigenvalues": [0.98, 0.87, 0.76],
      "phase_coupling": 0.85
    }
  }
}
```

### Upload Endpoint: `POST /api/upload`
- Multipart form data
- Field: `pdf_file` (multiple)
- Returns extracted concepts

### Memory State: `GET /api/memory/state`
```json
{
  "success": true,
  "memoryState": {
    "concepts": ["active", "concepts", "list"],
    "conceptCount": 15,
    "isActive": true,
    "lastUpdate": 1234567890,
    "sessionId": 1234567890
  }
}
```

## 🧠 Advanced Features

### 1. **Koopman Spectral Analysis**
The system uses Koopman operator theory to:
- Decompose complex dynamics into linear eigenfunctions
- Identify dominant modes in conceptual space
- Predict evolution of ideas over time

### 2. **Soliton Memory Architecture**
- Topologically protected memory storage
- Resistant to noise and perturbations
- Self-organizing concept hierarchies
- Energy-efficient consolidation

### 3. **Phase-Coupled Reasoning**
- Oscillator networks for concept binding
- Synchronization indicates semantic similarity
- Gamma-band coupling for active reasoning
- Theta-band consolidation for memory

## 🔍 Troubleshooting

### Chat Not Responding
1. Check all services are running:
   - Chat Frontend: http://localhost:3000
   - PDF Server: http://localhost:5000
   - ALAN Backend: http://localhost:8000

2. Check browser console for errors

3. Verify `/api/health` endpoint:
   ```bash
   curl http://localhost:3000/api/health
   ```

### PDF Upload Fails
1. Check file size (max 100MB per file)
2. Ensure PDF format (not scanned images)
3. Check PDF server is running

### Concepts Not Appearing
1. Upload may be processing (check progress)
2. Document may have been rejected (quality check)
3. Check browser console for errors

## 📊 Production Metrics

The system tracks:
- Response times
- Concept extraction success rates
- Memory coherence levels
- Phase coupling strength
- Eigenvalue stability

Access metrics at: `/api/health`

## 🚨 Important Notes

1. **First Run**: Dependencies will be installed automatically
2. **Build Required**: Frontend must be built before production use
3. **Service Dependencies**: Full functionality requires all services
4. **Memory Persistence**: Concepts persist only within a session

## 🎯 48-Hour Sprint Priorities

1. ✅ Chat functionality working
2. ✅ PDF upload integrated
3. ✅ Concept extraction active
4. ✅ Intelligent responses
5. ✅ Production-ready error handling
6. ⏳ User authentication (next phase)
7. ⏳ Persistent storage (next phase)

---

**System Status**: Production Ready for 48-hour deployment
**Architecture**: Soliton-DNLS Memory with Koopman Spectral Reasoning
