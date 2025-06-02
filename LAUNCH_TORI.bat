@echo off
title TORI Chat Launcher
color 0A

echo.
echo  ████████╗ ██████╗ ██████╗ ██╗     ██████╗██╗  ██╗ █████╗ ████████╗
echo  ╚══██╔══╝██╔═══██╗██╔══██╗██║    ██╔════╝██║  ██║██╔══██╗╚══██╔══╝
echo     ██║   ██║   ██║██████╔╝██║    ██║     ███████║███████║   ██║   
echo     ██║   ██║   ██║██╔══██╗██║    ██║     ██╔══██║██╔══██║   ██║   
echo     ██║   ╚██████╔╝██║  ██║██║    ╚██████╗██║  ██║██║  ██║   ██║   
echo     ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
echo.
echo                    Soliton Memory System Active
echo.
echo =====================================================================
echo.

:: Change to the project directory
cd /d "C:\Users\jason\Desktop\tori\kha"

:: Check if the deployment script exists
if not exist "deploy-tori-chat-with-mcp.bat" (
    echo ERROR: Cannot find deploy-tori-chat-with-mcp.bat
    echo Please ensure you're in the correct directory.
    echo.
    pause
    exit /b 1
)

:: Run the deployment script
echo Starting TORI Chat deployment...
echo.

:: Call the script (not run directly)
call deploy-tori-chat-with-mcp.bat

:: If the script exits, pause to see any error messages
echo.
echo =====================================================================
echo.
pause
