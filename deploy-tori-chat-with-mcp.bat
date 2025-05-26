@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    TORI Chat Build and Deploy Script
echo    With MCP Key Configuration
echo ==========================================
echo.

REM Change to the frontend directory
cd /d "C:\Users\jason\Desktop\tori\kha\tori_chat_frontend"
if %errorlevel% neq 0 (
    echo ERROR: Could not change to tori_chat_frontend directory
    exit /b 1
)

echo Current directory: %cd%
echo.

REM Step 1: Check if MCP key is configured
echo [1/7] Checking MCP key configuration...
findstr /c:"VITE_MCP_KEY=ed8c312bbb55b6e1fd9c81b44e0019ea" .env.production >nul
if %errorlevel% neq 0 (
    echo ERROR: MCP key not found in .env.production
    echo Please ensure VITE_MCP_KEY=ed8c312bbb55b6e1fd9c81b44e0019ea is in .env.production
    exit /b 1
)
echo ✓ MCP key configured correctly
echo.

REM Step 2: Fix React dependency conflicts
echo [2/7] Fixing React 18 dependency conflicts...
npm ls react-diff-viewer >nul 2>&1
if %errorlevel% equ 0 (
    echo Removing incompatible react-diff-viewer...
    npm uninstall react-diff-viewer
    if %errorlevel% neq 0 (
        echo ERROR: Failed to uninstall react-diff-viewer
        exit /b 1
    )
    
    echo Installing React 18 compatible version...
    npm install react-diff-viewer-continued@4.0.0 --save-exact
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install react-diff-viewer-continued
        exit /b 1
    )
    echo ✓ React dependency conflicts resolved
) else (
    echo ✓ No React dependency conflicts found
)
echo.

REM Step 3: Clean install dependencies
echo [3/7] Installing dependencies...
npm ci --omit dev
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    echo Trying clean reinstall...
    if exist node_modules rmdir /s /q node_modules
    if exist package-lock.json del package-lock.json
    npm ci --omit dev
    if %errorlevel% neq 0 (
        echo ERROR: Clean reinstall also failed
        exit /b 1
    )
)
echo ✓ Dependencies installed successfully
echo.

REM Step 4: Build the application
echo [4/7] Building the application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    exit /b 1
)
echo ✓ Build completed successfully
echo.

REM Step 5: Verify the build
echo [5/7] Verifying build output...
if not exist "dist\index.html" (
    echo ERROR: Build output not found - dist\index.html missing
    exit /b 1
)

REM Check if it's a proper React build (not just a redirect page)
findstr /c:"ReactDOM" dist\index.html >nul
if %errorlevel% neq 0 (
    echo WARNING: Build may be a redirect page, not the full React app
    echo Checking file size...
    for %%F in ("dist\index.html") do (
        if %%~zF lss 1000 (
            echo ERROR: dist\index.html is too small (%%~zF bytes) - likely a redirect page
            exit /b 1
        )
    )
)
echo ✓ Build verification passed
echo.

REM Step 6: Check port availability
echo [6/7] Checking port availability...
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo WARNING: Port 3000 is in use
    echo Checking what's using it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        tasklist /fi "pid eq %%a" | findstr /v "INFO:"
    )
    echo.
    set /p kill_process="Kill the process using port 3000? (y/N): "
    if /i "!kill_process!"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
            echo Killing process %%a...
            taskkill /f /pid %%a
        )
    ) else (
        echo Using alternative port 3001...
        set PORT=3001
    )
) else (
    echo ✓ Port 3000 is available
)
echo.

REM Step 7: Start the production server
echo [7/7] Starting production server...
echo.
echo ==========================================
echo  TORI Chat is starting...
echo  
echo  Access the application at:
if defined PORT (
    echo  http://localhost:%PORT%
) else (
    echo  http://localhost:3000
)
echo  
echo  Press Ctrl+C to stop the server
echo ==========================================
echo.

REM Start the server
if defined PORT (
    set PORT=%PORT%
    node start-production.cjs
) else (
    node start-production.cjs
)

pause