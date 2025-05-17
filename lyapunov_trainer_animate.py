#!/usr/bin/env python3
"""
ELFIN Loss Surface Animation.

This script provides a visualization of how the Lyapunov function evolves
during neural network training, creating an animation of the loss surface.
"""

import os
import numpy as np
import torch
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib.colors import LinearSegmentedColormap
from typing import List, Callable, Tuple, Dict, Any
import time
import logging
import tempfile
from pathlib import Path

try:
    from stability_demo import (
        DynamicsModel, LyapunovNetwork, example_dynamics
    )
except ImportError:
    try:
        from alan_backend.elfin.stability.learn_neural_lyap import (
            DynamicsModel, LyapunovNetwork
        )
    except ImportError:
        print("Could not import ELFIN stability modules.")
        print("Make sure you're running this script from the correct directory,")
        print("or that alan_backend is in your PYTHONPATH.")
        exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("lyapunov-animate")


class LyapunovTrainerWithSnapshots:
    """
    Neural Lyapunov trainer that saves snapshots of the network during training.
    """
    
    def __init__(
        self,
        dynamics_fn: Callable,
        state_dim: int = 2,
        hidden_dims: List[int] = [32, 32],
        snapshot_interval: int = 10,
        device: str = "cpu"
    ):
        """
        Initialize the trainer.
        
        Args:
            dynamics_fn: Function returning the system dynamics dx/dt = f(x)
            state_dim: Dimension of the state space
            hidden_dims: List of hidden layer dimensions
            snapshot_interval: Interval for saving network snapshots
            device: Device to use for training
        """
        self.state_dim = state_dim
        self.device = device
        self.snapshot_interval = snapshot_interval
        
        # Create dynamics model
        self.dynamics = DynamicsModel(
            forward_fn=dynamics_fn,
            input_dim=state_dim
        )
        
        # Create neural Lyapunov network
        self.network = LyapunovNetwork(
            input_dim=state_dim,
            hidden_dims=hidden_dims
        ).to(device)
        
        # Create optimizer
        self.optimizer = torch.optim.Adam(self.network.parameters(), lr=1e-3)
        
        # Initialize history and snapshots
        self.history = {
            "total_loss": [],
            "pd_loss": [],
            "decreasing_loss": [],
            "zero_loss": []
        }
        self.snapshots = []
        
    def sample_states(
        self,
        n_samples: int,
        radius: float = 5.0,
        include_origin: bool = False
    ) -> torch.Tensor:
        """
        Sample states from the state space.
        
        Args:
            n_samples: Number of samples
            radius: Maximum radius for sampling
            include_origin: Whether to include the origin
            
        Returns:
            Tensor of shape (n_samples, state_dim)
        """
        # Sample from unit ball and scale
        states = torch.randn(n_samples, self.state_dim, device=self.device)
        
        # Normalize and scale by random radius
        norms = torch.norm(states, dim=1, keepdim=True)
        states = states / norms * torch.rand_like(norms) * radius
        
        if include_origin:
            # Replace one sample with the origin
            states[0] = torch.zeros(self.state_dim, device=self.device)
            
        return states
    
    def compute_lie_derivative(self, x: torch.Tensor) -> torch.Tensor:
        """
        Compute the Lie derivative dV/dt = ∇V(x)·f(x).
        
        Args:
            x: State vector(s) of shape (batch_size, state_dim)
            
        Returns:
            dV/dt of shape (batch_size, 1)
        """
        # Clone input and enable gradient tracking
        x_clone = x.clone().detach().requires_grad_(True)
        V = self.network(x_clone)
        
        # Compute batch gradients
        batch_size = x_clone.shape[0]
        grads = torch.zeros(batch_size, self.state_dim, device=self.device)
        
        for i in range(batch_size):
            if i > 0:
                x_clone.grad = None
            V[i].backward(retain_graph=(i < batch_size - 1))
            grads[i] = x_clone.grad[i].clone()
        
        # Compute dynamics
        f_x = self.dynamics(x)
        
        # Compute Lie derivative ∇V(x)·f(x)
        lie_derivative = torch.sum(grads * f_x, dim=1, keepdim=True)
        
        return lie_derivative
    
    def train_step(self, n_samples: int = 1000, epsilon: float = 0.1) -> Dict[str, float]:
        """
        Perform one training step.
        
        Args:
            n_samples: Number of samples
            epsilon: Margin for Lyapunov conditions
            
        Returns:
            Dictionary of loss values
        """
        self.optimizer.zero_grad()
        
        # Sample states
        states = self.sample_states(n_samples, include_origin=True)
        
        # Exclude the origin for positive definiteness
        non_origin_mask = ~torch.all(states == 0, dim=1, keepdim=True)
        non_origin_states = states[non_origin_mask.squeeze()]
        
        # Compute V(x) for all states
        V = self.network(states)
        V_non_origin = V[non_origin_mask]
        
        # Compute dV/dt for all non-origin states
        dVdt = self.compute_lie_derivative(non_origin_states)
        
        # Compute loss for V(x) > 0 for x ≠ 0
        pd_loss = torch.relu(-V_non_origin + 1e-6).mean()
        
        # Compute loss for dV/dt < 0 for x ≠ 0
        decreasing_loss = torch.relu(dVdt + epsilon).mean()
        
        # Compute loss for V(0) = 0
        origin_mask = ~non_origin_mask
        zero_loss = (V[origin_mask]**2).mean() if origin_mask.sum() > 0 else torch.tensor(0.0)
        
        # Total loss
        loss = pd_loss + decreasing_loss + zero_loss
        
        # Backward and optimize
        loss.backward()
        self.optimizer.step()
        
        return {
            "total_loss": loss.item(),
            "pd_loss": pd_loss.item(),
            "decreasing_loss": decreasing_loss.item(),
            "zero_loss": zero_loss.item()
        }
    
    def save_snapshot(self, epoch: int) -> None:
        """
        Save a snapshot of the current network state.
        
        Args:
            epoch: Current training epoch
        """
        # Create a deep copy of the model
        model_copy = LyapunovNetwork(
            input_dim=self.state_dim,
            hidden_dims=self.network.hidden_dims
        )
        model_copy.load_state_dict(self.network.state_dict())
        
        # Add to snapshots
        self.snapshots.append({
            "epoch": epoch,
            "model": model_copy
        })
        
    def train(
        self,
        n_epochs: int = 500,
        samples_per_epoch: int = 1000,
        epsilon: float = 0.1
    ) -> Dict[str, List[float]]:
        """
        Train the neural Lyapunov function.
        
        Args:
            n_epochs: Number of epochs
            samples_per_epoch: Number of samples per epoch
            epsilon: Margin for Lyapunov conditions
            
        Returns:
            Dictionary of loss histories
        """
        start_time = time.time()
        
        # Save initial snapshot
        self.save_snapshot(0)
        
        for epoch in range(1, n_epochs + 1):
            metrics = self.train_step(samples_per_epoch, epsilon)
            
            # Store metrics
            for k, v in metrics.items():
                self.history[k].append(v)
            
            # Save snapshot if needed
            if epoch % self.snapshot_interval == 0 or epoch == n_epochs:
                self.save_snapshot(epoch)
            
            # Log progress
            if epoch % 50 == 0:
                elapsed = time.time() - start_time
                logger.info(f"Epoch {epoch}/{n_epochs} "
                          f"[{elapsed:.1f}s] "
                          f"Loss: {metrics['total_loss']:.6f}")
        
        logger.info(f"Training completed in {time.time() - start_time:.1f}s")
        logger.info(f"Saved {len(self.snapshots)} snapshots")
        
        return self.history


