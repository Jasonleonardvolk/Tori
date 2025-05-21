"""
Memory System Manager

This module provides a unified API for memory recall with support for
hot-swapping between Hopfield and Ising memory backends.
"""

from __future__ import annotations

import os
import logging
import numpy as np
from typing import Optional, Dict, Tuple, List, Any

# Import backend implementations
from .hopfield_to_ising import (
    hopfield_to_ising, 
    dense_recall, 
    pattern_overlap, 
    get_highest_overlap_pattern,
    check_pattern_stability
)
from .dw_sim import ising_recall, calculate_energy

# Configure logging
LOGGER = logging.getLogger("tori.memory.manager")

class MemoryManager:
    """
    Memory system manager with support for multiple backends.
    
    This class provides a unified API for memory recall operations
    with support for hot-swapping between Hopfield and Ising backends.
    """
    
    VALID_BACKENDS = ["dense", "ising"]
    
    def __init__(
        self, 
        patterns: Optional[np.ndarray] = None, 
        backend: str = "dense",
        coupling_matrix: Optional[np.ndarray] = None
    ):
        """
        Initialize memory manager.
        
        Parameters
        ----------
        patterns
            Memory patterns with shape *(P, N)* and values ±1
        backend
            Memory backend ("dense" or "ising")
        coupling_matrix
            Optional pre-computed coupling matrix for Ising backend
        """
        # Validate backend
        if backend not in self.VALID_BACKENDS:
            raise ValueError(f"Invalid backend: {backend}. Valid options: {self.VALID_BACKENDS}")
        
        self.backend = backend
        self.patterns = patterns
        self.coupling_matrix = coupling_matrix
        
        # If Ising backend and no coupling matrix provided, compute it from patterns
        if self.backend == "ising" and self.coupling_matrix is None and self.patterns is not None:
            self.coupling_matrix = hopfield_to_ising(self.patterns)
            
        LOGGER.info(f"Initialized memory manager with {backend} backend")
    
    def recall(
        self, 
        cue: np.ndarray, 
        backend: Optional[str] = None,
        **kwargs
    ) -> np.ndarray:
        """
        Recall a pattern from memory.
        
        Parameters
        ----------
        cue
            Initial state for recall
        backend
            Optional override for backend choice
        **kwargs
            Additional backend-specific parameters
            
            For dense:
              - iterations (int): Maximum iterations (default: 10)
              - threshold (float): Activation threshold (default: 0)
                
            For ising:
              - beta (float): Inverse temperature (default: 2.0)
              - steps (int): Number of Monte Carlo steps (default: 5000)
              - schedule (str): Temperature schedule (default: "constant")
              - field (ndarray): Optional external field
                
        Returns
        -------
        np.ndarray
            Recalled pattern
        """
        # Use provided backend or default
        backend = backend or self.backend
        
        if backend not in self.VALID_BACKENDS:
            raise ValueError(f"Invalid backend: {backend}. Valid options: {self.VALID_BACKENDS}")
        
        # Backend-specific recall
        if backend == "dense":
            if self.patterns is None:
                raise ValueError("Dense backend requires patterns to be provided")
            
            iterations = kwargs.get("iterations", 10)
            threshold = kwargs.get("threshold", 0)
            
            return dense_recall(self.patterns, cue, iterations=iterations, threshold=threshold)
            
        elif backend == "ising":
            if self.coupling_matrix is None:
                raise ValueError("Ising backend requires coupling matrix")
                
            beta = kwargs.get("beta", 2.0)
            steps = kwargs.get("steps", 5000)
            schedule = kwargs.get("schedule", "constant")
            field = kwargs.get("field", None)
            
            return ising_recall(
                self.coupling_matrix, 
                cue, 
                beta=beta, 
                steps=steps,
                schedule=schedule,
                field=field
            )
    
    def switch_backend(self, backend: str) -> None:
        """
        Switch memory backend.
        
        Parameters
        ----------
        backend
            New backend to use
        """
        if backend not in self.VALID_BACKENDS:
            raise ValueError(f"Invalid backend: {backend}. Valid options: {self.VALID_BACKENDS}")
            
        # If switching to Ising and no coupling matrix yet, compute it
        if backend == "ising" and self.coupling_matrix is None and self.patterns is not None:
            self.coupling_matrix = hopfield_to_ising(self.patterns)
            
        self.backend = backend
        LOGGER.info(f"Switched to {backend} memory backend")
    
    def add_patterns(self, new_patterns: np.ndarray) -> None:
        """
        Add new patterns to memory.
        
        Parameters
        ----------
        new_patterns
            New patterns to add with shape *(P_new, N)* and values ±1
        """
        if self.patterns is None:
            self.patterns = new_patterns
        else:
            self.patterns = np.vstack([self.patterns, new_patterns])
            
        # If using Ising backend, update coupling matrix
        if self.backend == "ising":
            self.coupling_matrix = hopfield_to_ising(self.patterns)
            
        LOGGER.info(f"Added {len(new_patterns)} new patterns to memory")
    
    def get_highest_match(self, state: np.ndarray) -> Tuple[int, float]:
        """
        Find the stored pattern with highest overlap to the given state.
        
        Parameters
        ----------
        state
            Current state
            
        Returns
        -------
        Tuple[int, float]
            (pattern_index, overlap)
        """
        if self.patterns is None:
            raise ValueError("No patterns in memory")
            
        return get_highest_overlap_pattern(state, self.patterns)
    
    def calculate_energy(self, state: np.ndarray, field: Optional[np.ndarray] = None) -> float:
        """
        Calculate energy of a state in the current memory model.
        
        Parameters
        ----------
        state
            Spin configuration
        field
            Optional external field
            
        Returns
        -------
        float
            Energy of the state
        """
        if self.coupling_matrix is None:
            raise ValueError("Energy calculation requires coupling matrix")
            
        return calculate_energy(self.coupling_matrix, state, field)
    
    def check_stability(self, pattern: np.ndarray) -> Tuple[bool, float]:
        """
        Check if a pattern is stable under the current memory model.
        
        Parameters
        ----------
        pattern
            Pattern to check
            
        Returns
        -------
        Tuple[bool, float]
            (is_stable, stability_measure)
        """
        if self.coupling_matrix is None:
            raise ValueError("Stability check requires coupling matrix")
            
        return check_pattern_stability(self.coupling_matrix, pattern)
    
    @property
    def pattern_count(self) -> int:
        """Get the number of patterns in memory."""
        return 0 if self.patterns is None else len(self.patterns)
    
    @property
    def system_size(self) -> int:
        """Get the size of memory system (number of neurons/spins)."""
        if self.patterns is not None:
            return self.patterns.shape[1]
        elif self.coupling_matrix is not None:
            return self.coupling_matrix.shape[0]
        else:
            return 0


# Create a default manager instance
default_memory_backend = os.environ.get("MEMORY_BACKEND", "dense")
default_manager = MemoryManager(backend=default_memory_backend)
