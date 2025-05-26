@echo off
echo ==========================================
echo    TORI Chat Quick Manual Deploy
echo ==========================================

cd /d "C:\Users\jason\Desktop\tori\kha\tori_chat_frontend"

echo [Step 1] Skipping React dependency check...
echo.

echo [Step 2] Installing dependencies...
npm ci --omit dev
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo [Step 3] Building application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo [Step 4] Starting server...
echo.
echo ==========================================
echo  TORI Chat Starting at:
echo  http://localhost:3000
echo ==========================================
echo.

node start-production.cjs

pause