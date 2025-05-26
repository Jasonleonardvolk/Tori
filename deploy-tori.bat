@echo off
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    TORI Chat Deployment                     ║
echo ║                  Quick Start Launcher                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Select deployment option:
echo.
echo [1] Quick Deploy (Automated - Recommended)
echo [2] Check System Readiness First
echo [3] Setup MCP Key Only
echo [4] View Complete Guide
echo [5] Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto quick_deploy
if "%choice%"=="2" goto check_readiness  
if "%choice%"=="3" goto setup_mcp
if "%choice%"=="4" goto view_guide
if "%choice%"=="5" goto exit
goto invalid_choice

:quick_deploy
echo.
echo 🚀 Starting Quick Deployment...
echo.
call deploy-tori-chat-with-mcp.bat
goto end

:check_readiness
echo.
echo 🔍 Checking system readiness...
echo.
node pre-deployment-check.js
if %errorlevel% equ 0 (
    echo.
    set /p deploy="System ready! Deploy now? (y/N): "
    if /i "!deploy!"=="y" call deploy-tori-chat-with-mcp.bat
) else (
    echo.
    echo ❌ Please fix the issues above before deploying.
    set /p setup="Run MCP key setup to fix configuration? (y/N): "
    if /i "!setup!"=="y" node setup-mcp-key.js
)
goto end

:setup_mcp
echo.
echo 🔧 Setting up MCP key configuration...
echo.
node setup-mcp-key.js
echo.
set /p deploy="Setup complete! Deploy now? (y/N): "
if /i "!deploy!"=="y" call deploy-tori-chat-with-mcp.bat
goto end

:view_guide
echo.
echo 📖 Opening Complete Deployment Guide...
echo.
if exist "COMPLETE_DEPLOYMENT_GUIDE.md" (
    start "" "COMPLETE_DEPLOYMENT_GUIDE.md"
) else (
    echo Guide not found. Please check the repository.
)
goto end

:invalid_choice
echo.
echo ❌ Invalid choice. Please select 1-5.
timeout /t 2 >nul
goto start

:exit
echo.
echo 👋 Goodbye!
goto end

:end
echo.
pause