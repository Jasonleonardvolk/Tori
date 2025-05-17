@echo off
echo ALAN IDE - Client Restart and Navigation Demo Launch
echo ==========================================================
echo.
echo This script restarts the ALAN IDE client with the Navigation Demo interface,
echo featuring the enhanced Lyapunov Predictability tab that uses the Rosenstein algorithm.
echo.

cd client

echo Checking node modules...
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
) else (
  echo Dependencies already installed.
)

echo.
echo Stopping any running client processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo Starting ALAN IDE client with NavigationDemoApp...
echo The app will be available at: http://localhost:3000
echo.
echo Additional features enabled:
echo   - Enhanced Lyapunov Predictability (Rosenstein algorithm)
echo   - Document Chaos Profile visualization
echo   - Improved concept dynamics analysis
echo.

start npm run start
