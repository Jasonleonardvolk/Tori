@echo off
echo ======================================================
echo             ITORI IDE Development Server
echo ======================================================
echo.

rem Check if dependencies are installed
if not exist "node_modules" (
  echo Installing dependencies...
  npm install --legacy-peer-deps
  echo.
)

echo Starting development server in development mode...
echo.
echo Server will be available at:
echo   http://localhost:5173     - Development server
echo   http://localhost:5173/chat/standalone.html - Standalone Chat
echo.
echo Press Ctrl+C to stop the server
echo.

rem Run in development mode using the .env.development file
npx vite --mode development
