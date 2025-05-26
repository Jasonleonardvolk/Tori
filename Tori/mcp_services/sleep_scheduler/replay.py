"""
SleepScheduler Energy-Based Replay

This module implements the Hopfield memory model with simulated annealing for energy-based
memory consolidation.
"""

import numpy as np
import logging
from tqdm import tqdm
from typing import List, Dict, Tuple, Optional, Union, Any
import time
import os
import json
from dataclasses import dataclass
from enum import Enum

from ..metrics import (
    SCHEDULER_CONSOL_OPS_TOTAL,
    SCHEDULER_CURRENT_TEMP,
    SCHEDULER_CURRENT_ENERGY,
    SCHEDULER_ENERGY_IMPROVEMENT,
    SCHEDULER_WEIGHT_SPARSITY,
)

# Set up logging
logger = logging.getLogger(__name__)


class TemperatureSchedule(str, Enum):
    """Temperature schedule types for simulated annealing."""
    GEOMETRIC = "geometric"
    LOGARITHMIC = "logarithmic"
    EXPONENTIAL = "exponential"
    LINEAR = "linear"


@dataclass
class ReplayConfig:
    """Configuration for Hopfield replay."""
    initial_temperature: float = 2.0
    cooling_rate: float = 0.95
    annealing_steps: int = 1000
    learning_rate: float = 0.01
    negative_samples: int = 5
    l1_regularization: float = 0.001
    adaptive_learning_rate: bool = True
    min_energy_improvement: float = 0.001
    temperature_schedule: TemperatureSchedule = TemperatureSchedule.GEOMETRIC
    prioritize_threshold_edges: bool = False
    threshold_sampling_weight: float = 2.0
    max_iterations: int = 10
    weights_path: Optional[str] = None


@dataclass
class ConceptActivation:
    """Concept activation pattern."""
    # Sparse representation - concept IDs and their activation values
    concept_ids: List[str]
    values: List[float]
    # Dense binary vector (optional, computed on demand)
    binary_vector: Optional[np.ndarray] = None
    # Size of the full concept space
    concept_space_size: int = 0

    def to_binary_vector(self, concept_map: Dict[str, int]) -> np.ndarray:
        """Convert sparse representation to binary vector."""
        if self.binary_vector is not None:
            return self.binary_vector

        # Ensure concept_space_size is set
        if self.concept_space_size == 0:
            self.concept_space_size = len(concept_map)

        # Create binary vector
        binary = np.zeros(self.concept_space_size)
        for concept_id, value in zip(self.concept_ids, self.values):
            if concept_id in concept_map:
                idx = concept_map[concept_id]
                binary[idx] = 1 if value > 0.5 else -1

        self.binary_vector = binary
        return binary

    @classmethod
    def from_binary_vector(cls, binary: np.ndarray, concept_map: Dict[int, str]) -> 'ConceptActivation':
        """Create ConceptActivation from binary vector."""
        # Convert to sparse representation
        active_indices = np.where(binary > 0)[0]
        concept_ids = [concept_map[idx] for idx in active_indices if idx in concept_map]
        values = [1.0] * len(concept_ids)

        return cls(
            concept_ids=concept_ids,
            values=values,
            binary_vector=binary,
            concept_space_size=len(binary)
        )


@dataclass
class Episode:
    """Episode with concept activations and metadata."""
    id: str
    timestamp: int
    activation: ConceptActivation
    energy: float = 0.0
    source: Optional[Dict[str, Any]] = None
    tags: List[str] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.metadata is None:
            self.metadata = {}
        if self.source is None:
            self.source = {}


@dataclass
class ReplayResult:
    """Result of a replay operation."""
    energy_improvement: float
    final_energy: float
    iterations: int
    duration_seconds: float
    weight_sparsity: float
    annealing_steps: int
    temperature_history: List[float]
    energy_history: List[float]
    concept_deltas: Dict[str, Dict[str, float]]


