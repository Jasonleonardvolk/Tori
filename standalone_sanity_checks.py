#!/usr/bin/env python3
"""
Standalone sanity checks for the ELFIN Stability Framework.

This script runs without relying on the full package imports to avoid
parser/AST module errors.
"""

import os
import sys
import time
import argparse
import logging
from typing import Dict, List, Optional, Tuple, Union, Any, Callable
import numpy as np
import torch
import torch.nn as nn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('sanity_checker')

#---------- Van der Pol dynamics ----------#
def vdp_dynamics(x, mu=1.0):
    """Van der Pol oscillator dynamics."""
    x1 = x[:, 0]
    x2 = x[:, 1]
    dx1 = x2
    dx2 = mu * (1 - x1**2) * x2 - x1
    return np.stack([dx1, dx2], axis=1)

def vdp_system(batch_x, mu=1.0):
    """Van der Pol oscillator dynamics wrapper."""
    return vdp_dynamics(batch_x, mu=mu)

def linear_system(batch_x):
    """Simple stable linear system."""
    return -0.5 * batch_x

#---------- Core Lyapunov Network Implementation ----------#
class LyapunovNet(nn.Module):
    """
    Lyapunov-Net architecture for learning verifiable Lyapunov functions.
    
    Implements the approach where V(x) = |phi(x) - phi(0)| + alpha*||x||.
    This construction guarantees V(0)=0 and V(x)>0 for x≠0.
    """
    
    def __init__(
        self, 
        dim: int, 
        hidden_dims: Tuple[int, ...] = (64, 64),
        alpha: float = 1e-3,
        activation: nn.Module = nn.Tanh()
    ):
        """Initialize the LyapunovNet."""
        super().__init__()
        
        if alpha <= 0:
            raise ValueError(f"alpha must be positive, got {alpha}")
            
        self.alpha = alpha
        self.hidden_dims = hidden_dims
        self.activation_type = activation.__class__.__name__
        
        # Build the neural network phi(x)
        layers = []
        in_dim = dim
        
        for h_dim in hidden_dims:
            layers.append(nn.Linear(in_dim, h_dim))
            layers.append(activation)
            in_dim = h_dim
            
        # Final output layer (scalar)
        layers.append(nn.Linear(in_dim, 1))
        
        # Create sequential model
        self.phi = nn.Sequential(*layers)
        
        # Initialize weights
        self._initialize_weights()
        
        logger.info(f"Created LyapunovNet with hidden dims {hidden_dims}, "
                   f"alpha={alpha}, activation={self.activation_type}")
    
    def _initialize_weights(self):
        """Initialize network weights for better training."""
        for m in self.modules():
            if isinstance(m, nn.Linear):
                # He initialization
                nn.init.kaiming_uniform_(m.weight, nonlinearity='tanh')
                if m.bias is not None:
                    nn.init.zeros_(m.bias)
    
    def forward(self, x: torch.Tensor, alpha: Optional[float] = None) -> torch.Tensor:
        """Compute the Lyapunov function value V(x)."""
        # Create a zero vector with the same batch shape as x
        zeros = torch.zeros_like(x)
        
        # Compute |phi(x) - phi(0)|
        phi_diff = torch.abs(self.phi(x) - self.phi(zeros))
        
        # Compute the norm term alpha*||x||
        use_alpha = alpha if alpha is not None else self.alpha
        norm_term = use_alpha * torch.norm(x, dim=-1, keepdim=True)
        
        # Return V(x) = |phi(x) - phi(0)| + alpha*||x||
        return phi_diff + norm_term
        
    def update_alpha(self, alpha: float) -> None:
        """Update the alpha parameter."""
        if alpha <= 0:
            raise ValueError(f"Alpha must be positive, got {alpha}")
            
        self.alpha = alpha
        logger.debug(f"Updated LyapunovNet alpha to {alpha:.6f}")

