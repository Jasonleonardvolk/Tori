@echo off
echo.
echo ================================================================
echo  🧪 MESH EXTRACTION COMPARISON TEST LAUNCHER
echo ================================================================
echo.
echo This will run scientific comparison tests between:
echo   • ScholarSphere (port 5731) - Legacy direct mesh writes
echo   • Prajna API (port 8001) - New lockdown proposal system
echo.
echo Test matrix: PDF and TXT files through both systems
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python and try again.
    pause
    exit /b 1
)

echo ✅ Python found
echo.

REM Check if we're in the right directory
if not exist "mesh_extraction_comparison_test.py" (
    echo ❌ Test script not found!
    echo    Make sure you're running this from the correct directory.
    echo    Expected: mesh_extraction_comparison_test.py
    pause
    exit /b 1
)

echo ✅ Test script found
echo.

REM Check if setup script exists and run it
if exist "setup_mesh_comparison_test.py" (
    echo 🛠️ Running interactive setup...
    echo.
    python setup_mesh_comparison_test.py
) else (
    echo 🧪 Running direct test...
    echo.
    python mesh_extraction_comparison_test.py
)

echo.
echo ✅ Test complete! Check the results and logs.
echo.
pause