class HopfieldMemory:
    """
    Hopfield memory model with simulated annealing for energy-based replay.
    
    This implementation includes:
    - Weight matrix learning from episodes
    - Simulated annealing for finding low-energy states
    - Wake-sleep updates for improving the model
    - L1 regularization for sparsity
    - Adaptive learning rate
    - Custom temperature schedules
    """
    
    def __init__(self, config: ReplayConfig = None):
        """Initialize the Hopfield memory."""
        self.config = config or ReplayConfig()
        self.W = None  # Weight matrix
        self.concept_to_idx = {}  # Mapping from concept IDs to indices
        self.idx_to_concept = {}  # Mapping from indices to concept IDs
        self.concept_space_size = 0
        self.episode_count = 0
        self.near_threshold_edges = set()  # Edges near the pruning threshold
        
        # Load weights if path provided
        if self.config.weights_path and os.path.exists(self.config.weights_path):
            self.load_weights(self.config.weights_path)

    def learn_from_episodes(self, episodes: List[Episode]) -> None:
        """Learn patterns from episodes."""
        if not episodes:
            return
        
        # Update concept mapping
        self._update_concept_mapping(episodes)
        
        # Initialize weight matrix if needed
        if self.W is None:
            self.W = np.zeros((self.concept_space_size, self.concept_space_size))
        
        # Convert episodes to binary vectors
        patterns = []
        for episode in episodes:
            binary = episode.activation.to_binary_vector(self.concept_to_idx)
            patterns.append(binary)
        
        # Update weight matrix (Hebbian learning)
        for pattern in patterns:
            outer_product = np.outer(pattern, pattern)
            np.fill_diagonal(outer_product, 0)  # No self-connections
            self.W += outer_product / self.concept_space_size
        
        self.episode_count += len(episodes)
        
        # Update sparsity metric
        sparsity = np.sum(np.abs(self.W) < 1e-6) / (self.W.size - self.concept_space_size)
        SCHEDULER_WEIGHT_SPARSITY.set(sparsity)

    def _update_concept_mapping(self, episodes: List[Episode]) -> None:
        """Update the concept mapping based on new episodes."""
        # Collect all unique concept IDs
        all_concepts = set()
        for episode in episodes:
            all_concepts.update(episode.activation.concept_ids)
        
        # Add new concepts to the mapping
        new_concepts = all_concepts - set(self.concept_to_idx.keys())
        for concept_id in new_concepts:
            idx = self.concept_space_size
            self.concept_to_idx[concept_id] = idx
            self.idx_to_concept[idx] = concept_id
            self.concept_space_size += 1
        
        # If we added new concepts, resize the weight matrix
        if new_concepts and self.W is not None:
            old_size = self.W.shape[0]
            new_size = self.concept_space_size
            if new_size > old_size:
                # Create new weight matrix with zeros for new concepts
                W_new = np.zeros((new_size, new_size))
                W_new[:old_size, :old_size] = self.W
                self.W = W_new

    def compute_energy(self, state: np.ndarray) -> float:
        """Compute energy of a state."""
        return -0.5 * np.dot(state, np.dot(self.W, state))

    def compute_energy_change(self, state: np.ndarray, idx: int) -> float:
        """Compute energy change for flipping a bit."""
        return 2 * state[idx] * np.dot(self.W[idx], state)

    def simulated_annealing(self, 
                           initial_state: np.ndarray, 
                           job_id: str = "unknown") -> Tuple[np.ndarray, List[float], List[float]]:
        """
        Perform simulated annealing to find a low-energy state.
        
        Args:
            initial_state: Initial binary state vector
            job_id: ID for the current job (for metrics)
            
        Returns:
            Tuple of (final_state, temperature_history, energy_history)
        """
        if self.W is None:
            raise ValueError("Weight matrix not initialized. Call learn_from_episodes first.")
        
        # Make a copy of the initial state
        state = initial_state.copy()
        
        # Initial energy
        energy = self.compute_energy(state)
        
        # Initialize temperature and histories
        T = self.config.initial_temperature
        temp_history = [T]
        energy_history = [energy]
        
        # Set up temperature schedule
        schedule = self.config.temperature_schedule
        
        # Run annealing
        for step in range(self.config.annealing_steps):
            # Update metrics
            SCHEDULER_CURRENT_TEMP.labels(job_id=job_id).set(T)
            SCHEDULER_CURRENT_ENERGY.labels(job_id=job_id).set(energy)
            
            # Pick a random spin to flip
            idx = np.random.randint(0, len(state))
            
            # Compute energy change
            delta_E = self.compute_energy_change(state, idx)
            
            # Accept or reject the flip
            if delta_E < 0 or np.random.random() < np.exp(-delta_E / T):
                state[idx] *= -1  # Flip the spin
                energy += delta_E
                energy_history.append(energy)
            
            # Update temperature according to schedule
            if schedule == TemperatureSchedule.GEOMETRIC:
                T = T * self.config.cooling_rate
            elif schedule == TemperatureSchedule.LOGARITHMIC:
                T = self.config.initial_temperature / np.log(2 + step)
            elif schedule == TemperatureSchedule.EXPONENTIAL:
                T = self.config.initial_temperature * np.exp(-self.config.cooling_rate * step)
            elif schedule == TemperatureSchedule.LINEAR:
                T = self.config.initial_temperature * (1 - step / self.config.annealing_steps)
            
            temp_history.append(T)
            
            # Early stopping if energy isn't changing
            if len(energy_history) > 100 and np.std(energy_history[-100:]) < 1e-6:
                logger.info(f"Early stopping at step {step} due to converged energy")
                break
        
        return state, temp_history, energy_history

    def wake_sleep_update(self,
                         positive_state: np.ndarray,
                         job_id: str = "unknown") -> None:
        """
        Update weights using wake-sleep algorithm.
        
        Args:
            positive_state: The low-energy state found by annealing
            job_id: ID for the current job (for metrics)
        """
        if self.W is None:
            raise ValueError("Weight matrix not initialized")
        
        # Positive phase: reinforce the low-energy state
        pos_outer = np.outer(positive_state, positive_state)
        np.fill_diagonal(pos_outer, 0)  # No self-connections
        
        # Negative phase: sample from the model and suppress these states
        neg_outer = np.zeros_like(pos_outer)
        for _ in range(self.config.negative_samples):
            # Start from random state
            random_state = np.random.choice([-1, 1], size=len(positive_state))
            # Run a short annealing to get a model sample
            neg_state, _, _ = self.simulated_annealing(random_state, job_id)
            # Compute outer product
            neg_product = np.outer(neg_state, neg_state)
            np.fill_diagonal(neg_product, 0)
            neg_outer += neg_product / self.config.negative_samples
        
        # Compute update
        delta_W = pos_outer - neg_outer
        
        # Apply L1 regularization to promote sparsity
        if self.config.l1_regularization > 0:
            l1_gradient = np.sign(self.W) * self.config.l1_regularization
            delta_W -= l1_gradient
        
        # Apply learning rate
        lr = self.config.learning_rate
        self.W += lr * delta_W
        
        # Track edges near threshold for importance sampling
        if self.config.prioritize_threshold_edges:
            threshold = self.config.l1_regularization * 2
            near_threshold = np.where((np.abs(self.W) > 0) & (np.abs(self.W) < threshold))
            self.near_threshold_edges = set(zip(near_threshold[0], near_threshold[1]))

    def replay(self, episodes: List[Episode], job_id: str = "unknown") -> ReplayResult:
        """
        Replay episodes to improve memory consolidation.
        
        Args:
            episodes: List of episodes to replay
            job_id: ID for the current job (for metrics)
            
        Returns:
            ReplayResult with metrics and deltas
        """
        if not episodes:
            return ReplayResult(
                energy_improvement=0.0,
                final_energy=0.0,
                iterations=0,
                duration_seconds=0.0,
                weight_sparsity=1.0,
                annealing_steps=0,
                temperature_history=[],
                energy_history=[],
                concept_deltas={}
            )
        
        start_time = time.time()
        
        # Ensure we have a weight matrix
        if self.W is None or self.episode_count == 0:
            self.learn_from_episodes(episodes)
        
        # Track concept deltas for each episode
        all_concept_deltas = {}
        
        # Initial energy
        total_initial_energy = 0.0
        total_final_energy = 0.0
        
        # Replay each episode
        for iteration in range(self.config.max_iterations):
            logger.info(f"Replay iteration {iteration+1}/{self.config.max_iterations}")
            
            total_improvement = 0.0
            
            for episode in tqdm(episodes, desc="Replaying episodes"):
                # Get binary state from episode
                initial_state = episode.activation.to_binary_vector(self.concept_to_idx)
                
                # Compute initial energy
                initial_energy = self.compute_energy(initial_state)
                
                # Run simulated annealing
                final_state, temp_history, energy_history = self.simulated_annealing(
                    initial_state, job_id
                )
                
                # Compute final energy
                final_energy = energy_history[-1] if energy_history else self.compute_energy(final_state)
                
                # Energy improvement
                improvement = initial_energy - final_energy
                total_improvement += improvement
                
                if iteration == 0:
                    total_initial_energy += initial_energy
                
                if iteration == self.config.max_iterations - 1:
                    total_final_energy += final_energy
                
                # Update weights using wake-sleep
                self.wake_sleep_update(final_state, job_id)
                
                # Calculate concept deltas for the last iteration
                if iteration == self.config.max_iterations - 1:
                    concept_deltas = self._calculate_concept_deltas(initial_state, final_state)
                    all_concept_deltas[episode.id] = concept_deltas
            
            # Log progress
            logger.info(f"Iteration {iteration+1} - Total energy improvement: {total_improvement:.4f}")
            
            # Check if improvement is below threshold
            if total_improvement < self.config.min_energy_improvement * len(episodes):
                logger.info(f"Early stopping after {iteration+1} iterations due to minimal improvement")
                break
        
        # Save weights
        if self.config.weights_path:
            self.save_weights(self.config.weights_path)
        
        # Calculate sparsity
        sparsity = np.sum(np.abs(self.W) < 1e-6) / (self.W.size - self.concept_space_size)
        SCHEDULER_WEIGHT_SPARSITY.set(sparsity)
        
        # Record energy improvement
        energy_improvement = total_initial_energy - total_final_energy
        SCHEDULER_ENERGY_IMPROVEMENT.observe(energy_improvement)
        
        # Return result
        result = ReplayResult(
            energy_improvement=energy_improvement,
            final_energy=total_final_energy,
            iterations=iteration + 1,
            duration_seconds=time.time() - start_time,
            weight_sparsity=sparsity,
            annealing_steps=len(temp_history),
            temperature_history=temp_history,
            energy_history=energy_history,
            concept_deltas=all_concept_deltas
        )
        
        return result

    def _calculate_concept_deltas(self, initial_state: np.ndarray, final_state: np.ndarray) -> Dict[str, float]:
        """Calculate concept activation deltas between initial and final states."""
        deltas = {}
        for i in range(len(initial_state)):
            if initial_state[i] != final_state[i] and i in self.idx_to_concept:
                concept_id = self.idx_to_concept[i]
                deltas[concept_id] = float(final_state[i])  # Convert to Python float for serialization
        return deltas

    def save_weights(self, path: str) -> None:
        """Save weight matrix and concept mappings to a file."""
        if self.W is None:
            logger.warning("No weights to save")
            return
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        
        # Prepare data
        data = {
            'concept_to_idx': self.concept_to_idx,
            'concept_space_size': self.concept_space_size,
            'episode_count': self.episode_count
        }
        
        # Save weight matrix
        np.savez_compressed(
            path,
            W=self.W,
            metadata=json.dumps(data)
        )
        
        logger.info(f"Saved weights to {path}")

    def load_weights(self, path: str) -> bool:
        """Load weight matrix and concept mappings from a file."""
        try:
            # Load from NPZ file
            data = np.load(path, allow_pickle=True)
            
            # Load weight matrix
            self.W = data['W']
            
            # Load metadata
            metadata = json.loads(str(data['metadata']))
            self.concept_to_idx = metadata['concept_to_idx']
            self.concept_space_size = metadata['concept_space_size']
            self.episode_count = metadata.get('episode_count', 0)
            
            # Rebuild idx_to_concept mapping
            self.idx_to_concept = {int(v): k for k, v in self.concept_to_idx.items()}
            
            logger.info(f"Loaded weights from {path} with {self.concept_space_size} concepts")
            
            # Update sparsity metric
            sparsity = np.sum(np.abs(self.W) < 1e-6) / (self.W.size - self.concept_space_size)
            SCHEDULER_WEIGHT_SPARSITY.set(sparsity)
            
            return True
        except Exception as e:
            logger.error(f"Failed to load weights from {path}: {e}")
            return False
