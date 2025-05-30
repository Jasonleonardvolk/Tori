@echo off
echo 🚀 STARTING BANKSY BACKEND FOR LIVE DEPLOYMENT
echo ==========================================

cd /d "C:\Users\jason\Desktop\tori\kha\alan_backend\server"

echo.
echo 🔍 Checking Python environment...
python --version
if %errorlevel% neq 0 (
    echo ❌ Python not found! Please install Python 3.8+
    pause
    exit /b 1
)

echo.
echo 📦 Installing dependencies...
pip install fastapi uvicorn websockets numpy
if %errorlevel% neq 0 (
    echo ⚠️ Some dependencies may already be installed - continuing...
)

echo.
echo 🌀 Starting Banksy Oscillator API Server...
echo 📍 Server will be available at: http://localhost:8000
echo 🔗 WebSocket endpoint: ws://localhost:8000/ws/simulate
echo.
echo ⏱️ GOING LIVE NOW! Starting simulation_api.py...
echo.

python simulation_api.py

echo.
echo ❌ Server stopped. Press any key to restart...
pause
goto start