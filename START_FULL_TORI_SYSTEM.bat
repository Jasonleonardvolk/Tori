@echo off
echo 🚀 STARTING FULL TORI SYSTEM - Frontend + Banksy Backend
echo =========================================================
echo.
echo 🎯 This will start BOTH:
echo    1. SvelteKit Frontend (port 5173)
echo    2. Banksy Backend API (port 8000)
echo.
echo 📍 Once running, visit: http://localhost:5173
echo 🌀 Banksy API will be: http://localhost:8000
echo.

cd "C:\Users\jason\Desktop\tori\kha\tori_ui_svelte"

REM Check if concurrently is installed
if not exist "node_modules\concurrently" (
    echo 📦 Installing concurrently...
    npm install concurrently --save-dev
)

echo 🚀 Starting integrated development environment...
echo.
echo ⏰ BOTH SERVERS STARTING NOW...
echo.

npm run dev:full