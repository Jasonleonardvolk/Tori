@echo off
echo Sorting files chronologically...
powershell -ExecutionPolicy Bypass -File "%~dp0SortFiles.ps1"
pause