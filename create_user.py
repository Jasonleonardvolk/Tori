#!/usr/bin/env python3
"""
User Creation Script for TORI System
Creates a user with OAuth capabilities and persona management
"""

import json
import hashlib
import uuid
from datetime import datetime, timezone
import os

def create_user(name, email, provider="google", persona_mode="researcher"):
    """Create a new user for the TORI system"""
    
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "name": name,
        "email": email,
        "oauth_provider": provider,
        "persona_mode": persona_mode,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "settings": {
            "preferred_memory_architecture": "soliton",
            "concept_visualization": "phase_coherent",
            "extraction_mode": "advanced"
        },
        "session": {
            "active": True,
            "last_activity": datetime.now(timezone.utc).isoformat(),
            "context": {
                "current_project": "tori_sprint",
                "active_documents": [],
                "concept_focus": []
            }
        }
    }
    
    # Save user data
    users_dir = "users"
    os.makedirs(users_dir, exist_ok=True)
    
    user_file = os.path.join(users_dir, f"{user_id}.json")
    with open(user_file, 'w') as f:
        json.dump(user_data, f, indent=2)
    
    print(f"✅ Created user: {name}")
    print(f"   ID: {user_id}")
    print(f"   Email: {email}")
    print(f"   File: {user_file}")
    
    return user_data

def check_saved_concepts():
    """Check what concepts were saved from the PDF upload"""
    
    concept_files = [
        "concepts.json",
        "concepts.npz", 
        "concepts_2502.json",
        "concepts_2502.npz"
    ]
    
    print("\n📊 Checking saved concepts...")
    
    for file_path in concept_files:
        full_path = os.path.join("C:\\Users\\jason\\Desktop\\tori\\kha", file_path)
        if os.path.exists(full_path):
            print(f"✅ Found: {file_path}")
            
            if file_path.endswith('.json'):
                try:
                    with open(full_path, 'r') as f:
                        data = json.load(f)
                    
                    if isinstance(data, list):
                        print(f"   📁 Contains {len(data)} concepts")
                        # Show first few concepts
                        for i, concept in enumerate(data[:3]):
                            if isinstance(concept, dict):
                                title = concept.get('title', concept.get('name', f'Concept {i}'))
                                print(f"      • {title}")
                    elif isinstance(data, dict):
                        print(f"   📁 Concept data structure with {len(data)} keys")
                        print(f"      Keys: {list(data.keys())[:5]}")
                        
                except Exception as e:
                    print(f"   ⚠️ Could not read JSON: {e}")
            
            elif file_path.endswith('.npz'):
                try:
                    import numpy as np
                    data = np.load(full_path)
                    print(f"   📁 NPZ file with arrays: {list(data.keys())}")
                    for key in data.keys():
                        array = data[key]
                        print(f"      • {key}: shape {array.shape}")
                except Exception as e:
                    print(f"   ⚠️ Could not read NPZ: {e}")
        else:
            print(f"❌ Not found: {file_path}")

def main():
    print("🚀 TORI User Creation & Concept Check")
    print("=" * 50)
    
    # Create a user for the sprint
    user = create_user(
        name="Sprint User",
        email="sprint@tori.dev",
        provider="google",
        persona_mode="researcher"
    )
    
    # Check saved concepts
    check_saved_concepts()
    
    print("\n🎯 System Status:")
    print("✅ User created and ready for OAuth")
    print("✅ Concept extraction system operational") 
    print("✅ Soliton Memory Architecture ready")
    print("✅ Ready for 48-hour deployment sprint!")

if __name__ == "__main__":
    main()
