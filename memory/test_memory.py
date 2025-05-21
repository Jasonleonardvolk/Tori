"""
Memory System Test

This script tests both the dense Hopfield and Ising memory backends.
"""

import numpy as np
import time
import logging
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("memory-test")

# Import memory functions
from hopfield_to_ising import hopfield_to_ising, dense_recall, check_pattern_stability
from dw_sim import ising_recall

def test_hot_swap():
    """
    Test the hot-swap capability between Hopfield and Ising backends.
    """
    # Generate test patterns (simple patterns for testing)
    patterns = np.array([
        [1, -1, 1, -1, 1, -1, 1, -1],  # Alternating
        [-1, 1, -1, 1, -1, 1, -1, 1],   # Reverse alternating
        [1, 1, 1, 1, -1, -1, -1, -1]    # Half-and-half
    ])
    
    # Create noisy cue (80% of pattern 0)
    cue = patterns[0].copy()
    num_noise = 2  # Change 2 bits
    noise_idx = np.random.choice(len(cue), num_noise, replace=False)
    for idx in noise_idx:
        cue[idx] *= -1
    
    logger.info(f"Original pattern: {patterns[0]}")
    logger.info(f"Noisy cue: {cue}")
    
    # Test 1: Dense Hopfield recall
    logger.info("\n--- Testing Dense Hopfield Recall ---")
    t_start = time.time()
    dense_result = dense_recall(patterns, cue, iterations=10)
    t_dense = time.time() - t_start
    
    dense_match = np.array_equal(dense_result, patterns[0])
    dense_similarity = np.sum(dense_result == patterns[0]) / len(patterns[0])
    
    logger.info(f"Dense result: {dense_result}")
    logger.info(f"Match: {dense_match}, Similarity: {dense_similarity:.2f}")
    logger.info(f"Time: {t_dense:.5f} seconds")
    
    # Test 2: Ising model recall
    logger.info("\n--- Testing Ising Model Recall ---")
    t_start = time.time()
    
    # Convert patterns to Ising coupling matrix
    J = hopfield_to_ising(patterns)
    
    # Use Ising recall
    ising_result = ising_recall(J, cue, beta=2.0, steps=1000)
    t_ising = time.time() - t_start
    
    ising_match = np.array_equal(ising_result, patterns[0])
    ising_similarity = np.sum(ising_result == patterns[0]) / len(patterns[0])
    
    logger.info(f"Ising result: {ising_result}")
    logger.info(f"Match: {ising_match}, Similarity: {ising_similarity:.2f}")
    logger.info(f"Time: {t_ising:.5f} seconds")
    
    # Check pattern stability
    logger.info("\n--- Checking Pattern Stability ---")
    for i, pattern in enumerate(patterns):
        is_stable, stability = check_pattern_stability(J, pattern)
        logger.info(f"Pattern {i}: stable={is_stable}, stability={stability:.4f}")
    
    # Summary
    logger.info("\n--- Summary ---")
    logger.info(f"Dense backend: {dense_similarity:.2f} similarity, {t_dense:.5f} seconds")
    logger.info(f"Ising backend: {ising_similarity:.2f} similarity, {t_ising:.5f} seconds")
    
    if dense_match and ising_match:
        logger.info("✅ Both backends successfully recovered the pattern")
        return True
    else:
        logger.info("❌ At least one backend failed to recover the pattern")
        return False

if __name__ == "__main__":
    logger.info("Starting memory backend hot-swap test")
    success = test_hot_swap()
    if success:
        logger.info("All tests passed successfully!")
    else:
        logger.info("Some tests failed.")
