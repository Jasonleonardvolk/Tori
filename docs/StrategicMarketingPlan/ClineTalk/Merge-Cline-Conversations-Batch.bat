@echo off
setlocal enabledelayedexpansion

echo Creating 10 chronological files with complete content from all api_conversation_history files...
echo This might take some time for large files.

set "SOURCE_FOLDER=%~dp0"
set "OUTPUT_PREFIX=%SOURCE_FOLDER%\Merged_Cline_Conversations_Batch_Part"

REM Create a temporary file to store folder information
set "TEMP_FILE=%TEMP%\folder_info.txt"
if exist "%TEMP_FILE%" del "%TEMP_FILE%"

REM Get all folders and sort them chronologically (folder names are timestamps)
echo Finding and sorting all folders...
for /d %%F in ("%SOURCE_FOLDER%\*") do (
    echo %%~nxF >> "%TEMP_FILE%"
)

REM Sort the folders numerically
sort /N "%TEMP_FILE%" /O "%TEMP_FILE%"

REM Count total folders
set "total_folders=0"
for /f %%A in ('type "%TEMP_FILE%" ^| find /c /v ""') do set "total_folders=%%A"

echo Found %total_folders% folders to process.

REM Calculate folders per output (ceiling division)
set /a "folders_per_output=(%total_folders%+9)/10"
echo Each output file will contain approximately %folders_per_output% folders.

REM Process each output file
for /l %%i in (1, 1, 10) do (
    set "output_file=%OUTPUT_PREFIX%%%i.txt"
    echo Creating !output_file!...
    
    REM Clear output file if it exists
    if exist "!output_file!" del "!output_file!"
    
    REM Create header for this file
    echo # Merged Cline Conversations - Part %%i of 10 > "!output_file!"
    echo # Created: %date% %time% >> "!output_file!"
    echo # Files included in this part: >> "!output_file!"
    
    REM Calculate range for this batch
    set /a "start_index=(%%i-1)*%folders_per_output%+1"
    set /a "end_index=%%i*%folders_per_output%"
    if !end_index! GTR %total_folders% set "end_index=%total_folders%"
    
    REM Process each folder in this range
    set "current_index=0"
    for /f "usebackq delims=" %%F in ("%TEMP_FILE%") do (
        set /a "current_index+=1"
        
        if !current_index! GEQ !start_index! (
            if !current_index! LEQ !end_index! (
                set "folder_name=%%F"
                
                echo   !current_index!. !folder_name! >> "!output_file!"
                
                echo Processing folder !current_index! of %total_folders%: !folder_name!
                
                REM Add separator and folder information
                echo. >> "!output_file!"
                echo ============================================================== >> "!output_file!"
                echo FOLDER: !folder_name! >> "!output_file!"
                echo ============================================================== >> "!output_file!"
                echo. >> "!output_file!"
                
                REM Check if the api_conversation_history.json file exists
                if exist "%SOURCE_FOLDER%\!folder_name!\api_conversation_history.json" (
                    REM Append the entire content of the file
                    type "%SOURCE_FOLDER%\!folder_name!\api_conversation_history.json" >> "!output_file!"
                ) else (
                    echo WARNING: No api_conversation_history.json found in this folder >> "!output_file!"
                )
                
                REM Add a separator after each folder
                echo. >> "!output_file!"
                echo. >> "!output_file!"
                echo *************************************************************** >> "!output_file!"
                echo. >> "!output_file!"
            )
        )
    )
    
    echo Completed output file %%i of 10.
)

del "%TEMP_FILE%"

echo.
echo All 10 files have been created successfully!
echo The files are named Merged_Cline_Conversations_Batch_Part1.txt through Merged_Cline_Conversations_Batch_Part10.txt
echo.
pause