@echo off
echo 🚀 STARTING COMPLETE TORI SYSTEM
echo =====================================
echo.
echo 📊 This starts:
echo    1. Backend API (Port 8002)
echo       - PDF Extraction Service
echo       - Soliton Memory System
echo       - WebSocket Progress Tracking
echo    2. Frontend (Port 5173)
echo       - Svelte UI
echo       - Real-time updates
echo.
echo 🌟 No databases - Pure in-memory performance!
echo.

REM Make sure we're in the right directory
cd /d "C:\Users\jason\Desktop\tori\kha"

echo 🌊 Starting Backend API with Soliton Memory...
start "TORI Backend API" cmd /k "cd /d C:\Users\jason\Desktop\tori\kha && python start_dynamic_api.py"

echo ⏳ Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

echo.
echo 🎨 Starting Frontend UI...
start "TORI Frontend UI" cmd /k "cd /d C:\Users\jason\Desktop\tori\kha\tori_ui_svelte && npm run dev"

echo.
echo ✅ TORI System Started!
echo.
echo 📍 Access Points:
echo    Frontend:  http://localhost:5173
echo    API Docs:  http://localhost:8002/docs
echo    Health:    http://localhost:8002/health
echo.
echo 💡 Both terminal windows will remain open.
echo    Close them manually to stop the services.
echo.
pause
