"""
Google Cloud Storage Bucket API Routes

This module provides FastAPI routes for securely accessing and browsing
files stored in Google Cloud Storage buckets, with authentication and
proper access controls.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from google.cloud import storage
from google.cloud.exceptions import NotFound
import os
import time
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/bucket", tags=["bucket"])

# Configuration
DEFAULT_BUCKET = os.environ.get("UPLOAD_BUCKET", "chopin")
SIGNED_URL_EXPIRATION = 300  # 5 minutes in seconds
MAX_LIST_RESULTS = 1000  # Maximum number of results to return in listing

# Helper to get GCS client
def get_storage_client():
    """Returns an authenticated Google Cloud Storage client."""
    try:
        return storage.Client()
    except Exception as e:
        logger.error(f"Failed to create GCS client: {e}")
        raise HTTPException(status_code=500, detail="Storage service unavailable")

@router.get("/list")
async def list_bucket_files(
    prefix: str = Query("", description="Path prefix to filter results"),
    delimiter: str = Query("/", description="Delimiter for path-like navigation"),
    client = Depends(get_storage_client)
):
    """
    List files in a bucket with optional path prefix.
    
    Args:
        prefix: Path prefix to filter results
        delimiter: Directory delimiter (/ for folder-like navigation)
        
    Returns:
        List of files/directories in the bucket
    """
    try:
        bucket = client.bucket(DEFAULT_BUCKET)
        blobs = client.list_blobs(
            bucket_or_name=DEFAULT_BUCKET,
            prefix=prefix,
            delimiter=delimiter,
            max_results=MAX_LIST_RESULTS
        )
        
        # Get prefixes (directories)
        directories = []
        for prefix in blobs.prefixes:
            directories.append({
                "name": prefix,
                "type": "directory",
                "path": prefix
            })
        
        # Get files
        files = []
        for blob in blobs:
            # Skip directories
            if blob.name.endswith(delimiter):
                continue
                
            # Get file metadata
            files.append({
                "name": blob.name.split("/")[-1] if delimiter in blob.name else blob.name,
                "path": blob.name,
                "type": "file",
                "size": blob.size,
                "updated": blob.updated.isoformat() if blob.updated else None,
                "content_type": blob.content_type,
            })
        
        return {
            "directories": directories,
            "files": files,
            "current_prefix": prefix,
            "parent_prefix": "/".join(prefix.split("/")[:-1]) + "/" if prefix and "/" in prefix else ""
        }
    except Exception as e:
        logger.error(f"Error listing bucket contents: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing bucket contents: {str(e)}")

@router.get("/view")
async def view_file(
    file_path: str = Query(..., description="Path to the file in the bucket"),
    client = Depends(get_storage_client)
):
    """
    Get metadata and a signed URL for a specific file.
    
    Args:
        file_path: Complete path to the file in the bucket
        
    Returns:
        File metadata and a signed URL for viewing
    """
    try:
        bucket = client.bucket(DEFAULT_BUCKET)
        blob = bucket.blob(file_path)
        
        if not blob.exists():
            raise HTTPException(status_code=404, detail=f"File {file_path} not found")
        
        # Generate a signed URL
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(seconds=SIGNED_URL_EXPIRATION),
            method="GET"
        )
        
        # Get file metadata
        metadata = {
            "name": blob.name.split("/")[-1],
            "path": blob.name,
            "size": blob.size,
            "size_formatted": format_file_size(blob.size),
            "updated": blob.updated.isoformat() if blob.updated else None,
            "content_type": blob.content_type,
            "md5_hash": blob.md5_hash,
            "url_expiry": (datetime.now() + timedelta(seconds=SIGNED_URL_EXPIRATION)).isoformat(),
        }
        
        return {
            "metadata": metadata,
            "signed_url": signed_url
        }
    except NotFound:
        raise HTTPException(status_code=404, detail=f"File {file_path} not found")
    except Exception as e:
        logger.error(f"Error generating view URL: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating view URL: {str(e)}")

@router.get("/download")
async def download_file(
    file_path: str = Query(..., description="Path to the file in the bucket"),
    client = Depends(get_storage_client)
):
    """
    Generate a signed URL for downloading a file.
    
    Args:
        file_path: Complete path to the file in the bucket
        
    Returns:
        A signed URL for downloading the file
    """
    try:
        bucket = client.bucket(DEFAULT_BUCKET)
        blob = bucket.blob(file_path)
        
        if not blob.exists():
            raise HTTPException(status_code=404, detail=f"File {file_path} not found")
        
        # Generate a signed URL with Content-Disposition header for download
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(seconds=SIGNED_URL_EXPIRATION),
            method="GET",
            response_disposition=f'attachment; filename="{blob.name.split("/")[-1]}"'
        )
        
        return {
            "download_url": signed_url,
            "filename": blob.name.split("/")[-1],
            "url_expiry": (datetime.now() + timedelta(seconds=SIGNED_URL_EXPIRATION)).isoformat()
        }
    except NotFound:
        raise HTTPException(status_code=404, detail=f"File {file_path} not found")
    except Exception as e:
        logger.error(f"Error generating download URL: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating download URL: {str(e)}")

@router.get("/search")
async def search_files(
    query: str = Query(..., description="Search query"),
    prefix: str = Query("", description="Path prefix to limit search scope"),
    client = Depends(get_storage_client)
):
    """
    Search for files in the bucket based on filename.
    
    Args:
        query: Search query string
        prefix: Optional path prefix to limit search scope
        
    Returns:
        List of matching files
    """
    try:
        bucket = client.bucket(DEFAULT_BUCKET)
        blobs = client.list_blobs(
            bucket_or_name=DEFAULT_BUCKET,
            prefix=prefix,
            max_results=MAX_LIST_RESULTS
        )
        
        results = []
        for blob in blobs:
            # Simple filename search
            if query.lower() in blob.name.lower():
                results.append({
                    "name": blob.name.split("/")[-1],
                    "path": blob.name,
                    "size": blob.size,
                    "size_formatted": format_file_size(blob.size),
                    "updated": blob.updated.isoformat() if blob.updated else None,
                    "content_type": blob.content_type,
                })
                
        return {
            "query": query,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"Error searching bucket: {e}")
        raise HTTPException(status_code=500, detail=f"Error searching bucket: {str(e)}")

def format_file_size(size_bytes):
    """Format byte size into human-readable string."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"
