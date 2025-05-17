@echo off
title ALAN IDE - Fixed Application
color 0A

echo =============================================
echo    ALAN IDE - Fixed Application
echo =============================================
echo.

echo Starting the server...
start cmd /k "cd server && node dev-server.js"

timeout /t 3 /nobreak > nul

echo.
echo Starting the React client...
echo.

cd client
set NODE_OPTIONS=--openssl-legacy-provider
set BROWSER=none
start cmd /k "npx react-scripts start"

echo.
echo Waiting for the client to start (8 seconds)...
timeout /t 8 /nobreak > nul

echo.
echo Opening browser...
start chrome --new-window http://localhost:3000

echo.
echo Application is now running!
echo.
echo Server: http://localhost:3003
echo Client: http://localhost:3000
echo API Endpoint: http://localhost:3003/api/agent-suggestions
echo.
echo Press any key to exit this window...
pause > nul
