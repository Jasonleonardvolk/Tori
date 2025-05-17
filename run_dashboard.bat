@echo off
echo ELFIN Safety Lens Dashboard
echo --------------------------
echo.

REM Parse command line arguments
set ARGS=

:parse_args
if "%~1"=="" goto end_parse_args
set ARGS=%ARGS% %1
shift
goto parse_args
:end_parse_args

REM Run with the default quadrotor demo if no arguments provided
if "%ARGS%"=="" (
    echo Starting with default quadrotor demo...
    echo.
    python run_dashboard.py --demo-system quadrotor --pregenerate-isosurfaces
) else (
    echo Starting with custom arguments: %ARGS%
    echo.
    python run_dashboard.py %ARGS%
)

echo.
echo Dashboard shutdown complete.
