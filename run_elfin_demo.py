"""
ELFIN Debug System Standalone Demo Runner

This script runs the fixed standalone demo without going through the package imports.
"""

import sys
import os

# Add the current directory to the path so we can import directly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Use the fixed standalone demo
from fixed_standalone_demo import demo_controlled_pendulum

if __name__ == "__main__":
    try:
        demo_controlled_pendulum()
    except Exception as e:
        print(f"Error running demo: {e}")
        import traceback
        traceback.print_exc()
