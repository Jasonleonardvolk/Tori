#!/usr/bin/env python3
"""
Standalone test to verify alpha scheduling functionality for LyapunovNet.

This script tests the different alpha scheduler implementations and 
visualizes their behavior over training iterations.
"""

import logging
import numpy as np
import matplotlib.pyplot as plt
from typing import List, Optional, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('alpha_scheduler_test')

class AlphaScheduler:
    """Base class for alpha schedulers."""
    
    def __init__(self, initial_alpha: float = 1e-2, min_alpha: float = 1e-3):
        """Initialize the AlphaScheduler."""
        if initial_alpha <= 0 or min_alpha <= 0:
            raise ValueError("Alpha values must be positive")
            
        if min_alpha > initial_alpha:
            raise ValueError("min_alpha must be <= initial_alpha")
            
        self.initial_alpha = initial_alpha
        self.min_alpha = min_alpha
        self.current_alpha = initial_alpha
        self.step_count = 0
        
        logger.info(f"Initialized {self.__class__.__name__} with "
                   f"initial_alpha={initial_alpha}, min_alpha={min_alpha}")
    
    def step(self) -> float:
        """Update alpha value based on the schedule."""
        self.step_count += 1
        return self.current_alpha
    
    def get_alpha(self) -> float:
        """Get the current alpha value without updating."""
        return self.current_alpha
    
    def reset(self) -> None:
        """Reset the scheduler to its initial state."""
        self.current_alpha = self.initial_alpha
        self.step_count = 0

class ExponentialAlphaScheduler(AlphaScheduler):
    """Exponential decay scheduler for alpha."""
    
    def __init__(
        self, 
        initial_alpha: float = 1e-2, 
        min_alpha: float = 1e-3,
        decay_steps: Optional[int] = None,
        decay_rate: float = 0.95,
        step_size: int = 100
    ):
        """Initialize the exponential decay scheduler."""
        super().__init__(initial_alpha, min_alpha)
        
        self.decay_steps = decay_steps
        self.decay_rate = decay_rate
        self.step_size = step_size
        
        # Calculate decay rate if decay_steps is provided
        if decay_steps is not None:
            # decay_rate = (min_alpha / initial_alpha)^(step_size/decay_steps)
            power = step_size / decay_steps
            self.decay_rate = (min_alpha / initial_alpha) ** power
        
        logger.info(f"Exponential alpha scheduler with decay_rate={self.decay_rate}, "
                    f"step_size={step_size}")
    
    def step(self) -> float:
        """Update alpha value with exponential decay."""
        self.step_count += 1
        
        # Apply decay every step_size steps
        if self.step_count % self.step_size == 0:
            self.current_alpha = max(
                self.min_alpha,
                self.current_alpha * self.decay_rate
            )
            
        return self.current_alpha

class WarmRestartAlphaScheduler(AlphaScheduler):
    """Alpha scheduler with cosine annealing and warm restarts."""
    
    def __init__(
        self, 
        initial_alpha: float = 1e-2, 
        min_alpha: float = 1e-3,
        cycle_length: int = 1000,
        cycle_mult: float = 2.0
    ):
        """Initialize the warm restart scheduler."""
        super().__init__(initial_alpha, min_alpha)
        
        self.cycle_length = cycle_length
        self.cycle_mult = cycle_mult
        self.cycle_count = 0
        self.cycle_step = 0
        
        logger.info(f"Warm restart alpha scheduler with cycle_length={cycle_length}, "
                    f"cycle_mult={cycle_mult}")
    
    def step(self) -> float:
        """Update alpha value with cosine annealing and warm restarts."""
        import math
        
        self.step_count += 1
        self.cycle_step += 1
        
        # Check if we need to restart
        current_cycle_length = self.cycle_length * (self.cycle_mult ** self.cycle_count)
        if self.cycle_step > current_cycle_length:
            # Start a new cycle
            self.cycle_count += 1
            self.cycle_step = 1
            current_cycle_length = self.cycle_length * (self.cycle_mult ** self.cycle_count)
            logger.debug(f"Alpha warm restart: cycle {self.cycle_count}, "
                        f"length {current_cycle_length}")
        
        # Calculate alpha with cosine annealing
        # alpha = min_alpha + 0.5 * (initial_alpha - min_alpha) * (1 + cos(pi * t / T))
        # where t is the current step in the cycle, T is the cycle length
        cosine_term = math.cos(math.pi * self.cycle_step / current_cycle_length)
        self.current_alpha = self.min_alpha + 0.5 * (self.initial_alpha - self.min_alpha) * (1 + cosine_term)
        
        return self.current_alpha

