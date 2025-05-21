@echo off
title ITORI IDE Development Dashboard
color 0B

:menu
cls
echo ======================================================================
echo                    ITORI IDE DEVELOPMENT DASHBOARD
echo ======================================================================
echo.
echo  Current time: %TIME%  Date: %DATE%
echo.
echo  [1] Start Development Server (HMR + Fast Refresh)
echo  [2] Build Production Version
echo  [3] Preview Production Build
echo  [4] TypeScript Type Check
echo  [5] Install/Update Dependencies
echo.
echo  [6] Open Standalone Chat (Dev Server with HMR)
echo  [7] Build Standalone Chat Bundle Only
echo.
echo  [8] Environment Info
echo  [9] Exit
echo.
echo ======================================================================
echo.

set /p choice="Enter option number: "

if "%choice%"=="1" goto start_dev
if "%choice%"=="2" goto build_prod
if "%choice%"=="3" goto preview_prod
if "%choice%"=="4" goto type_check
if "%choice%"=="5" goto install_deps
if "%choice%"=="6" goto open_standalone
if "%choice%"=="7" goto build_standalone
if "%choice%"=="8" goto env_info
if "%choice%"=="9" goto exit
goto menu

:start_dev
cls
echo Starting development server...
call dev-start.bat
goto menu

:build_prod
cls
echo Building production version...
call build-prod.bat
echo.
echo Press any key to return to menu...
pause > nul
goto menu

:preview_prod
cls
echo Previewing production build...
npx vite preview
goto menu

:type_check
cls
echo Running TypeScript type check...
npx tsc --noEmit
echo.
echo Press any key to return to menu...
pause > nul
goto menu

:install_deps
cls
echo Installing dependencies...
npm install --legacy-peer-deps
echo.
echo Press any key to return to menu...
pause > nul
goto menu

:open_standalone
cls
echo Opening standalone chat in browser...
start http://localhost:5173/chat/standalone.html
echo.
echo Note: Development server must be running for this to work!
echo.
echo Press any key to return to menu...
pause > nul
goto menu

:build_standalone
cls
echo Building standalone chat bundle...
npx vite build --mode production --config vite.standalone.config.js
echo.
echo Press any key to return to menu...
pause > nul
goto menu

:env_info
cls
echo ======================================================================
echo                     ENVIRONMENT INFORMATION
echo ======================================================================
echo.
echo Node version:
node -v
echo.
echo NPM version:
npm -v
echo.
echo Vite version:
npx vite --version
echo.
echo TypeScript version:
npx tsc --version
echo.
echo Operating system:
ver
echo.
echo Current directory:
cd
echo.
echo Press any key to return to menu...
pause > nul
goto menu

:exit
cls
echo Thank you for using ITORI IDE Development Dashboard
echo Goodbye!
exit /b 0
