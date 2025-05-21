# PDF Upload Guide for iTori Chat

This guide explains how to test and use the PDF upload functionality in the iTori Chat platform.

## Overview

The iTori Chat platform includes a powerful PDF upload feature that:
1. Accepts PDF files through the paperclip button in the chat interface
2. Processes PDFs to extract concepts using spectral-phase algorithm
3. Displays extracted concepts in a sidebar
4. Enables users to reference concepts in their conversations

## Testing the Upload

### Start the PDF Upload Server

```bash
# Open a terminal and run:
python pdf_upload_server.py
```

The server runs on port 5000 by default and handles the PDF uploads.

### Test Upload with a Sample PDF

Use the provided test script to verify the upload functionality:

```bash
# Run the test script with a path to a PDF file
python test-pdf-upload.py data/cellular\ automata/Spacetime/2505.10383v1.pdf
```

This will:
- Verify the upload pipeline is properly configured
- Upload the sample PDF to the server
- Display the server response with extracted concepts

### Using the Upload in Chat Interface

1. Start the chat frontend with `pnpm --filter @itori/chat dev`
2. Click the paperclip (📎) button at the bottom of the chat
3. Select one or more PDF files (up to 10 files, max 100MB each)
4. View the upload progress in the overlay
5. Once processing completes, extracted concepts will appear in the sidebar
6. You can ask questions about the uploaded documents and their concepts

## Directory Structure

- `uploads/`: Temporary storage for uploaded PDF files
- `concepts/`: Extracted concepts are stored here as JSON files
- `ingest_pdf/`: Contains the processing pipeline for PDF extraction

## Troubleshooting

If you encounter issues with the upload:

1. Ensure the upload server is running (`python pdf_upload_server.py`)
2. Check that the PDF files are valid and not corrupted
3. Verify the uploads directory has proper write permissions
4. The extraction process may take longer for large or complex PDFs
5. Ensure you're using Chrome, Firefox, or Edge for best compatibility

## Concept IDs and Persistence

Each concept extracted from PDFs receives a unique identifier. These concepts are:

- Stored in the concept store with metadata linking back to the source document
- Persisted between sessions so they can be recalled later
- Associated with the user who uploaded the document
- Available for cross-referencing with other concepts in the system

The system uses specialized algorithms to extract meaningful concepts from PDFs, focusing on:
- Spectral analysis to identify concept clusters
- Phase-coupling to find related concepts
- Lyapunov stability to evaluate concept predictability
