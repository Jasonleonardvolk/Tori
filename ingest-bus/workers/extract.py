"""
Extract worker module for TORI Ingest Bus.

This module provides the functions for extracting, chunking, vectorizing,
and concept-mapping content from different document types.
"""

import os
import sys
import time
import json
import hashlib
import logging
import asyncio
import requests
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime
from pathlib import Path

# Import data models
from models.schemas import (
    IngestStatus, DocumentType, FailureCode,
    Chunk, ConceptVectorLink, IngestJob
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ingest-bus.extract")

# Load configuration from parent directory
try:
    config_path = Path(__file__).parent.parent.parent / "conversation_config.json"
    with open(config_path, "r") as f:
        config = json.load(f)
except Exception as e:
    logger.warning(f"Could not load configuration: {str(e)}")
    logger.warning("Using default configuration")
    config = {
        "scholar_sphere": {
            "enabled": True,
            "encoder_version": "v2.5.0",
            "chunk_size": 512,
            "chunk_overlap": 128
        }
    }

# ScholarSphere configuration
SCHOLAR_SPHERE_ENABLED = config.get("scholar_sphere", {}).get("enabled", True)
ENCODER_VERSION = config.get("scholar_sphere", {}).get("encoder_version", "v2.5.0")
CHUNK_SIZE = config.get("scholar_sphere", {}).get("chunk_size", 512)
CHUNK_OVERLAP = config.get("scholar_sphere", {}).get("chunk_overlap", 128)
MAX_CONCEPTS_PER_CHUNK = config.get("scholar_sphere", {}).get("max_concepts_per_chunk", 12)

# Extract content from a PDF document
async def extract_pdf(file_path: Optional[str], file_content: Optional[bytes], job: IngestJob) -> Optional[str]:
    """
    Extract text content from a PDF document.
    
    Args:
        file_path: Path to the PDF file
        file_content: Raw PDF content if file_path is None
        job: The ingest job
        
    Returns:
        str: Extracted text content, or None if extraction failed
    """
    logger.info(f"Extracting content from PDF: job_id={job.id}")
    
    try:
        # Use PyPDF2 if available
        try:
            from PyPDF2 import PdfReader
            
            if file_path:
                reader = PdfReader(file_path)
            else:
                from io import BytesIO
                reader = PdfReader(BytesIO(file_content))
            
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            
            return text
            
        except ImportError:
            logger.warning("PyPDF2 not available, falling back to pdf_reader.py")
            
            # Fall back to custom PDF reader if available
            pdf_reader_path = Path(__file__).parent.parent.parent / "pdf_reader.py"
            if os.path.exists(pdf_reader_path):
                sys.path.append(str(pdf_reader_path.parent))
                from pdf_reader import extract_text_from_pdf
                
                if file_path:
                    return extract_text_from_pdf(file_path)
                else:
                    temp_path = Path("temp") / f"temp_{job.id}.pdf"
                    os.makedirs(temp_path.parent, exist_ok=True)
                    
                    with open(temp_path, "wb") as f:
                        f.write(file_content)
                    
                    result = extract_text_from_pdf(str(temp_path))
                    
                    # Clean up temp file
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                    
                    return result
            else:
                logger.error("No PDF extraction method available")
                return None
        
    except Exception as e:
        logger.exception(f"Error extracting PDF content: {str(e)}")
        return None

# Extract content from a conversation file
async def extract_conversation(file_path: Optional[str], file_content: Optional[bytes], job: IngestJob) -> Optional[str]:
    """
    Extract content from a conversation file (JSON or Markdown).
    
    This function uses the TORI conversation extractor to process the content.
    
    Args:
        file_path: Path to the conversation file
        file_content: Raw conversation content if file_path is None
        job: The ingest job
        
    Returns:
        str: Extracted and processed conversation content, or None if extraction failed
    """
    logger.info(f"Extracting content from conversation: job_id={job.id}")
    
    try:
        # Determine file path or create a temporary file
        actual_file_path = file_path
        temp_file = None
        
        if not actual_file_path and file_content:
            # Create temporary file
            file_ext = ".json" if file_content.strip().startswith(b"{") else ".md"
            temp_file = Path("temp") / f"temp_{job.id}{file_ext}"
            os.makedirs(temp_file.parent, exist_ok=True)
            
            with open(temp_file, "wb") as f:
                f.write(file_content)
            
            actual_file_path = str(temp_file)
        
        if not actual_file_path:
            logger.error("No file path or content provided for conversation extraction")
            return None
        
        # Check if extract_conversation.js exists
        extractor_path = Path(__file__).parent.parent.parent / "extract_conversation.js"
        if not os.path.exists(extractor_path):
            logger.error(f"Conversation extractor not found at {extractor_path}")
            return None
        
        # Use our custom output directory
        output_dir = Path(__file__).parent.parent / "temp" / f"extracted_{job.id}"
        os.makedirs(output_dir, exist_ok=True)
        
        # Use the conversation extractor
        import subprocess
        cmd = [
            "node", 
            str(extractor_path),
            actual_file_path,
            "--outdir", str(output_dir),
            "--format", "json"
        ]
        
        logger.info(f"Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"Conversation extraction failed: {result.stderr}")
            return None
        
        logger.info(f"Conversation extraction completed: {result.stdout}")
        
        # Find the JSON output file
        json_files = list(output_dir.glob("*_extracted.json"))
        if not json_files:
            logger.error(f"No extracted JSON file found in {output_dir}")
            return None
        
        # Read the JSON output
        with open(json_files[0], "r") as f:
            extracted_data = json.load(f)
        
        # Clean up temporary files
        if temp_file and os.path.exists(temp_file):
            os.remove(temp_file)
        
        # Prepare combined content for chunking
        combined_content = ""
        
        # Add code blocks with language markers
        if extracted_data.get("code"):
            combined_content += "# Extracted Code\n\n"
            combined_content += extracted_data["code"] + "\n\n"
        
        # Add notes
        if extracted_data.get("notes"):
            combined_content += "# Extracted Notes\n\n"
            combined_content += extracted_data["notes"] + "\n\n"
        
        # Add conversation
        if extracted_data.get("conversation"):
            combined_content += "# Conversation\n\n"
            combined_content += extracted_data["conversation"]
        
        return combined_content
        
    except Exception as e:
        logger.exception(f"Error extracting conversation content: {str(e)}")
        return None

# Extract content from a text file
async def extract_text(file_path: Optional[str], file_content: Optional[bytes], job: IngestJob) -> Optional[str]:
    """
    Extract content from a text file.
    
    Args:
        file_path: Path to the text file
        file_content: Raw text content if file_path is None
        job: The ingest job
        
    Returns:
        str: Extracted text content, or None if extraction failed
    """
    logger.info(f"Extracting content from text: job_id={job.id}")
    
    try:
        if file_path:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        elif file_content:
            return file_content.decode("utf-8")
        else:
            logger.error("No file path or content provided")
            return None
    except Exception as e:
        logger.exception(f"Error extracting text content: {str(e)}")
        return None

# Chunk content into manageable pieces
async def chunk_content(content: str, job: IngestJob) -> Optional[List[Chunk]]:
    """
    Chunk content into manageable pieces.
    
    Args:
        content: The text content to chunk
        job: The ingest job
        
    Returns:
        List[Chunk]: List of content chunks, or None if chunking failed
    """
    logger.info(f"Chunking content: job_id={job.id}")
    
    try:
        # Split content into paragraphs
        paragraphs = content.split("\n\n")
        
        # Initialize chunk variables
        chunks = []
        current_chunk = ""
        current_start = 0
        chunk_index = 0
        
        for paragraph in paragraphs:
            # Skip empty paragraphs
            if not paragraph.strip():
                continue
            
            # If adding this paragraph would exceed chunk size, create a new chunk
            if len(current_chunk) + len(paragraph) > CHUNK_SIZE and current_chunk:
                # Create chunk
                chunk_id = f"{job.id}_{chunk_index}"
                chunk_text = current_chunk.strip()
                
                # Calculate chunk hash
                chunk_hash = hashlib.sha256(chunk_text.encode("utf-8")).hexdigest()
                
                chunks.append(Chunk(
                    id=chunk_id,
                    text=chunk_text,
                    index=chunk_index,
                    sha256=chunk_hash,
                    start_offset=current_start,
                    end_offset=current_start + len(current_chunk),
                    metadata={
                        "job_id": job.id,
                        "document_type": job.request.document_type,
                        "source": job.request.source_url or "unknown"
                    }
                ))
                
                # Start new chunk with overlap
                words = current_chunk.split()
                overlap_words = words[-min(len(words), CHUNK_OVERLAP // 10):]
                current_chunk = " ".join(overlap_words) + "\n\n" + paragraph + "\n\n"
                current_start = current_start + len(current_chunk) - len(" ".join(overlap_words) + "\n\n")
                chunk_index += 1
            else:
                # Add paragraph to current chunk
                current_chunk += paragraph + "\n\n"
        
        # Add the last chunk if it's not empty
        if current_chunk.strip():
            chunk_id = f"{job.id}_{chunk_index}"
            chunk_text = current_chunk.strip()
            
            # Calculate chunk hash
            chunk_hash = hashlib.sha256(chunk_text.encode("utf-8")).hexdigest()
            
            chunks.append(Chunk(
                id=chunk_id,
                text=chunk_text,
                index=chunk_index,
                sha256=chunk_hash,
                start_offset=current_start,
                end_offset=current_start + len(current_chunk),
                metadata={
                    "job_id": job.id,
                    "document_type": job.request.document_type,
                    "source": job.request.source_url or "unknown"
                }
            ))
        
        logger.info(f"Created {len(chunks)} chunks")
        return chunks
        
    except Exception as e:
        logger.exception(f"Error chunking content: {str(e)}")
        return None

# Vectorize chunks
async def vectorize_chunks(chunks: List[Chunk], job: IngestJob) -> Optional[List[Tuple[Chunk, List[float]]]]:
    """
    Vectorize content chunks using a vector embedding model.
    
    Args:
        chunks: List of content chunks
        job: The ingest job
        
    Returns:
        List[Tuple[Chunk, List[float]]]: List of chunks and their vector embeddings,
            or None if vectorization failed
    """
    logger.info(f"Vectorizing {len(chunks)} chunks: job_id={job.id}")
    
    try:
        # In a real implementation, we would use a proper embedding model
        # This is a mock implementation that returns random vectors
        import random
        vector_dim = config.get("scholar_sphere", {}).get("phase_vector_dim", 1024)
        
        results = []
        for chunk in chunks:
            # Generate a deterministic random vector based on the chunk text
            random.seed(chunk.sha256)
            vector = [random.uniform(-1, 1) for _ in range(vector_dim)]
            
            # Normalize the vector
            norm = sum(x**2 for x in vector) ** 0.5
            vector = [x / norm for x in vector]
            
            results.append((chunk, vector))
            
            # Update job progress
            job.chunks_processed += 1
            job.percent_complete = min(
                70.0,  # Cap at 70% since we still have concept mapping and storage
                10.0 + (job.chunks_processed / len(chunks) * 40.0)
            )
        
        logger.info(f"Vectorized {len(results)} chunks")
        return results
        
    except Exception as e:
        logger.exception(f"Error vectorizing chunks: {str(e)}")
        return None

# Map vectors to concepts
async def map_to_concepts(vectors: List[Tuple[Chunk, List[float]]], job: IngestJob) -> Optional[List[ConceptVectorLink]]:
    """
    Map vector embeddings to concepts in ScholarSphere.
    
    Args:
        vectors: List of chunks and their vector embeddings
        job: The ingest job
        
    Returns:
        List[ConceptVectorLink]: List of concept-vector links, or None if mapping failed
    """
    logger.info(f"Mapping {len(vectors)} vectors to concepts: job_id={job.id}")
    
    try:
        # In a real implementation, we would query ScholarSphere for concept matches
        # This is a mock implementation that generates random concept IDs
        import random
        
        links = []
        for i, (chunk, vector) in enumerate(vectors):
            # Generate a number of concept links for this chunk
            num_concepts = random.randint(1, MAX_CONCEPTS_PER_CHUNK)
            
            for j in range(num_concepts):
                # Generate a deterministic concept ID based on the chunk and index
                concept_seed = f"{chunk.sha256}_{j}"
                random.seed(concept_seed)
                
                # Generate hex concept ID
                concept_id = ''.join(random.choices('0123456789abcdef', k=24))
                
                # Generate strength between 0.5 and 1.0, with a bias towards higher values
                strength = 0.5 + (random.random() * 0.5)
                
                # Create the concept link
                links.append(ConceptVectorLink(
                    concept_id=concept_id,
                    chunk_id=chunk.id,
                    strength=strength,
                    phase_vector=vector,  # Use the same vector for now
                    encoder_version=ENCODER_VERSION
                ))
            
            # Update job progress
            job.percent_complete = min(
                90.0,  # Cap at 90% since we still have storage
                70.0 + (i / len(vectors) * 20.0)
            )
        
        logger.info(f"Mapped to {len(links)} concepts")
        return links
        
    except Exception as e:
        logger.exception(f"Error mapping to concepts: {str(e)}")
        return None

# Store results
async def store_results(
    chunks: List[Chunk], 
    vectors: List[Tuple[Chunk, List[float]]], 
    concept_links: List[ConceptVectorLink],
    job: IngestJob
) -> bool:
    """
    Store the processed results in ScholarSphere.
    
    Args:
        chunks: List of content chunks
        vectors: List of chunks and their vector embeddings
        concept_links: List of concept-vector links
        job: The ingest job
        
    Returns:
        bool: True if storage succeeded, False otherwise
    """
    logger.info(f"Storing results: job_id={job.id}")
    
    try:
        # In a real implementation, we would store the results in a database
        # and/or send them to ScholarSphere
        # This is a mock implementation that just logs the data
        
        # Log some information about the stored data
        logger.info(f"Would store {len(chunks)} chunks")
        logger.info(f"Would store {len(vectors)} vectors")
        logger.info(f"Would store {len(concept_links)} concept links")
        
        # If a specific output directory is requested in the job metadata, save there
        output_dir = job.request.metadata.get("output_dir")
        if output_dir:
            output_path = Path(output_dir)
            os.makedirs(output_path, exist_ok=True)
            
            # Save chunks
            with open(output_path / f"{job.id}_chunks.json", "w") as f:
                json.dump([chunk.dict() for chunk in chunks], f, indent=2)
            
            # Save concept links
            with open(output_path / f"{job.id}_concepts.json", "w") as f:
                json.dump([link.dict() for link in concept_links], f, indent=2)
            
            logger.info(f"Saved results to {output_path}")
        
        # In a real implementation, we would create document records
        # and links to the chunks and concepts
        
        return True
        
    except Exception as e:
        logger.exception(f"Error storing results: {str(e)}")
        return False

# Send callback when job is complete
async def send_callback(job: IngestJob) -> bool:
    """
    Send a callback to the URL specified in the job request.
    
    Args:
        job: The completed ingest job
        
    Returns:
        bool: True if the callback succeeded, False otherwise
    """
    if not job.request.callback_url:
        return True
    
    logger.info(f"Sending callback to {job.request.callback_url}: job_id={job.id}")
    
    try:
        response = requests.post(
            job.request.callback_url,
            json={
                "job_id": job.id,
                "status": job.status,
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                "chunks_processed": job.chunks_processed,
                "concepts_mapped": job.concepts_mapped,
                "chunk_ids": job.chunk_ids,
                "concept_ids": job.concept_ids
            },
            timeout=10
        )
        
        if response.status_code >= 200 and response.status_code < 300:
            logger.info(f"Callback succeeded: {response.status_code}")
            return True
        else:
            logger.error(f"Callback failed: {response.status_code} {response.text}")
            return False
        
    except Exception as e:
        logger.exception(f"Error sending callback: {str(e)}")
        return False
