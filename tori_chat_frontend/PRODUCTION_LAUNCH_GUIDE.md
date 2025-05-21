# TORI Chat Production Launch Guide

This document provides clear instructions for launching the TORI Chat application in production mode.

## Quick Start

1. **Double-click the desktop shortcut**: `TORI_Chat_Production.url` on your desktop.

OR

2. **Run the batch file directly**:
   - Navigate to `C:\Users\jason\Desktop\tori\kha\tori_chat_frontend`
   - Double-click `production-launch.bat`

## What the Production Launcher Does

The production launcher (`production-launch.bat`) performs these steps automatically:

1. Navigates to the correct directory
2. Checks if Node.js is installed
3. Installs all dependencies with `npm install`
4. Builds the application with `npm run build`
5. Starts the production server with `node start-production.cjs`

## Manual Launch Process

If you need to run the steps manually:

1. Open Command Prompt
2. Navigate to the application directory:
   ```
   cd C:\Users\jason\Desktop\tori\kha\tori_chat_frontend
   ```
3. Install dependencies:
   ```
   npm install --legacy-peer-deps
   ```
   
   If that fails, try:
   ```
   npm install --force
   ```
4. Build for production:
   ```
   npm run build
   ```
5. Start the production server:
   ```
   node start-production.cjs
   ```

## Failsafe Options

If you encounter server startup issues, the launcher will automatically try these options in sequence:

1. **Primary method**: `node start-production.cjs` (Express server)
2. **Secondary method**: `npm run start` (NPM script)
3. **Emergency method**: `node minimal-server.js` (Dependency-free server)

The minimal server is included as a last resort and uses only Node.js built-in modules with no external dependencies.

## Troubleshooting

If you encounter any issues:

### Server Won't Start

- Check for port conflicts: Another service might be using port 3000
- Try setting a different port:
  ```
  set PORT=3001
  node start-production.cjs
  ```

### Build Fails

- Check for errors in the build output
- Ensure all dependencies are installed correctly:
  ```
  npm install
  ```

### Cannot Find Module Error

- Ensure Express is installed:
  ```
  npm install express
  ```

### Browser Cannot Connect

- Make sure you're connecting to http://localhost:3000
- Check if the server is actually running (look for the "TORI Chat Production running" message)
- Try a different browser

## Accessing the Application

Once the server is running, open your browser and navigate to:

http://localhost:3000

## Stopping the Server

To stop the server, press Ctrl+C in the command prompt window, then enter Y to terminate the batch job.
