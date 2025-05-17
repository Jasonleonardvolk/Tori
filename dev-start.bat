@echo off
title ALAN IDE Development Server
color 0B

echo =============================================
echo    ALAN IDE Development Server
echo =============================================
echo.

echo Installing server dependencies...
cd server
call npm install
cd ..

echo.
echo Starting the development server...
start cmd /k "cd server && npm run dev"

echo.
echo Starting the React client...
start cmd /k "cd client && set NODE_OPTIONS=--openssl-legacy-provider && npx react-scripts start"

echo.
echo Both processes started in separate windows.
echo.
echo Client will be available at:
echo   http://localhost:3000
echo.
echo Server API endpoints:
echo   http://localhost:3003/api/health
echo   http://localhost:3003/api/agent-suggestions
echo.
echo WebSocket server:
echo   ws://localhost:8082
echo.
echo Press any key to exit this console...
pause > nul
