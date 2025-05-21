#!/usr/bin/env python3
"""
Phase Heatmap Downsampler

This module provides efficient downsampling for phase data from large oscillator sets,
preventing Grafana dashboard performance issues when visualizing >4k oscillators.

Usage:
    from phase_downsampler import downsample_phase_data, adaptive_downsample
    
    # Basic usage with reservoir sampling
    downsampled = downsample_phase_data(phases, target_size=1000)
    
    # Adaptive downsampling based on data characteristics
    downsampled = adaptive_downsample(phases, max_points=1000)
"""

import numpy as np
import random
import logging
from typing import List, Dict, Any, Union, Tuple, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("phase_downsampler")

def reservoir_sample(data: List[float], k: int) -> List[float]:
    """
    Perform reservoir sampling to get k random elements from data.
    This provides an unbiased random sample when k < len(data).
    
    Args:
        data: The input data array
        k: The desired sample size
        
    Returns:
        A list of k randomly selected elements
    """
    if len(data) <= k:
        return data.copy()
        
    # Fill the reservoir with the first k elements
    result = data[:k].copy()
    
    # Replace elements with decreasing probability
    for i in range(k, len(data)):
        # Random index in [0, i]
        j = random.randrange(0, i + 1)
        
        # Replace element at j with probability k/(i+1)
        if j < k:
            result[j] = data[i]
    
    return result

def stratified_sample(data: List[float], k: int) -> List[float]:
    """
    Perform stratified sampling to ensure representation across the range.
    
    Args:
        data: The input data array
        k: The desired sample size
        
    Returns:
        A list of k elements distributed across the data range
    """
    if len(data) <= k:
        return data.copy()
    
    # Sort data to create strata
    sorted_data = sorted(data)
    
    # Calculate stratum size
    stratum_size = len(data) // k
    
    # Select one element from each stratum
    result = []
    for i in range(k):
        start_idx = i * stratum_size
        end_idx = min((i + 1) * stratum_size, len(data))
        
        if start_idx < end_idx:
            # Select a random element from this stratum
            idx = random.randint(start_idx, end_idx - 1)
            result.append(sorted_data[idx])
    
    return result

def cluster_based_sample(data: List[float], k: int) -> List[float]:
    """
    Perform cluster-based sampling to preserve the distribution shape.
    
    Args:
        data: The input data array
        k: The desired sample size
        
    Returns:
        A list of k elements representing clusters
    """
    if len(data) <= k:
        return data.copy()
    
    # Simple k-means like approach
    # Convert to numpy for easier manipulation
    np_data = np.array(data)
    
    # Initialize cluster centers
    min_val = np.min(np_data)
    max_val = np.max(np_data)
    if max_val == min_val:
        # All values are the same, return k copies
        return [data[0]] * k
        
    centers = np.linspace(min_val, max_val, k)
    
    # Assign data points to clusters
    clusters = [[] for _ in range(k)]
    for val in np_data:
        # Find closest center
        closest = np.argmin(np.abs(centers - val))
        clusters[closest].append(val)
    
    # Take mean of each cluster
    result = []
    for i, cluster in enumerate(clusters):
        if cluster:
            result.append(float(np.mean(cluster)))
        else:
            # If cluster is empty, use the center
            result.append(float(centers[i]))
    
    return result

def bin_based_downsample(data: List[float], k: int) -> Dict[str, List[float]]:
    """
    Downsample by binning data and computing statistics for each bin.
    
    Args:
        data: The input data array
        k: The desired number of bins
        
    Returns:
        A dictionary with arrays for min, max, mean, median, and std values per bin
    """
    if len(data) <= k:
        return {
            "min": data.copy(),
            "max": data.copy(),
            "mean": data.copy(),
            "median": data.copy(),
            "std": [0.0] * len(data)
        }
    
    # Convert to numpy
    np_data = np.array(data)
    
    # Create bins
    bin_size = len(data) // k
    result = {
        "min": [],
        "max": [],
        "mean": [],
        "median": [],
        "std": []
    }
    
    for i in range(k):
        start_idx = i * bin_size
        end_idx = min((i + 1) * bin_size, len(data))
        
        if start_idx < end_idx:
            bin_data = np_data[start_idx:end_idx]
            result["min"].append(float(np.min(bin_data)))
            result["max"].append(float(np.max(bin_data)))
            result["mean"].append(float(np.mean(bin_data)))
            result["median"].append(float(np.median(bin_data)))
            result["std"].append(float(np.std(bin_data)))
    
    return result

