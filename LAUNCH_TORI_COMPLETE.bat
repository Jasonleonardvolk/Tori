@echo off
echo ==========================================
echo    TORI Complete System Launcher
echo    With MCP Server Integration
echo ==========================================
echo.

cd /d "C:\Users\jason\Desktop\tori\kha"

:: Display comprehensive menu
echo Which components would you like to start?
echo.
echo 1. Frontend only (SvelteKit on port 5173)
echo 2. Frontend + Banksy Backend
echo 3. Frontend + Banksy + MCP Servers
echo 4. FULL SYSTEM (Frontend + Banksy + MCP + PDF Service) [RECOMMENDED]
echo 5. MCP Servers only (for testing)
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Starting SvelteKit frontend only...
    cd tori_ui_svelte
    call npm run dev
    
) else if "%choice%"=="2" (
    echo.
    echo Starting Frontend + Banksy Backend...
    call START_FULL_TORI_SYSTEM.bat
    
) else if "%choice%"=="3" (
    echo.
    echo Starting Frontend + Banksy + MCP Servers...
    echo.
    
    :: Start MCP servers first
    echo [1/3] Starting MCP servers...
    start "MCP Servers" /D "%CD%\mcp-server-architecture" cmd /c "npm run start"
    timeout /t 5
    
    :: Start Banksy + Frontend
    echo [2/3] Starting TORI Frontend + Banksy Backend...
    start "TORI System" /D "%CD%" START_FULL_TORI_SYSTEM.bat
    
    echo.
    echo Services starting:
    echo - MCP Gateway: http://localhost:3001
    echo - Frontend: http://localhost:5173
    echo - Banksy API: http://localhost:8000
    echo.
    echo Press any key when done to close all services...
    pause >nul
    
) else if "%choice%"=="4" (
    echo.
    echo Starting FULL TORI ECOSYSTEM with all services...
    echo.
    
    :: Start MCP servers first
    echo [1/4] Starting MCP servers...
    start "MCP Servers" /D "%CD%\mcp-server-architecture" cmd /c "npm run start"
    timeout /t 5
    
    :: Start Frontend + Banksy
    echo [2/4] Starting TORI Frontend + Banksy Backend...
    start "TORI System" /D "%CD%" START_FULL_TORI_SYSTEM.bat
    timeout /t 5
    
    :: Start PDF extraction service (which also connects to MCP)
    echo [3/4] Starting PDF Extraction Service with TORI filtering...
    start "PDF Service" /D "%CD%" cmd /c "python run_stable_server.py"
    
    echo.
    echo ==========================================
    echo  ALL SERVICES STARTED:
    echo ==========================================
    echo  - Frontend:      http://localhost:5173
    echo  - Banksy API:    http://localhost:8000
    echo  - MCP Gateway:   http://localhost:3001
    echo  - PDF Service:   http://localhost:8002
    echo ==========================================
    echo.
    echo Your complete MCP-TORI ecosystem is running!
    echo Press any key when done to close all services...
    pause >nul
    
) else if "%choice%"=="5" (
    echo.
    echo Starting MCP servers only...
    cd mcp-server-architecture
    npm run start
    
) else (
    echo Invalid choice. Please run again and select 1-5.
    pause
    exit /b 1
)

:: Cleanup message
echo.
echo Services stopped or stopping...
echo To ensure all services are stopped, you may need to:
echo - Press Ctrl+C in any remaining terminal windows
echo - Run: taskkill /f /im node.exe (kills all Node processes)
echo.
pause
