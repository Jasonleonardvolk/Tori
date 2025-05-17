# PDF Upload Server for Concept Extraction

This simple Flask application provides a web interface for uploading PDFs and processing them using the Spectral-Phase Concept Ingestion Pipeline.

## Features

- Upload scientific PDFs through a simple web interface
- Extract concepts using the advanced spectral-phase algorithm
- Configure the number of concepts to extract and embedding dimensions
- View extracted concepts in the browser
- Results are saved to `concepts.npz` and `concepts.json` for further processing

## How to Use

1. Make sure you have Flask installed:
   ```
   pip install flask
   ```

2. Run the server:
   ```
   python pdf_upload_server.py
   ```

3. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

4. Upload a PDF and adjust the parameters as needed
   - Maximum concepts: The maximum number of concepts to extract (default: 12)
   - Embedding dimensions: The dimensions for spectral embedding (default: 16)

5. Click "Upload and Process" and wait for the processing to complete
   - The extracted concepts will be displayed on the page
   - The full results are saved to `concepts.npz` and `concepts.json`

## Accessing the Results Programmatically

You can access the extracted concepts through:

- The `/concepts` endpoint (JSON format)
- Loading the `concepts.npz` file directly using NumPy
- Reading the `concepts.json` file for integration with other tools

## Integration with ALAN

This tool integrates with the existing ALAN framework by:

1. Using the same `ingest_pdf` module for processing
2. Saving results to the standard `concepts.npz` and `concepts.json` files
3. Maintaining the same concept tuple structure with resonance scores and narrative centrality

## Folder Structure

- `uploads/`: Uploaded PDF files are stored here
- `concepts.npz`: NumPy archive with extracted concepts (for ALAN core)
- `concepts.json`: JSON format for UI visualization
