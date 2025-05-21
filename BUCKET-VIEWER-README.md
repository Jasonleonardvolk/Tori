# Bucket Viewer for iTori Platform

This document explains the implementation and usage of the Bucket Viewer component, which provides a secure interface for browsing and accessing files in Google Cloud Storage buckets.

## Overview

The Bucket Viewer is a full-stack feature that includes:

1. **Backend API**: Secure FastAPI endpoints for accessing GCS buckets
2. **Frontend UI**: React components for browsing files and directories
3. **File Preview**: Built-in preview for common file types (PDF, images, text)

## Features

- 📂 Navigate through bucket directories with breadcrumb navigation
- 🔍 Search for files within the current directory
- 📄 View file metadata (size, type, last modified date)
- 👁️ Preview PDFs, images, and text files directly in the browser
- ⬇️ Download files with secure, time-limited signed URLs
- 🔒 Secure access to Google Cloud Storage buckets

## Architecture

### Backend (FastAPI)

The backend provides these API endpoints:

- `GET /api/bucket/list` - List files and directories in a bucket path
- `GET /api/bucket/view` - Get file metadata and signed URL for viewing
- `GET /api/bucket/download` - Generate download URL for a file
- `GET /api/bucket/search` - Search for files by name

These endpoints are defined in `backend/routes/bucket.py` and integrated into the main FastAPI application in `backend/main.py`.

### Frontend (React)

The frontend consists of these components:

1. `BucketViewer` - Main component with state management
2. `PathNavigator` - Directory breadcrumb navigation
3. `FileList` - Display of files and directories
4. `FileDetails` - Metadata and file preview
5. `FileTypeIcon` - Type-specific icons for files

## Setup & Configuration

### Required Environment Variables

```
UPLOAD_BUCKET=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
```

### Google Cloud Storage Requirements

1. A GCS bucket must be configured
2. Appropriate permissions must be granted to the service account
3. CORS configuration should be set for browser access

## Running the Bucket Viewer

### Using the Start Script

Run the provided startup script:

```bash
./start-bucket-viewer.bat
```

This will:
1. Set up environment variables
2. Start the FastAPI backend
3. Start the frontend development server
4. Open your browser to the Bucket Viewer

### Manual Setup

1. Start the backend:
   ```bash
   cd backend
   python main.py
   ```

2. Start the frontend:
   ```bash
   cd ide_frontend
   pnpm dev
   ```

3. Navigate to `http://localhost:5173/bucket` in your browser

## Security Considerations

- Signed URLs are valid for 5 minutes by default
- Backend authentication should be added for production use
- The bucket name is configured via environment variable
- Service account credentials must be properly secured

## Integration with PDF Upload

The Bucket Viewer complements the PDF upload functionality by providing:

1. A way to browse uploaded PDFs in the GCS bucket
2. Preview capabilities for the uploaded files
3. Access to metadata about uploaded files

This creates a complete end-to-end experience from file upload through the chat interface to viewing processed files in the bucket viewer.
