@echo off
REM BANKSY RESTORATION DEPLOYMENT SCRIPT (Windows)
REM This script sets up the frontend-backend bridge for Banksy Oscillator

echo.
echo 🌀 BANKSY OSCILLATOR RESTORATION
echo =================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Run this script from the TORI project root directory
    pause
    exit /b 1
)

echo ✅ Setting up Banksy frontend components...

REM Install required dependencies
echo 📦 Installing dependencies...
call npm install --save-dev @types/websocket

REM Check if backend is available
echo 🔍 Checking Banksy backend availability...
curl -s http://localhost:8000/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Banksy backend is running!
) else (
    echo ⚠️  Banksy backend not detected. 
    echo.
    if exist "alan_backend\server\simulation_api.py" (
        echo 🚀 To start Banksy backend manually:
        echo    cd alan_backend\server
        echo    python simulation_api.py
        echo.
        echo Starting backend now...
        start "Banksy Backend" cmd /k "cd alan_backend\server && python simulation_api.py"
        echo ✅ Backend starting in new window...
        timeout /t 3 >nul
    ) else (
        echo ❌ Banksy backend files not found!
        echo    Looking for: alan_backend\server\simulation_api.py
    )
)

echo.
echo ✅ Banksy components created:
echo    📁 src\components\banksy\
echo    ├── BanksyApiClient.ts      (API connection)
echo    ├── BanksyOscillatorPanel.tsx (Control panel)
echo    ├── PhaseVisualization.tsx   (Phase display)
echo    └── index.ts                (Exports)

echo.
echo 🚀 NEXT STEPS TO COMPLETE INTEGRATION:
echo =======================================
echo.
echo 1. 🔗 Add Banksy to main UI:
echo    Edit src\components\ToriCognitionEngine.tsx
echo    Import: import { BanksyOscillatorPanel } from './banksy';
echo    Add: ^<BanksyOscillatorPanel className="mb-4" /^>
echo.
echo 2. 🎛️  Test the integration:
echo    npm start
echo    Look for Banksy panel in TORI UI
echo.
echo 3. 🌐 Verify backend connection:
echo    Visit: http://localhost:8000/
echo    Should show: ALAN Simulation API info
echo.
echo 📋 INTEGRATION CHECKLIST:
echo =========================
echo [ ] Backend API server running (port 8000)
echo [ ] Frontend components created
echo [ ] API client connecting successfully
echo [ ] UI panel integrated into main app
echo [ ] Real-time visualization working
echo [ ] WebSocket connection stable
echo.
echo 🎯 BANKSY RESTORATION STATUS: READY FOR INTEGRATION
echo.
echo For troubleshooting, check:
echo   📄 BANKSY_RESTORATION_ROADMAP.md
echo   🔧 alan_backend\server\simulation_api.py
echo   🌐 http://localhost:8000/docs (API documentation)
echo.

pause
