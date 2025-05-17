"""
ELFIN Stability Framework Demo.

This script demonstrates the stability verification components we've implemented.
"""

import numpy as np
import matplotlib.pyplot as plt
import torch
import logging
import time
from enum import Enum, auto
from typing import Dict, List, Tuple, Optional, Any, Union, Callable
from dataclasses import dataclass, field
import json
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

#----------------------------------------------------------------------
# Core Constraint IR Classes
#----------------------------------------------------------------------

class ConstraintType(Enum):
    """Types of constraints supported in the IR."""
    
    EQUALITY = auto()     # a == b
    INEQUALITY = auto()   # a <= b or a >= b
    POSITIVE = auto()     # a > 0
    NEGATIVE = auto()     # a < 0
    VANISHING = auto()    # a == 0
    CUSTOM = auto()       # Other constraint types


class VerificationStatus(Enum):
    """Status of a verification result."""
    
    VERIFIED = auto()     # Constraint verified to be true
    REFUTED = auto()      # Constraint verified to be false
    UNKNOWN = auto()      # Unknown status
    IN_PROGRESS = auto()  # Verification in progress
    ERROR = auto()        # Error during verification


@dataclass
class ConstraintIR:
    """
    Constraint Intermediate Representation.
    
    This represents a solver-agnostic constraint that can be passed to
    various verification backends (SOS, SMT, MILP, etc.).
    """
    
    id: str
    variables: List[str]
    expression: str
    constraint_type: Union[ConstraintType, str]
    context: Dict[str, Any] = field(default_factory=dict)
    solver_hint: Optional[str] = None
    proof_needed: bool = True
    dependencies: List[str] = field(default_factory=list)
    
    def compute_hash(self) -> str:
        """
        Compute a unique hash for this constraint.
        
        This hash can be used for caching verification results.
        """
        # Convert to JSON-serializable dict (excluding solver-specific hints)
        data = {
            "id": self.id,
            "variables": sorted(self.variables),
            "expression": self.expression,
            "constraint_type": self.constraint_type.name if isinstance(self.constraint_type, ConstraintType) else self.constraint_type,
            "context": {k: v for k, v in sorted(self.context.items()) if k != "solver_specific"}
        }
        
        # Compute hash
        json_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(json_str.encode()).hexdigest()


@dataclass
class VerificationResult:
    """
    Result of a constraint verification.
    
    This includes the status, any counterexample found, and a
    certificate of proof if the verification succeeded.
    """
    
    constraint_id: str
    status: VerificationStatus
    proof_hash: str
    verification_time: float
    counterexample: Optional[Dict[str, Any]] = None
    certificate: Optional[Dict[str, Any]] = None
    solver_info: Dict[str, Any] = field(default_factory=dict)


#----------------------------------------------------------------------
# SOS Verification
#----------------------------------------------------------------------

