"""
FastAPI Backend for iTori Platform

This is the main FastAPI application that serves API routes for the iTori platform,
including bucket access, PDF upload, and personas management.
"""

import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import route modules
from routes.bucket import router as bucket_router
from routes.personas import router as personas_router
from routes.coherence import router as coherence_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("backend")

# Create FastAPI app
app = FastAPI(
    title="iTori Platform API",
    description="Backend API for the iTori Platform, including bucket access, PDF processing, and more.",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(bucket_router)
app.include_router(personas_router)
app.include_router(coherence_router)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint to verify the API is running."""
    return {"status": "healthy", "version": "1.0.0"}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "iTori Platform API",
        "documentation": "/docs",
        "status": "running",
    }

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or use default
    port = int(os.environ.get("API_PORT", 8000))
    
    # Start the server
    logger.info(f"Starting iTori Platform API on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
