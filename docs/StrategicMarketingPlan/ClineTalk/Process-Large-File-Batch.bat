@echo off
setlocal enabledelayedexpansion

echo Processing large JSON file using batch file method...
echo This might take a moment for a 4MB file.

set "SOURCE_FILE=C:\Users\jason\Desktop\tori\kha\docs\StrategicMarketingPlan\ClineTalk\1747599198541\api_conversation_history.json"
set "OUTPUT_FILE=C:\Users\jason\Desktop\tori\kha\docs\StrategicMarketingPlan\ClineTalk\1747599198541_Extracted_Batch.txt"

echo # Extracted Content from Large JSON File > "%OUTPUT_FILE%"
echo # Source: %SOURCE_FILE% >> "%OUTPUT_FILE%"
echo # Size: 4MB >> "%OUTPUT_FILE%"
echo # Processed: %date% %time% >> "%OUTPUT_FILE%"
echo # >> "%OUTPUT_FILE%"
echo # This file contains the raw content extracted using a batch file method >> "%OUTPUT_FILE%"
echo # >> "%OUTPUT_FILE%"
echo # ============================================================ >> "%OUTPUT_FILE%"
echo. >> "%OUTPUT_FILE%"

echo Extracting content with type command...
type "%SOURCE_FILE%" >> "%OUTPUT_FILE%"

echo.
echo Extraction complete! File saved to: %OUTPUT_FILE%
echo.
pause
