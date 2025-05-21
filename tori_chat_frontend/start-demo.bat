@echo off
:: TORI Chat Demo Launcher
:: This script launches the TORI Chat interface in legacy demo mode

echo.
echo =======================================
echo    TORI Chat Legacy Demo Launcher
echo =======================================
echo.
echo Starting TORI Chat in legacy demo mode...
echo This will launch a server at http://localhost:3000
echo.
echo Note: This is a legacy mode with limited functionality.
echo For full functionality, use start-chat.bat instead.
echo.

:: Navigate to the correct directory
cd %~dp0

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Install express if it's missing (required for start-demo.js)
echo Checking for required dependencies...
npm list express --depth=0 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing express...
    npm install express
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install express.
        echo.
        pause
        exit /b 1
    )
)

:: Run the demo server
echo Running legacy demo server...
echo.
npm run legacy-demo
if %ERRORLEVEL% neq 0 (
    echo ERROR: Demo server failed to start. See error messages above.
    echo.
    pause
    exit /b 1
)

:: If we get here, something went wrong
echo.
echo The server has stopped unexpectedly.
echo Check the error messages above for more information.
echo.
pause
