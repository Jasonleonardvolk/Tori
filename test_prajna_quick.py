"""
Quick test script to see why Prajna isn't starting
"""
import sys
import os
from pathlib import Path

# Add prajna to path
prajna_dir = Path(r"C:\Users\jason\Desktop\tori\kha\prajna")
sys.path.insert(0, str(prajna_dir))

try:
    print("🔄 Testing Prajna imports...")
    from prajna.config.prajna_config import load_config
    print("✅ prajna.config.prajna_config imported successfully")
    
    from prajna.api.prajna_api import app
    print("✅ prajna.api.prajna_api imported successfully")
    
    # Try to load config
    config = load_config()
    print(f"✅ Config loaded successfully: {config}")
    
    print("🎉 All Prajna components loaded successfully!")
    print("The issue might be with uvicorn or server startup, not imports.")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Other error: {e}")
    import traceback
    print(traceback.format_exc())
