@echo off
echo ==========================================
echo    TORI SvelteKit Chat Launcher
echo    Full System Integration
echo ==========================================
echo.

cd /d "C:\Users\jason\Desktop\tori\kha"

:: Check which systems to start
echo Which components would you like to start?
echo.
echo 1. Frontend only (SvelteKit on port 5173)
echo 2. Full system (Frontend + Banksy Backend)
echo 3. Full system + PDF Extraction Service
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Starting SvelteKit frontend only...
    cd tori_ui_svelte
    call npm run dev
) else if "%choice%"=="2" (
    echo.
    echo Starting full TORI system...
    call START_FULL_TORI_SYSTEM.bat
) else if "%choice%"=="3" (
    echo.
    echo Starting full system with PDF extraction...
    start "TORI Frontend + Backend" /D "%CD%" START_FULL_TORI_SYSTEM.bat
    timeout /t 5
    start "PDF Extraction Service" /D "%CD%" python run_stable_server.py
    echo.
    echo All services starting:
    echo - Frontend: http://localhost:5173
    echo - Banksy API: http://localhost:8000
    echo - PDF Service: http://localhost:8002
) else (
    echo Invalid choice. Please run again and select 1-3.
    pause
    exit /b 1
)

pause