def evaluate_model_on_grid(
    model: LyapunovNetwork,
    bounds: Tuple[float, float] = (-3.0, 3.0),
    grid_size: int = 50,
    include_dynamics: bool = True
) -> Dict[str, np.ndarray]:
    """
    Evaluate a model on a grid of points.
    
    Args:
        model: LyapunovNetwork to evaluate
        bounds: Tuple of (min, max) bounds for x and y
        grid_size: Number of points per dimension
        include_dynamics: Whether to include vector field
        
    Returns:
        Dictionary with grid data
    """
    # Create grid
    x = np.linspace(bounds[0], bounds[1], grid_size)
    y = np.linspace(bounds[0], bounds[1], grid_size)
    X, Y = np.meshgrid(x, y)
    
    # Evaluate model on grid
    Z = np.zeros_like(X)
    
    for i in range(grid_size):
        for j in range(grid_size):
            state = np.array([X[i, j], Y[i, j]])
            
            # Convert to tensor
            state_tensor = torch.tensor(state, dtype=torch.float32).unsqueeze(0)
            with torch.no_grad():
                Z[i, j] = model(state_tensor).item()
    
    result = {
        "X": X,
        "Y": Y,
        "Z": Z
    }
    
    # Compute vector field if requested
    if include_dynamics:
        U = np.zeros_like(X)
        V = np.zeros_like(Y)
        
        for i in range(grid_size):
            for j in range(grid_size):
                state = np.array([X[i, j], Y[i, j]])
                dstate = example_dynamics(state)
                U[i, j] = dstate[0]
                V[i, j] = dstate[1]
        
        result["U"] = U
        result["V"] = V
    
    return result


