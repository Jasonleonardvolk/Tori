@echo off
echo Running Cline Conversation Exporter...
echo.

:: Check if .cline directory exists
if not exist ".cline" (
  echo Error: .cline directory not found in current location.
  echo Please run this script from your project root or specify the correct path in export-cline.js.
  echo.
  goto :end
)

:: Run the exporter with Node.js (using CommonJS version for compatibility)
node export-cline-cjs.js %*

:: If you prefer to use the ES modules version instead:
:: node --experimental-modules export-cline.js %*

:: Check for success
if %errorlevel% equ 0 (
  echo.
  echo Export completed successfully! Look for Cline_Conversation_*.json in the current directory.
) else (
  echo.
  echo Error during export. Please check if Node.js is installed and .cline/tasks exists.
)

:end
echo.
echo Press any key to exit...
pause > nul
