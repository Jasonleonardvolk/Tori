@echo off
echo ALAN IDE - Enhanced Lyapunov Predictability Analysis
echo ==========================================================
echo.
echo This script processes all PDF files from the USB Drive folder,
echo applying the Rosenstein algorithm-based Lyapunov exponent estimation
echo to measure concept predictability across documents.
echo.
echo Key features:
echo   - Parallel processing (2 documents at a time)
echo   - Smart NPZ sharding (max 100MB per file)
echo   - Duplicate detection via SHA-256 hashing
echo   - Detailed logging and error handling
echo   - Summary statistics and visualization output
echo.
echo Press any key to start processing, or Ctrl+C to cancel...
pause > nul

echo.
echo Starting batch processing...
echo.

if not exist "output\processed_pdfs" mkdir "output\processed_pdfs"

python batch_process_pdfs.py --input_dir "data/USB Drive" --output_dir "output/processed_pdfs" --parallelism 2 --max_file_size 52428800 --verbose

echo.
echo Processing complete! Results are available in:
echo   - output\processed_pdfs\predictability_results.json (for visualization)
echo   - output\processed_pdfs\last_run_summary.json (for statistics)
echo   - output\processed_pdfs\batch_processing.log (for detailed logs)
echo.
echo Press any key to exit...
pause > nul
