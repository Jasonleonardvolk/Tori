#!/usr/bin/env python3
"""
TORI Auto-Upload Beast 🤖
Processes 23GB of arXiv/Nature PDFs automatically while you enjoy a beer! 🍺

Usage: python auto_upload_pdfs.py
Features: Progress tracking, error recovery, parallel processing, beer time!
"""

import os
import asyncio
import aiohttp
import aiofiles
from pathlib import Path
import time
import json
from typing import List, Dict
import logging
from concurrent.futures import ThreadPoolExecutor

# Configuration
PDF_DIRECTORY = r"C:\Users\jason\Desktop\tori\kha\data\USB Drive"
API_BASE_URL = "http://localhost:8002"
MAX_CONCURRENT_UPLOADS = 3  # Don't overwhelm the system
MAX_FILE_SIZE_MB = 50  # Skip files larger than this
SUPPORTED_EXTENSIONS = ['.pdf']
PROGRESS_FILE = "upload_progress.json"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pdf_upload.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class BeerTimeUploader:
    def __init__(self):
        self.processed_files = self.load_progress()
        self.stats = {
            'total_files': 0,
            'processed': 0,
            'successful': 0,
            'failed': 0,
            'skipped': 0,
            'total_size_mb': 0,
            'start_time': time.time()
        }
    
    def load_progress(self) -> set:
        """Load previously processed files to resume where we left off"""
        try:
            if os.path.exists(PROGRESS_FILE):
                with open(PROGRESS_FILE, 'r') as f:
                    data = json.load(f)
                    return set(data.get('processed_files', []))
        except Exception as e:
            logger.warning(f"Could not load progress: {e}")
        return set()
    
    def save_progress(self):
        """Save progress so we can resume if interrupted"""
        try:
            with open(PROGRESS_FILE, 'w') as f:
                json.dump({
                    'processed_files': list(self.processed_files),
                    'stats': self.stats,
                    'last_update': time.time()
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save progress: {e}")
    
    def get_pdf_files(self) -> List[Path]:
        """Recursively find all PDF files in the directory"""
        pdf_files = []
        
        logger.info(f"🔍 Scanning {PDF_DIRECTORY} for PDF files...")
        
        for root, dirs, files in os.walk(PDF_DIRECTORY):
            for file in files:
                if any(file.lower().endswith(ext) for ext in SUPPORTED_EXTENSIONS):
                    file_path = Path(root) / file
                    
                    # Skip if already processed
                    if str(file_path) in self.processed_files:
                        self.stats['skipped'] += 1
                        continue
                    
                    # Check file size
                    try:
                        file_size_mb = file_path.stat().st_size / (1024 * 1024)
                        if file_size_mb > MAX_FILE_SIZE_MB:
                            logger.warning(f"⚠️ Skipping large file ({file_size_mb:.1f}MB): {file}")
                            self.stats['skipped'] += 1
                            continue
                        
                        pdf_files.append(file_path)
                        self.stats['total_size_mb'] += file_size_mb
                        
                    except Exception as e:
                        logger.error(f"❌ Error checking file {file}: {e}")
                        self.stats['failed'] += 1
        
        self.stats['total_files'] = len(pdf_files)
        logger.info(f"📊 Found {len(pdf_files)} PDF files ({self.stats['total_size_mb']:.1f}MB total)")
        logger.info(f"📊 Skipped {self.stats['skipped']} files (already processed or too large)")
        
        return pdf_files
    
    async def upload_single_pdf(self, session: aiohttp.ClientSession, pdf_path: Path) -> Dict:
        """Upload a single PDF file"""
        try:
            logger.info(f"📤 Uploading: {pdf_path.name}")
            
            # Read file
            async with aiofiles.open(pdf_path, 'rb') as f:
                file_content = await f.read()
            
            # Prepare multipart data
            data = aiohttp.FormData()
            data.add_field('file', file_content, 
                          filename=pdf_path.name, 
                          content_type='application/pdf')
            
            # Upload with timeout
            timeout = aiohttp.ClientTimeout(total=300)  # 5 minute timeout per file
            async with session.post(f"{API_BASE_URL}/extract", 
                                  data=data, 
                                  timeout=timeout) as response:
                
                if response.status == 200:
                    result = await response.json()
                    
                    concepts_count = result.get('concept_count', 0)
                    processing_time = result.get('processing_time_seconds', 0)
                    
                    logger.info(f"✅ Success: {pdf_path.name} -> {concepts_count} concepts ({processing_time:.1f}s)")
                    
                    # Mark as processed
                    self.processed_files.add(str(pdf_path))
                    self.stats['successful'] += 1
                    
                    return {
                        'status': 'success',
                        'file': str(pdf_path),
                        'concepts': concepts_count,
                        'processing_time': processing_time
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Upload failed ({response.status}): {pdf_path.name} - {error_text}")
                    self.stats['failed'] += 1
                    
                    return {
                        'status': 'failed',
                        'file': str(pdf_path),
                        'error': f"HTTP {response.status}: {error_text}"
                    }
        
        except asyncio.TimeoutError:
            logger.error(f"⏰ Timeout uploading: {pdf_path.name}")
            self.stats['failed'] += 1
            return {'status': 'timeout', 'file': str(pdf_path)}
            
        except Exception as e:
            logger.error(f"❌ Error uploading {pdf_path.name}: {str(e)}")
            self.stats['failed'] += 1
            return {'status': 'error', 'file': str(pdf_path), 'error': str(e)}
        
        finally:
            self.stats['processed'] += 1
            
            # Save progress every 10 files
            if self.stats['processed'] % 10 == 0:
                self.save_progress()
                self.print_progress()
    
    def print_progress(self):
        """Print current progress stats"""
        elapsed = time.time() - self.stats['start_time']
        rate = self.stats['processed'] / elapsed if elapsed > 0 else 0
        eta = (self.stats['total_files'] - self.stats['processed']) / rate if rate > 0 else 0
        
        logger.info(f"📊 Progress: {self.stats['processed']}/{self.stats['total_files']} "
                   f"({self.stats['successful']} ✅, {self.stats['failed']} ❌) "
                   f"| Rate: {rate:.1f} files/min | ETA: {eta/60:.1f} min")
    
    async def upload_all_pdfs(self):
        """Main upload orchestrator"""
        pdf_files = self.get_pdf_files()
        
        if not pdf_files:
            logger.info("🍺 No new files to process! Time for that beer! 🍺")
            return
        
        logger.info(f"🚀 Starting batch upload of {len(pdf_files)} files...")
        logger.info(f"🍺 Estimated time: {len(pdf_files) * 25 / 60:.1f} minutes - perfect for multiple beers!")
        
        # Create semaphore to limit concurrent uploads
        semaphore = asyncio.Semaphore(MAX_CONCURRENT_UPLOADS)
        
        async def bounded_upload(session, pdf_path):
            async with semaphore:
                return await self.upload_single_pdf(session, pdf_path)
        
        # Upload all files with concurrency control
        connector = aiohttp.TCPConnector(limit=MAX_CONCURRENT_UPLOADS)
        async with aiohttp.ClientSession(connector=connector) as session:
            
            # Test API availability first
            try:
                async with session.get(f"{API_BASE_URL}/health") as response:
                    if response.status != 200:
                        logger.error(f"❌ API not available: {response.status}")
                        return
                    logger.info("✅ API is healthy, starting uploads...")
            except Exception as e:
                logger.error(f"❌ Cannot connect to API: {e}")
                logger.info("💡 Make sure TORI backend is running: cd C:\\Users\\jason\\Desktop\\tori\\kha && python start_dynamic_api.py")
                return
            
            # Process all files
            tasks = [bounded_upload(session, pdf_path) for pdf_path in pdf_files]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Final progress save
        self.save_progress()
        
        # Print final stats
        elapsed = time.time() - self.stats['start_time']
        total_concepts = sum(r.get('concepts', 0) for r in results if isinstance(r, dict) and r.get('status') == 'success')
        
        logger.info("🎉 " + "="*50)
        logger.info("🎉 BEER TIME UPLOAD COMPLETE!")
        logger.info("🎉 " + "="*50)
        logger.info(f"📊 Total files processed: {self.stats['processed']}")
        logger.info(f"✅ Successful uploads: {self.stats['successful']}")
        logger.info(f"❌ Failed uploads: {self.stats['failed']}")
        logger.info(f"⏱️ Total time: {elapsed/60:.1f} minutes")
        logger.info(f"🧠 Total concepts extracted: {total_concepts:,}")
        logger.info(f"📈 Average concepts per file: {total_concepts/self.stats['successful']:.1f}")
        logger.info(f"🍺 Perfect! Your knowledge base is now MASSIVE!")
        logger.info("🎉 " + "="*50)

async def main():
    """Beer time starts here! 🍺"""
    print("🍺 TORI Auto-Upload Beast Starting!")
    print("🤖 Processing 23GB of arXiv/Nature PDFs...")
    print("🍺 Go grab that beer - this will take a while!")
    print("="*50)
    
    uploader = BeerTimeUploader()
    await uploader.upload_all_pdfs()
    
    print("🍺 Enjoy your beer! The beast is working! 🤖")

if __name__ == "__main__":
    asyncio.run(main())
