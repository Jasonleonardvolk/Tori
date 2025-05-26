@echo off
setlocal enabledelayedexpansion
:: Simplified TORI Chat Deployment Script (Direct Method)
:: Now includes conversation extraction functionality

echo.
echo =======================================
echo    TORI Chat Production Deployment
echo =======================================
echo.

:: Parse extraction-related arguments
set "EXTRACT_CONVERSATION="
set "VERIFY_EXTRACTION=false"
set "OUTPUT_DIR="
set "EXTRACT_ONLY=false"

:parse_args
if "%~1"=="" goto :end_parse_args
set "ARG=%~1"
if "!ARG:~0,10!"=="--extract=" (
    set "EXTRACT_CONVERSATION=!ARG:~10!"
) else if "%~1"=="--verify" (
    set "VERIFY_EXTRACTION=true"
) else if "!ARG:~0,9!"=="--outdir=" (
    set "OUTPUT_DIR=!ARG:~9!"
) else if "%~1"=="--extract-only" (
    set "EXTRACT_ONLY=true"
)
shift
goto :parse_args
:end_parse_args

:: Process extraction if requested
if not "!EXTRACT_CONVERSATION!"=="" (
    echo Conversation extraction requested for: !EXTRACT_CONVERSATION!
    
    set "EXTRACT_ARGS=--conversation !EXTRACT_CONVERSATION!"
    
    if "!VERIFY_EXTRACTION!"=="true" (
        set "EXTRACT_ARGS=!EXTRACT_ARGS! --verify"
    )
    
    if not "!OUTPUT_DIR!"=="" (
        set "EXTRACT_ARGS=!EXTRACT_ARGS! --output !OUTPUT_DIR!"
    )
    
    echo Running extraction with arguments: !EXTRACT_ARGS!
    node extraction-integration.js !EXTRACT_ARGS!
    
    :: Exit after extraction if --extract-only is specified
    if "!EXTRACT_ONLY!"=="true" (
        echo Extraction complete. Exiting as requested by --extract-only flag.
        exit /b 0
    )
    
    echo.
    echo Continuing with deployment...
    echo.
)


:: Navigate to the correct directory
cd /d %~dp0tori_chat_frontend

:: Verify we're in the right place
if not exist "package.json" (
    echo ERROR: Not in the correct directory!
    echo Expected to find package.json in %CD%
    echo.
    pause
    exit /b 1
)

:: Make sure .env.production exists
if not exist ".env.production" (
    echo Creating .env.production file...
    echo VITE_APP_MODE=chat> .env.production
    echo PUBLIC_URL=/>> .env.production
)

:: Clean up and install directly
echo.
echo Step 1: Cleaning up node_modules and installing dependencies...
if exist "node_modules" rd /s /q node_modules
if exist "package-lock.json" del package-lock.json

:: Install all dependencies including dev dependencies
echo Installing all dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install dependencies.
    echo.
    pause
    exit /b 1
)

:: Verify the Vite config and handle the index.html issue
echo.
echo Step 2: Setting up Vite configuration...
if not exist "vite.config.js" (
    echo ERROR: vite.config.js not found!
    pause
    exit /b 1
)

:: Copy index.html to project root (in case Vite expects it there)
echo Checking index.html placement...
if not exist "index.html" (
    echo Copying index.html to project root...
    copy src\index.html .\ > nul
)

:: Ensure src/index.html exists
if not exist "src\index.html" (
    echo ERROR: src/index.html not found!
    pause
    exit /b 1
)

echo ✓ Vite configuration and index.html verified

:: Build using Vite CLI
echo.
echo Step 3: Building the application...
echo Running: npx vite build --debug
call npx vite build --debug
echo Build exit code: %ERRORLEVEL%
if %ERRORLEVEL% neq 0 (
    echo ERROR: Build failed.
    echo.
    pause
    exit /b 1
)
echo ✓ Build completed