def create_animation(
    snapshots: List[Dict[str, Any]],
    bounds: Tuple[float, float] = (-3.0, 3.0),
    grid_size: int = 50,
    fps: int = 10,
    output_file: str = "lyapunov_evolution.mp4",
    title: str = "Neural Lyapunov Function Evolution",
    dpi: int = 100
):
    """
    Create an animation of the Lyapunov function evolution.
    
    Args:
        snapshots: List of model snapshots
        bounds: Tuple of (min, max) bounds for x and y
        grid_size: Number of points per dimension
        fps: Frames per second for animation
        output_file: Output file path
        title: Animation title
        dpi: DPI for rendering
    """
    logger.info(f"Creating animation with {len(snapshots)} frames...")
    
    # Create figure
    fig = plt.figure(figsize=(10, 8))
    ax = fig.add_subplot(111)
    
    # Define custom colormap that goes from blue to white to red
    # Blue for negative values, white for zero, red for positive
    colors = [(0, 0, 1), (1, 1, 1), (1, 0, 0)]
    cmap = LinearSegmentedColormap.from_list("lyapunov", colors, N=100)
    
    # Get data range for consistent color scaling
    v_min = float('inf')
    v_max = float('-inf')
    
    for snapshot in snapshots:
        data = evaluate_model_on_grid(
            snapshot["model"],
            bounds=bounds,
            grid_size=grid_size
        )
        v_min = min(v_min, data["Z"].min())
        v_max = max(v_max, data["Z"].max())
    
    # Ensure symmetric range for better visualization
    v_abs_max = max(abs(v_min), abs(v_max))
    v_min = -v_abs_max
    v_max = v_abs_max
    
    # Animation function
    def update(frame):
        ax.clear()
        
        snapshot = snapshots[frame]
        epoch = snapshot["epoch"]
        model = snapshot["model"]
        
        # Evaluate model
        data = evaluate_model_on_grid(
            model,
            bounds=bounds,
            grid_size=grid_size
        )
        
        # Create contour plot
        contour = ax.contourf(
            data["X"],
            data["Y"],
            data["Z"],
            levels=20,
            cmap=cmap,
            vmin=v_min,
            vmax=v_max
        )
        
        # Add vector field
        stride = grid_size // 10
        ax.quiver(
            data["X"][::stride, ::stride],
            data["Y"][::stride, ::stride],
            data["U"][::stride, ::stride],
            data["V"][::stride, ::stride],
            color="white",
            alpha=0.8
        )
        
        # Add zero level contour
        ax.contour(
            data["X"],
            data["Y"],
            data["Z"],
            levels=[0],
            colors="black",
            linestyles="dashed"
        )
        
        # Add title
        ax.set_title(f"{title} - Epoch {epoch}")
        
        # Set axis labels
        ax.set_xlabel("x")
        ax.set_ylabel("y")
        
        return [contour]
    
    # Create animation
    ani = animation.FuncAnimation(
        fig,
        update,
        frames=len(snapshots),
        blit=False
    )
    
    # Set up colorbar
    plt.colorbar(plt.cm.ScalarMappable(
        norm=plt.Normalize(v_min, v_max),
        cmap=cmap
    ), ax=ax, label="Lyapunov Value")
    
    # Save animation
    ani.save(
        output_file,
        writer=animation.FFMpegWriter(fps=fps)
    )
    
    logger.info(f"Animation saved to {output_file}")


def main():
    """Main function."""
    # Set parameters
    state_dim = 2
    hidden_dims = [32, 32]
    n_epochs = 250
    snapshot_interval = 5
    
    # Create trainer
    trainer = LyapunovTrainerWithSnapshots(
        dynamics_fn=example_dynamics,
        state_dim=state_dim,
        hidden_dims=hidden_dims,
        snapshot_interval=snapshot_interval
    )
    
    # Train
    logger.info(f"Training neural Lyapunov function for {n_epochs} epochs...")
    trainer.train(n_epochs=n_epochs)
    
    # Create animation
    create_animation(
        snapshots=trainer.snapshots,
        output_file="lyapunov_evolution.mp4",
        fps=10
    )
    
    # Plot final loss history
    plt.figure(figsize=(12, 6))
    
    # Plot total loss
    plt.subplot(1, 2, 1)
    plt.semilogy(trainer.history['total_loss'], label='Total Loss')
    plt.title('Total Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss (log scale)')
    plt.grid(True)
    
    # Plot component losses
    plt.subplot(1, 2, 2)
    plt.semilogy(trainer.history['pd_loss'], label='PD Loss')
    plt.semilogy(trainer.history['decreasing_loss'], label='Decreasing Loss')
    plt.semilogy(trainer.history['zero_loss'], label='Zero Loss')
    plt.title('Component Losses')
    plt.xlabel('Epoch')
    plt.ylabel('Loss (log scale)')
    plt.legend()
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig('loss_history.png')
    
    logger.info("Loss history saved to loss_history.png")
    logger.info("Done!")


if __name__ == "__main__":
    main()
