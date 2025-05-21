@echo off
echo Processing large JSON file separately...
echo This script will carefully extract the content of the 4MB file that was causing issues.
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0Process-Large-File.ps1"
