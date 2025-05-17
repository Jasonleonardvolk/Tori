@echo off
:: ELFIN CI Test Runner for Windows
:: This batch file runs the CI tests locally

echo ELFIN CI Test Runner
echo ==================
echo.

:: Check if Python is available
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found in PATH
    echo Please install Python 3.9 or higher and try again
    exit /b 1
)

:: Parse command line arguments
set RUN_ALL=
set RUN_KOOPMAN=
set RUN_NEURAL=
set RUN_MILP=
set RUN_DASHBOARD=

:parse_args
if "%~1"=="" goto run_tests
if /i "%~1"=="--all" set RUN_ALL=1
if /i "%~1"=="--koopman" set RUN_KOOPMAN=1
if /i "%~1"=="--neural" set RUN_NEURAL=1
if /i "%~1"=="--milp" set RUN_MILP=1
if /i "%~1"=="--dashboard" set RUN_DASHBOARD=1
if /i "%~1"=="--help" goto show_help
shift
goto parse_args

:show_help
echo Usage: run-ci-tests.bat [--all] [--koopman] [--neural] [--milp] [--dashboard]
echo.
echo Options:
echo   --all          Run all tests
echo   --koopman      Run Koopman tests
echo   --neural       Run Neural Lyapunov tests
echo   --milp         Run MILP solver tests
echo   --dashboard    Run dashboard widget tests
echo   --help         Show this help message
exit /b 0

:run_tests
:: If no specific tests are requested, run all tests
if not defined RUN_KOOPMAN if not defined RUN_NEURAL if not defined RUN_MILP if not defined RUN_DASHBOARD set RUN_ALL=1

:: Build command line
set "COMMAND=python run-ci-tests.py"
if defined RUN_ALL set "COMMAND=%COMMAND% --all"
if defined RUN_KOOPMAN set "COMMAND=%COMMAND% --koopman"
if defined RUN_NEURAL set "COMMAND=%COMMAND% --neural"
if defined RUN_MILP set "COMMAND=%COMMAND% --milp"
if defined RUN_DASHBOARD set "COMMAND=%COMMAND% --dashboard"

:: Run the tests
echo Running: %COMMAND%
echo.
%COMMAND%

:: Show completion message
if %ERRORLEVEL% EQU 0 (
    echo.
    echo All tests passed!
) else (
    echo.
    echo Some tests failed. See output above for details.
)

exit /b %ERRORLEVEL%
