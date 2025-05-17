# ITORI Ingest Package

This package provides document ingestion utilities for the ITORI platform, focusing on PDF processing, concept extraction, and document management.

## Installation

Since this package is part of the ITORI monorepo, it's available as an internal dependency:

```bash
pnpm add @itori/ingest
```

## Features

- PDF ingestion with progress tracking
- Document processing status checking
- Concept extraction from uploaded documents
- Utilities for checking and polling upload job status

## Usage

### Checking Upload Status

```typescript
import { checkUploadStatus } from '@itori/ingest';

async function checkDocument(jobId) {
  try {
    const status = await checkUploadStatus(jobId);
    console.log(`Document status: ${status.status}, progress: ${status.progress}%`);
  } catch (error) {
    console.error('Failed to check status:', error);
  }
}
```

### Polling Until Complete

```typescript
import { pollUploadStatus } from '@itori/ingest';

async function waitForDocument(jobId) {
  try {
    // Progress callback
    const onProgress = (job) => {
      console.log(`Processing: ${job.progress}%`);
    };
    
    // Wait for document to be ready
    const document = await pollUploadStatus(jobId, onProgress);
    console.log('Document ready:', document.title);
    
    // Do something with the document
    return document;
  } catch (error) {
    console.error('Processing failed:', error);
  }
}
```

## Integration with Backend

This package is designed to work with the PDF ingest backend services:

- `pdf_upload_server.py` - Handles initial file uploads
- `batch_process_pdfs.py` - Processes uploaded files
- `canonical_ingestion.py` - Extracts concepts and performs document analysis

The frontend utilities in this package provide TypeScript interfaces and helpers for working with these backend services.

## Data Model

This package uses the document and concept types from `@itori/data-model`:

```typescript
import { Document, Concept } from '@itori/data-model';
```

## Environment Configuration

The ingest utilities read API URLs from environment variables:

- `VITE_ITORI_API_URL`: REST API URL for upload endpoints
