from flask import Flask, request, render_template, jsonify, send_file
import os
from pathlib import Path
from ingest_pdf.pipeline import ingest_pdf_and_update_index
import json
import time
import shutil

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
CONCEPTS_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'concepts')
ALLOWED_EXTENSIONS = {'pdf'}
MASTER_INDEX_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'master_concepts_index.json')

# Create necessary folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONCEPTS_FOLDER, exist_ok=True)

# Create or load master index
if not os.path.exists(MASTER_INDEX_PATH):
    with open(MASTER_INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump({"pdfs": []}, f)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_master_index():
    with open(MASTER_INDEX_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def update_master_index(pdf_info):
    master_index = get_master_index()
    master_index["pdfs"].append(pdf_info)
    with open(MASTER_INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(master_index, f, indent=2)

@app.route('/')
def index():
    return render_template('upload.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'pdf_file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['pdf_file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if file and allowed_file(file.filename):
        # Generate timestamped filename to avoid collisions
        timestamp = int(time.time())
        original_filename = Path(file.filename).stem
        safe_filename = "".join([c if c.isalnum() else "_" for c in original_filename])
        
        # Save the PDF
        pdf_filename = f"{safe_filename}_{timestamp}.pdf"
        pdf_path = os.path.join(UPLOAD_FOLDER, pdf_filename)
        file.save(pdf_path)
        
        # Create unique filenames for NPZ and JSON outputs
        npz_filename = f"{safe_filename}_{timestamp}.npz"
        json_filename = f"{safe_filename}_{timestamp}.json"
        npz_path = os.path.join(CONCEPTS_FOLDER, npz_filename)
        json_path = os.path.join(CONCEPTS_FOLDER, json_filename)
        
        try:
            # Process the PDF using the ingest_pdf package
            max_concepts = int(request.form.get('max_concepts', 12))
            dim = int(request.form.get('dim', 16))
            
            result = ingest_pdf_and_update_index(
                pdf_path=pdf_path,
                index_path=npz_path,
                max_concepts=max_concepts,
                dim=dim,
                json_out=json_path
            )
            
            # Create an entry for the master index
            pdf_info = {
                "original_filename": file.filename,
                "processed_timestamp": timestamp,
                "pdf_path": pdf_path,
                "npz_path": npz_path,
                "json_path": json_path,
                "concept_count": result["concept_count"],
                "concept_names": result.get("concept_names", []),
                "file_size_kb": round(os.path.getsize(npz_path) / 1024, 2)
            }
            
            # Update the master index
            update_master_index(pdf_info)
            
            # Return success and the extracted concepts
            return jsonify({
                "success": True,
                "message": f"File processed successfully. Extracted {result['concept_count']} concepts.",
                "result": result,
                "storage_info": {
                    "npz_file": npz_filename,
                    "json_file": json_filename,
                    "file_size_kb": pdf_info["file_size_kb"]
                }
            })
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"error": "Invalid file format. Only PDF files are allowed."}), 400

@app.route('/concepts/<filename>')
def get_concepts(filename):
    json_path = os.path.join(CONCEPTS_FOLDER, filename)
    
    if os.path.exists(json_path) and json_path.endswith('.json'):
        with open(json_path, 'r', encoding='utf-8') as f:
            concepts = json.load(f)
        return jsonify(concepts)
    else:
        return jsonify({"error": "File not found"}), 404

@app.route('/download/<filename>')
def download_file(filename):
    file_path = os.path.join(CONCEPTS_FOLDER, filename)
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    else:
        return jsonify({"error": "File not found"}), 404

@app.route('/list')
def list_processed_pdfs():
    master_index = get_master_index()
    return jsonify(master_index)

@app.route('/analytics')
def analytics():
    master_index = get_master_index()
    
    # Calculate statistics
    total_pdfs = len(master_index["pdfs"])
    total_concepts = sum(pdf.get("concept_count", 0) for pdf in master_index["pdfs"])
    total_size_kb = sum(pdf.get("file_size_kb", 0) for pdf in master_index["pdfs"])
    
    # Get concept name frequency
    concept_frequency = {}
    for pdf in master_index["pdfs"]:
        for concept in pdf.get("concept_names", []):
            concept_frequency[concept] = concept_frequency.get(concept, 0) + 1
    
    # Sort concepts by frequency
    top_concepts = sorted(concept_frequency.items(), key=lambda x: x[1], reverse=True)[:20]
    
    return jsonify({
        "total_pdfs": total_pdfs,
        "total_concepts": total_concepts,
        "total_size_kb": total_size_kb,
        "average_concepts_per_pdf": total_concepts / total_pdfs if total_pdfs > 0 else 0,
        "average_size_kb": total_size_kb / total_pdfs if total_pdfs > 0 else 0,
        "top_concepts": top_concepts
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
