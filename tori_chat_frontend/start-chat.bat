@echo off
:: TORI Chat Production Launcher
:: This script builds and launches the TORI Chat interface in production mode

echo.
echo =======================================
echo    TORI Chat Production Launcher
echo =======================================
echo.
echo Building and starting TORI Chat in production mode...
echo This will launch a server at http://localhost:3000
echo.
echo Tip: Check START_TORI_CHAT.md for other options
echo and troubleshooting information.
echo.

:: Navigate to the correct directory
cd %~dp0

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Install dependencies if node_modules doesn't exist
if not exist node_modules\ (
    echo Node modules not found. Installing dependencies...
    echo Running: npm install
    echo.
    npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install dependencies.
        echo.
        pause
        exit /b 1
    )
)

:: Install express if it's missing (required for start-production.js)
echo Checking for required dependencies...
npm list express --depth=0 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing express...
    npm install express
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install express.
        echo.
        pause
        exit /b 1
    )
)

:: Build the application
echo Building production version...
echo Running: npm run build
echo.
npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Build failed. See error messages above.
    echo.
    pause
    exit /b 1
)

echo.
echo Starting production server...
echo Running: node start-production.js
echo.
node start-production.js
if %ERRORLEVEL% neq 0 (
    echo ERROR: Server failed to start. See error messages above.
    echo.
    echo Trying alternative method...
    npm run start
    if %ERRORLEVEL% neq 0 (
        echo ERROR: All server start methods failed.
        echo.
        pause
        exit /b 1
    )
)

:: If we get here, something went wrong
echo.
echo The server has stopped unexpectedly.
echo Check the error messages above for more information.
echo.
pause
