"""
ALAN Backend Initialization

Main entry point for the ALAN backend runtime.
"""

from .config import cfg

# Conditional import based on SPIN_MODE setting
if cfg.get("SPIN_MODE", False):
    from .banksy.banksy_spin import step as phase_step
    print("Using Banksy Spin oscillator mode")
else:
    from .banksy.kuramoto import step as phase_step
    print("Using Kuramoto oscillator mode")

# Export the appropriate step function
__all__ = ['phase_step']
