@echo off
:: TORI Chat One-Step Deployment Script
:: This script handles all steps to build and deploy the TORI Chat interface

echo.
echo =======================================
echo    TORI Chat Production Deployment
echo =======================================
echo.
echo This script will build and deploy the TORI Chat interface
echo and launch it on http://localhost:3000
echo.

:: Navigate to the correct directory
cd /d %~dp0tori_chat_frontend

:: Verify we're in the right place
if not exist "vite.config.js" (
    echo ERROR: Not in the correct directory!
    echo Expected to find vite.config.js in %CD%
    echo.
    pause
    exit /b 1
)

:: Clean any existing build
echo Cleaning previous build...
if exist "dist" rd /s /q dist

:: Fix React dependency conflicts by removing problematic packages
echo Checking for React dependency conflicts...
echo Running: npm ls react-diff-viewer
call npm ls react-diff-viewer
if %ERRORLEVEL% equ 0 (
    echo.
    echo WARNING: Found react-diff-viewer which conflicts with React 18
    echo Would you like to: 
    echo 1. Upgrade to compatible version (react-diff-viewer@4.0.0-rc.1)
    echo 2. Remove the package (if not needed for production)
    echo 3. Continue anyway (might fail)
    echo.
    set /p choice=Enter choice (1, 2, or 3): 
    
    if "%choice%"=="1" (
        echo Upgrading react-diff-viewer to compatible version...
        call npm install react-diff-viewer@4.0.0-rc.1 --save-exact
        if %ERRORLEVEL% neq 0 (
            echo ERROR: Failed to upgrade react-diff-viewer.
            echo.
            pause
            exit /b 1
        )
    ) else if "%choice%"=="2" (
        echo Removing react-diff-viewer...
        call npm uninstall react-diff-viewer
        if %ERRORLEVEL% neq 0 (
            echo ERROR: Failed to remove react-diff-viewer.
            echo.
            pause
            exit /b 1
        )
    ) else (
        echo Continuing with potential dependency conflicts...
    )
)

:: Install dependencies
echo Installing production dependencies...
echo Running: npm ci --omit dev
call npm ci --omit dev
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install dependencies.
    echo Trying alternative approach...
    call npm ci --omit dev --legacy-peer-deps
    if %ERRORLEVEL% neq 0 (
        echo ERROR: All dependency installation methods failed.
        echo You may need to manually fix dependency conflicts.
        echo See TORI_CHAT_DEPLOYMENT_PLAN.md for details.
        echo.
        pause
        exit /b 1
    )
)

:: Verify Vite config has correct entry point
echo Checking Vite configuration...
findstr /C:"src/index.html" vite.config.js >nul
if %ERRORLEVEL% neq 0 (
    echo WARNING: Your vite.config.js might not be using the correct entry point.
    echo This could result in building the redirect page instead of the full UI.
    echo See TORI_CHAT_DEPLOYMENT_PLAN.md for details on fixing this.
    echo.
    echo Press any key to continue anyway...
    pause >nul
)

:: Verify .env.production exists
if not exist ".env.production" (
    echo Creating .env.production...
    echo VITE_APP_MODE=chat> .env.production
    echo PUBLIC_URL=/>> .env.production
)

:: Build the application directly with Vite
echo Building production version...
echo Running: npx vite build
call npx vite build
call :checkError "Build failed. See error messages above."

goto :build_success

:checkError
if %ERRORLEVEL% neq 0 (
    echo ERROR: %~1
    echo.
    pause
    exit /b 1
)
goto :EOF

:build_success

:: Verify build size
for %%F in (dist\index.html) do set size=%%~zF
echo Built index.html size: %size% bytes
if %size% LSS 1000 (
    echo WARNING: The built index.html is very small (%size% bytes)
    echo This might indicate it's still the redirect page rather than the full UI.
    echo.
    echo Press any key to continue anyway...
    pause >nul
)

:: Install express if needed
echo Checking for express dependency...
call npm list express --depth=0 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing express...
    call npm install express
)

:: Check if port is in use
echo.
echo Checking if port 3000 is available...
node ..\check-port.js
if %ERRORLEVEL% neq 0 (
    echo Would you like to try an alternative port? (Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        echo Using port 3001 instead...
        set PORT=3001
        echo Access the application at: http://localhost:3001
    ) else (
        echo.
        echo Please manually stop the process using port 3000 and try again.
        echo Use: netstat -ano ^| findstr :3000
        echo Then: taskkill /F /PID PID_NUMBER
        echo.
        pause
        exit /b 1
    )
) else (
    set PORT=3000
    echo Access the application at: http://localhost:3000
)

:: Start the production server
echo.
echo Starting production server...
echo Running: node start-production.cjs
echo.
echo Press Ctrl+C to stop the server when finished.
echo.
node start-production.cjs

:: If we get here, something went wrong
echo.
echo The server has stopped unexpectedly.
echo Check the error messages above for more information.
echo.
pause