def downsample_phase_data(phases: List[float], target_size: int = 1000, 
                          method: str = "auto") -> Union[List[float], Dict[str, List[float]]]:
    """
    Downsample phase data for large oscillator sets.
    
    Args:
        phases: Original phase data array
        target_size: Desired output size
        method: Sampling method ("reservoir", "stratified", "cluster", "bin", or "auto")
        
    Returns:
        Downsampled data, either as a list or a dictionary with statistics
    """
    if len(phases) <= target_size:
        return phases
    
    logger.info(f"Downsampling {len(phases)} phase values to {target_size} using {method} method")
    
    # Choose method based on data and request
    if method == "auto":
        # Auto-select based on data size and variance
        if len(phases) > 10000:
            method = "bin"  # For very large datasets
        else:
            # Check variance
            np_data = np.array(phases)
            variance = np.var(np_data)
            if variance < 0.1:  # Low variance
                method = "stratified"  # Ensure representation
            else:
                method = "reservoir"  # Random sampling
    
    # Apply selected method
    if method == "reservoir":
        return reservoir_sample(phases, target_size)
    elif method == "stratified":
        return stratified_sample(phases, target_size)
    elif method == "cluster":
        return cluster_based_sample(phases, target_size)
    elif method == "bin":
        return bin_based_downsample(phases, target_size)
    else:
        logger.warning(f"Unknown sampling method: {method}, falling back to reservoir sampling")
        return reservoir_sample(phases, target_size)

def estimate_optimal_sample_size(data_size: int, complexity_factor: float = 1.0) -> int:
    """
    Estimate the optimal sample size based on data size and complexity.
    
    Args:
        data_size: Size of the original data
        complexity_factor: Factor representing data complexity (1.0 = normal)
        
    Returns:
        Recommended sample size
    """
    # Base heuristic: logarithmic scale with a minimum
    base_size = max(100, int(1000 * np.log10(data_size / 1000 + 1)))
    
    # Adjust for complexity
    adjusted_size = int(base_size * complexity_factor)
    
    # Cap at reasonable limits
    return min(max(adjusted_size, 100), 5000)

def adaptive_downsample(phases: List[float], max_points: int = 1000) -> Union[List[float], Dict[str, List[float]]]:
    """
    Adaptively downsample phase data based on its characteristics.
    
    Args:
        phases: Original phase data
        max_points: Maximum number of points to return
        
    Returns:
        Downsampled data optimized for visualization
    """
    # Skip if already small enough
    if len(phases) <= max_points:
        return phases
    
    # Convert to numpy for analysis
    np_data = np.array(phases)
    
    # Analyze data characteristics
    variance = np.var(np_data)
    range_size = np.max(np_data) - np.min(np_data)
    
    # Calculate complexity factor
    complexity_factor = 1.0
    if variance > 0.5:
        complexity_factor *= 1.5  # Higher variance needs more points
    if range_size > np.pi:
        complexity_factor *= 1.3  # Wider range needs more points
    
    # Check for oscillatory patterns using FFT
    if len(np_data) > 1000:
        try:
            fft = np.fft.fft(np_data[:1000])
            magnitudes = np.abs(fft)
            sorted_indices = np.argsort(magnitudes)[::-1]
            
            # If there are strong frequencies beyond DC
            if len(sorted_indices) > 5 and magnitudes[sorted_indices[5]] > 0.1 * magnitudes[sorted_indices[0]]:
                complexity_factor *= 1.5  # Oscillatory data needs more points
        except Exception as e:
            logger.warning(f"FFT analysis failed: {e}")
    
    # Determine optimal sample size
    target_size = min(estimate_optimal_sample_size(len(phases), complexity_factor), max_points)
    
    # Choose method based on characteristics
    if variance < 0.1 and range_size < 0.5:
        # Low variance and small range - use bin-based
        return bin_based_downsample(phases, target_size)
    elif variance > 0.5 or range_size > np.pi:
        # High variance or wide range - use stratified
        return stratified_sample(phases, target_size)
    else:
        # Default case - use cluster-based
        return cluster_based_sample(phases, target_size)

def create_phase_heatmap_data(phases_by_agent: Dict[str, List[float]], 
                            max_oscillators: int = 1000) -> Dict[str, Any]:
    """
    Create heatmap data for multiple agents with downsampling.
    
    Args:
        phases_by_agent: Dictionary of phase data by agent ID
        max_oscillators: Maximum oscillators to include per agent
        
    Returns:
        Processed data suitable for heatmap visualization
    """
    result = {}
    
    for agent_id, phases in phases_by_agent.items():
        if len(phases) > max_oscillators:
            # Downsample if needed
            stats = bin_based_downsample(phases, max_oscillators)
            result[agent_id] = {
                "data": stats["mean"],  # Mean for the main display
                "min": stats["min"],
                "max": stats["max"],
                "std": stats["std"],
                "downsampled": True,
                "original_size": len(phases)
            }
        else:
            # No downsampling needed
            result[agent_id] = {
                "data": phases,
                "downsampled": False,
                "original_size": len(phases)
            }
    
    return result

# Simple CLI for testing
if __name__ == "__main__":
    import sys
    import json
    
    if len(sys.argv) < 2:
        print("Usage: python phase_downsampler.py <input_file> [target_size] [method]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    target_size = int(sys.argv[2]) if len(sys.argv) > 2 else 1000
    method = sys.argv[3] if len(sys.argv) > 3 else "auto"
    
    try:
        with open(input_file, 'r') as f:
            data = json.load(f)
        
        if isinstance(data, list):
            result = downsample_phase_data(data, target_size, method)
        elif isinstance(data, dict):
            result = {}
            for key, values in data.items():
                result[key] = downsample_phase_data(values, target_size, method)
        
        print(json.dumps(result))
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
