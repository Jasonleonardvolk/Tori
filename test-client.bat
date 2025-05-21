@echo off
title ALAN IDE Test Client
color 0A

echo =============================================
echo    ALAN IDE Test Client
echo =============================================
echo.

echo Preparing temporary test files...
echo.

REM Backup original index.js
if not exist "ide_frontend\src\index.js.backup" (
  copy "ide_frontend\src\index.js" "ide_frontend\src\index.js.backup"
  echo Backed up original index.js
)

REM Copy test index.js
copy "ide_frontend\src\test-index.js" "ide_frontend\src\index.js" /Y
echo Applied test index.js

echo.
echo Starting simplified test client...
echo This will use a very simple React app to test API connectivity.
echo.
echo After testing, run restore-client.bat to restore original files.
echo.

cd ide_frontend
set NODE_OPTIONS=--openssl-legacy-provider
npx react-scripts start

cd ..
