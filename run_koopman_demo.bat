@echo off
REM =======================================================
REM Koopman Bridge Demo Runner
REM =======================================================

if "%1"=="" (
    echo Koopman Bridge Demo
    echo Usage: run_koopman_demo.bat [system] [options]
    echo.
    echo Systems:
    echo   pendulum   - Damped pendulum system
    echo   vdp        - Van der Pol oscillator
    echo   both       - Run both demos
    echo.
    echo Options:
    echo   --dict TYPE   - Dictionary type (rbf, fourier, poly)
    echo   --modes N     - Number of modes (dictionary size)
    echo   --no-plot     - Disable plotting
    echo.
    echo Examples:
    echo   run_koopman_demo.bat pendulum
    echo   run_koopman_demo.bat vdp --dict fourier --modes 50
    goto :end
)

echo Running Koopman demo: %*

REM Properly format arguments for Python module
set ARGS=
if not "%1"=="" set ARGS=--system %1
:parse_args
shift
if "%1"=="" goto run_demo
set ARGS=%ARGS% %1
goto parse_args

:run_demo
echo python -m alan_backend.elfin.examples.koopman_bridge_demo %ARGS%
python -m alan_backend.elfin.examples.koopman_bridge_demo %ARGS%

:end