#---------- Alpha Scheduler ----------#
class AlphaScheduler:
    """
    Base class for alpha schedulers.
    
    Alpha schedulers control the alpha parameter in LyapunovNet over the
    course of training.
    """
    
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
    """
    Exponential decay scheduler for alpha.
    
    Decays alpha exponentially from initial_alpha to min_alpha over
    a specified number of steps or with a given decay rate.
    """
    
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
    
    def step(self) -> float:
        """Update alpha value with exponential decay."""
        self.step_count += 1
        
        # Apply decay every step_size steps
        if self.step_count % self.step_size == 0:
            self.current_alpha = max(
                self.min_alpha,
                self.current_alpha * self.decay_rate
            )
            
            logger.debug(f"Alpha updated to {self.current_alpha:.6f} at step {self.step_count}")
        
        return self.current_alpha

#---------- Trajectory Sampler ----------#
class TrajectorySampler:
    """
    Sampler for generating training data from trajectories.
    
    This class samples states and their derivatives from a dynamical system
    for training Lyapunov networks.
    """
    
    def __init__(
        self,
        dynamics_fn: Callable[[np.ndarray], np.ndarray],
        dim: int,
        domain: Tuple[np.ndarray, np.ndarray],
        batch_size: int = 1024,
        counterexample_buffer_size: int = 1000
    ):
        """Initialize the trajectory sampler."""
        self.dynamics_fn = dynamics_fn
        self.dim = dim
        self.domain = domain
        self.batch_size = batch_size
        
        # Counterexample buffer
        self.counterexample_buffer = []
        self.counterexample_buffer_size = counterexample_buffer_size
    
    def random_batch(self) -> Tuple[np.ndarray, np.ndarray]:
        """Generate a random batch of states and their derivatives."""
        # Generate random states within the domain
        low, high = self.domain
        x = np.random.uniform(low, high, size=(self.batch_size, self.dim))
        
        # Compute derivatives
        xdot = self.dynamics_fn(x)
        
        return x, xdot
    
    def add_counterexamples(self, counterexamples: List[np.ndarray]) -> None:
        """Add counterexamples to the buffer."""
        # Add new counterexamples
        for ce in counterexamples:
            if len(self.counterexample_buffer) >= self.counterexample_buffer_size:
                # Replace a random counterexample
                idx = np.random.randint(0, len(self.counterexample_buffer))
                self.counterexample_buffer[idx] = ce
            else:
                self.counterexample_buffer.append(ce)
        
        logger.info(f"Added {len(counterexamples)} counterexamples, buffer size: {len(self.counterexample_buffer)}")
    
    def balanced_batch(self) -> Tuple[np.ndarray, np.ndarray]:
        """Generate a batch with counterexamples mixed in."""
        # Number of counterexamples to include
        n_ce = min(self.batch_size // 4, len(self.counterexample_buffer))
        n_random = self.batch_size - n_ce
        
        # Generate random states
        low, high = self.domain
        x_random = np.random.uniform(low, high, size=(n_random, self.dim))
        
        # Include counterexamples
        if n_ce > 0:
            # Sample from counterexample buffer
            ce_indices = np.random.choice(len(self.counterexample_buffer), n_ce, replace=False)
            x_ce = np.array([self.counterexample_buffer[i] for i in ce_indices])
            
            # Combine random and counterexample states
            x = np.vstack([x_random, x_ce])
        else:
            x = x_random
        
        # Compute derivatives
        xdot = self.dynamics_fn(x)
        
        return x, xdot
    
    def get_counterexample_count(self) -> int:
        """Get the number of counterexamples in the buffer."""
        return len(self.counterexample_buffer)

#---------- Lyapunov Trainer ----------#
class NeuralLyapunovTrainer:
    """
    Trainer for neural Lyapunov functions.
    
    Uses the decrease condition as the loss function, as the LyapunovNet
    architecture guarantees positive definiteness by construction.
    """
    
    def __init__(
        self, 
        model: LyapunovNet, 
        sampler: TrajectorySampler,
        learning_rate: float = 1e-3,
        gamma: float = 0.0,
        weight_decay: float = 0.0,
        device: Optional[torch.device] = None,
        alpha_scheduler: Optional[AlphaScheduler] = None
    ):
        """Initialize the Lyapunov function trainer."""
        self.net = model
        self.sampler = sampler
        
        # Create alpha scheduler if not provided
        if alpha_scheduler is None:
            self.alpha_scheduler = ExponentialAlphaScheduler(
                initial_alpha=model.alpha,
                min_alpha=1e-3,
                decay_steps=2000,
                step_size=100
            )
        else:
            self.alpha_scheduler = alpha_scheduler
        
        # Set device
        self.device = device or torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.net = self.net.to(self.device)
        
        # Create optimizer
        self.optimizer = torch.optim.Adam(
            self.net.parameters(), 
            lr=learning_rate,
            weight_decay=weight_decay
        )
        
        # Initialize gradient scaler for mixed precision training
        self.use_amp = self.device.type == 'cuda'  # Only use AMP on CUDA devices
        self.scaler = torch.cuda.amp.GradScaler(enabled=self.use_amp) if self.use_amp else None
        
        # Set margin for decrease condition
        self.gamma = gamma
        
        # Training history
        self.history = {
            'loss': [],
            'steps': [],
            'decrease_violations': [],
            'time': [],
            'alpha': []
        }
        
        logger.info(f"Initialized {self.__class__.__name__} with lr={learning_rate}, "
                   f"gamma={gamma}, device={self.device}")
    
    def train_step(self, use_counterexamples: bool = True) -> Dict[str, float]:
        """Execute a single training step."""
        self.net.train()
        
        # Generate batch
        if use_counterexamples:
            x_np, xdot_np = self.sampler.balanced_batch()
        else:
            x_np, xdot_np = self.sampler.random_batch()
        
        # Convert to tensors
        x = torch.tensor(x_np, dtype=torch.float32, device=self.device)
        xdot = torch.tensor(xdot_np, dtype=torch.float32, device=self.device)
        
        # Use mixed precision training if on CUDA
        if self.use_amp:
            with torch.cuda.amp.autocast():
                # Compute gradient of V with respect to x
                x.requires_grad_(True)
                V = self.net(x)
                
                # Compute ∇V (jacobian of V with respect to x)
                gradV = torch.autograd.grad(V.sum(), x, create_graph=True)[0]
                
                # Compute V̇ = ∇V · ẋ (time derivative of V)
                Vdot = torch.sum(gradV * xdot, dim=1, keepdim=True)
                
                # Compute margin term (optional)
                if self.gamma > 0:
                    margin = self.gamma * torch.norm(x, dim=1, keepdim=True)
                else:
                    margin = 0.0
                
                # Loss: hinge on decrease condition V̇(x) ≤ -margin
                loss = torch.relu(Vdot + margin).mean()
            
            # Backpropagation with gradient scaling for mixed precision
            self.optimizer.zero_grad()
            self.scaler.scale(loss).backward()
            self.scaler.unscale_(self.optimizer)
            
            # Gradient clipping to prevent exploding gradients
            torch.nn.utils.clip_grad_norm_(self.net.parameters(), max_norm=1.0)
            
            # Update with scaled gradients
            self.scaler.step(self.optimizer)
            self.scaler.update()
        else:
            # Standard forward pass
            x.requires_grad_(True)
            V = self.net(x)
            
            # Compute ∇V (jacobian of V with respect to x)
            gradV = torch.autograd.grad(V.sum(), x, create_graph=True)[0]
            
            # Compute V̇ = ∇V · ẋ
            Vdot = torch.sum(gradV * xdot, dim=1, keepdim=True)
            
            # Compute margin term (optional)
            if self.gamma > 0:
                margin = self.gamma * torch.norm(x, dim=1, keepdim=True)
            else:
                margin = 0.0
            
            # Loss: hinge on decrease condition V̇(x) ≤ -margin
            loss = torch.relu(Vdot + margin).mean()
            
            # Standard backward pass
            self.optimizer.zero_grad()
            loss.backward()
            
            # Gradient clipping to prevent exploding gradients
            torch.nn.utils.clip_grad_norm_(self.net.parameters(), max_norm=1.0)
            
            # Regular update
            self.optimizer.step()
        
        # Count violations of strict decrease condition
        with torch.no_grad():
            violations = torch.sum(Vdot > 0).item()
        
        # Return metrics
        return {
            'loss': loss.item(),
            'decrease_violations': violations,
            'violation_rate': violations / len(x)
        }
    
    def fit(
        self, 
        steps: int = 2000, 
        log_every: int = 100
    ) -> Dict[str, List]:
        """Train the model for the specified number of steps."""
        logger.info(f"Starting training for {steps} steps")
        start_time = time.time()
            
        for step in range(1, steps + 1):
            # Update alpha using scheduler
            current_alpha = self.alpha_scheduler.step()
            self.net.update_alpha(current_alpha)
            
            # Execute training step
            metrics = self.train_step(use_counterexamples=True)
            
            # Update history
            self.history['loss'].append(metrics['loss'])
            self.history['decrease_violations'].append(metrics['decrease_violations'])
            self.history['steps'].append(step)
            self.history['time'].append(time.time() - start_time)
            self.history['alpha'].append(current_alpha)
            
            # Log progress
            if step % log_every == 0 or step == steps:
                elapsed = time.time() - start_time
                logger.info(
                    f"Step {step}/{steps} ({step/steps*100:.1f}%) - "
                    f"Loss: {metrics['loss']:.6f}, "
                    f"Violations: {metrics['decrease_violations']} "
                    f"({metrics['violation_rate']*100:.2f}%), "
                    f"Alpha: {current_alpha:.6f}, "
                    f"Time: {elapsed:.2f}s"
                )
        
        total_time = time.time() - start_time
        logger.info(f"Training completed in {total_time:.2f}s")
        
        return self.history

    def evaluate(self, n_samples: int = 1000) -> Dict[str, float]:
        """Evaluate the current model on a test batch."""
        self.net.eval()
        
        # Generate samples
        batch_size = self.sampler.batch_size
        original_batch_size = self.sampler.batch_size
        
        # Temporarily set batch size
        self.sampler.batch_size = n_samples
        x_np, xdot_np = self.sampler.random_batch()
        self.sampler.batch_size = original_batch_size
        
        # Convert to tensors
        x = torch.tensor(x_np, dtype=torch.float32, device=self.device)
        xdot = torch.tensor(xdot_np, dtype=torch.float32, device=self.device)
        
        with torch.no_grad():
            # Compute V(x)
            V = self.net(x)
            
            # Compute ∇V manually since we're in no_grad context
            x.requires_grad_(True)
            V_grad = self.net(x)
            gradV = torch.autograd.grad(V_grad.sum(), x)[0]
            
            # Compute V̇ = ∇V · ẋ
            Vdot = torch.sum(gradV * xdot, dim=1, keepdim=True)
            
            # Compute margin term
            if self.gamma > 0:
                margin = self.gamma * torch.norm(x, dim=1, keepdim=True)
            else:
                margin = 0.0
            
            # Calculate metrics
            decrease_violations = torch.sum(Vdot > 0).item()
            margin_violations = torch.sum(Vdot + margin > 0).item()
            
            # Calculate statistics
            v_min = V.min().item()
            v_max = V.max().item()
            v_mean = V.mean().item()
            vdot_min = Vdot.min().item()
            vdot_max = Vdot.max().item()
            vdot_mean = Vdot.mean().item()
        
        # Return metrics
        return {
            'decrease_violations': decrease_violations,
            'decrease_violation_rate': decrease_violations / n_samples,
            'margin_violations': margin_violations,
            'margin_violation_rate': margin_violations / n_samples,
            'V_min': v_min,
            'V_max': v_max,
            'V_mean': v_mean,
            'Vdot_min': vdot_min,
            'Vdot_max': vdot_max,
            'Vdot_mean': vdot_mean
        }

#---------- Sanity Checker ----------#
class SanityChecker:
    """Performs sanity checks on the Lyapunov functionality."""
    
    def __init__(self, dim=2, domain_size=3.0, system_fn=vdp_system):
        """Initialize the sanity checker."""
        self.dim = dim
        self.domain = (
            np.array([-domain_size] * dim), 
            np.array([domain_size] * dim)
        )
        self.system_fn = system_fn
        
        # Set device
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")
        
        # Initialize components
        self.net = None
        self.trainer = None
        self.sampler = None
        
    def setup_components(self, batch_size=1024, hidden_dims=(64, 64), alpha=1e-2):
        """Set up common components needed for multiple checks."""
        logger.info("Setting up components...")
        
        # Create sampler
        self.sampler = TrajectorySampler(
            dynamics_fn=self.system_fn,
            dim=self.dim,
            domain=self.domain,
            batch_size=batch_size
        )
        
        # Create LyapunovNet
        self.net = LyapunovNet(
            dim=self.dim,
            hidden_dims=hidden_dims,
            alpha=alpha,
            activation=torch.nn.Tanh()
        ).to(self.device)
        
        # Create alpha scheduler
        alpha_scheduler = ExponentialAlphaScheduler(
            initial_alpha=alpha,
            min_alpha=1e-3,
            decay_steps=1000
        )
        
        # Create trainer
        self.trainer = NeuralLyapunovTrainer(
            model=self.net,
            sampler=self.sampler,
            learning_rate=1e-3,
            gamma=0.1,
            device=self.device,
            alpha_scheduler=alpha_scheduler
        )
    
    def check_true_pd_enforcement(self, n_samples=10000):
        """
        Check that LyapunovNet correctly enforces positive definiteness by design.
        
        Samples points from the domain and checks that V(x) > 0 for all non-zero
        points without relying on verification.
        """
        logger.info("=== Checking True PD Enforcement ===")
        
        # Make sure components are set up
        if self.net is None:
            self.setup_components()
            
        # Pre-train the network briefly
        logger.info("Pre-training network for 500 steps...")
        self.trainer.fit(steps=500, log_every=100)
            
        # Generate random samples
        logger.info(f"Sampling {n_samples} random points...")
        low, high = self.domain
        samples = np.random.uniform(low, high, size=(n_samples, self.dim))
        
        # Add origin
        samples_with_origin = np.vstack([samples, np.zeros((1, self.dim))])
        
        # Evaluate network
        with torch.no_grad():
            x_tensor = torch.tensor(samples_with_origin, dtype=torch.float32).to(self.device)
            v_values = self.net(x_tensor).cpu().numpy().flatten()
        
        # Check non-zero points
        non_zero_mask = np.abs(samples_with_origin).sum(axis=1) > 1e-10
        non_zero_values = v_values[non_zero_mask]
        v_min = non_zero_values.min()
        v_mean = non_zero_values.mean()
        violations = (non_zero_values <= 0).sum()
        
        # Check origin
        origin_idx = samples_with_origin.shape[0] - 1
        v_origin = v_values[origin_idx]
        
        # Report results
        logger.info(f"V(x) statistics for non-zero points:")
        logger.info(f"  Min: {v_min:.6f}")
        logger.info(f"  Mean: {v_mean:.6f}")
        logger.info(f"  Violations (V(x) ≤ 0): {violations}/{non_zero_mask.sum()}")
        logger.info(f"V(0) = {v_origin:.6f} (should be 0)")
        
        success = (violations == 0) and (abs(v_origin) < 1e-6)
        logger.info(f"PD enforcement: {'✓ SUCCESS' if success else '✗ FAILURE'}")
        
        return success
    
    def run_all_checks(self):
        """Run all sanity checks and report results."""
        logger.info("=== Running All Sanity Checks ===")
        
        # Set up components once
        self.setup_components()
        
        results = {}
        
        # Check PD enforcement
        results['true_pd_enforcement'] = self.check_true_pd_enforcement()
        
        # Report all results
        logger.info("=== Sanity Check Results ===")
        passed = 0
        for check, result in results.items():
            status = "✓ PASSED" if result else "✗ FAILED"
            logger.info(f"{check}: {status}")
            if result:
                passed += 1
        
        logger.info(f"Overall: {passed}/{len(results)} checks passed")
        return passed == len(results)

def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description='Run sanity checks for Lyapunov Networks')
    
    parser.add_argument('--check', choices=['all', 'pd'],
                       default='all', help='Which check to run')
    
    parser.add_argument('--dim', type=int, default=2,
                       help='State space dimension')
    
    parser.add_argument('--domain', type=float, default=3.0,
                       help='Domain size')
    
    parser.add_argument('--system', choices=['vdp', 'linear'],
                       default='vdp', help='Dynamical system to use')
    
    return parser.parse_args()

def main():
    """Main entry point."""
    args = parse_args()
    
    # Choose system function
    if args.system == 'vdp':
        system_fn = vdp_system
    else:
        system_fn = linear_system
    
    # Create sanity checker
    checker = SanityChecker(
        dim=args.dim,
        domain_size=args.domain,
        system_fn=system_fn
    )
    
    # Run specified check
    if args.check == 'all':
        checker.run_all_checks()
    elif args.check == 'pd':
        checker.check_true_pd_enforcement()

if __name__ == "__main__":
    main()
