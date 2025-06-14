#!/usr/bin/env python3
"""
Prajna PDF-Only Data Ingestion System - FIXED VERSION
====================================================

Specialized PDF processing and ingestion for Prajna's consciousness.
Focuses exclusively on PDF documents with advanced text extraction.
SAVES OUTPUT TO JSON FILES FOR STATS VIEWING!
"""

import os
import sys
import asyncio
import logging
import time
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import concurrent.futures
import hashlib
import re

# PDF processing imports
try:
    import PyPDF2
    PDF_EXTRACTION_AVAILABLE = True
except ImportError:
    PDF_EXTRACTION_AVAILABLE = False
    print("⚠️ PyPDF2 not available - install with: pip install PyPDF2")

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    print("💡 PyMuPDF not available - install with: pip install PyMuPDF for better PDF processing")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prajna.pdf_ingest")

@dataclass
class PDFDocument:
    """Represents a PDF document to be ingested"""
    path: str
    size: int
    pages: int
    title: str
    author: str
    subject: str
    content_hash: str
    text_content: str = ""
    concepts: List[str] = None
    document_type: str = ""
    
    def __post_init__(self):
        if self.concepts is None:
            self.concepts = []

@dataclass
class PDFIngestionStats:
    """Statistics for PDF ingestion process"""
    total_pdfs: int = 0
    processed_pdfs: int = 0
    failed_pdfs: int = 0
    total_pages: int = 0
    total_size: int = 0
    processed_size: int = 0
    start_time: float = 0.0
    
    @property
    def progress_percent(self) -> float:
        return (self.processed_pdfs / max(1, self.total_pdfs)) * 100
    
    @property
    def processing_rate(self) -> float:
        elapsed = time.time() - self.start_time
        return self.processed_pdfs / max(1, elapsed)

