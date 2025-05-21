@echo off
echo Splitting files for CLINE in VS Code...
echo.
echo Option 1: Split into 2 files
echo Option 2: Split into exactly 3 files (2MB max each)
echo.
choice /C 12 /M "Choose an option"

if errorlevel 2 goto three_files
if errorlevel 1 goto two_files

:two_files
powershell -ExecutionPolicy Bypass -File "%~dp0split_for_cline.ps1"
goto end

:three_files
powershell -ExecutionPolicy Bypass -File "%~dp0split_into_3files.ps1"
goto end

:end
echo.
echo Done! Files are created in docs\conversations\cline_split
pause
