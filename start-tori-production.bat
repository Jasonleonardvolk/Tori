@echo off
echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║          TORI PRODUCTION ENVIRONMENT STARTUP          ║
echo ║                   48-Hour Sprint Mode                 ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM Check if we should start all services
if "%1"=="all" goto START_ALL

:START_CHAT_ONLY
echo Starting TORI Chat Frontend...
echo.
cd /d "%~dp0\tori_chat_frontend"

REM Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    call yarn install
)

REM Build if needed
if not exist dist (
    echo Building frontend...
    call yarn build
)

REM Start the chat server
echo Starting chat server on port 3000...
call yarn start
goto END

:START_ALL
echo Starting ALL TORI Services...
echo.

REM Start PDF Upload Server (port 5000)
echo [1/3] Starting PDF Upload Server on port 5000...
start "PDF Upload Server" cmd /c "cd /d %~dp0 && python pdf_upload_server.py"
timeout /t 3 /nobreak >nul

REM Start ALAN Backend (port 8000)
echo [2/3] Starting ALAN Backend on port 8000...
start "ALAN Backend" cmd /c "cd /d %~dp0\alan_backend\server && python simulation_api.py"
timeout /t 3 /nobreak >nul

REM Start Chat Frontend (port 3000)
echo [3/3] Starting TORI Chat Frontend on port 3000...
cd /d "%~dp0\tori_chat_frontend"

if not exist node_modules (
    echo Installing dependencies...
    call yarn install
)

if not exist dist (
    echo Building frontend...
    call yarn build
)

call yarn start

:END
echo.
echo Services stopped.
pause
