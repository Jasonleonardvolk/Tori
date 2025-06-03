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

cd /d "C:\Users\jason\Desktop\tori\kha"

echo 🌊 Starting Backend API with Soliton Memory...
start "TORI Backend API" cmd /k "python start_dynamic_api.py"

echo ⏳ Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

echo.
echo 🎨 Starting Frontend UI...
cd tori_ui_svelte
start "TORI Frontend UI" cmd /k "npm run dev"

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
