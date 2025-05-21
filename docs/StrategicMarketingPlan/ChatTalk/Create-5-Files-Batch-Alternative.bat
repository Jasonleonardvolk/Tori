@echo off
setlocal enabledelayedexpansion

echo Creating 5 chronological files with complete content from all conversation files...
echo This might take some time for large files.

set "SOURCE_FOLDER=%~dp0"
set "OUTPUT_PREFIX=%SOURCE_FOLDER%\Complete_Chronological_Content_Part"

REM Create a temporary file to store file information with creation dates
set "TEMP_FILE=%TEMP%\file_info.txt"
if exist "%TEMP_FILE%" del "%TEMP_FILE%"

REM Get all JSON files and their creation dates
echo Finding and sorting all JSON files...
for %%F in ("%SOURCE_FOLDER%\*.json") do (
    for /f "tokens=1-6 delims=: " %%A in ('dir /TC "%%F" ^| findstr /i "%%~nxF"') do (
        echo %%A %%B %%C %%D %%E %%F "%%~nxF" >> "%TEMP_FILE%"
    )
)

REM Sort the files by creation date
sort "%TEMP_FILE%" /O "%TEMP_FILE%"

REM Count total files
set "total_files=0"
for /f %%A in ('type "%TEMP_FILE%" ^| find /c /v ""') do set "total_files=%%A"

echo Found %total_files% files to process.

REM Calculate files per output (ceiling division)
set /a "files_per_output=(%total_files%+4)/5"
echo Each output file will contain approximately %files_per_output% original files.

REM Process each output file
for /l %%i in (1, 1, 5) do (
    set "output_file=%OUTPUT_PREFIX%%%i.txt"
    echo Creating !output_file!...
    
    REM Clear output file if it exists
    if exist "!output_file!" del "!output_file!"
    
    REM Create header for this file
    echo # Complete Chronological Content - Part %%i of 5 > "!output_file!"
    echo # Created: %date% %time% >> "!output_file!"
    echo # Files included in this part: >> "!output_file!"
    
    REM Calculate range for this batch
    set /a "start_index=(%%i-1)*%files_per_output%+1"
    set /a "end_index=%%i*%files_per_output%"
    if !end_index! GTR %total_files% set "end_index=%total_files%"
    
    REM Process each file in this range
    set "current_index=0"
    for /f "tokens=1-7 delims= " %%A in ('type "%TEMP_FILE%"') do (
        set /a "current_index+=1"
        
        if !current_index! GEQ !start_index! (
            if !current_index! LEQ !end_index! (
                set "file_name=%%G"
                set "file_name=!file_name:"=!"
                
                echo   !current_index!. !file_name! >> "!output_file!"
                
                echo Processing file !current_index! of %total_files%: !file_name!
                
                REM Add separator and file information
                echo. >> "!output_file!"
                echo ============================================================== >> "!output_file!"
                echo FILE: !file_name! >> "!output_file!"
                echo CREATED: %%A %%B %%C %%D %%E %%F >> "!output_file!"
                echo ============================================================== >> "!output_file!"
                echo. >> "!output_file!"
                
                REM Append the entire content of the file
                type "%SOURCE_FOLDER%\!file_name!" >> "!output_file!"
                
                REM Add a separator after each file
                echo. >> "!output_file!"
                echo. >> "!output_file!"
                echo *************************************************************** >> "!output_file!"
                echo. >> "!output_file!"
            )
        )
    )
    
    echo Completed output file %%i of 5.
)

del "%TEMP_FILE%"

echo.
echo All 5 files have been created successfully!
echo The files are named Complete_Chronological_Content_Part1.txt through Complete_Chronological_Content_Part5.txt
echo NOTE: This version creates TXT files instead of JSON to ensure all content is preserved.
echo.
pause