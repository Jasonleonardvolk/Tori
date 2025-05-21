# TORI Chat Production Deployment

This repository contains tools for building and deploying the TORI Chat application in production mode.

## Quick Start

### Windows
From Command Prompt:
```cmd
deploy-tori-chat.bat
```

From PowerShell:
```powershell
# Option 1: Using the relative path
.\deploy-tori-chat.bat

# Option 2: Using the & operator (preferred in PowerShell)
& .\deploy-tori-chat.bat

# Option 3: Using the full path
& "C:\Users\jason\Desktop\tori\kha\deploy-tori-chat.bat"
```

### Mac/Linux
```
chmod +x deploy-tori-chat.sh
./deploy-tori-chat.sh
```

## Key Features

- **React 18 Compatibility**: Automatically fixes React dependency conflicts
- **Cross-Platform Support**: Works on Windows, Mac, and Linux
- **Port Conflict Resolution**: Detects and offers to resolve port conflicts
- **Build Verification**: Ensures the correct UI is built (not the redirect page)
- **CI/CD Integration**: GitHub Actions workflow for automated verification

## Available Tools

### 1. Dependency Conflict Fixer
```
node fix-react-deps.js             # Interactive mode
node fix-react-deps.js --ci        # Non-interactive (for CI)
node fix-react-deps.js --upgrade   # Auto-upgrade without prompting
node fix-react-deps.js --remove    # Auto-remove without prompting
```

### 2. Port Checker
```
node check-port.js                 # Check if port 3000 is available
node check-port.js 8080            # Check a specific port
node check-port.js --kill          # Check and offer to kill blocking process
```

### 3. Build Verification
```
node verify-tori-build.js          # Verify the built UI is correct
```

## Documentation

For detailed information, see:

- [TORI_CHAT_DEPLOYMENT_PLAN.md](TORI_CHAT_DEPLOYMENT_PLAN.md) - Complete deployment guide
- [TORI_CHAT_FIX_SUMMARY.md](TORI_CHAT_FIX_SUMMARY.md) - Technical explanation of fixes

## Frequently Asked Questions

### Why does the build show a redirect page instead of the full UI?

This can happen if:
1. The entry point in vite.config.js is incorrect
2. The script path in src/index.html is incorrect
3. Environment variables are not set correctly

Solution: Run `node fix-react-deps.js` first, then build.

### How do I check if my build is correct?

A properly built TORI Chat UI will:
1. Have an index.html file significantly larger than 100 bytes
2. Not contain text about being "redirected" or "Go to demo"
3. Include references to JavaScript assets

You can verify this with: `node verify-tori-build.js`

### How do I fix React dependency conflicts?

The `react-diff-viewer@3.1.1` package is incompatible with React 18. You have two options:
1. Upgrade to the compatible version: `npm install react-diff-viewer@4.0.0-rc.1 --save-exact`
2. Remove it if not needed: `npm uninstall react-diff-viewer`

The `fix-react-deps.js` script automates this process.
