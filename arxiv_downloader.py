#!/usr/bin/env python3
"""
ArXiv Auto-Downloader Beast 📚
Downloads papers from arXiv automatically based on categories/keywords
Perfect for building massive knowledge foundations! 🧠

Usage: python arxiv_downloader.py
Features: Category-based downloading, keyword filtering, rate limiting, beer time!
"""

import arxiv
import os
import time
import json
import logging
from pathlib import Path
from typing import List, Dict, Set
import requests
from datetime import datetime, timedelta
import re

# Configuration
DOWNLOAD_DIR = r"C:\Users\jason\Desktop\tori\kha\data\arxiv_downloads"
MAX_PAPERS_PER_CATEGORY = 100  # Adjust based on your appetite
MAX_PAPERS_TOTAL = 1000  # Total limit to prevent runaway downloading
RATE_LIMIT_DELAY = 2  # Seconds between downloads (be nice to arXiv)
PROGRESS_FILE = "arxiv_download_progress.json"

# ArXiv categories for building comprehensive knowledge base
ARXIV_CATEGORIES = {
    # AI & Machine Learning
    "cs.AI": "Artificial Intelligence",
    "cs.LG": "Machine Learning", 
    "cs.CL": "Natural Language Processing",
    "cs.CV": "Computer Vision",
    "cs.NE": "Neural Networks",
    "stat.ML": "Statistics - Machine Learning",
    
    # Physics & Mathematics  
    "physics.gen-ph": "General Physics",
    "quant-ph": "Quantum Physics",
    "math.ST": "Statistics Theory",
    "math.PR": "Probability",
    
    # Biology & Life Sciences
    "q-bio.GN": "Genomics",
    "q-bio.MN": "Molecular Networks", 
    "q-bio.PE": "Populations and Evolution",
    
    # Economics & Finance
    "econ.EM": "Econometrics",
    "q-fin.GN": "General Finance",
    
    # Other Sciences
    "astro-ph.GA": "Astrophysics - Galaxies",
    "cond-mat.stat-mech": "Statistical Mechanics"
}

