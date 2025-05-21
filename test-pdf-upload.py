"""
PDF Upload Test Script for iTori Chat

This script tests the PDF upload functionality by uploading a sample PDF 
to the Flask server that handles PDF processing.

Usage:
    python test-pdf-upload.py path/to/test.pdf
"""

import sys
import os
import requests
import time
import json
from pathlib import Path

def test_pdf_upload(pdf_path):
    """Upload a PDF file to the server and verify the response."""
    if not os.path.exists(pdf_path):
        print(f"Error: File {pdf_path} does not exist")
        return False
    
    # Check file size
    file_size = os.path.getsize(pdf_path)
    file_size_mb = file_size / (1024 * 1024)
    
    print(f"Uploading {pdf_path} ({file_size_mb:.2f} MB)")
    
    # Prepare the file for upload
    with open(pdf_path, 'rb') as f:
        files = {'pdf_file': (os.path.basename(pdf_path), f, 'application/pdf')}
        
        try:
            # Send the upload request
            print("Sending upload request...")
            start_time = time.time()
            response = requests.post('http://localhost:5000/upload', files=files)
            elapsed = time.time() - start_time
            
            # Check the response
            if response.status_code == 200:
                print(f"✅ Upload successful! ({elapsed:.2f} seconds)")
                try:
                    data = response.json()
                    print(f"Server response: {json.dumps(data, indent=2)}")
                    
                    # If the response includes a file ID, check if the file is processed
                    if 'file_id' in data:
                        print(f"Upload ID: {data['file_id']}")
                    
                    return True
                except ValueError:
                    print("Server returned a non-JSON response:")
                    print(response.text[:100] + "..." if len(response.text) > 100 else response.text)
            else:
                print(f"❌ Upload failed with status code {response.status_code}")
                print(f"Error: {response.text}")
                return False
        except requests.RequestException as e:
            print(f"❌ Request error: {e}")
            return False

def verify_upload_pipeline():
    """Verify the upload directory structure and permissions."""
    uploads_dir = Path('uploads')
    concepts_dir = Path('concepts')
    ingest_dir = Path('ingest_pdf')
    
    print("Checking upload pipeline...")
    
    # Check directories
    print(f"✓ uploads/ directory {'exists' if uploads_dir.exists() else 'missing'}")
    print(f"✓ concepts/ directory {'exists' if concepts_dir.exists() else 'missing'}")
    print(f"✓ ingest_pdf/ directory {'exists' if ingest_dir.exists() else 'missing'}")
    
    # Check PDF upload server
    try:
        response = requests.get('http://localhost:5000')
        print(f"✓ PDF upload server is running on port 5000")
    except requests.RequestException:
        print("✗ PDF upload server is not running on port 5000")
    
    print("\nUse this command to start the server if it's not running:")
    print("python pdf_upload_server.py")

if __name__ == "__main__":
    print("=" * 60)
    print("PDF Upload Test for iTori Chat")
    print("=" * 60)
    
    verify_upload_pipeline()
    
    if len(sys.argv) < 2:
        print("\nNo PDF file specified.")
        print("Usage: python test-pdf-upload.py path/to/test.pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    print("\n" + "=" * 60)
    test_pdf_upload(pdf_path)
