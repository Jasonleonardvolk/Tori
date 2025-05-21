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

:: Navigate to the correct directory (this script's location)
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

:: Install dependencies
echo Installing dependencies...
echo Running: npm install --legacy-peer-deps
echo.
call npm install --legacy-peer-deps
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install dependencies.
    echo Trying alternative approach with --force...
    call npm install --force
    if %ERRORLEVEL% neq 0 (
        echo ERROR: All dependency installation methods failed.
        echo.
        pause
        exit /b 1
    )
)

:: Build the application
echo Building production version...
echo Running: npm run build
echo.
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Build failed. See error messages above.
    echo.
    pause
    exit /b 1
)

:: Start the production server
echo.
echo Starting production server...
echo Running: node start-production.cjs
echo.
node start-production.cjs
if %ERRORLEVEL% neq 0 (
    echo ERROR: Server failed to start. See error messages above.
    echo.
    echo Trying alternative method with npm script...
    npm run start
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Standard servers failed.
        echo Trying minimal fallback server...
        echo Running: node minimal-server.js
        echo.
        node minimal-server.js
        if %ERRORLEVEL% neq 0 (
            echo ERROR: All server start methods failed.
            echo.
            pause
            exit /b 1
        )
    )
)

:: If we get here, something went wrong
echo.
echo The server has stopped unexpectedly.
echo Check the error messages above for more information.
echo.
pause
