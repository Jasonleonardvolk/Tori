@echo off
title ALAN IDE Puppeteer Viewer
color 0B

echo =============================================
echo    ALAN IDE Puppeteer Viewer
echo =============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if puppeteer is installed
echo Checking for Puppeteer...
node -e "try{require('puppeteer');console.log('Puppeteer is installed.')}catch(e){console.log('ERROR: Puppeteer is not installed.');process.exit(1)}" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing Puppeteer...
    call npm install puppeteer --save-dev
    if %ERRORLEVEL% neq 0 (
        echo Failed to install Puppeteer. Please run 'npm install puppeteer --save-dev' manually.
        pause
        exit /b 1
    )
    echo Puppeteer installed successfully.
) else (
    echo Puppeteer is already installed.
)

echo.
echo Starting Puppeteer viewer...
echo.
echo This script will:
echo  1. Check if the ALAN IDE application is running
echo  2. Start components automatically if needed
echo  3. Take screenshots of different parts of the application
echo  4. Open a browser for you to interact with the application
echo.
echo Screenshots will be saved to the puppeteer-screenshots directory.
echo.
echo Press any key to start, or Ctrl+C to cancel...
pause > nul

:: Run the Puppeteer viewer script
node puppeteer-viewer.js

echo.
pause
