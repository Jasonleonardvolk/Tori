@echo off
title ALAN IDE Restore Client
color 0E

echo =============================================
echo    ALAN IDE Restore Client
echo =============================================
echo.

echo Restoring original files...

if exist "client\src\index.js.backup" (
  copy "client\src\index.js.backup" "client\src\index.js" /Y
  echo Restored original index.js
) else (
  echo No backup file found for index.js
)

echo.
echo Files restored to original state.
echo.
pause
