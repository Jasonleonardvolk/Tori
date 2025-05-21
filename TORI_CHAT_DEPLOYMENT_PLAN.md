# TORI Chat Deployment Plan

This document provides step-by-step instructions for deploying the TORI Chat application in production.

## Quick Start Guide (Manual Method)

Run these commands in order from a Command Prompt:

```
cd C:\Users\jason\Desktop\tori\kha\tori_chat_frontend   # Navigate to project directory
npm ci --omit dev                                       # Install production dependencies
npx vite build                                          # Build the application directly
node start-production.cjs                               # Start the production server
```

## What to Expect

| Stage | Success Indicator | Notes |
|-------|-------------------|-------|
| npm ci | "added X packages in Y seconds" | Production dependencies installed |
| npx vite build | "built in X ms" | Check dist/index.html is 5-10KB, not 100 bytes |
| start-production.cjs | "TORI Chat Production running on port 3000" | Server ready |

## Troubleshooting

If you see the redirect page in your browser:
1. Hard-refresh with Ctrl+Shift+R
2. Delete the dist/ directory and rebuild
3. Verify the correct index.html is being used (should be from src/index.html)

## Common Issues

### Vite Package Not Found Error
- If you see `Cannot find package 'vite'` errors when running `npx vite build`:
  ```
  npm install vite --save-dev
  npx vite build
  ```
  This ensures the Vite package is installed before building.

### Port Already in Use (EADDRINUSE)
- If you see `Error: listen EADDRINUSE: address already in use :::3000`:
  ```
  # Find the process using port 3000
  netstat -ano | findstr :3000
  
  # Kill the process (replace PID with the actual process ID)
  taskkill /F /PID PID
  ```
  Alternatively, use a different port:
  ```
  set PORT=3001
  node start-production.cjs
  ```
  Or use the provided check-port.js script:
  ```
  node check-port.js
  ```

### Permission Errors with turbo.exe
- If you see `npm ERR! code EPERM` or `operation not permitted, unlink 'turbo.exe'` errors:
  ```
  taskkill /IM turbo.exe /F
  rmdir /S /Q node_modules
  npm ci --omit dev --legacy-peer-deps
  ```
  This happens when turbo.exe is locked by another process. Killing the process and cleaning node_modules resolves it.

### React Dependency Conflicts
- If you see `npm ERR! ERESOLVE could not resolve` errors mentioning react-diff-viewer, you must either:
  
  **Option 1: Upgrade to a compatible version**
  ```
  npm install react-diff-viewer@4.0.0-rc.1 --save-exact
  npm ci --omit dev
  ```
  
  **Option 2: Remove the package** (if not needed for production)
  ```
  npm uninstall react-diff-viewer
  npm ci --omit dev
  ```
  
  **Important**: Using `--legacy-peer-deps` is only a temporary workaround, and any subsequent package installation will trigger the conflict again. Fix the dependency directly instead.

### Build Fails with Turbo/pnpm Errors
- Use `npx vite build` directly instead of npm run build
- This bypasses the workspace/monorepo configuration

### Redirect Page Shows Instead of Chat UI
- Check dist/index.html size - if it's tiny (~100 bytes), the build used the wrong entry point
- Verify the script path in src/index.html points to the correct location:
  ```html
  <script type="module" src="/src/main.jsx"></script>
  ```
  Not `src="/main.jsx"` which is incorrect
- Edit vite.config.js to explicitly set the entry point:
  ```js
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html')
      }
    }
  }
  ```

### Cannot Find Module Errors
- Run `npm ci` instead of `npm install` to ensure exact dependency versions
- Verify express is installed: `npm install express`

## Verification

After deployment, the TORI Chat UI should:
1. Show the React-based chat interface, not a redirect page
2. Allow file uploads via the paperclip icon
3. Support full interactivity

## Support

For deployment assistance:
1. Check dist/index.html content for "redirected" text (indicates wrong build)
2. Run verification script: `node .github/workflows/verify-build.js`
