@echo off
REM Master batch file to run ψ-Sync demonstrations from the project root
echo ψ-Sync Stability Monitoring System Demonstration
echo =============================================

cd %~dp0
python -c "import sys; print('Python version:', sys.version)"

echo.
echo Select demonstration to run:
echo 1. Basic ψ-Sync functionality
echo 2. Koopman eigenfunction integration
echo 3. ALAN bridge integration
echo 4. Run all demos
echo q. Quit

set /p choice="Enter your choice (1-4, or q): "

if "%choice%"=="1" (
    python alan_backend/banksy/run_psi_sync_tests.py basic
) else if "%choice%"=="2" (
    python alan_backend/banksy/run_psi_sync_tests.py koopman
) else if "%choice%"=="3" (
    python alan_backend/banksy/run_psi_sync_tests.py bridge
) else if "%choice%"=="4" (
    python alan_backend/banksy/run_psi_sync_tests.py all
) else if "%choice%"=="q" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice. Please enter 1-4 or q.
    pause
    exit /b 1
)

echo.
echo Demonstration completed.
pause
