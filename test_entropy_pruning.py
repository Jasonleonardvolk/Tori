#!/usr/bin/env python3
"""
Test script for entropy-based diversity pruning integration
"""

import sys
import os
import logging
from pathlib import Path

# Add ingest_pdf to path
sys.path.insert(0, str(Path(__file__).parent / "ingest_pdf"))

from entropy_prune import entropy_prune, entropy_prune_with_categories

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

def test_basic_entropy_pruning():
    """Test basic entropy pruning functionality"""
    print("\n" + "="*60)
    print("🧪 TEST 1: Basic Entropy Pruning")
    print("="*60)

    # Create test concepts with some similar ones
    test_concepts = [
        {"name": "machine learning", "score": 0.95, "embedding": None},
        {"name": "deep learning", "score": 0.93, "embedding": None},  # Similar to ML
        {"name": "neural networks", "score": 0.91, "embedding": None},  # Similar to DL
        {"name": "quantum computing", "score": 0.88, "embedding": None},  # Different
        {"name": "blockchain technology", "score": 0.85, "embedding": None},  # Different
        {"name": "artificial intelligence", "score": 0.90, "embedding": None},  # Similar to ML
        {"name": "cryptography", "score": 0.82, "embedding": None},  # Different
        {"name": "ML algorithms", "score": 0.87, "embedding": None},  # Similar to ML
    ]

    # Run entropy pruning
    selected, stats = entropy_prune(
        test_concepts,
        top_k=5,
        entropy_threshold=0.01,
        similarity_threshold=0.85,
        verbose=True
    )

    print(f"\n✅ Results:")
    print(f"   Original concepts: {stats['total']}")
    print(f"   Selected diverse: {stats['selected']}")
    print(f"   Pruned similar: {stats['pruned']}")
    print(f"   Final entropy: {stats['final_entropy']:.3f}")

    print(f"\n🌟 Selected concepts:")
    for i, c in enumerate(selected):
        print(f"   {i+1}. {c['name']} (score={c['score']:.2f})")

def test_category_aware_pruning():
    """Test category-aware entropy pruning"""
    print("\n" + "="*60)
    print("🧪 TEST 2: Category-Aware Entropy Pruning")
    print("="*60)

    # Create concepts with categories
    test_concepts = [
        # AI/ML category
        {"name": "machine learning", "score": 0.95, "metadata": {"category": "AI"}},
        {"name": "deep learning", "score": 0.93, "metadata": {"category": "AI"}},
        {"name": "neural networks", "score": 0.91, "metadata": {"category": "AI"}},
        {"name": "reinforcement learning", "score": 0.89, "metadata": {"category": "AI"}},
        
        # Physics category
        {"name": "quantum mechanics", "score": 0.92, "metadata": {"category": "Physics"}},
        {"name": "quantum computing", "score": 0.88, "metadata": {"category": "Physics"}},
        {"name": "quantum entanglement", "score": 0.86, "metadata": {"category": "Physics"}},
        
        # Security category
        {"name": "cryptography", "score": 0.87, "metadata": {"category": "Security"}},
        {"name": "blockchain", "score": 0.85, "metadata": {"category": "Security"}},
        {"name": "encryption", "score": 0.83, "metadata": {"category": "Security"}},
    ]

    # Run category-aware pruning
    selected, stats = entropy_prune_with_categories(
        test_concepts,
        categories=["AI", "Physics", "Security"],
        concepts_per_category=2,
        entropy_threshold=0.01,
        similarity_threshold=0.85,
        verbose=True
    )

    print(f"\n✅ Results by category:")
    for cat, cat_stats in stats.get("by_category", {}).items():
        print(f"   {cat}: {cat_stats['selected']}/{cat_stats['total']} concepts")

    print(f"\n🌟 Selected concepts:")
    for cat in ["AI", "Physics", "Security"]:
        cat_concepts = [c for c in selected if c.get('metadata', {}).get('category') == cat]
        if cat_concepts:
            print(f"\n   {cat}:")
            for c in cat_concepts:
                print(f"     - {c['name']} (score={c['score']:.2f})")

def test_pipeline_integration():
    """Test integration with main pipeline"""
    print("\n" + "="*60)
    print("🧪 TEST 3: Pipeline Integration Check")
    print("="*60)

    try:
        from pipeline import ENABLE_ENTROPY_PRUNING, ENTROPY_CONFIG
        print(f"✅ Entropy pruning enabled: {ENABLE_ENTROPY_PRUNING}")
        print(f"✅ Configuration:")
        for key, value in ENTROPY_CONFIG.items():
            print(f"   - {key}: {value}")
    except ImportError as e:
        print(f"❌ Failed to import pipeline config: {e}")

if __name__ == "__main__":
    print("🚀 ENTROPY-BASED DIVERSITY PRUNING TEST SUITE")
    print("=" * 60)

    # Run all tests
    test_basic_entropy_pruning()
    test_category_aware_pruning()
    test_pipeline_integration()

    print("\n✅ All tests complete!")