# High-value keywords to prioritize
PRIORITY_KEYWORDS = [
    "consciousness", "artificial intelligence", "machine learning", "neural networks",
    "quantum", "evolution", "cognition", "language models", "transformer",
    "attention mechanism", "reinforcement learning", "deep learning",
    "emergence", "complexity", "information theory", "entropy",
    "soliton", "wave dynamics", "nonlinear", "systems theory"
]

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('arxiv_download.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ArxivDownloader:
    def __init__(self):
        self.download_dir = Path(DOWNLOAD_DIR)
        self.download_dir.mkdir(exist_ok=True)
        self.downloaded_papers = self.load_progress()
        self.stats = {
            'total_downloaded': 0,
            'total_size_mb': 0,
            'categories_processed': 0,
            'high_priority_papers': 0,
            'start_time': time.time()
        }
    
    def load_progress(self) -> Set[str]:
        """Load previously downloaded papers to avoid duplicates"""
        try:
            if os.path.exists(PROGRESS_FILE):
                with open(PROGRESS_FILE, 'r') as f:
                    data = json.load(f)
                    return set(data.get('downloaded_papers', []))
        except Exception as e:
            logger.warning(f"Could not load progress: {e}")
        return set()
    
    def save_progress(self):
        """Save progress for resumability"""
        try:
            with open(PROGRESS_FILE, 'w') as f:
                json.dump({
                    'downloaded_papers': list(self.downloaded_papers),
                    'stats': self.stats,
                    'last_update': time.time()
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save progress: {e}")
    
    def calculate_paper_priority(self, paper) -> float:
        """Calculate priority score for a paper based on keywords"""
        title_lower = paper.title.lower()
        abstract_lower = paper.summary.lower()
        
        priority_score = 0.0
        
        # Check for priority keywords
        for keyword in PRIORITY_KEYWORDS:
            if keyword in title_lower:
                priority_score += 2.0  # Title mentions are worth more
            elif keyword in abstract_lower:
                priority_score += 1.0
        
        # Boost recent papers
        if paper.published:
            days_old = (datetime.now() - paper.published.replace(tzinfo=None)).days
            if days_old < 30:  # Recent papers get priority
                priority_score += 1.0
            elif days_old < 90:
                priority_score += 0.5
        
        return priority_score
    
    def search_category(self, category: str, max_results: int) -> List:
        """Search arXiv for papers in a specific category"""
        logger.info(f"🔍 Searching category: {category} ({ARXIV_CATEGORIES.get(category, 'Unknown')})")
        
        try:
            # Create search query
            search = arxiv.Search(
                query=f"cat:{category}",
                max_results=max_results * 2,  # Get extra to allow for filtering
                sort_by=arxiv.SortCriterion.SubmittedDate,
                sort_order=arxiv.SortOrder.Descending
            )
            
            papers = []
            for paper in search.results():
                # Skip if already downloaded
                if paper.entry_id in self.downloaded_papers:
                    continue
                
                # Calculate priority
                priority = self.calculate_paper_priority(paper)
                
                papers.append({
                    'paper': paper,
                    'priority': priority,
                    'category': category
                })
                
                if len(papers) >= max_results:
                    break
            
            # Sort by priority (highest first)
            papers.sort(key=lambda x: x['priority'], reverse=True)
            
            logger.info(f"📊 Found {len(papers)} new papers in {category}")
            if papers:
                avg_priority = sum(p['priority'] for p in papers) / len(papers)
                logger.info(f"📈 Average priority score: {avg_priority:.2f}")
            
            return papers[:max_results]  # Return top papers
            
        except Exception as e:
            logger.error(f"❌ Error searching category {category}: {e}")
            return []
    
    def download_paper(self, paper_info: Dict) -> bool:
        """Download a single paper"""
        paper = paper_info['paper']
        category = paper_info['category']
        priority = paper_info['priority']
        
        try:
            # Create category subdirectory
            category_dir = self.download_dir / category.replace('.', '_')
            category_dir.mkdir(exist_ok=True)
            
            # Generate safe filename
            safe_title = re.sub(r'[^\w\s-]', '', paper.title)[:100]
            safe_title = re.sub(r'\s+', '_', safe_title)
            filename = f"{safe_title}_{paper.entry_id.split('/')[-1]}.pdf"
            filepath = category_dir / filename
            
            # Skip if file already exists
            if filepath.exists():
                logger.info(f"⏭️ Already exists: {filename}")
                self.downloaded_papers.add(paper.entry_id)
                return True
            
            logger.info(f"📥 Downloading [{priority:.1f}★]: {paper.title[:80]}...")
            
            # Download the paper
            paper.download_pdf(dirpath=str(category_dir), filename=filename)
            
            # Track stats
            file_size = filepath.stat().st_size / (1024 * 1024)  # MB
            self.stats['total_size_mb'] += file_size
            self.stats['total_downloaded'] += 1
            
            if priority >= 2.0:
                self.stats['high_priority_papers'] += 1
            
            # Mark as downloaded
            self.downloaded_papers.add(paper.entry_id)
            
            logger.info(f"✅ Downloaded: {filename} ({file_size:.1f}MB)")
            
            # Save metadata
            metadata = {
                'title': paper.title,
                'authors': [str(author) for author in paper.authors],
                'published': paper.published.isoformat() if paper.published else None,
                'categories': paper.categories,
                'priority_score': priority,
                'abstract': paper.summary[:500] + '...' if len(paper.summary) > 500 else paper.summary
            }
            
            metadata_file = filepath.with_suffix('.json')
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error downloading {paper.title}: {e}")
            return False
    
    def download_from_categories(self):
        """Download papers from all configured categories"""
        logger.info(f"🚀 Starting arXiv download from {len(ARXIV_CATEGORIES)} categories")
        logger.info(f"🎯 Max papers per category: {MAX_PAPERS_PER_CATEGORY}")
        logger.info(f"🔒 Total limit: {MAX_PAPERS_TOTAL}")
        logger.info(f"🍺 Perfect time for beer! This will take a while...")
        
        total_downloaded = 0
        
        for category, description in ARXIV_CATEGORIES.items():
            if total_downloaded >= MAX_PAPERS_TOTAL:
                logger.info(f"🛑 Reached total limit of {MAX_PAPERS_TOTAL} papers")
                break
            
            logger.info(f"\n🔄 Processing: {category} - {description}")
            
            # Search for papers in this category
            papers = self.search_category(category, MAX_PAPERS_PER_CATEGORY)
            
            if not papers:
                logger.info(f"⏭️ No new papers found in {category}")
                continue
            
            # Download papers from this category
            category_downloaded = 0
            for paper_info in papers:
                if total_downloaded >= MAX_PAPERS_TOTAL:
                    break
                
                if self.download_paper(paper_info):
                    category_downloaded += 1
                    total_downloaded += 1
                
                # Rate limiting - be nice to arXiv
                time.sleep(RATE_LIMIT_DELAY)
                
                # Save progress periodically
                if total_downloaded % 10 == 0:
                    self.save_progress()
                    self.print_progress()
            
            logger.info(f"📊 Downloaded {category_downloaded} papers from {category}")
            self.stats['categories_processed'] += 1
        
        # Final save
        self.save_progress()
    
    def print_progress(self):
        """Print current download stats"""
        elapsed = time.time() - self.stats['start_time']
        rate = self.stats['total_downloaded'] / (elapsed / 60) if elapsed > 60 else 0
        
        logger.info(f"📊 Progress: {self.stats['total_downloaded']} papers downloaded "
                   f"({self.stats['total_size_mb']:.1f}MB) | "
                   f"Rate: {rate:.1f} papers/min | "
                   f"High-priority: {self.stats['high_priority_papers']}")
    
    def generate_summary(self):
        """Generate final download summary"""
        elapsed = time.time() - self.stats['start_time']
        
        logger.info("🎉 " + "="*60)
        logger.info("🎉 ARXIV DOWNLOAD COMPLETE!")
        logger.info("🎉 " + "="*60)
        logger.info(f"📚 Total papers downloaded: {self.stats['total_downloaded']}")
        logger.info(f"💾 Total size: {self.stats['total_size_mb']:.1f}MB")
        logger.info(f"🌟 High-priority papers: {self.stats['high_priority_papers']}")
        logger.info(f"📂 Categories processed: {self.stats['categories_processed']}")
        logger.info(f"⏱️ Total time: {elapsed/60:.1f} minutes")
        logger.info(f"📍 Papers saved to: {self.download_dir}")
        logger.info(f"🧠 Your knowledge base is now EPIC!")
        logger.info("🎉 " + "="*60)

def main():
    """Start the arXiv downloading beast!"""
    print("📚 ArXiv Auto-Downloader Beast Starting!")
    print("🧠 Building your epic knowledge foundation...")
    print("🍺 Perfect beer time - this will take hours!")
    print("="*60)
    
    downloader = ArxivDownloader()
    downloader.download_from_categories()
    downloader.generate_summary()
    
    print("\n🍺 Enjoy your beer! The knowledge beast delivered! 📚")

if __name__ == "__main__":
    main()
