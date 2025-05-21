@echo off
echo Creating 5 chronological files with complete content from all conversation files...
powershell -ExecutionPolicy Bypass -File "%~dp0Create-5-Chronological-Files.ps1"
echo.
echo If the PowerShell script fails due to JSON depth limitations, try the batch file alternative.
pause