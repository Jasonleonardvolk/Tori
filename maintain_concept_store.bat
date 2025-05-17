@echo off
echo ALAN Concept Store Maintenance Utilities
echo ======================================
echo.
echo Available actions:
echo.
echo 1. Identify invalid concepts
echo 2. Fix invalid concepts and reset ingestion tracking
echo 3. Completely wipe concept store
echo 4. Reset ingestion tracking only
echo.

set /p action="Enter action number (1-4): "
echo.

if "%action%"=="1" (
  echo Identifying invalid concepts...
  python concept_store_maintenance.py --action identify
) else if "%action%"=="2" (
  echo Fixing invalid concepts and resetting ingestion tracking...
  python concept_store_maintenance.py --action fix
) else if "%action%"=="3" (
  echo WARNING: This will completely wipe the concept store!
  set /p confirm="Are you sure? (y/n): "
  if /i "%confirm%"=="y" (
    echo Wiping concept store...
    python concept_store_maintenance.py --action wipe
  ) else if /i "%confirm%"=="yes" (
    echo Wiping concept store...
    python concept_store_maintenance.py --action wipe
  ) else (
    echo Operation cancelled.
  )
) else if "%action%"=="4" (
  echo Resetting ingestion tracking to allow re-ingestion of documents...
  python concept_store_maintenance.py --action reset-tracking
) else (
  echo Invalid action number.
)

echo.
echo Maintenance operation completed.
pause
