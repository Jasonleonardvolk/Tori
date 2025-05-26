@echo off
echo ╔═══════════════════════════════════════╗
echo ║ TORI Emergency Dependency Fix         ║
echo ║ Installing Missing Packages           ║
echo ╚═══════════════════════════════════════╝

echo.
echo [1/3] Clearing old dependencies...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo [2/3] Installing all dependencies fresh...
npm install

echo.
echo [3/3] Verifying express-session installation...
npm list express-session

echo.
echo ╔═══════════════════════════════════════╗
echo ║ TORI Dependencies Fixed!              ║
echo ║ Ready to start production             ║
echo ╚═══════════════════════════════════════╝
pause
