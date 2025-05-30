@echo off
REM Backup current pipeline before testing
echo Creating backup of pipeline.py...
set BACKUP_DIR=backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%
mkdir %BACKUP_DIR% 2>nul

copy ingest_pdf\pipeline.py %BACKUP_DIR%\pipeline_backup.py
copy ingest_pdf\extractConceptsFromDocument.py %BACKUP_DIR%\extractConceptsFromDocument_backup.py
copy main.py %BACKUP_DIR%\main_backup.py

echo.
echo ✅ Backup created in %BACKUP_DIR%
echo.
echo To restore if needed:
echo copy %BACKUP_DIR%\pipeline_backup.py ingest_pdf\pipeline.py
echo.
pause
