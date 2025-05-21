#!/usr/bin/env python3
"""
Setup Script for PDF Upload Infrastructure in iTori Chat

This script verifies and sets up the directory structure needed for
the PDF upload functionality. It creates the necessary folders and
tests permissions to ensure smooth operation of the upload pipeline.

Usage:
    python setup_pdf_upload.py
"""

import os
import sys
import shutil
from pathlib import Path
import json

# Directory paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(CURRENT_DIR, 'uploads')
CONCEPTS_DIR = os.path.join(CURRENT_DIR, 'concepts')
INGEST_DIR = os.path.join(CURRENT_DIR, 'ingest_pdf')
MASTER_INDEX_PATH = os.path.join(CURRENT_DIR, 'master_concepts_index.json')

def ensure_directory(directory_path):
    """Ensure directory exists, creating it if necessary."""
    if not os.path.exists(directory_path):
        print(f"📁 Creating directory: {directory_path}")
        try:
            os.makedirs(directory_path)
            return True
        except Exception as e:
            print(f"❌ Error creating directory: {e}")
            return False
    else:
        print(f"✅ Directory exists: {directory_path}")
        return True

def test_write_permissions(directory_path):
    """Test if we can write to the directory."""
    test_file = os.path.join(directory_path, '.write_test')
    try:
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
        print(f"✅ Write permissions OK for: {directory_path}")
        return True
    except Exception as e:
        print(f"❌ Write permission error for {directory_path}: {e}")
        return False

def create_master_index():
    """Create the master index file if it doesn't exist."""
    if not os.path.exists(MASTER_INDEX_PATH):
        print(f"📝 Creating master index file: {MASTER_INDEX_PATH}")
        try:
            with open(MASTER_INDEX_PATH, 'w', encoding='utf-8') as f:
                json.dump({"pdfs": []}, f, indent=2)
            return True
        except Exception as e:
            print(f"❌ Error creating master index: {e}")
            return False
    else:
        print(f"✅ Master index file exists: {MASTER_INDEX_PATH}")
        return True

def check_ingest_pipeline():
    """Check if the ingest pipeline modules exist."""
    if not os.path.exists(INGEST_DIR):
        print(f"❌ Ingest directory missing: {INGEST_DIR}")
        return False
    
    pipeline_path = os.path.join(INGEST_DIR, 'pipeline.py')
    if not os.path.exists(pipeline_path):
        print(f"❌ Pipeline module missing: {pipeline_path}")
        return False
    
    print(f"✅ Ingest pipeline exists")
    return True

def setup_env():
    """Setup environment variables for the PDF processing."""
    env_path = os.path.join(CURRENT_DIR, '.env')
    env_vars = {
        'UPLOAD_DIR': UPLOAD_DIR,
        'CONCEPTS_DIR': CONCEPTS_DIR,
        'INGEST_DIR': INGEST_DIR,
    }
    
    try:
        with open(env_path, 'a') as f:
            f.write("\n# PDF Upload Configuration\n")
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")
        print(f"✅ Environment variables added to .env file")
        return True
    except Exception as e:
        print(f"❌ Error setting environment variables: {e}")
        return False

def main():
    """Main function to setup and verify PDF upload infrastructure."""
    print("=" * 60)
    print("Setting up PDF Upload Infrastructure for iTori Chat")
    print("=" * 60)
    
    # Create directories
    upload_dir_ok = ensure_directory(UPLOAD_DIR)
    concepts_dir_ok = ensure_directory(CONCEPTS_DIR)
    
    # Test write permissions
    if upload_dir_ok:
        test_write_permissions(UPLOAD_DIR)
    if concepts_dir_ok:
        test_write_permissions(CONCEPTS_DIR)
    
    # Create master index
    create_master_index()
    
    # Check ingest pipeline
    check_ingest_pipeline()
    
    # Setup environment variables
    setup_env()
    
    print("\n" + "=" * 60)
    print("Setup Complete! Next steps:")
    print("1. Start the PDF upload server: python pdf_upload_server.py")
    print("2. Start the chat frontend: pnpm --filter @itori/chat dev")
    print("3. Use the paperclip button to upload PDFs in the chat interface")
    print("=" * 60)

if __name__ == "__main__":
    main()