class PrajnaPDFIngestor:
    """
    Specialized PDF ingestion system for Prajna's consciousness
    
    Features:
    - Advanced PDF text extraction
    - Metadata preservation
    - Concept extraction from content
    - Title and author analysis
    - Academic paper recognition
    - Research document categorization
    - SAVES RESULTS TO JSON FILES!
    """
    
    def __init__(self, data_directory: str):
        self.data_dir = Path(data_directory)
        self.stats = PDFIngestionStats()
        self.processed_hashes = set()
        self.batch_size = 25
        self.max_workers = 3
        
        # Output files for stats viewing
        self.pdf_knowledge_file = Path("prajna_pdf_knowledge.json")
        self.pdf_concepts_file = Path("prajna_pdf_concepts.json")
        
        # Load existing data if available
        self.pdf_documents = []
        self.concept_index = {}
        self.document_types = {}
        self._load_existing_data()
        
        # PDF-specific patterns
        self.academic_patterns = [
            r'\babstract\b', r'\bintroduction\b', r'\bmethodology\b',
            r'\bresults\b', r'\bconclusion\b', r'\breferences\b',
            r'\bbibliography\b', r'\backnowledg\w+\b'
        ]
        
        self.concept_patterns = [
            r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b',  # Title case terms
            r'\b\w+(?:tion|sion|ment|ness|ity|ism)\b',  # Common suffixes
            r'\b(?:machine|artificial|deep|neural|quantum|cognitive)\s+\w+\b'  # Tech terms
        ]
        
        logger.info(f"📚 Prajna PDF Ingestor initialized for: {self.data_dir}")
    
    def _load_existing_data(self):
        """Load existing PDF data if available"""
        try:
            if self.pdf_knowledge_file.exists():
                with open(self.pdf_knowledge_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.pdf_documents = data.get('pdf_documents', [])
                    # Load processed hashes
                    for doc in self.pdf_documents:
                        if 'content_hash' in doc:
                            self.processed_hashes.add(doc['content_hash'])
                logger.info(f"📚 Loaded {len(self.pdf_documents)} existing PDF documents")
        except Exception as e:
            logger.warning(f"⚠️ Could not load existing data: {e}")
    
    def _save_pdf_knowledge(self):
        """Save PDF knowledge to JSON file"""
        try:
            knowledge_data = {
                "metadata": {
                    "processing_date": datetime.now().isoformat(),
                    "total_documents": len(self.pdf_documents),
                    "total_pages": sum(doc.get('pages', 0) for doc in self.pdf_documents),
                    "ingestion_stats": {
                        "processed_pdfs": self.stats.processed_pdfs,
                        "failed_pdfs": self.stats.failed_pdfs,
                        "processing_rate": self.stats.processing_rate
                    }
                },
                "pdf_documents": self.pdf_documents
            }
            
            with open(self.pdf_knowledge_file, 'w', encoding='utf-8') as f:
                json.dump(knowledge_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"💾 Saved PDF knowledge to {self.pdf_knowledge_file}")
            
        except Exception as e:
            logger.error(f"❌ Failed to save PDF knowledge: {e}")
    
    def _save_pdf_concepts(self):
        """Save PDF concepts index to JSON file"""
        try:
            concepts_data = {
                "metadata": {
                    "last_updated": datetime.now().isoformat(),
                    "total_concepts": len(self.concept_index),
                    "total_document_types": len(self.document_types)
                },
                "concepts": self.concept_index,
                "document_types": self.document_types
            }
            
            with open(self.pdf_concepts_file, 'w', encoding='utf-8') as f:
                json.dump(concepts_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"💾 Saved PDF concepts to {self.pdf_concepts_file}")
            
        except Exception as e:
            logger.error(f"❌ Failed to save PDF concepts: {e}")
    
    async def discover_pdfs(self) -> List[PDFDocument]:
        """Discover all PDF files in the data directory"""
        logger.info(f"🔍 Discovering PDF files in {self.data_dir}...")
        
        discovered_pdfs = []
        
        # Recursively find all PDF files
        for pdf_path in self.data_dir.rglob("*.pdf"):
            if not pdf_path.exists() or pdf_path.stat().st_size == 0:
                continue
            
            # Calculate content hash
            content_hash = self._calculate_file_hash(pdf_path)
            
            # Skip if already processed
            if content_hash in self.processed_hashes:
                logger.info(f"⏭️ Skipping already processed: {pdf_path.name}")
                continue
            
            # Extract basic PDF info
            pdf_info = await self._extract_pdf_info(pdf_path)
            
            if pdf_info:
                pdf_doc = PDFDocument(
                    path=str(pdf_path),
                    size=pdf_path.stat().st_size,
                    pages=pdf_info.get('pages', 0),
                    title=pdf_info.get('title', pdf_path.stem),
                    author=pdf_info.get('author', 'Unknown'),
                    subject=pdf_info.get('subject', ''),
                    content_hash=content_hash
                )
                
                discovered_pdfs.append(pdf_doc)
        
        # Sort by size (smaller PDFs first for faster initial processing)
        discovered_pdfs.sort(key=lambda p: p.size)
        
        self.stats.total_pdfs = len(discovered_pdfs)
        self.stats.total_pages = sum(p.pages for p in discovered_pdfs)
        self.stats.total_size = sum(p.size for p in discovered_pdfs)
        
        logger.info(f"📊 Discovered {len(discovered_pdfs)} NEW PDF files to process")
        logger.info(f"📊 Total pages: {self.stats.total_pages:,}")
        logger.info(f"📊 Total size: {self._format_size(self.stats.total_size)}")
        
        return discovered_pdfs
    
    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash of file content"""
        try:
            hasher = hashlib.sha256()
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(8192), b""):
                    hasher.update(chunk)
            return hasher.hexdigest()[:16]
        except Exception:
            return str(file_path)
    
    async def _extract_pdf_info(self, pdf_path: Path) -> Optional[Dict[str, Any]]:
        """Extract basic PDF information"""
        try:
            if PYMUPDF_AVAILABLE:
                return await self._extract_with_pymupdf(pdf_path)
            elif PDF_EXTRACTION_AVAILABLE:
                return await self._extract_with_pypdf2(pdf_path)
            else:
                # Fallback - just file info
                return {
                    'pages': 0,
                    'title': pdf_path.stem,
                    'author': 'Unknown',
                    'subject': ''
                }
        except Exception as e:
            logger.warning(f"⚠️ Failed to extract PDF info from {pdf_path}: {e}")
            return None
    
    async def _extract_with_pymupdf(self, pdf_path: Path) -> Dict[str, Any]:
        """Extract PDF info using PyMuPDF (recommended)"""
        doc = fitz.open(str(pdf_path))
        metadata = doc.metadata
        
        result = {
            'pages': doc.page_count,
            'title': metadata.get('title', pdf_path.stem) or pdf_path.stem,
            'author': metadata.get('author', 'Unknown') or 'Unknown',
            'subject': metadata.get('subject', '') or '',
            'creator': metadata.get('creator', ''),
            'producer': metadata.get('producer', '')
        }
        
        doc.close()
        return result
    
    async def _extract_with_pypdf2(self, pdf_path: Path) -> Dict[str, Any]:
        """Extract PDF info using PyPDF2 (fallback)"""
        with open(pdf_path, 'rb') as f:
            pdf_reader = PyPDF2.PdfReader(f)
            
            info = pdf_reader.metadata if pdf_reader.metadata else {}
            
            return {
                'pages': len(pdf_reader.pages),
                'title': info.get('/Title', pdf_path.stem) or pdf_path.stem,
                'author': info.get('/Author', 'Unknown') or 'Unknown',
                'subject': info.get('/Subject', '') or ''
            }
    
    async def ingest_pdfs(self, max_pdfs: Optional[int] = None) -> PDFIngestionStats:
        """Main PDF ingestion process"""
        logger.info("📚 Starting PDF-only ingestion for Prajna's consciousness...")
        
        self.stats.start_time = time.time()
        
        # Discover PDFs
        pdfs_to_process = await self.discover_pdfs()
        
        if not pdfs_to_process:
            logger.info("✅ No new PDFs to process - all files already ingested!")
            self._save_pdf_knowledge()
            self._save_pdf_concepts()
            return self.stats
        
        if max_pdfs:
            pdfs_to_process = pdfs_to_process[:max_pdfs]
            logger.info(f"🔢 Limited to {max_pdfs} PDFs for this run")
        
        # Process PDFs in batches
        logger.info(f"⚡ Processing {len(pdfs_to_process)} PDFs in batches of {self.batch_size}...")
        
        for i in range(0, len(pdfs_to_process), self.batch_size):
            batch = pdfs_to_process[i:i + self.batch_size]
            
            logger.info(f"📦 Processing PDF batch {i//self.batch_size + 1}/{(len(pdfs_to_process)-1)//self.batch_size + 1}")
            
            # Process batch with controlled concurrency
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                tasks = []
                for pdf_doc in batch:
                    task = executor.submit(self._process_pdf_sync, pdf_doc)
                    tasks.append(task)
                
                # Wait for batch completion
                for task in concurrent.futures.as_completed(tasks):
                    try:
                        result = task.result()
                        if result:
                            self.stats.processed_pdfs += 1
                            self.stats.processed_size += result.get('size', 0)
                            
                            # Add to documents list
                            self.pdf_documents.append(result['document'])
                            
                            # Update concept index
                            self._update_concept_index(result['document'])
                            
                        else:
                            self.stats.failed_pdfs += 1
                    except Exception as e:
                        self.stats.failed_pdfs += 1
                        logger.error(f"❌ PDF processing failed: {e}")
            
            # Progress update
            self._print_progress()
            
            # Save progress after each batch
            self._save_pdf_knowledge()
            self._save_pdf_concepts()
            
            # Brief delay between batches
            await asyncio.sleep(0.5)
        
        # Final save
        self._save_pdf_knowledge()
        self._save_pdf_concepts()
        
        # Final statistics
        elapsed_time = time.time() - self.stats.start_time
        logger.info(f"\n🎉 PDF INGESTION COMPLETE!")
        logger.info(f"📊 Processed: {self.stats.processed_pdfs}/{self.stats.total_pdfs} PDFs")
        logger.info(f"📊 Total pages: {self.stats.total_pages:,}")
        logger.info(f"📊 Data size: {self._format_size(self.stats.processed_size)}")
        logger.info(f"📊 Time taken: {elapsed_time:.1f} seconds")
        logger.info(f"📊 Rate: {self.stats.processing_rate:.1f} PDFs/second")
        logger.info(f"📊 Failed: {self.stats.failed_pdfs} PDFs")
        
        return self.stats
    
    def _update_concept_index(self, document):
        """Update concept index with document concepts"""
        doc_type = document.get('document_type', 'unknown')
        
        # Update document type count
        if doc_type not in self.document_types:
            self.document_types[doc_type] = 0
        self.document_types[doc_type] += 1
        
        # Update concept index
        for concept in document.get('concepts', []):
            if concept not in self.concept_index:
                self.concept_index[concept] = {
                    'count': 0,
                    'documents': []
                }
            
            self.concept_index[concept]['count'] += 1
            self.concept_index[concept]['documents'].append({
                'title': document.get('title', 'Unknown'),
                'path': document.get('file_path', ''),
                'document_type': doc_type
            })
    
    def _process_pdf_sync(self, pdf_doc: PDFDocument) -> Optional[Dict[str, Any]]:
        """Synchronous PDF processing (for thread pool)"""
        try:
            return asyncio.run(self._process_pdf(pdf_doc))
        except Exception as e:
            logger.error(f"❌ Failed to process PDF {pdf_doc.path}: {e}")
            return None
    
    async def _process_pdf(self, pdf_doc: PDFDocument) -> Optional[Dict[str, Any]]:
        """Process a single PDF document"""
        try:
            # Extract full text content
            text_content = await self._extract_pdf_text(Path(pdf_doc.path))
            
            if text_content:
                pdf_doc.text_content = text_content[:50000]  # Limit to 50KB of text
                
                # Extract concepts from content
                pdf_doc.concepts = await self._extract_concepts(text_content)
                
                # Determine document type
                pdf_doc.document_type = self._classify_pdf_type(text_content, pdf_doc)
            
            # Create comprehensive PDF entry
            pdf_entry = {
                'file_path': pdf_doc.path,
                'file_type': 'pdf_document',
                'title': pdf_doc.title,
                'author': pdf_doc.author,
                'subject': pdf_doc.subject,
                'pages': pdf_doc.pages,
                'text_content': pdf_doc.text_content,
                'concepts': pdf_doc.concepts,
                'document_type': pdf_doc.document_type,
                'content_hash': pdf_doc.content_hash,
                'size': pdf_doc.size,
                'ingestion_time': datetime.now().isoformat(),
                'research_field': self._determine_research_field(text_content),
                'technical_level': self._assess_technical_level(text_content),
                'citation_count': self._count_citations(text_content)
            }
            
            # Mark as processed
            self.processed_hashes.add(pdf_doc.content_hash)
            
            return {
                'size': pdf_doc.size, 
                'pages': pdf_doc.pages,
                'document': pdf_entry
            }
            
        except Exception as e:
            logger.warning(f"⚠️ Failed to process PDF {pdf_doc.path}: {e}")
            return None
    
    async def _extract_pdf_text(self, pdf_path: Path) -> str:
        """Extract text content from PDF"""
        try:
            if PYMUPDF_AVAILABLE:
                return await self._extract_text_pymupdf(pdf_path)
            elif PDF_EXTRACTION_AVAILABLE:
                return await self._extract_text_pypdf2(pdf_path)
            else:
                return f"PDF document: {pdf_path.name} (text extraction not available)"
        except Exception as e:
            logger.warning(f"⚠️ Text extraction failed for {pdf_path}: {e}")
            return f"PDF document: {pdf_path.name} (extraction failed)"
    
    async def _extract_text_pymupdf(self, pdf_path: Path) -> str:
        """Extract text using PyMuPDF"""
        doc = fitz.open(str(pdf_path))
        text_content = ""
        
        # Extract text from each page (limit to first 100 pages for performance)
        for page_num in range(min(100, doc.page_count)):
            page = doc[page_num]
            text_content += page.get_text() + "\n\n"
        
        doc.close()
        return text_content
    
    async def _extract_text_pypdf2(self, pdf_path: Path) -> str:
        """Extract text using PyPDF2"""
        with open(pdf_path, 'rb') as f:
            pdf_reader = PyPDF2.PdfReader(f)
            text_content = ""
            
            # Extract text from each page (limit to first 100 pages)
            for page_num in range(min(100, len(pdf_reader.pages))):
                page = pdf_reader.pages[page_num]
                text_content += page.extract_text() + "\n\n"
        
        return text_content
    
    async def _extract_concepts(self, text_content: str) -> List[str]:
        """Extract key concepts from PDF text content"""
        concepts = set()
        text_lower = text_content.lower()
        
        # Extract using concept patterns
        for pattern in self.concept_patterns:
            matches = re.findall(pattern, text_content, re.IGNORECASE)
            concepts.update([match.lower().strip() for match in matches if len(match) > 3])
        
        # Academic/research indicators
        if any(re.search(pattern, text_lower) for pattern in self.academic_patterns):
            concepts.add('academic_paper')
            concepts.add('research')
        
        # Technology indicators
        tech_terms = ['ai', 'machine learning', 'neural network', 'algorithm', 'data', 'model',
                     'quantum', 'physics', 'mathematics', 'computer science', 'engineering']
        for term in tech_terms:
            if term in text_lower:
                concepts.add(term.replace(' ', '_'))
        
        # Domain-specific terms
        domain_terms = ['soliton', 'schrödinger', 'nonlinear', 'eigenvalue', 'spectral',
                       'cognition', 'consciousness', 'neural', 'brain', 'memory']
        for term in domain_terms:
            if term in text_lower:
                concepts.add(term)
        
        return list(concepts)[:100]  # Limit to top 100 concepts
    
    def _classify_pdf_type(self, text_content: str, pdf_doc: PDFDocument) -> str:
        """Classify the type of PDF document"""
        text_lower = text_content.lower()
        
        # Academic paper
        if any(re.search(pattern, text_lower) for pattern in self.academic_patterns):
            if any(term in text_lower for term in ['arxiv', 'doi:', 'journal', 'proceedings']):
                return 'academic_paper'
            return 'research_document'
        
        # Technical documentation
        if any(word in text_lower for word in ['api', 'documentation', 'manual', 'guide', 'tutorial']):
            return 'technical_documentation'
        
        # Thesis/dissertation
        if any(word in text_lower for word in ['thesis', 'dissertation', 'phd', 'master']):
            return 'thesis'
        
        # Book/ebook
        if pdf_doc.pages > 100 and any(word in text_lower for word in ['chapter', 'table of contents']):
            return 'book'
        
        # Report
        if any(word in text_lower for word in ['report', 'analysis', 'findings', 'executive summary']):
            return 'report'
        
        # Presentation
        if pdf_doc.pages < 50 and any(word in text_lower for word in ['slide', 'presentation']):
            return 'presentation'
        
        # White paper
        if any(word in text_lower for word in ['white paper', 'whitepaper', 'technical paper']):
            return 'whitepaper'
        
        return 'general_document'
    
    def _determine_research_field(self, text_content: str) -> str:
        """Determine the research field of the document"""
        text_lower = text_content.lower()
        
        field_indicators = {
            'physics': ['quantum', 'particle', 'relativity', 'thermodynamics', 'electromagnetic'],
            'mathematics': ['theorem', 'proof', 'equation', 'algebra', 'calculus', 'topology'],
            'computer_science': ['algorithm', 'programming', 'software', 'database', 'computation'],
            'artificial_intelligence': ['machine learning', 'neural network', 'ai', 'deep learning'],
            'neuroscience': ['brain', 'neuron', 'cognitive', 'neural', 'consciousness'],
            'biology': ['cell', 'organism', 'gene', 'protein', 'evolution'],
            'chemistry': ['molecule', 'reaction', 'compound', 'synthesis', 'catalyst'],
            'psychology': ['behavior', 'cognition', 'mental', 'psychological', 'therapy']
        }
        
        for field, indicators in field_indicators.items():
            if any(indicator in text_lower for indicator in indicators):
                return field
        
        return 'general'
    
    def _assess_technical_level(self, text_content: str) -> str:
        """Assess the technical level of the document"""
        text_lower = text_content.lower()
        
        # Count technical indicators
        technical_terms = len(re.findall(r'\b(?:algorithm|theorem|equation|methodology|analysis)\b', text_lower))
        math_symbols = len(re.findall(r'[αβγδεζηθικλμνξοπρστυφχψω∑∏∫∂∇]', text_content))
        
        if technical_terms > 10 or math_symbols > 5:
            return 'graduate'
        elif technical_terms > 5 or math_symbols > 2:
            return 'undergraduate'
        else:
            return 'general_public'
    
    def _count_citations(self, text_content: str) -> int:
        """Count the number of citations in the document"""
        citation_patterns = [
            r'\[\d+\]',  # [1], [2], etc.
            r'\(\w+,?\s*\d{4}\)',  # (Author, 2023)
            r'et al\.',  # et al.
            r'DOI:\s*\S+',  # DOI references
        ]
        
        citation_count = 0
        for pattern in citation_patterns:
            citation_count += len(re.findall(pattern, text_content, re.IGNORECASE))
        
        return citation_count
    
    def _print_progress(self):
        """Print PDF ingestion progress"""
        elapsed = time.time() - self.stats.start_time
        rate = self.stats.processing_rate
        
        print(f"\r📚 PDF Progress: {self.stats.progress_percent:.1f}% | "
              f"PDFs: {self.stats.processed_pdfs}/{self.stats.total_pdfs} | "
              f"Rate: {rate:.1f}/sec | "
              f"Failed: {self.stats.failed_pdfs} | "
              f"Time: {elapsed:.0f}s", end="", flush=True)
    
    def _format_size(self, size_bytes: int) -> str:
        """Format file size in human readable form"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.1f} TB"

async def main():
    """Main PDF ingestion function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Ingest PDF documents into Prajna")
    parser.add_argument("--data-dir", default="C:\\Users\\jason\\Desktop\\tori\\kha\\data",
                       help="Data directory to scan for PDFs")
    parser.add_argument("--max-pdfs", type=int, help="Maximum PDFs to process")
    parser.add_argument("--batch-size", type=int, default=25, help="PDF batch size")
    parser.add_argument("--workers", type=int, default=3, help="Number of workers")
    
    args = parser.parse_args()
    
    # Create PDF ingestor
    ingestor = PrajnaPDFIngestor(args.data_dir)
    ingestor.batch_size = args.batch_size
    ingestor.max_workers = args.workers
    
    # Run PDF ingestion
    stats = await ingestor.ingest_pdfs(max_pdfs=args.max_pdfs)
    
    print(f"\n\n🎉 PRAJNA PDF INGESTION COMPLETE!")
    print(f"📚 Prajna's consciousness has absorbed:")
    print(f"   📄 {stats.processed_pdfs} PDF documents")
    print(f"   📃 {stats.total_pages:,} total pages")
    print(f"   💾 {ingestor._format_size(stats.processed_size)} of PDF data")
    print(f"   ⚡ {stats.processing_rate:.1f} PDFs per second")
    print(f"   ❌ {stats.failed_pdfs} failed PDFs")
    print(f"\n💾 Results saved to:")
    print(f"   📚 {ingestor.pdf_knowledge_file}")
    print(f"   🧠 {ingestor.pdf_concepts_file}")
    print(f"\n🧠 Prajna is now ready to reason with PDF knowledge!")

if __name__ == "__main__":
    asyncio.run(main())
