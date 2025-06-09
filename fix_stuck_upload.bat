@echo off
REM STUCK UPLOAD FIX SCRIPT
REM Run this to diagnose and fix the upload issue

echo ========================================
echo    TORI STUCK UPLOAD FIX SCRIPT
echo ========================================
echo.

REM Step 1: Run diagnostic
echo Step 1: Running comprehensive diagnostic...
cd /d "C:\Users\jason\Desktop\tori\kha"
python diagnose_stuck_upload.py

echo.
echo ========================================
echo    IMMEDIATE FIXES TO TRY
echo ========================================
echo.

echo 1. REFRESH FRONTEND:
echo    - Open new browser tab
echo    - Go to: http://localhost:5173
echo    - Try upload again
echo.

echo 2. HARD REFRESH:
echo    - Press Ctrl+Shift+R in browser
echo    - This clears cache and resets state
echo.

echo 3. TEST BACKEND DIRECTLY:
echo    - Open: http://localhost:8002/test
echo    - Should show test data
echo.

echo 4. CHECK DEBUG INFO:
echo    - Open: http://localhost:8002/debug/last-upload
echo    - Shows recent uploaded files
echo.

echo ========================================
echo    IF STILL STUCK - NUCLEAR OPTION
echo ========================================
echo.

echo Press 'R' to RESTART everything, or any other key to exit
set /p choice="Your choice: "

if /i "%choice%"=="R" goto restart
goto end

:restart
echo.
echo 🛑 STOPPING ALL TORI PROCESSES...

REM Kill all Python processes
taskkill /f /im python.exe 2>nul
taskkill /f /im pythonw.exe 2>nul

REM Kill all Node processes  
taskkill /f /im node.exe 2>nul

echo ⏳ Waiting 5 seconds for cleanup...
timeout /t 5 /nobreak >nul

echo 🚀 RESTARTING TORI SYSTEM...
start "TORI Backend" cmd /k "python start_unified_tori.py"

echo.
echo ✅ RESTART COMPLETE!
echo.
echo 📱 Now open browser to: http://localhost:5173
echo 🎯 Try uploading your PDF again
echo.

:end
echo.
echo 🏁 Script complete! 
echo.
echo If upload still hangs:
echo 1. Check browser Network tab (F12)
echo 2. Look for failed requests
echo 3. Try smaller PDF first
echo.
pause
