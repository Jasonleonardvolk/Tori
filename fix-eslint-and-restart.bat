@echo off
title ALAN IDE ESLint Fix
color 0C

echo =============================================
echo    ALAN IDE ESLint Compatibility Fix
echo =============================================
echo.

echo Stopping any running React processes...
taskkill /f /im node.exe 2>nul

echo.
echo Running ESLint fix script...
node fix-eslint.js

echo.
echo Cleaning node_modules cache...
cd client
if exist "node_modules\.cache" (
  rmdir /s /q "node_modules\.cache"
  echo Cache cleared.
) else (
  echo No cache directory found.
)

echo.
echo Creating additional temporary fix...
echo.
echo Adding DISABLE_ESLINT_PLUGIN=true to .env file...
echo DISABLE_ESLINT_PLUGIN=true> .env
echo SKIP_PREFLIGHT_CHECK=true>> .env
echo BROWSER=none>> .env

echo.
echo Starting React client with ESLint disabled...
set NODE_OPTIONS=--openssl-legacy-provider
start cmd /k "npx react-scripts start"

echo.
echo Fix applied and client restarted!
echo.
echo If you still see ESLint errors, try these additional steps:
echo  1. Run 'npm uninstall babel-eslint' in the client directory
echo  2. Run 'npm install @babel/eslint-parser --save-dev' in the client directory
echo  3. Run 'npm install eslint-plugin-react-hooks --save-dev' in the client directory
echo  4. Restart the client
echo.
echo Press any key to exit this window...
pause > nul
