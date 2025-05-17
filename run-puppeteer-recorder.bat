@echo off
title ALAN IDE Puppeteer Recorder
color 0A

echo ============================================
echo      ALAN IDE Puppeteer Interaction Recorder
echo ============================================
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
echo Starting Puppeteer recorder...
echo.
echo This script will:
echo  1. Open a browser window controlled by Puppeteer
echo  2. Record your interactions with the ALAN IDE application
echo  3. Generate a script that can replay those interactions
echo  4. Save screenshots during the recording
echo.
echo NOTES:
echo  - Make sure the ALAN IDE application is running at http://localhost:3000
echo  - Press Ctrl+Alt+X to take a screenshot during recording
echo  - Press Ctrl+C in this console window to stop recording
echo.
echo Press any key to start recording, or Ctrl+C to cancel...
pause > nul

:: Create recorded-screenshots directory if it doesn't exist
if not exist "recorded-screenshots" mkdir recorded-screenshots

:: Run the Puppeteer recorder script
node puppeteer-recorder.js

echo.
if %ERRORLEVEL% equ 0 (
    echo Recording completed successfully!
    echo A script has been generated at recorded-script.js
) else (
    echo There were some issues during recording. Check the output above for details.
)

echo.
echo You can find the screenshots in the 'recorded-screenshots' directory.
echo To replay your recording, use: node recorded-script.js
echo.
pause
