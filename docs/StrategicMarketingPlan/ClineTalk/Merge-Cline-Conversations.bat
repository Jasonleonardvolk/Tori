@echo off
echo Creating 10 chronological files with complete content from all api_conversation_history files...
echo This script will create both JSON and TXT versions of the merged files.

powershell -ExecutionPolicy Bypass -File "%~dp0Merge-Cline-Conversations.ps1"

echo.
echo If the PowerShell script fails, try the batch file alternative.
pause