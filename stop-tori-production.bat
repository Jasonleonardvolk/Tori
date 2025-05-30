@echo off
REM 🛑 TORI PRODUCTION STOP SCRIPT (Windows)
REM Gracefully shutdown all TORI services

echo 🛑 STOPPING TORI COGNITIVE OS
echo =============================
echo Date: %date% %time%
echo.

echo 🔄 Shutting down TORI services...

REM Stop Banksy Backend (Python simulation API)
echo 🌀 Stopping Banksy Oscillator Backend...
taskkill /f /im python.exe /fi "WINDOWTITLE eq Banksy Backend*" 2>nul
if %errorlevel%==0 (
    echo ✅ Banksy backend stopped
) else (
    echo ⚠️  No Banksy backend process found
)

REM Stop TORI Frontend (Node.js React app)
echo 🖥️  Stopping TORI Frontend...
taskkill /f /im node.exe /fi "WINDOWTITLE eq TORI Frontend*" 2>nul
if %errorlevel%==0 (
    echo ✅ TORI frontend stopped
) else (
    echo ⚠️  No TORI frontend process found
)

REM Additional cleanup - stop any remaining npm/react processes
echo 🧹 Cleaning up remaining processes...
taskkill /f /im node.exe /fi "COMMANDLINE eq *react-scripts*" 2>nul
taskkill /f /im python.exe /fi "COMMANDLINE eq *simulation_api*" 2>nul

REM Wait a moment for processes to fully terminate
timeout /t 2 >nul

REM Verify ports are free
echo 🔍 Verifying ports are released...

netstat -an | find ":8000 " | find "LISTENING" >nul 2>&1
if %errorlevel%==1 (
    echo ✅ Port 8000 (Banksy Backend) is free
) else (
    echo ⚠️  Port 8000 may still be in use
)

netstat -an | find ":3000 " | find "LISTENING" >nul 2>&1
if %errorlevel%==1 (
    echo ✅ Port 3000 (TORI Frontend) is free
) else (
    echo ⚠️  Port 3000 may still be in use
)

echo.
echo ✅ TORI COGNITIVE OS SHUTDOWN COMPLETE
echo =====================================
echo 🧠 All TORI services have been stopped
echo 📝 System is ready for restart or maintenance
echo.
echo 🚀 To restart TORI, run: deploy-tori-production.bat
echo.

pause
