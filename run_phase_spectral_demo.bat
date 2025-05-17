@echo off
echo Running Phase-Koopman Coupled System Demo
echo This demonstrates the integration between the phase synchronization engine and Koopman spectral analysis pipeline.

:: Create outputs directory if it doesn't exist
if not exist "outputs" mkdir outputs

:: Run the demo
python alan_backend/elfin/examples/phase_spectral_demo.py

:: Open the result directory if successful
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Demo completed successfully! Opening results folder...
    start "" "outputs"
) else (
    echo.
    echo Demo encountered an error. Please check the console output for details.
)

:: Keep the window open
echo.
echo Press any key to exit...
pause > nul
