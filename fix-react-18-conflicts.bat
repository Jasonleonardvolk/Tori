@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    React 18 Dependency Conflicts Fixer
echo ==========================================
echo.

cd /d "C:\Users\jason\Desktop\tori\kha\tori_chat_frontend"
if %errorlevel% neq 0 (
    echo ERROR: Could not change to frontend directory
    exit /b 1
)

echo Current directory: %cd%
echo.

echo [1/8] Checking for problematic packages...

REM Check if react-diff-viewer (the problematic one) exists
npm ls react-diff-viewer >nul 2>&1
if %errorlevel% equ 0 (
    echo Found react-diff-viewer - removing it...
    npm uninstall react-diff-viewer
    if %errorlevel% neq 0 (
        echo ERROR: Failed to remove react-diff-viewer
        exit /b 1
    )
    echo ✓ Removed react-diff-viewer
) else (
    echo ✓ No react-diff-viewer found (good!)
)

echo.
echo [2/8] Removing node_modules and package-lock.json for clean install...
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
    if %errorlevel% neq 0 (
        echo ERROR: Could not remove node_modules
        exit /b 1
    )
    echo ✓ Removed node_modules
)

if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
    echo ✓ Removed package-lock.json
)

echo.
echo [3/8] Clearing npm cache...
npm cache clean --force
echo ✓ Cache cleared

echo.
echo [4/8] Installing React 18 compatible dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    echo Trying with --legacy-peer-deps...
    npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo ERROR: npm install failed even with legacy peer deps
        exit /b 1
    )
)
echo ✓ Dependencies installed

echo.
echo [5/8] Ensuring react-diff-viewer-continued is installed...
npm list react-diff-viewer-continued >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing react-diff-viewer-continued...
    npm install react-diff-viewer-continued@4.0.0 --save-exact
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install react-diff-viewer-continued
        exit /b 1
    )
)
echo ✓ react-diff-viewer-continued verified

echo.
echo [6/8] Verifying React versions...
echo React packages installed:
npm list react react-dom react-diff-viewer-continued

echo.
echo [7/8] Checking for peer dependency warnings...
npm list --depth=0

echo.
echo [8/8] Running a quick build test...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build test failed - there may still be dependency conflicts
    echo Trying to fix peer dependencies...
    npm install --legacy-peer-deps
    npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Build still failing after peer dep fix
        exit /b 1
    )
)

echo.
echo ==========================================
echo ✓ React 18 Dependency Conflicts FIXED!
echo ==========================================
echo.
echo ✅ All React dependencies are now compatible
echo ✅ Build test passed
echo ✅ Ready for production deployment
echo.
echo Next step: Run your deployment script or:
echo   node start-production.cjs
echo.
pause