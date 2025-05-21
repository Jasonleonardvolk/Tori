@echo off
echo Creating 10 chronological files with complete content from all api_conversation_history files...
echo This script will skip the problematic file (1747599198541) which should be processed separately.
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0Merge-Cline-Conversations-Skip-Problem.ps1"

echo.
echo To process the problematic file separately, run:
echo   Process-Large-File.bat   (PowerShell method)
echo   or
echo   Process-Large-File-Batch.bat   (Batch file method)
echo.
pause