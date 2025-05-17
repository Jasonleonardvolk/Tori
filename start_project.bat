@echo off
title ALAN IDE Project Starter
color 0B

echo ========================================
echo        ALAN IDE Project Starter
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Get Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo Using Node.js %NODE_VERSION%

:: Check for required directories
if not exist "client\" (
    echo ERROR: client directory not found!
    echo Make sure you're running this from the project root directory.
    pause
    exit /b 1
)

if not exist "server\" (
    echo ERROR: server directory not found!
    echo Make sure you're running this from the project root directory.
    pause
    exit /b 1
)

:: Ensure node_modules are installed
echo Checking for dependencies...

if not exist "node_modules\" (
    echo Installing root dependencies...
    call yarn install
)

if not exist "client\node_modules\" (
    echo Installing client dependencies...
    cd client
    call yarn install
    cd ..
)

if not exist "server\node_modules\" (
    echo Installing server dependencies...
    cd server
    call yarn install
    cd ..
)

echo All dependencies are installed!
echo.
echo Starting the project using Node.js...
echo.
echo NOTE: A browser window should open automatically in a few seconds.
echo      If not, open http://localhost:3000 manually.
echo.
echo Press Ctrl+C to stop the project when you're done.
echo.

:: Start the project using our Node.js script
node start_project.js

pause
