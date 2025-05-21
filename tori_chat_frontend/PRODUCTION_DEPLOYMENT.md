# TORI Chat Production Deployment Guide

This document provides detailed instructions for deploying the TORI Chat interface in a production environment.

## Prerequisites

- Node.js 16.x or later
- npm 8.x or later
- Sufficient disk space for dependencies and build artifacts
- Network connectivity to required backend services

## Pre-Deployment Steps

1. Ensure all code changes are committed
2. Run a final code quality check
3. Update version number in package.json if needed
4. Ensure backend services are properly configured

## Deployment Process

### Option 1: Automated Deployment (Recommended)

Use the provided deployment script:

```bash
# From the project root
cd tori_chat_frontend
start-chat.bat
```

This script:
1. Builds the production version of the application
2. Starts the server with the optimized build

### Option 2: Manual Deployment

```bash
# Navigate to the tori_chat_frontend directory
cd tori_chat_frontend

# Install dependencies
npm install

# Build the production version
npm run build

# Start the production server
npm run start
```

### Environment Configuration

The following environment variables can be configured:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Port on which the server will run |
| NODE_ENV | production | Node environment (should be "production") |

Example of setting environment variables:

```bash
# Windows
set PORT=8080
set NODE_ENV=production
npm run start

# Linux/MacOS
PORT=8080 NODE_ENV=production npm run start
```

## Required Services

The TORI Chat interface depends on the following services:

1. **Ingest Bus Service**: For PDF processing
   - Must be running before starting the TORI Chat interface
   - Start with: `start-ingest-bus.bat`

2. **Backend API**: For chat functionality
   - Configured in `.env.production`
   - Default URL: `https://api.tori.dev`

## Post-Deployment Verification

After deployment, verify the following:

1. **UI Check**:
   - Navigate to the deployed URL (e.g., http://localhost:3000)
   - Verify that the chat interface loads correctly
   - Check that the paperclip upload functionality works

2. **Log Check**:
   - Examine server logs for any errors
   - Ensure connections to backend services are established

3. **Performance Check**:
   - Verify page load times are acceptable
   - Check resource utilization (CPU, memory)

## Rollback Procedure

If issues are encountered after deployment:

1. Stop the current server
2. Revert to the previous version:
   ```bash
   git checkout <previous-version-tag>
   npm install
   npm run build
   npm run start
   ```

## Monitoring and Maintenance

- Check server logs regularly for errors
- Monitor server resource usage
- Schedule regular dependency updates

## Troubleshooting Common Issues

### Server Won't Start

- Check for port conflicts: Another service may be using port 3000
- Verify Node.js version: Run `node -v` to confirm version 16.x or later
- Check for dependency issues: Delete node_modules and run `npm install` again

### UI Rendering Issues

- Clear browser cache: Use Ctrl+F5 to force a refresh
- Check browser console for JavaScript errors
- Verify that all static assets are being served correctly

### PDF Upload Problems

- Verify that the ingest-bus service is running
- Check upload size limits in both frontend and backend configurations
- Examine network requests in browser developer tools

## Security Considerations

- The server should be run behind a reverse proxy with HTTPS enabled
- Set appropriate Content Security Policy headers
- Implement rate limiting for upload endpoints
- Consider additional authentication mechanisms for sensitive operations

## Support and Contact

For issues with the production deployment:

- Check the documentation first for known issues and solutions
- Review logs for specific error messages
- Contact the development team at dev@tori.ai
