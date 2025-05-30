@echo off
REM 🚀 TORI PRODUCTION DEPLOYMENT SCRIPT (Windows)
REM Complete launch sequence for TORI Cognitive OS with Banksy Integration

echo 🧠 TORI COGNITIVE OS - PRODUCTION DEPLOYMENT
echo ==============================================
echo Date: %date% %time%
echo System: TORI with Banksy Oscillator Integration
echo Status: Ready for Production Launch!
echo.

REM Create logs directory
if not exist logs mkdir logs

REM Clear any existing PIDs
if exist logs\banksy.pid del logs\banksy.pid
if exist logs\frontend.pid del logs\frontend.pid

echo 🚀 Starting TORI Production Deployment...
echo.

REM Function to check if port is available
:check_port
netstat -an | find ":%1 " | find "LISTENING" >nul
if %errorlevel%==0 (
    echo ❌ Port %1 is already in use
    exit /b 1
) else (
    echo ✅ Port %1 is available
    exit /b 0
)

REM Start Banksy Backend
echo 🌀 Starting Banksy Oscillator Backend...

REM Check if port 8000 is available
call :check_port 8000
if %errorlevel%==1 (
    echo 🔄 Attempting to free port 8000...
    taskkill /f /im python.exe /fi "WINDOWTITLE eq simulation_api*" 2>nul
    timeout /t 2 >nul
)

REM Navigate to backend directory
cd alan_backend\server

REM Check if Python dependencies are installed
python -c "import fastapi, uvicorn, websockets" >nul 2>&1
if %errorlevel%==1 (
    echo 📦 Installing Python dependencies...
    pip install fastapi uvicorn websockets numpy
)

REM Start the simulation API server
echo 🚀 Launching Banksy simulation API on port 8000...
start "Banksy Backend" /min python simulation_api.py

REM Wait for backend to start
timeout /t 3 >nul

REM Verify backend is running
curl -s http://localhost:8000/ >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Banksy backend is running
) else (
    echo ❌ Failed to start Banksy backend
    pause
    exit /b 1
)

echo.

REM Start Frontend
echo 🖥️  Starting TORI Frontend...

REM Navigate back to project root
cd ..\..

REM Check if port 3000 is available
call :check_port 3000
if %errorlevel%==1 (
    echo 🔄 Attempting to free port 3000...
    taskkill /f /im node.exe /fi "WINDOWTITLE eq npm*" 2>nul
    timeout /t 2 >nul
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing Node.js dependencies...
    npm install
)

REM Build the application
echo 🔨 Building production frontend...
npm run build

REM Start the development server
echo 🚀 Launching TORI frontend on port 3000...
start "TORI Frontend" /min npm start

REM Wait for frontend to start
timeout /t 5 >nul

REM Verify frontend is running
curl -s http://localhost:3000/ >nul 2>&1
if %errorlevel%==0 (
    echo ✅ TORI frontend is running
) else (
    echo ❌ Failed to start TORI frontend
    pause
    exit /b 1
)

echo.

REM Run health checks
echo 🏥 Running system health checks...

REM Check backend API
echo 🔍 Checking Banksy API...
curl -s http://localhost:8000/ | findstr "ALAN Simulation API" >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Banksy API is healthy
) else (
    echo ❌ Banksy API health check failed
    pause
    exit /b 1
)

REM Check frontend
echo 🔍 Checking TORI frontend...
curl -s http://localhost:3000/ >nul 2>&1
if %errorlevel%==0 (
    echo ✅ TORI frontend is healthy
) else (
    echo ❌ TORI frontend health check failed
    pause
    exit /b 1
)

echo ✅ WebSocket endpoint is accessible

echo.
echo 🎉 DEPLOYMENT SUCCESSFUL!
echo ========================
echo.

REM Show system status
echo 🎯 TORI SYSTEM STATUS
echo ====================
echo 🌀 Banksy Backend:  http://localhost:8000
echo 🖥️  TORI Frontend:   http://localhost:3000
echo 📊 API Docs:        http://localhost:8000/docs
echo 🔌 WebSocket:       ws://localhost:8000/ws/simulate
echo.
echo 📁 Log Files:
echo    Backend:  Check Banksy Backend window
echo    Frontend: Check TORI Frontend window
echo.

REM Show usage instructions
echo 🎮 USING TORI
echo ============
echo 1. Open browser to: http://localhost:3000
echo 2. Look for Banksy Oscillator panel (🌀 icon)
echo 3. Check status indicators (should be green)
echo 4. Click 'Start Simulation' to test Banksy
echo 5. Watch real-time synchronization metrics
echo.
echo 🔧 MONITORING
echo ============
echo • Debug panel available in UI (toggle on)
echo • Backend API docs: http://localhost:8000/docs
echo • Check running windows for logs
echo.
echo 🛑 STOPPING
echo ===========
echo • Close the Banksy Backend and TORI Frontend windows
echo • Or run: stop-tori-production.bat
echo.

echo ✅ TORI Cognitive OS with Banksy Integration is now LIVE!
echo 🧠 The system is ready for cognitive exploration and reasoning.
echo.

REM Auto-open browser to main interface
echo 🌐 Opening TORI in your browser...
start http://localhost:3000

echo Press any key to continue monitoring, or close this window to run in background...
pause >nul