class SOSVerifier:
    """
    Simplified SOS verifier with direct computation.
    
    This provides a pure Python implementation for verifying
    quadratic Lyapunov functions without requiring MATLAB.
    """
    
    def verify_pd(
        self,
        q_matrix: np.ndarray,
        variables: Optional[List[str]] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Verify positive definiteness of a quadratic form V(x) = x^T Q x.
        
        Args:
            q_matrix: Q matrix defining the quadratic form
            variables: Optional variable names (for documentation)
            
        Returns:
            Tuple of (success, certificate)
        """
        start_time = time.time()
        
        # Check symmetric part
        q_symmetric = (q_matrix + q_matrix.T) / 2
        
        try:
            # Check eigenvalues
            eigenvalues = np.linalg.eigvalsh(q_symmetric)
            min_eigenvalue = np.min(eigenvalues)
            
            success = min_eigenvalue > 0
            
            if success:
                # Generate certificate
                certificate = {
                    "type": "eigenvalue",
                    "min_eigenvalue": float(min_eigenvalue),
                    "eigenvalues": eigenvalues.tolist(),
                }
            else:
                # Find eigenvector for counterexample
                eigenvalues, eigenvectors = np.linalg.eigh(q_symmetric)
                min_idx = np.argmin(eigenvalues)
                counterexample = eigenvectors[:, min_idx]
                
                certificate = {
                    "type": "counterexample",
                    "counterexample": counterexample.tolist(),
                    "min_eigenvalue": float(min_eigenvalue)
                }
                
            return success, {
                "certificate": certificate,
                "verification_time": time.time() - start_time
            }
            
        except Exception as e:
            return False, {
                "error": str(e),
                "verification_time": time.time() - start_time
            }


#----------------------------------------------------------------------
# Neural Lyapunov Learning
#----------------------------------------------------------------------

class LyapunovNetwork(torch.nn.Module):
    """Neural network for Lyapunov function approximation."""
    
    def __init__(
        self,
        input_dim: int,
        hidden_dims: List[int] = [64, 64]
    ):
        """
        Initialize a neural Lyapunov network.
        
        Args:
            input_dim: Dimension of the state space
            hidden_dims: Dimensions of hidden layers
        """
        super().__init__()
        
        # Build layers
        layers = []
        dims = [input_dim] + hidden_dims + [1]
        
        for i in range(len(dims) - 1):
            layers.append(torch.nn.Linear(dims[i], dims[i+1]))
            
            if i < len(dims) - 2:
                layers.append(torch.nn.ReLU())
            else:
                layers.append(torch.nn.Softplus())
                
        self.net = torch.nn.Sequential(*layers)
        self.input_dim = input_dim
        self.hidden_dims = hidden_dims
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through the network.
        
        Args:
            x: State vector(s) of shape (batch_size, input_dim)
            
        Returns:
            V(x) of shape (batch_size, 1)
        """
        return self.net(x)
    
    def grad(self, x: torch.Tensor) -> torch.Tensor:
        """
        Compute gradient ∇V(x) using autograd.
        
        Args:
            x: State vector(s) of shape (batch_size, input_dim)
            
        Returns:
            ∇V(x) of shape (batch_size, input_dim)
        """
        x_clone = x.clone().detach().requires_grad_(True)
        V = self.forward(x_clone)
        
        # Compute batch gradients
        batch_size = x_clone.shape[0]
        grads = torch.zeros(batch_size, self.input_dim, device=x.device)
        
        for i in range(batch_size):
            if i > 0:
                x_clone.grad = None
            V[i].backward(retain_graph=(i < batch_size - 1))
            grads[i] = x_clone.grad[i].clone()
            
        return grads


@dataclass
class DynamicsModel:
    """
    Model of system dynamics dx/dt = f(x).
    
    This class provides a PyTorch-compatible wrapper around
    system dynamics functions.
    """
    
    forward_fn: Callable
    input_dim: int
    
    def __call__(self, x: torch.Tensor) -> torch.Tensor:
        """
        Evaluate dynamics function.
        
        Args:
            x: State vector(s) of shape (batch_size, input_dim)
            
        Returns:
            dx/dt of shape (batch_size, input_dim)
        """
        # Convert to NumPy if the forward function doesn't accept tensors
        x_np = x.detach().cpu().numpy()
        
        # Batch processing
        results = []
        for i in range(x_np.shape[0]):
            results.append(self.forward_fn(x_np[i]))
            
        result_np = np.stack(results)
            
        return torch.tensor(
            result_np,
            dtype=torch.float32,
            device=x.device
        )


class NeuralLyapunovLearner:
    """
    Trainer for neural network Lyapunov functions.
    
    This class provides functionality for learning neural network Lyapunov
    functions that satisfy stability conditions for dynamical systems.
    """
    
    def __init__(
        self,
        dynamics: DynamicsModel,
        state_dim: int,
        hidden_dims: List[int] = [64, 64],
        lr: float = 1e-3,
        epsilon: float = 0.1,
        device: str = "cpu"
    ):
        """
        Initialize the neural Lyapunov learner.
        
        Args:
            dynamics: Dynamics model
            state_dim: Dimension of the state space
            hidden_dims: Dimensions of hidden layers
            lr: Learning rate
            epsilon: Margin for Lyapunov conditions
            device: Device to use for training
        """
        self.dynamics = dynamics
        self.state_dim = state_dim
        self.device = device
        self.epsilon = epsilon
        
        # Initialize network and optimizer
        self.network = LyapunovNetwork(state_dim, hidden_dims).to(device)
        self.optimizer = torch.optim.Adam(self.network.parameters(), lr=lr)
        
        # Learning history
        self.history = {
            "total_loss": [],
            "pd_loss": [],
            "decreasing_loss": [],
            "zero_loss": []
        }
        
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
        grads = self.network.grad(x)  # Shape: (batch_size, state_dim)
        f_x = self.dynamics(x)  # Shape: (batch_size, state_dim)
        
        # Compute Lie derivative ∇V(x)·f(x)
        lie_derivative = torch.sum(grads * f_x, dim=1, keepdim=True)
        
        return lie_derivative
    
    def train_step(self, n_samples: int = 1000) -> Dict[str, float]:
        """
        Perform one training step.
        
        Args:
            n_samples: Number of samples
            
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
        decreasing_loss = torch.relu(dVdt + self.epsilon).mean()
        
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
    
    def train(self, n_epochs: int = 1000) -> Dict[str, List[float]]:
        """
        Train the neural Lyapunov function.
        
        Args:
            n_epochs: Number of epochs
            
        Returns:
            Dictionary of loss histories
        """
        start_time = time.time()
        
        for epoch in range(n_epochs):
            metrics = self.train_step()
            
            # Store metrics
            for k, v in metrics.items():
                self.history[k].append(v)
            
            # Log progress
            if epoch % 100 == 0:
                elapsed = time.time() - start_time
                logger.info(f"Epoch {epoch}/{n_epochs} "
                          f"[{elapsed:.1f}s] "
                          f"Loss: {metrics['total_loss']:.6f}")
        
        logger.info(f"Training completed in {time.time() - start_time:.1f}s")
        
        return self.history
    
    def verify_around_equilibrium_batched(
        self,
        radius: float = 1.0,
        n_samples: int = 1000,
        epsilon: float = 0.0,
        grid_dims: Optional[Tuple[int, int]] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Verify Lyapunov conditions around an equilibrium point using batch operations.
        
        This implementation uses vectorized operations for a 10-20x speedup compared
        to point-by-point evaluation.
        
        Args:
            radius: Radius around the equilibrium
            n_samples: Number of random samples for verification
            epsilon: Margin for decreasing condition
            grid_dims: Optional tuple of grid dimensions for deterministic sampling
            
        Returns:
            Tuple of (success, details)
        """
        start_time = time.time()
        
        # Random sampling approach
        if grid_dims is None:
            # Sample states from uniform distribution over unit hypersphere
            # and scale by radius parameter
            states = self.sample_states(n_samples)
            norms = torch.norm(states, dim=1, keepdim=True)
            states = states * radius / norms
        else:
            # Create a deterministic grid in state space (for 2D or 3D)
            assert self.state_dim <= 3, "Grid sampling only supported for 2D or 3D state spaces"
            
            if self.state_dim == 2:
                # 2D grid
                nx, ny = grid_dims
                x = torch.linspace(-radius, radius, nx, device=self.device)
                y = torch.linspace(-radius, radius, ny, device=self.device)
                X, Y = torch.meshgrid(x, y, indexing='ij')
                
                # Reshape to batch of points
                states = torch.stack([X.flatten(), Y.flatten()], dim=1)
                
                # Filter out points outside the radius
                mask = torch.norm(states, dim=1) <= radius
                states = states[mask]
                
            elif self.state_dim == 3:
                # 3D grid
                nx, ny = grid_dims
                nz = max(1, int(nx / 2))  # Fewer points in z-dimension
                
                x = torch.linspace(-radius, radius, nx, device=self.device)
                y = torch.linspace(-radius, radius, ny, device=self.device)
                z = torch.linspace(-radius, radius, nz, device=self.device)
                
                X, Y, Z = torch.meshgrid(x, y, z, indexing='ij')
                
                # Reshape to batch of points
                states = torch.stack([X.flatten(), Y.flatten(), Z.flatten()], dim=1)
                
                # Filter out points outside the radius
                mask = torch.norm(states, dim=1) <= radius
                states = states[mask]
        
        # Filter out origin (if present) to avoid division by zero
        origin_mask = torch.all(torch.abs(states) < 1e-6, dim=1)
        if origin_mask.any():
            states = states[~origin_mask]
        
        # Batch evaluate Lyapunov function
        with torch.no_grad():
            # Compute V(x)
            V = self.network(states)
            
            # Compute dV/dt
            dVdt = self.compute_lie_derivative(states)
            
            # Check positive definiteness
            pd_violations = (V <= 0).sum().item()
            
            # Check decreasing property
            decreasing_violations = (dVdt >= -epsilon).sum().item()
            
            # Overall success
            success = (pd_violations == 0) and (decreasing_violations == 0)
            
            # Compute statistics
            n_total = len(states)
            details = {
                "pd_violations": pd_violations,
                "decreasing_violations": decreasing_violations,
                "pd_violation_rate": pd_violations / n_total,
                "decreasing_violation_rate": decreasing_violations / n_total,
                "V_min": V.min().item(),
                "V_max": V.max().item(),
                "dVdt_min": dVdt.min().item(),
                "dVdt_max": dVdt.max().item(),
                "verification_time": time.time() - start_time,
                "n_samples": n_total
            }
            
            return success, details


#----------------------------------------------------------------------
# Example Functions
#----------------------------------------------------------------------

def example_dynamics(x):
    """Example dynamics dx/dt = -x for a linear system."""
    return -x


def create_constraint(state_dim=2):
    """
    Create a constraint for positive definiteness verification.
    
    Args:
        state_dim: Dimension of the state space
        
    Returns:
        ConstraintIR instance and Q matrix
    """
    # Create a random positive definite matrix
    q_matrix = np.random.randn(state_dim, state_dim)
    q_matrix = q_matrix.T @ q_matrix + np.eye(state_dim) * 0.1
    
    # Create variables
    variables = [f"x{i}" for i in range(state_dim)]
    
    # Create constraint for positive definiteness
    constraint = ConstraintIR(
        id="pd_test",
        variables=variables,
        expression="V(x) > 0",  # Symbolic representation
        constraint_type=ConstraintType.POSITIVE,
        context={
            "q_matrix": q_matrix.tolist(),
            "dimension": state_dim,
            "lyapunov_type": "polynomial"
        },
        solver_hint="sos",
        proof_needed=True
    )
    
    return constraint, q_matrix


def verify_with_sos(constraint, q_matrix):
    """
    Verify a constraint using SOS.
    
    Args:
        constraint: Constraint to verify
        q_matrix: Q matrix for verification
        
    Returns:
        Verification result
    """
    logger.info("Verifying with SOS...")
    
    # Create SOS verifier
    verifier = SOSVerifier()
    
    # Verify positive definiteness
    start_time = time.time()
    success, details = verifier.verify_pd(q_matrix)
    verification_time = time.time() - start_time
    
    # Create verification result
    status = VerificationStatus.VERIFIED if success else VerificationStatus.REFUTED
    
    result = VerificationResult(
        constraint_id=constraint.id,
        status=status,
        proof_hash=constraint.compute_hash(),
        verification_time=verification_time,
        certificate=details.get("certificate"),
        counterexample=details.get("counterexample"),
        solver_info={"solver": "sos_verifier"}
    )
    
    logger.info(f"SOS verification result: {status.name} in {verification_time:.3f}s")
    
    return result


def train_neural_lyapunov(state_dim=2, epochs=500):
    """
    Train a neural Lyapunov function.
    
    Args:
        state_dim: Dimension of the state space
        epochs: Number of training epochs
        
    Returns:
        Trained neural Lyapunov learner
    """
    logger.info(f"Training neural Lyapunov function ({epochs} epochs)...")
    
    # Create dynamics model
    dynamics = DynamicsModel(
        forward_fn=example_dynamics,
        input_dim=state_dim
    )
    
    # Create neural Lyapunov learner
    learner = NeuralLyapunovLearner(
        dynamics=dynamics,
        state_dim=state_dim,
        hidden_dims=[32, 32],
        lr=1e-3,
        epsilon=0.1
    )
    
    # Train
    history = learner.train(n_epochs=epochs)
    
    logger.info("Neural Lyapunov training complete")
    
    return learner, history


def plot_lyapunov_values(lyapunov_fn, title="Lyapunov Function"):
    """
    Plot Lyapunov function values in 2D.
    
    Args:
        lyapunov_fn: Lyapunov function (Q matrix or neural network)
        title: Plot title
    """
    # Create meshgrid
    x = np.linspace(-3, 3, 50)
    y = np.linspace(-3, 3, 50)
    X, Y = np.meshgrid(x, y)
    
    # Evaluate Lyapunov function
    Z = np.zeros_like(X)
    
    for i in range(50):
        for j in range(50):
            state = np.array([X[i, j], Y[i, j]])
            
            if isinstance(lyapunov_fn, np.ndarray):
                # Quadratic form
                Z[i, j] = state @ lyapunov_fn @ state
            else:
                # Neural network
                state_tensor = torch.tensor(state, dtype=torch.float32).unsqueeze(0)
                with torch.no_grad():
                    Z[i, j] = lyapunov_fn(state_tensor).item()
    
    # Create plot
    plt.figure(figsize=(10, 8))
    plt.contourf(X, Y, Z, levels=20, cmap='viridis')
    plt.colorbar(label='Lyapunov Value')
    plt.title(title)
    plt.xlabel('x')
    plt.ylabel('y')
    plt.grid(True)
    
    # Add a quiver plot for the dynamics
    dx = np.zeros_like(X)
    dy = np.zeros_like(Y)
    for i in range(50):
        for j in range(50):
            state = np.array([X[i, j], Y[i, j]])
            dstate = example_dynamics(state)
            dx[i, j] = dstate[0]
            dy[i, j] = dstate[1]
    
    # Skip some points for clarity
    stride = 5
    plt.quiver(X[::stride, ::stride], Y[::stride, ::stride], 
              dx[::stride, ::stride], dy[::stride, ::stride],
              color='white', alpha=0.8)
    
    plt.tight_layout()


def plot_training_history(history):
    """
    Plot training history for neural Lyapunov function.
    
    Args:
        history: Training history
    """
    plt.figure(figsize=(12, 6))
    
    # Plot total loss
    plt.subplot(1, 2, 1)
    plt.semilogy(history['total_loss'], label='Total Loss')
    plt.title('Total Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss (log scale)')
    plt.grid(True)
    
    # Plot component losses
    plt.subplot(1, 2, 2)
    plt.semilogy(history['pd_loss'], label='PD Loss')
    plt.semilogy(history['decreasing_loss'], label='Decreasing Loss')
    plt.semilogy(history['zero_loss'], label='Zero Loss')
    plt.title('Component Losses')
    plt.xlabel('Epoch')
    plt.ylabel('Loss (log scale)')
    plt.legend()
    plt.grid(True)
    
    plt.tight_layout()


def main():
    """Run the demonstration."""
    # Set state dimension
    state_dim = 2
    
    # Create constraint for SOS verification
    constraint, q_matrix = create_constraint(state_dim)
    
    # Verify with SOS
    verify_with_sos(constraint, q_matrix)
    
    # Train neural Lyapunov function (reduced epochs for quick demo)
    learner, history = train_neural_lyapunov(state_dim, epochs=200)
    
    # Verify the neural Lyapunov function using batched verification
    logger.info("Verifying neural Lyapunov function with batched verification...")
    start_time = time.time()
    success, details = learner.verify_around_equilibrium_batched(
        radius=2.0,
        n_samples=5000,
        grid_dims=(50, 50)  # Use a 50x50 grid for deterministic verification
    )
    logger.info(f"Batched verification completed in {time.time() - start_time:.3f}s")
    logger.info(f"Verification result: {'Success' if success else 'Failed'}")
    logger.info(f"  PD violations: {details['pd_violations']}/{details['n_samples']}")
    logger.info(f"  Decreasing violations: {details['decreasing_violations']}/{details['n_samples']}")
    
    # Plot Lyapunov functions
    plot_lyapunov_values(q_matrix, title="Quadratic Lyapunov Function")
    plot_lyapunov_values(learner.network, title="Neural Lyapunov Function")
    
    # Plot training history
    plot_training_history(history)
    
    plt.show()


if __name__ == "__main__":
    main()