:: Verify build was successful
echo.
echo Step 4: Verifying build output...
if exist "dist\src\index.html" (
    echo Found index.html in dist/src/ - Moving to dist/ for server compatibility...
    if not exist "dist" mkdir dist
    copy dist\src\index.html dist\ > nul
) else if not exist "dist\index.html" (
    echo ERROR: Build failed - index.html not found in expected locations.
    echo Expected in either dist/index.html or dist/src/index.html
    echo.
    pause
    exit /b 1
)
echo ✓ Build output verified

:: Serve the application using a simple server
echo.
echo Step 5: Preparing to start the server
echo.
echo The application will be available at http://localhost:3000 or alternative port if 3000 is busy.
echo Press Ctrl+C to stop the server when finished.
echo.

:: Copy the build assets to proper locations if needed
echo Preparing build assets for serving...
dir /b dist >nul 2>nul
if exist "dist\src\assets" (
    echo Moving assets to correct location...
    if not exist "dist\assets" mkdir dist\assets
    xcopy dist\src\assets\*.* dist\assets\ /Y /Q >nul
)

:: List the contents of the dist directory for debugging
echo.
echo Build output directory structure:
dir dist /s /b

:: Ensure express is installed before creating server file
call npm list express --depth=0 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing express...
    call npm install express --save
)

:: Create a server.cjs file (CommonJS syntax) with proper escaping
echo.
echo Creating Express server (CommonJS)...
echo const express = require('express'); > server.cjs
echo const path = require('path'); >> server.cjs
echo const fs = require('fs'); >> server.cjs
echo const app = express(); >> server.cjs
echo const PORT = process.env.PORT ^|^| 3000; >> server.cjs
echo. >> server.cjs
echo // Serve static files from dist directory >> server.cjs
echo app.use^(express.static^(path.join^(__dirname, 'dist'^)^)^); >> server.cjs
echo. >> server.cjs
echo // Also serve from dist/src if needed ^(for assets^) >> server.cjs
echo app.use^(express.static^(path.join^(__dirname, 'dist/src'^)^)^); >> server.cjs
echo. >> server.cjs
echo // Fallback route for SPA >> server.cjs
echo app.get^('*', ^(req, res^) ^=^> { >> server.cjs
echo   // Check if index.html exists in dist >> server.cjs
echo   const indexPath = path.join^(__dirname, 'dist', 'index.html'^); >> server.cjs
echo   const srcIndexPath = path.join^(__dirname, 'dist', 'src', 'index.html'^); >> server.cjs
echo. >> server.cjs
echo   if ^(fs.existsSync^(indexPath^)^) { >> server.cjs
echo     res.sendFile^(indexPath^); >> server.cjs
echo   } else if ^(fs.existsSync^(srcIndexPath^)^) { >> server.cjs
echo     res.sendFile^(srcIndexPath^); >> server.cjs
echo   } else { >> server.cjs
echo     res.status^(404^).send^('Application not found. Build may be incomplete.'^); >> server.cjs
echo   } >> server.cjs
echo }^); >> server.cjs
echo. >> server.cjs
echo // Start server >> server.cjs
echo app.listen^(PORT, ^(^) ^=^> { >> server.cjs
echo   console.log^(`TORI Chat running on http://localhost:${PORT}`^); >> server.cjs
echo   console.log^(`Press Ctrl+C to stop the server.`^); >> server.cjs
echo }^); >> server.cjs

:: Check if port 3000 is in use
echo.
echo Checking if port 3000 is available...
set PORT=3000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo WARNING: Port 3000 is already in use by PID %%a
    tasklist /FI "PID eq %%a"
    echo.
    echo Would you like to: 
    echo 1. Try an alternative port (3001)
    echo 2. Exit and manage the process manually
    set /p portChoice=Enter choice (1 or 2): 
    
    if "!portChoice!"=="1" (
        echo Using alternative port 3001...
        set PORT=3001
    ) else (
        echo.
        echo Please stop the process using port 3000 and try again.
        echo You can use: taskkill /PID %%a /F
        pause
        exit /b 1
    )
)

:: Start the server with improved error handling
echo.
echo Starting server on port %PORT%...
set NODE_ENV=production
node server.cjs
if %ERRORLEVEL% neq 0 (
    echo ERROR: Server failed to start.
    pause
    exit /b 1
)
