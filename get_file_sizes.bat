@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0get_file_sizes.ps1"
type "C:\Users\jason\Desktop\tori\kha\file_sizes.txt"
pause
