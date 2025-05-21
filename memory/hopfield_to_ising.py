"""
hopfield_ising.py  ▸  Conversion & recall utilities
===================================================

High-level goals
----------------
1. **Convert Hopfield patterns (±1) → Ising couplings J** via the Hebbian rule.
2. **Recall** a stored pattern using either:
   • *Dense* Hopfield dynamics (sequential threshold updates)  
   • *Ising* Metropolis dynamics (optional, not implemented here)
3. **Diagnostics**
   • Per-pattern stability check  
   • Overlap / similarity metrics

All public functions are pure NumPy and side-effect-free (except for logging).
"""

from __future__ import annotations

import logging
from typing import Dict, Tuple

import numpy as np

LOGGER = logging.getLogger("tori.memory.hopfield_ising")
__all__ = [
    "hopfield_to_ising",
    "dense_recall",
    "check_pattern_stability",
    "check_all_patterns_stability",
    "pattern_overlap",
    "get_highest_overlap_pattern",
]


# --------------------------------------------------------------------------- #
# 1. Coupling-matrix construction                                             #
# --------------------------------------------------------------------------- #
def hopfield_to_ising(patterns: np.ndarray) -> np.ndarray:
    """
    Return the Ising coupling matrix **J** for a set of ±1 patterns.

    Formula
    -------
    .. math::
        J_{ij} \\;=\\; \\frac1{N}\\sum_{\\mu=1}^{P} \\xi_i^{\\mu}\\,\\xi_j^{\\mu}
        \\quad (i≠j),\\qquad J_{ii}=0

    Parameters
    ----------
    patterns
        Array of shape *(P, N)* where *P* = #patterns, *N* = #spins.
        Accepted values:
          • ±1  (preferred)  
          • 0/1 – will be auto-mapped to ±1 with a warning.

    Returns
    -------
    np.ndarray
        Coupling matrix of shape *(N, N)*, zero-diagonal, symmetric.
    """
    patt = np.asarray(patterns, dtype=np.int8)
    P, N = patt.shape

    # Normalise binary → bipolar if needed
    unique = np.unique(patt)
    if np.all(np.isin(unique, [0, 1])):
        LOGGER.warning("Patterns are {0,1}; remapping to ±1".format(unique.tolist()))
        patt = 2 * patt - 1
    elif not np.all(np.isin(unique, [-1, 1])):
        raise ValueError(f"Unexpected pattern values {unique}; expected ±1 or 0/1.")

    # Hebbian rule, with the diagonal explicitly zeroed
    J = (patt.T @ patt) / N
    np.fill_diagonal(J, 0)

    LOGGER.debug("J created  shape=%s  mean=%.4f", J.shape, J.mean())
    return J.astype(np.float32)


# --------------------------------------------------------------------------- #
# 2. Dense Hopfield recall (sequential updates)                               #
# --------------------------------------------------------------------------- #
def dense_recall(
    patterns: np.ndarray,
    cue: np.ndarray,
    iterations: int = 10,
    threshold: float = 0.0,
) -> np.ndarray:
    """
    Recall a pattern in a *dense* Hopfield network.

    Parameters
    ----------
    patterns
        Stored patterns *(P, N)*, ±1.
    cue
        Initial state *(N,)*, ±1 (or noisy).
    iterations
        Maximum update sweeps.
    threshold
        Activation threshold (0 = standard sign rule).

    Returns
    -------
    np.ndarray
        Final state after `iterations` sequential updates.

    Notes
    -----
    Complexity is **O(P N²)** for the weight matrix build, then **O(iter·N²)**
    for recall.  Acceptable for N ≲ 1 000.
    """
    patt = np.asarray(patterns, dtype=np.int8)
    state = np.asarray(cue, dtype=np.int8).copy()
    P, N = patt.shape

    # Build weight matrix once (Hebbian)
    W = patt.T @ patt
    np.fill_diagonal(W, 0)
    W = W / N

    for _ in range(iterations):
        for i in range(N):
            h_i = np.dot(W[i], state)
            state[i] = 1 if h_i > threshold else -1

    return state


# --------------------------------------------------------------------------- #
# 3. Stability / overlap diagnostics                                          #
# --------------------------------------------------------------------------- #
def check_pattern_stability(
    J: np.ndarray, pattern: np.ndarray
) -> Tuple[bool, float]:
    """
    Determine if `pattern` is a fixed point of the Ising dynamics.

    Returns
    -------
    (is_stable, mean_margin)
        *is_stable* – True if every spin is aligned with its local field.  
        *mean_margin* – ⟨σᵢ hᵢ⟩, positive margins ⇒ stability confidence.
    """
    p = pattern.astype(np.int8)
    h = J @ p
    margin = p * h
    return bool(np.all(margin > 0)), float(np.mean(margin))


def check_all_patterns_stability(
    J: np.ndarray, patterns: np.ndarray
) -> Dict[int, Tuple[bool, float]]:
    """
    Evaluate stability for each stored pattern; returns mapping *idx → (bool, margin)*.
    """
    return {i: check_pattern_stability(J, pat) for i, pat in enumerate(patterns)}


def pattern_overlap(state: np.ndarray, patterns: np.ndarray) -> np.ndarray:
    """
    Return cosine-style overlap between *state* and every stored pattern.

    Formula
    -------
    .. math::
        m_{\\mu} = \\frac1N \\sum_{i=1}^{N} \\sigma_i\\,\\xi_i^{\\mu}
    """
    patt = np.asarray(patterns, dtype=np.int8)
    s = np.asarray(state, dtype=np.int8)
    N = patt.shape[1]
    return (patt @ s) / N  # (P,)


def get_highest_overlap_pattern(
    state: np.ndarray, patterns: np.ndarray
) -> Tuple[int, float]:
    """
    Index + value of the pattern with maximal absolute overlap to *state*.
    """
    ov = pattern_overlap(state, patterns)
    idx = int(np.argmax(np.abs(ov)))
    return idx, float(ov[idx])
