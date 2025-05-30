@echo off
REM Backup critical files before context enhancement implementation
echo Creating backup of critical files before context enhancement...
set BACKUP_DIR=backup_context_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%
mkdir %BACKUP_DIR% 2>nul

echo Backing up pipeline files...
copy ingest_pdf\pipeline.py %BACKUP_DIR%\pipeline_backup.py
copy ingest_pdf\extract_blocks.py %BACKUP_DIR%\extract_blocks_backup.py
copy ingest_pdf\extractConceptsFromDocument.py %BACKUP_DIR%\extractConceptsFromDocument_backup.py

echo.
echo ✅ Backup created in %BACKUP_DIR%
echo.
echo Files backed up:
echo - pipeline.py
echo - extract_blocks.py  
echo - extractConceptsFromDocument.py
echo.
echo To restore if needed:
echo copy %BACKUP_DIR%\pipeline_backup.py ingest_pdf\pipeline.py
echo copy %BACKUP_DIR%\extract_blocks_backup.py ingest_pdf\extract_blocks.py
echo copy %BACKUP_DIR%\extractConceptsFromDocument_backup.py ingest_pdf\extractConceptsFromDocument.py
echo.
pause
