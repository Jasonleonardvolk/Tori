# TORI Chat - Production Launch Guide

This document provides clear, step-by-step instructions for launching the TORI Chat interface with the paperclip upload functionality. This guide has been updated for production deployment.

## Quick Start Options

You have three options to run the TORI Chat interface:

1. **Production Mode** (Recommended): Optimized build for production deployment
2. **Development Mode**: Full development environment with hot-reloading (for developers only)
3. **Legacy Demo Mode**: Simple UI preview (deprecated, not recommended for production)

## Option 1: Production Mode (Recommended)

The production mode builds and serves the optimized application. This is the recommended approach for deployment.

```bash
# Navigate to the tori_chat_frontend directory
cd C:\Users\jason\Desktop\tori\kha\tori_chat_frontend

# Run the production launcher (builds and starts the server)
start-chat.bat
```

You can also run the steps manually:

```bash
# Navigate to the tori_chat_frontend directory
cd C:\Users\jason\Desktop\tori\kha\tori_chat_frontend

# Build the production version
npm run build

# Start the production server
npm run start
```

Then open your browser to http://localhost:3000

This provides a fully functional production version with the paperclip upload feature connected to the backend services.

## Option 2: Development Mode (For Developers Only)

This launches the full development environment with Vite, providing hot module reloading and a better developer experience.

```bash
# Navigate to the tori_chat_frontend directory
cd C:\Users\jason\Desktop\tori\kha\tori_chat_frontend

# Install dependencies (if you haven't already)
npm install

# Start the development server
npm run dev
```

Once running, Vite will display a URL in the console (usually http://localhost:5173). Open this URL in your browser.

## Option 3: Legacy Demo Mode (Deprecated)

The legacy demo mode is deprecated and not recommended for production use. It serves a standalone HTML version with mock functionality.

```bash
# Navigate to the tori_chat_frontend directory
cd C:\Users\jason\Desktop\tori\kha\tori_chat_frontend

# Run the legacy demo server
npm run legacy-demo
```

## Accessing Deployed Version

If you want to access the deployed version instead of running locally:

1. **Main URL**: https://tori.dev/chat or https://app.tori.dev
2. **Alternative**: If experiencing certificate issues, try https://ide.tori.dev

## Production Deployment Notes

### Environment Variables

For production deployment, you may need to set the following environment variables:

- `PORT`: The port number to run the server on (defaults to 3000)
- `NODE_ENV`: Set to "production" for optimized performance

### Required Services

The production version requires the following services to be running:

- **Ingest Bus Service**: For PDF upload and processing
  ```bash
  cd C:\Users\jason\Desktop\tori\kha\ingest-bus
  start-ingest-bus.bat
  ```

## Troubleshooting

### Certificate Issues

If you encounter certificate errors when accessing the deployed version:

1. **Temporary Browser Override** (development only):
   - Click "Advanced" in the browser error page
   - Click "Proceed to site (unsafe)"

2. **Direct Bucket Upload Alternative**:
   If you just need to upload PDFs and can't access the UI:
   ```bash
   gsutil cp *.pdf gs://chopinbucket1/Chopin/raw/programming/
   ```

3. **Alternative Hostnames**:
   - Try https://ide.tori.dev instead

See `ingest-bus/docs/CERT_TROUBLESHOOTING.md` for more detailed certificate troubleshooting.

### Common Local Setup Issues

1. **Port Already in Use**:
   - Change the port by setting the PORT environment variable:
     ```bash
     set PORT=3001
     npm run start
     ```
   - Or kill the process using that port: `npx kill-port 3000`

2. **Module Not Found Errors**:
   - Ensure you've run `npm install` to install all dependencies

3. **Backend Connection Issues**:
   - For the production mode, make sure the ingest-bus service is running
   - Check network connectivity to any required backend services

## Usage Guide

Once you've launched the TORI Chat interface:

1. You'll see the chat interface with:
   - TORI Chat header
   - Message history area
   - Input field at the bottom
   - Paperclip icon (📎) for file uploads

2. To **upload PDF files**:
   - Click the paperclip icon (📎) next to the message input
   - Select up to 10 PDF files (max 100MB each, 500MB total)
   - The upload progress will display in an overlay
   - After uploading, extracted concepts will appear in a side panel

3. The uploaded files will be processed and the assistant will respond with a message about the extracted concepts.

## Need Help?

If you encounter any issues not covered in this guide:

1. Check the terminal output for error messages
2. Review the browser console for frontend errors
3. Look in the `CERT_TROUBLESHOOTING.md` for network/certificate issues
