@echo off
echo ALAN IDE Test Runner - Batch Version
echo ====================================
echo.

cd /d "%~dp0"

:: Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

:: Generate timestamp for log file
for /f "tokens=1-4 delims=/ " %%i in ("%date%") do (
    set yyyy=%%l
    set mm=%%j
    set dd=%%k
)
for /f "tokens=1-2 delims=: " %%i in ("%time%") do (
    set hh=%%i
    set min=%%j
)
set timestamp=%yyyy%%mm%%dd%_%hh%%min%
set logfile=logs\test-run-%timestamp%.log

echo Phase 1: Running tests...
echo Saving output to: %logfile%
echo.

:: Try npm run test
echo Attempting npm run test...
npm run test > %logfile% 2>&1

:: Check exit code
if %ERRORLEVEL% == 0 (
    echo SUCCESS: All tests passed!
    echo.
    echo Phase 2: Running coverage...
    npm run test:coverage
    
    if %ERRORLEVEL% == 0 (
        echo.
        echo Coverage report generated successfully!
        echo View at: coverage\lcov-report\index.html
    ) else (
        echo Coverage generation failed
    )
) else (
    echo FAILED: Tests did not pass
    echo.
    echo Here's a preview of the log:
    echo --- BEGIN LOG EXCERPT ---
    type %logfile% | more
    echo --- END LOG EXCERPT ---
    echo.
    echo Full log available at: %logfile%
)

echo.
echo --- NEXT STEPS ---
echo 1. Review test output in: %logfile%
echo 2. Run specific test: npm test -- path/to/test.js
echo 3. Debug mode: npm test -- --verbose --no-cache
echo.
pause
