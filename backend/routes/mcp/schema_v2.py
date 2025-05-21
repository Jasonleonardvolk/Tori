"""
MCP 2.0 Schema Definitions

This module defines the data models for PCC state transmission
using Pydantic for validation and serialization.
"""

from pydantic import BaseModel, conlist
from typing import List


class PCCState(BaseModel):
    """
    PCC State model representing the current state of the Phase-Coupled Computation.
    
    Attributes:
        step (int): Current simulation step
        phases (List[float]): Phase values for each oscillator
        spins (List[int]): Spin values (±1) for each node
        energy (float): Current system energy
    """
    step: int
    phases: conlist(float, min_items=1)  
    spins: conlist(int, min_items=1)
    energy: float
