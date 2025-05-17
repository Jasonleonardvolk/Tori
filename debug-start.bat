@echo off
title ALAN IDE Debug Startup
color 0E

echo =============================================
echo    ALAN IDE Debug Startup
echo =============================================
echo.

echo Starting the application with improved error handling...
echo.
echo This script:
echo  1. Starts the API server
echo  2. Starts the React client with error handling
echo  3. Opens Chrome with React devtools for debugging
echo.

echo Starting the API server...
start cmd /k "cd server && (if not exist node_modules npm install) && node dev-server.js"

timeout /t 3 /nobreak > nul

echo.
echo Starting the React client...
echo.
echo TIP: Look for error messages in the console and in the browser
echo     to identify which component is causing issues.
echo.

cd client
set NODE_OPTIONS=--openssl-legacy-provider
set BROWSER=none
start cmd /k "npx react-scripts start"

echo.
echo Waiting for the client to start (10 seconds)...
timeout /t 10 /nobreak > nul

echo.
echo Opening Chrome with React DevTools...
start chrome --new-window http://localhost:3000

echo.
echo Development environment is now running!
echo.
echo If you see errors in the browser:
echo  1. Open Chrome DevTools (F12)
echo  2. Look in the Console tab for error messages
echo  3. Check the Components tab for React component issues
echo.
echo Press any key to exit this window...
pause > nul
