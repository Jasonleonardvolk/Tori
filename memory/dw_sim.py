"""
dw_sim.py  ▸  Domain Wall & Ising Model Simulation
===============================================

High-level goals
----------------
1. **Ising pattern recall** using Metropolis algorithm
2. **Temperature annealing** options for better convergence
3. **Energy statistics** tracking during simulation

This module provides a minimal but robust implementation of Ising model
simulation for associative memory recall using domain wall dynamics.
"""

from __future__ import annotations

import logging
import random
from typing import Optional, Tuple, List, Dict, Any

import numpy as np

LOGGER = logging.getLogger("tori.memory.dw_sim")
__all__ = ["ising_recall", "calculate_energy"]


def ising_recall(
    J: np.ndarray,
    cue: np.ndarray,
    beta: float = 2.0,
    steps: int = 5000,
    schedule: str = "constant",
    field: Optional[np.ndarray] = None,
) -> np.ndarray:
    """
    Recall a pattern using Ising model dynamics with Metropolis updates.
    
    Parameters
    ----------
    J
        Coupling matrix with shape *(N, N)*.
    cue
        Initial state with shape *(N,)*, values ±1.
    beta
        Inverse temperature parameter (higher = less noise).
    steps
        Number of Monte Carlo steps.
    schedule
        Temperature schedule: "constant", "linear", or "exponential".
    field
        Optional external field with shape *(N,)*.
    
    Returns
    -------
    np.ndarray
        Final state after simulation, shape *(N,)*.
        
    Notes
    -----
    Uses the Metropolis algorithm for pattern recall:
    1. Randomly select a spin
    2. Calculate energy change for flipping that spin
    3. Accept flip if ΔE ≤ 0 or with probability exp(-βΔE)
    
    This implementation is optimized for pattern recall in associative memory
    rather than physical simulation accuracy.
    """
    sigma = np.asarray(cue, dtype=np.int8).copy()
    N = len(sigma)
    
    # Create temperature schedule
    betas = _create_beta_schedule(beta, steps, schedule)
    
    # Run simulation
    for step in range(steps):
        # Select random spin
        i = random.randrange(N)
        
        # Calculate energy change for flipping
        dE = 2 * sigma[i] * np.dot(J[i], sigma)
        
        # Add external field if provided
        if field is not None:
            dE += 2 * sigma[i] * field[i]
        
        # Metropolis criterion
        current_beta = betas[step]
        if dE <= 0 or random.random() < np.exp(-current_beta * dE):
            sigma[i] *= -1
            
    return sigma


def calculate_energy(
    J: np.ndarray, 
    state: np.ndarray, 
    field: Optional[np.ndarray] = None
) -> float:
    """
    Calculate energy of an Ising model configuration.
    
    Parameters
    ----------
    J
        Coupling matrix with shape *(N, N)*.
    state
        Spin configuration with shape *(N,)*, values ±1.
    field
        Optional external field with shape *(N,)*.
    
    Returns
    -------
    float
        Total energy of the configuration.
        
    Notes
    -----
    Energy formula: E = -∑ᵢⱼ Jᵢⱼsᵢsⱼ - ∑ᵢ hᵢsᵢ
    where hᵢ is the external field at site i.
    """
    s = np.asarray(state, dtype=np.int8)
    
    # Interaction energy
    E = -0.5 * s @ J @ s  # Avoided double-counting
    
    # Field energy
    if field is not None:
        E -= np.sum(field * s)
        
    return float(E)


def _create_beta_schedule(
    beta_final: float, steps: int, schedule: str
) -> np.ndarray:
    """
    Create a temperature (β) schedule for annealing.
    
    Parameters
    ----------
    beta_final
        Final inverse temperature.
    steps
        Number of steps.
    schedule
        Schedule type: "constant", "linear", or "exponential".
    
    Returns
    -------
    np.ndarray
        Array of beta values for each step.
    """
    if schedule == "constant":
        return np.ones(steps, dtype=np.float32) * beta_final
        
    elif schedule == "linear":
        # Linear annealing from β=0.1 to β=beta_final
        return np.linspace(0.1, beta_final, steps, dtype=np.float32)
        
    elif schedule == "exponential":
        # Exponential annealing from β=0.1 to β=beta_final
        return np.geomspace(0.1, beta_final, steps, dtype=np.float32)
        
    else:
        LOGGER.warning(f"Unknown schedule '{schedule}', using constant")
        return np.ones(steps, dtype=np.float32) * beta_final
