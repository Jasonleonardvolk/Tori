@echo off
title ALAN IDE Puppeteer Test Runner
color 0B

echo ============================================
echo      ALAN IDE Puppeteer Test Runner
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
echo Starting Puppeteer test...
echo.
echo This script will:
echo  1. Check if the ALAN IDE application is running
echo  2. Start it automatically if needed
echo  3. Run automated tests with Puppeteer
echo  4. Save screenshots to the screenshots directory
echo.
echo NOTE: A browser window will open automatically.
echo       Please do not interact with it during testing.
echo.
echo Press any key to start testing, or Ctrl+C to cancel...
pause > nul

:: Create screenshots directory if it doesn't exist
if not exist "screenshots" mkdir screenshots

:: Run the Puppeteer test script
node puppeteer-test.js

echo.
if %ERRORLEVEL% equ 0 (
    echo Testing completed successfully!
) else (
    echo There were some issues during testing. Check the output above for details.
)

echo.
echo You can find the screenshots in the 'screenshots' directory.
echo.
pause