class StepAlphaScheduler(AlphaScheduler):
    """Step-based alpha scheduler."""
    
    def __init__(
        self, 
        initial_alpha: float = 1e-2, 
        min_alpha: float = 1e-3,
        milestones: List[int] = None,
        gamma: float = 0.1
    ):
        """Initialize the step scheduler."""
        super().__init__(initial_alpha, min_alpha)
        
        self.milestones = milestones or [500, 1000, 2000]
        self.gamma = gamma
        
        # Internal state for milestone tracking
        self._milestones_passed = 0
        
        logger.info(f"Step alpha scheduler with milestones={self.milestones}, gamma={gamma}")
    
    def step(self) -> float:
        """Update alpha value at specified milestones."""
        self.step_count += 1
        
        # Check if we've reached a milestone
        if self._milestones_passed < len(self.milestones) and self.step_count >= self.milestones[self._milestones_passed]:
            # Apply decay
            self.current_alpha = max(
                self.min_alpha,
                self.current_alpha * self.gamma
            )
            
            self._milestones_passed += 1
        
        return self.current_alpha

def test_and_visualize_schedulers():
    """Test and visualize the different alpha schedulers."""
    # Create schedulers
    schedulers = {
        "Exponential (fast)": ExponentialAlphaScheduler(
            initial_alpha=1e-2, 
            min_alpha=1e-4, 
            decay_steps=1000,
            step_size=100
        ),
        "Exponential (slow)": ExponentialAlphaScheduler(
            initial_alpha=1e-2, 
            min_alpha=1e-4, 
            decay_steps=2000,
            step_size=100
        ),
        "Step": StepAlphaScheduler(
            initial_alpha=1e-2,
            min_alpha=1e-4,
            milestones=[500, 1000, 1500, 2000],
            gamma=0.5
        ),
        "Warm Restart": WarmRestartAlphaScheduler(
            initial_alpha=1e-2,
            min_alpha=1e-4,
            cycle_length=500,
            cycle_mult=1.5
        )
    }
    
    # Run for 3000 steps
    steps = 3000
    results = {}
    
    for name, scheduler in schedulers.items():
        alphas = []
        for _ in range(steps):
            alphas.append(scheduler.step())
        results[name] = alphas
    
    # Plot results
    plt.figure(figsize=(10, 6))
    
    for name, alphas in results.items():
        plt.plot(range(1, steps + 1), alphas, label=name)
    
    plt.xlabel('Training Step')
    plt.ylabel('Alpha Value')
    plt.yscale('log')
    plt.title('Alpha Scheduler Comparison')
    plt.legend()
    plt.grid(True, which='both', linestyle='--', linewidth=0.5)
    plt.tight_layout()
    
    # Save the figure
    plt.savefig('alpha_scheduler_comparison.png')
    logger.info(f"Saved alpha scheduler comparison plot to alpha_scheduler_comparison.png")
    
    # Display final alpha values
    logger.info("Final alpha values after 3000 steps:")
    for name, alphas in results.items():
        logger.info(f"  {name}: {alphas[-1]:.8f}")
    
    try:
        plt.show()
    except:
        logger.info("Unable to display plot (likely running headless)")
    
    return results

def main():
    """Main entry point."""
    logger.info("=== Testing Alpha Schedulers ===")
    
    # Test and visualize schedulers
    test_and_visualize_schedulers()

if __name__ == "__main__":
    main()
