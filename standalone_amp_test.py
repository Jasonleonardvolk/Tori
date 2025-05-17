#!/usr/bin/env python3
"""
Standalone test to verify mixed-precision training and gradient clipping functionality.
"""

import time
import logging
import numpy as np
import torch
import torch.nn as nn
from typing import Dict, List, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('amp_test')

def benchmark_training(use_amp=False, use_grad_clip=False, device_type='cpu'):
    """
    Benchmark training with and without AMP and gradient clipping.
    
    Args:
        use_amp: Whether to use Automatic Mixed Precision
        use_grad_clip: Whether to use gradient clipping
        device_type: Device type to use ('cpu' or 'cuda')
        
    Returns:
        Dict with benchmark results
    """
    logger.info(f"Running benchmark with AMP={use_amp}, grad_clip={use_grad_clip}, device={device_type}")
    
    # Set device
    if device_type == 'cuda' and torch.cuda.is_available():
        device = torch.device('cuda')
    else:
        device = torch.device('cpu')
        if device_type == 'cuda':
            logger.warning("CUDA requested but not available, using CPU instead")
    
    # Create a simple model
    model = nn.Sequential(
        nn.Linear(10, 64),
        nn.Tanh(),
        nn.Linear(64, 64),
        nn.Tanh(),
        nn.Linear(64, 1)
    ).to(device)
    
    # Create optimizer
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    
    # Create gradient scaler for AMP
    scaler = torch.cuda.amp.GradScaler(enabled=use_amp) if use_amp else None
    
    # Create synthetic data
    batch_size = 1024
    x = torch.randn(batch_size, 10, device=device)
    y = torch.randn(batch_size, 1, device=device)
    
    # Training steps
    num_steps = 100
    
    # Track metrics
    times = []
    memory_usage = []
    grad_norms = []
    
    # Training loop
    for step in range(num_steps):
        # Record start time
        start_time = time.time()
        
        # Run forward and backward pass
        if use_amp and device.type == 'cuda':
            # Mixed precision training
            with torch.cuda.amp.autocast():
                # Forward pass
                output = model(x)
                loss = nn.functional.mse_loss(output, y)
            
            # Backward pass with gradient scaling
            optimizer.zero_grad()
            scaler.scale(loss).backward()
            
            # Gradient clipping if enabled
            if use_grad_clip:
                scaler.unscale_(optimizer)
                grad_norm = torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                grad_norms.append(grad_norm.item())
            
            # Step with scaler
            scaler.step(optimizer)
            scaler.update()
        else:
            # Standard precision training
            output = model(x)
            loss = nn.functional.mse_loss(output, y)
            
            optimizer.zero_grad()
            loss.backward()
            
            # Gradient clipping if enabled
            if use_grad_clip:
                grad_norm = torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                grad_norms.append(grad_norm.item())
            
            optimizer.step()
        
        # Record time
        end_time = time.time()
        times.append(end_time - start_time)
        
        # Record memory usage if on GPU
        if device.type == 'cuda':
            memory_usage.append(torch.cuda.max_memory_allocated() / 1024**2)  # MB
        
    # Compute metrics
    avg_time = sum(times) / len(times)
    total_time = sum(times)
    steps_per_sec = num_steps / total_time
    
    logger.info(f"Average time per step: {avg_time:.6f}s")
    logger.info(f"Total time for {num_steps} steps: {total_time:.6f}s")
    logger.info(f"Steps per second: {steps_per_sec:.2f}")
    
    if device.type == 'cuda':
        max_memory = max(memory_usage) if memory_usage else 0
        logger.info(f"Max GPU memory usage: {max_memory:.2f} MB")
    
    if use_grad_clip and grad_norms:
        logger.info(f"Average gradient norm: {sum(grad_norms) / len(grad_norms):.6f}")
        logger.info(f"Max gradient norm: {max(grad_norms):.6f}")
    
    # Return results
    results = {
        'avg_time': avg_time,
        'total_time': total_time,
        'steps_per_sec': steps_per_sec,
        'grad_norms': grad_norms if use_grad_clip else None,
        'memory_usage': memory_usage if device.type == 'cuda' else None
    }
    
    return results

