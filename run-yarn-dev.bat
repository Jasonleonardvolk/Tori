@echo off
title ALAN IDE Yarn Dev Runner
color 0B

echo ============================================
echo    ALAN IDE Yarn Dev Runner for Puppeteer
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

:: Run the Node.js script
echo Starting the application with yarn dev...
echo This will run until you press Ctrl+C to stop it.
echo.
echo The application will be available at:
echo   Client: http://localhost:3000
echo   Server: http://localhost:3003
echo   Status: http://localhost:8088
echo.
echo Starting now...
echo.

node run-yarn-dev.js

pause
