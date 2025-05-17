@echo off
title ALAN IDE Simple Starter
color 0B

echo ========================================
echo        ALAN IDE Simple Starter
echo ========================================
echo.

echo Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo Failed to install dependencies with npm. Trying yarn...
    call yarn
)

echo.
echo Starting the client and server...
echo.

:: Start the server
start cmd /k "cd server && node index.js"

:: Wait a moment for the server to initialize
timeout /t 3 /nobreak > nul

:: Start the client
start cmd /k "cd client && npx react-scripts start"

echo.
echo Started the application in separate windows.
echo Client will be available at: http://localhost:3000
echo Server will be available at: http://localhost:3003
echo.
echo Press any key to exit this window...
pause > nul
