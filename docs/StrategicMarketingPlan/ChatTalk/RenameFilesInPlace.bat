@echo off
setlocal enabledelayedexpansion

echo Sorting files chronologically and renaming them in place...

set "SOURCE_FOLDER=%~dp0"
set "OUTPUT_FILE=%SOURCE_FOLDER%\SortedFilesList.txt"

REM Delete the output file if it exists
if exist "%OUTPUT_FILE%" del "%OUTPUT_FILE%"

REM Create a temporary file to store file information
set "TEMP_FILE=%TEMP%\file_info.txt"
if exist "%TEMP_FILE%" del "%TEMP_FILE%"

REM Get file information with creation dates
for %%F in ("%SOURCE_FOLDER%\*.json") do (
    for /f "tokens=1-6 delims=: " %%A in ('dir /TC "%%F" ^| findstr /i "%%~nxF"') do (
        echo %%A %%B %%C %%D %%E %%F "%%~nxF" >> "%TEMP_FILE%"
    )
)

REM Sort the files by creation date
sort "%TEMP_FILE%" /O "%TEMP_FILE%"

REM Create a list of sorted files and rename them
set "counter=1"
echo Files in chronological order: > "%OUTPUT_FILE%"

for /f "tokens=1-7 delims= " %%A in ('type "%TEMP_FILE%"') do (
    set "fileName=%%G"
    set "fileName=!fileName:"=!"
    
    REM Format counter with leading zeros
    set "paddedCounter=00!counter!"
    set "paddedCounter=!paddedCounter:~-3!"
    
    echo !paddedCounter!. !fileName! >> "%OUTPUT_FILE%"
    
    REM Rename the file with a numbered prefix if it doesn't already have one
    if "!fileName:~0,1!" NEQ "[" (
        if not exist "%SOURCE_FOLDER%\!paddedCounter! - !fileName!" (
            echo Renaming: !fileName! to !paddedCounter! - !fileName!
            ren "%SOURCE_FOLDER%\!fileName!" "!paddedCounter! - !fileName!"
        )
    )
    
    set /a "counter+=1"
)

del "%TEMP_FILE%"

echo Files have been sorted and renamed with numbered prefixes.
echo A list of the files in chronological order has been saved to:
echo %OUTPUT_FILE%
echo.
pause