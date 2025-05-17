@echo off
echo ALAN IDE - Enhanced Lyapunov Predictability Analysis (RECURSIVE)
echo ==========================================================
echo.
echo This script processes all PDF files from the USB Drive folder and its SUBDIRECTORIES,
echo applying the Rosenstein algorithm-based Lyapunov exponent estimation
echo to measure concept predictability across documents.
echo.
echo Key features:
echo   - RECURSIVE DIRECTORY TRAVERSAL (processes all nested folders)
echo   - Parallel processing (8 documents at a time)
echo   - Smart NPZ sharding (max 100MB per file)
echo   - Duplicate detection via SHA-256 hashing
echo   - Detailed logging and error handling
echo   - Summary statistics and visualization output
echo.
echo WARNING: This will attempt to process up to 47,177 files (22GB)
echo          Consider limiting the number of files for testing
echo.
echo Options:
echo   1. Process ALL files (may take several hours)
echo   2. Process limited sample (100 files for testing)
echo.
set /p choice="Enter option (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Processing ALL files in data/USB Drive and subdirectories...
    echo This may take a long time depending on your system.
    echo.
    set max_files=
) else (
    echo.
    echo Processing 10000 files for testing...
    echo.
    set max_files=--max_files 10000
)

echo Press any key to start processing, or Ctrl+C to cancel...
pause > nul

echo.
echo Starting recursive batch processing...
echo.

if not exist "output\processed_pdfs_recursive" mkdir "output\processed_pdfs_recursive"

python batch_process_pdfs_recursive.py --input_dir "data/USB Drive" --output_dir "output/processed_pdfs_recursive" ^
  --parallelism 8 --max_file_size 104857600 --verbose ^
  --len_trajectory 10 --min_separation 0 --k_neighbors 3 --fallback_value 0.5 ^
  %max_files%

echo.
echo Processing complete! Results are available in:
echo   - output\processed_pdfs_recursive\predictability_results.json (for visualization)
echo   - output\processed_pdfs_recursive\last_run_summary.json (for statistics)
echo   - output\processed_pdfs_recursive\batch_processing.log (for detailed logs)
echo.
echo Press any key to exit...
pause > nul
