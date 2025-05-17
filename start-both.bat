@echo off
echo Starting ALAN IDE application...
echo.
echo Starting server in a new window...
start cmd /k "cd %~dp0server && node index.js"
echo.
echo Starting client in a new window...
start cmd /k "cd %~dp0client && set NODE_OPTIONS=--openssl-legacy-provider && npx react-scripts start"
echo.
echo Both processes have been started in separate windows.
echo Client will be available at: http://localhost:3000
echo Server will be available at: http://localhost:3003
echo.
echo You can close this window now.
