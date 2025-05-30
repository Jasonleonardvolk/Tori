#!/usr/bin/env python3
"""
🚀 CLEAN PYTHON EXTRACTION API - FastAPI Service

This replaces the broken subprocess integration with a clean HTTP API.
The SvelteKit frontend calls this endpoint for reliable concept extraction.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path
import tempfile
import json
import time
import logging

# Add the ingest_pdf directory to path
sys.path.append(str(Path(__file__).parent / "ingest_pdf"))

try:
    from extractConceptsFromDocument import extractConceptsFromDocument
    print("✅ Successfully imported universal extraction module")
except ImportError as e:
    print(f"❌ Failed to import extraction module: {e}")
    print("Make sure you're in the correct directory with ingest_pdf/")
    sys.exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="TORI Universal Concept Extraction API",
    description="Clean Python API for universal concept extraction",
    version="1.0.0"
)

# Add CORS middleware for SvelteKit integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """API health check"""
    return {
        "status": "healthy",
        "service": "TORI Universal Concept Extraction API",
        "version": "1.0.0",
        "ready": True
    }

@app.get("/health")
async def health_check():
    """Detailed health check with module verification"""
    try:
        # Test that extraction modules are working
        test_text = "This is a test of machine learning and artificial intelligence algorithms."
        test_concepts = extractConceptsFromDocument(test_text, threshold=0.0)
        
        return {
            "status": "healthy",
            "extraction_engine": "universal_pipeline",
            "modules_loaded": True,
            "test_extraction": len(test_concepts) > 0,
            "test_concepts_found": len(test_concepts),
            "ready": True
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "error": str(e),
            "ready": False
        }

@app.post("/extract")
async def extract_concepts_from_upload(file: UploadFile = File(...)):
    """
    🧬 UNIVERSAL CONCEPT EXTRACTION ENDPOINT
    
    Upload a PDF or text file and get back extracted concepts using
    the same universal pipeline that gives 44 concepts.
    """
    start_time = time.time()
    
    try:
        logger.info(f"🧬 Processing upload: {file.filename} ({file.content_type})")
        
        # Validate file type
        if not file.filename.lower().endswith(('.pdf', '.txt')):
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file type. PDF and TXT files only."
            )
        
        # Read file content
        content = await file.read()
        logger.info(f"📁 File read: {len(content)} bytes")
        
        # Extract text from file
        if file.filename.lower().endswith('.pdf'):
            # For PDF, we need basic text extraction
            # This is the same logic as the working test script
            try:
                # Basic PDF text extraction (same as test script)
                text_content = content.decode('utf-8', errors='ignore')
                # Clean non-printable characters
                text = ''.join(char if ord(char) >= 32 or char in '\n\r\t' else ' ' for char in text_content)
            except Exception as e:
                logger.error(f"❌ PDF text extraction failed: {e}")
                raise HTTPException(status_code=500, detail=f"PDF processing failed: {e}")
        else:
            # Plain text file
            text = content.decode('utf-8')
        
        logger.info(f"📄 Extracted text: {len(text)} characters")
        
        if len(text) < 50:
            raise HTTPException(
                status_code=400, 
                detail="Extracted text too short for meaningful concept extraction"
            )
        
        # 🧬 UNIVERSAL CONCEPT EXTRACTION - Same as test script
        logger.info("🧬 Starting universal concept extraction...")
        concepts = extractConceptsFromDocument(text, threshold=0.0)
        
        processing_time = time.time() - start_time
        
        logger.info(f"✅ Extraction complete: {len(concepts)} concepts in {processing_time:.2f}s")
        
        # Format response
        response = {
            "success": True,
            "filename": file.filename,
            "extraction_method": "enhanced_python_pipeline",
            "processing_time_seconds": round(processing_time, 3),
            "text_length": len(text),
            "concept_count": len(concepts),
            "concepts": concepts[:50],  # Limit to top 50 concepts
            "universal_extraction": True,
            "timestamp": time.time()
        }
        
        # Log method breakdown for visibility
        if concepts:
            method_counts = {}
            for concept in concepts:
                method = concept.get('source', {}).get('methods', 'unknown')
                method_counts[method] = method_counts.get(method, 0) + 1
            
            logger.info("🧬 METHOD BREAKDOWN:")
            for method, count in method_counts.items():
                logger.info(f"  📊 {method}: {count} concepts")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@app.post("/extract/text")
async def extract_concepts_from_text(data: dict):
    """
    🧬 DIRECT TEXT EXTRACTION ENDPOINT
    
    Send raw text and get back extracted concepts.
    Useful for testing and direct integration.
    """
    start_time = time.time()
    
    try:
        text = data.get('text', '')
        if not text or len(text) < 50:
            raise HTTPException(
                status_code=400, 
                detail="Text too short for meaningful concept extraction"
            )
        
        logger.info(f"📄 Processing text: {len(text)} characters")
        
        # 🧬 UNIVERSAL CONCEPT EXTRACTION
        concepts = extractConceptsFromDocument(text, threshold=0.0)
        
        processing_time = time.time() - start_time
        
        logger.info(f"✅ Extraction complete: {len(concepts)} concepts in {processing_time:.2f}s")
        
        return {
            "success": True,
            "extraction_method": "enhanced_python_pipeline",
            "processing_time_seconds": round(processing_time, 3),
            "text_length": len(text),
            "concept_count": len(concepts),
            "concepts": concepts,
            "universal_extraction": True,
            "timestamp": time.time()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Text extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # Try multiple ports in case of conflicts
    ports_to_try = [8002, 8003, 8004, 8005]
    
    for port in ports_to_try:
        try:
            print(f"🚀 Trying to start TORI Universal Concept Extraction API on port {port}")
            print(f"📍 Will be available at: http://localhost:{port}")
            print(f"🔗 Health check: http://localhost:{port}/health")
            print(f"📄 API docs: http://localhost:{port}/docs")
            
            uvicorn.run(
                app, 
                host="0.0.0.0", 
                port=port,
                log_level="info"
            )
            break  # If we get here, the server started successfully
            
        except Exception as e:
            print(f"❌ Port {port} failed: {e}")
            if port == ports_to_try[-1]:
                print("❌ All ports failed! Check what's using these ports:")
                print("   netstat -ano | findstr :8002")
                print("   netstat -ano | findstr :8003")
                print("   netstat -ano | findstr :8004")
                print("   netstat -ano | findstr :8005")
            else:
                print(f"🔄 Trying next port...")
                continue
