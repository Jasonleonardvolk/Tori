@echo off
REM start_alan.bat - Windows batch file to run ALAN system

if "%1"=="" (
    echo ALAN Pure Emergent Cognition System
    echo ===================================
    echo.
    echo Commands:
    echo   start_alan.bat init          Initialize ALAN system
    echo   start_alan.bat ingest PATH   Ingest PDF file or directory
    echo   start_alan.bat stats         Display system statistics
    echo   start_alan.bat explore       Explore ingested knowledge
    echo   start_alan.bat reset         Reset the system (caution!)
    echo.
    echo For more options, run: python start_alan.py --help
    exit /b
)

python start_alan.py %*
