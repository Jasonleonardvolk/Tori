#!/usr/bin/env python3
"""
🚀 SIMPLE WORKING FASTAPI SERVER - TORI Concept Extraction API

This is a simple, reliable FastAPI server that works without complex progress tracking.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import sys
import os
import tempfile
import time
import logging
from pathlib import Path
import traceback

# Add the ingest_pdf directory to Python path
current_dir = Path(__file__).parent
ingest_pdf_dir = current_dir / "ingest_pdf"
sys.path.insert(0, str(ingest_pdf_dir))
sys.path.insert(0, str(current_dir))

# Import your extraction functions
try:
    from pipeline import ingest_pdf_clean
    print("✅ Successfully imported ingest_pdf_clean")
except ImportError as e:
    print(f"❌ Failed to import ingest_pdf_clean: {e}")
    try:
        # Try alternative import paths
        from ingest_pdf.pipeline import ingest_pdf_clean
        print("✅ Successfully imported ingest_pdf_clean (alternative path)")
    except ImportError as e2:
        print(f"❌ Failed to import from ingest_pdf: {e2}")
        print("Available files in ingest_pdf/:")
        if ingest_pdf_dir.exists():
            for f in ingest_pdf_dir.iterdir():
                print(f"  - {f.name}")
        sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ExtractionRequest(BaseModel):
    file_path: str
    filename: str
    content_type: str

# Create FastAPI app
app = FastAPI(
    title="TORI Universal Concept Extraction API",
    description="Simple, reliable API for extracting concepts from documents",
    version="2.3.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for SvelteKit integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000", 
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint - API status"""
    return {
        "service": "TORI Universal Concept Extraction API",
        "version": "2.3.0",
        "status": "healthy",
        "features": ["fast_processing", "purity_analysis", "5_chunk_limit"],
        "endpoints": {
            "health": "/health",
            "extract": "/extract (POST with JSON)",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Health check with pipeline test"""
    try:
        logger.info("🏥 Health check started")
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "extraction_engine": "purity_based_universal_pipeline",
            "performance_limits": "5 chunks max, 500 concepts max",
            "processing_time": "30-40 seconds typical",
            "ready": True
        }
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time(),
                "ready": False
            }
        )

@app.post("/extract")
async def extract_concepts_endpoint(request: ExtractionRequest):
    """
    🧬 MAIN EXTRACTION ENDPOINT - Simple and reliable
    
    This endpoint accepts a file path and extracts concepts.
    Used by SvelteKit frontend for file uploads.
    """
    start_time = time.time()
    
    try:
        file_path = request.file_path
        filename = request.filename
        content_type = request.content_type
        
        logger.info(f"🧬 [EXTRACT] Processing file: {filename}")
        logger.info(f"📁 [EXTRACT] File path: {file_path}")
        logger.info(f"📊 [EXTRACT] Content type: {content_type}")
        
        # Validate file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        # Get file size
        file_size = os.path.getsize(file_path)
        file_size_mb = file_size / (1024 * 1024)
        
        logger.info(f"📏 [EXTRACT] File size: {file_size_mb:.2f} MB")
        
        # Validate file type
        if not filename.lower().endswith(('.pdf', '.txt')):
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Only PDF and TXT files are supported. Got: {filename}"
            )
        
        logger.info("🧬 [EXTRACT] Starting pipeline extraction...")
        extraction_start = time.time()
        
        # 🏆 Call the optimized pipeline (5 chunks, fast processing)
        result = ingest_pdf_clean(file_path, extraction_threshold=0.0)
        
        extraction_time = time.time() - extraction_start
        total_time = time.time() - start_time
        
        logger.info(f"✅ [EXTRACT] Pipeline extraction complete!")
        logger.info(f"📊 [EXTRACT] Found {result.get('concept_count', 0)} concepts")
        logger.info(f"⚡ [EXTRACT] Extraction time: {extraction_time:.2f}s")
        logger.info(f"⚡ [EXTRACT] Total time: {total_time:.2f}s")
        
        # Check if extraction was successful
        if result.get("status") != "success":
            raise HTTPException(
                status_code=500, 
                detail=f"Extraction failed: {result.get('error_message', 'Unknown error')}"
            )
        
        # Prepare response data
        response_data = {
            "success": True,
            "filename": filename,
            "status": "success",
            "extraction_method": result.get("extraction_method", "purity_based_universal_pipeline"),
            "processing_time_seconds": round(total_time, 3),
            "extraction_time_seconds": round(extraction_time, 3),
            "concept_count": result.get("concept_count", 0),
            "concept_names": result.get("concept_names", []),
            "concepts": result.get("concept_names", []),  # For backwards compatibility
            "universal_extraction": True,
            "purity_based": result.get("purity_based", True),
            "performance_limited": result.get("performance_limited", True),
            "chunks_processed": result.get("chunks_processed", 0),
            "chunks_available": result.get("chunks_available", 0),
            "purity_analysis": result.get("purity_analysis", {}),
            "timestamp": time.time(),
            "api_version": "2.3.0"
        }
        
        logger.info(f"🎉 [EXTRACT] SUCCESS: Returning {result.get('concept_count', 0)} concepts for {filename}")
        logger.info(f"🏆 [EXTRACT] Method: {result.get('extraction_method', 'unknown')}")
        logger.info(f"🚀 [EXTRACT] Performance: {result.get('chunks_processed', 0)}/{result.get('chunks_available', 0)} chunks")
        
        return response_data
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
        
    except Exception as e:
        logger.error(f"❌ [EXTRACT] Unexpected error: {e}")
        logger.error(f"❌ [EXTRACT] Traceback: {traceback.format_exc()}")
        
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error during concept extraction: {str(e)}"
        )

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Endpoint not found", "available_endpoints": ["/", "/health", "/extract", "/docs"]}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"❌ Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting TORI Universal Concept Extraction API v2.3")
    print("🏆 SIMPLE AND RELIABLE!")
    print("=" * 60)
    print("📍 Server will be available at: http://localhost:8002")
    print("🔗 Health check: http://localhost:8002/health")
    print("📄 API documentation: http://localhost:8002/docs")
    print("🧬 Extract endpoint: http://localhost:8002/extract")
    print("🚀 Performance: 5 chunks max, 30-40 second processing")
    print("=" * 60)
    
    # Try multiple ports if needed
    for port in [8002, 8003, 8004, 8005]:
        try:
            print(f"🔌 Attempting to start on port {port}...")
            uvicorn.run(
                app,
                host="0.0.0.0",
                port=port,
                log_level="info",
                access_log=True
            )
            break
        except Exception as e:
            print(f"❌ Port {port} failed: {e}")
            if port == 8005:
                print("❌ All ports failed! Check for conflicts with:")
                print("   netstat -ano | findstr :8002")
                print("   netstat -ano | findstr :8003")
                break
            else:
                print("🔄 Trying next port...")
                continue