def test_gradient_clipping():
    """Test that gradient clipping correctly handles extreme gradients."""
    # Set up a simple model
    model = nn.Linear(1, 1)
    
    # Set extreme weights to generate large gradients
    with torch.no_grad():
        model.weight.fill_(1e5)
        model.bias.fill_(0)
    
    # Set up optimizer
    optimizer = torch.optim.SGD(model.parameters(), lr=0.01)
    
    # Create a single data point
    x = torch.tensor([[1.0]], requires_grad=True)
    y = torch.tensor([[1.0]])
    
    # First pass without clipping
    output = model(x)
    loss = nn.functional.mse_loss(output, y)
    optimizer.zero_grad()
    loss.backward()
    
    # Get gradient norm before clipping
    parameters = list(model.parameters())
    grad_norm_before = torch.norm(torch.stack([torch.norm(p.grad.detach(), 2) for p in parameters]), 2)
    logger.info(f"Gradient norm before clipping: {grad_norm_before:.6f}")
    
    # Make a copy of the gradient for comparison
    original_grad = parameters[0].grad.clone()
    
    # Apply gradient clipping
    max_norm = 1.0
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=max_norm)
    
    # Get gradient norm after clipping
    grad_norm_after = torch.norm(torch.stack([torch.norm(p.grad.detach(), 2) for p in parameters]), 2)
    logger.info(f"Gradient norm after clipping: {grad_norm_after:.6f}")
    
    # Calculate how much the gradient was scaled
    scaling_factor = grad_norm_after / grad_norm_before
    logger.info(f"Gradient scaling factor: {scaling_factor:.6f}")
    
    # Verify clipping worked correctly
    clipping_worked = abs(grad_norm_after - max_norm) < 1e-5
    direction_preserved = torch.allclose(
        parameters[0].grad / torch.norm(parameters[0].grad), 
        original_grad / torch.norm(original_grad),
        atol=1e-5
    )
    
    logger.info(f"Clipping correctly limited norm to {max_norm}: {clipping_worked}")
    logger.info(f"Clipping preserved gradient direction: {direction_preserved}")
    
    return clipping_worked and direction_preserved

def main():
    """Main entry point."""
    logger.info("=== Testing Gradient Clipping Implementation ===")
    clipping_correct = test_gradient_clipping()
    
    # Run benchmarks for CPU
    logger.info("\n=== CPU Benchmarks ===")
    regular_cpu = benchmark_training(use_amp=False, use_grad_clip=False, device_type='cpu')
    clip_cpu = benchmark_training(use_amp=False, use_grad_clip=True, device_type='cpu')
    
    # Speed comparison
    speedup = regular_cpu['steps_per_sec'] / clip_cpu['steps_per_sec'] 
    logger.info(f"Gradient clipping overhead: {(speedup - 1) * 100:.2f}%")
    
    # Only run CUDA benchmarks if available
    if torch.cuda.is_available():
        logger.info("\n=== CUDA Benchmarks ===")
        regular_cuda = benchmark_training(use_amp=False, use_grad_clip=False, device_type='cuda')
        amp_cuda = benchmark_training(use_amp=True, use_grad_clip=False, device_type='cuda')
        amp_clip_cuda = benchmark_training(use_amp=True, use_grad_clip=True, device_type='cuda')
        
        # Compute speedups
        amp_speedup = amp_cuda['steps_per_sec'] / regular_cuda['steps_per_sec']
        logger.info(f"AMP speedup: {amp_speedup:.2f}x")
        
        overhead = amp_clip_cuda['steps_per_sec'] / amp_cuda['steps_per_sec']
        logger.info(f"Gradient clipping overhead with AMP: {(1 - overhead) * 100:.2f}%")
    else:
        logger.info("CUDA not available - skipping GPU benchmarks")
    
    logger.info("\n=== Summary ===")
    logger.info(f"Gradient clipping implementation correct: {clipping_correct}")
    logger.info(f"CPU training with grad clip: {clip_cpu['steps_per_sec']:.2f} steps/sec")
    if torch.cuda.is_available():
        logger.info(f"GPU training with AMP + grad clip: {amp_clip_cuda['steps_per_sec']:.2f} steps/sec")
        total_speedup = amp_clip_cuda['steps_per_sec'] / regular_cpu['steps_per_sec']
        logger.info(f"Total speedup vs. CPU: {total_speedup:.2f}x")

if __name__ == "__main__":
    main()
