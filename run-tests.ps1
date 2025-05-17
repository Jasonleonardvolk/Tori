# PowerShell script to run ALAN IDE tests
Write-Host "ALAN IDE Test Runner - PowerShell Version" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Set location
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Create logs directory if it doesn't exist
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Generate timestamp for log file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "logs\test-run-$timestamp.log"

Write-Host "Phase 1: Running tests..." -ForegroundColor Yellow
Write-Host "Saving output to: $logFile" -ForegroundColor Gray
Write-Host ""

# Try to run Jest directly first
try {
    Write-Host "Attempting direct Jest execution..." -ForegroundColor Gray
    & npx jest --version
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Jest found! Running tests..." -ForegroundColor Green
        & npx jest --verbose --runInBand --forceExit | Tee-Object -FilePath $logFile
        $jestExitCode = $LASTEXITCODE
    } else {
        throw "Jest not found"
    }
} catch {
    Write-Host "Direct Jest failed. Trying npm run test..." -ForegroundColor Yellow
    & npm run test | Tee-Object -FilePath $logFile
    $jestExitCode = $LASTEXITCODE
}

Write-Host ""
Write-Host "--- TEST RESULTS ---" -ForegroundColor Cyan

if ($jestExitCode -eq 0) {
    Write-Host "SUCCESS: All tests passed!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Phase 2: Running coverage..." -ForegroundColor Yellow
    & npm run test:coverage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Coverage report generated successfully!" -ForegroundColor Green
        Write-Host "View at: coverage\lcov-report\index.html" -ForegroundColor Gray
    } else {
        Write-Host "Coverage generation failed" -ForegroundColor Red
    }
} else {
    Write-Host "FAILED: Tests did not pass" -ForegroundColor Red
    
    Write-Host ""
    Write-Host "Analyzing failures..." -ForegroundColor Yellow
    
    # Try to extract test summary from log
    if (Test-Path $logFile) {
        $logContent = Get-Content $logFile
        $summary = $logContent | Where-Object { $_ -match "Test Suites:" }
        if ($summary) {
            Write-Host ""
            Write-Host "Test Summary:" -ForegroundColor Gray
            Write-Host $summary
        }
        
        # Show failed tests
        $failedTests = $logContent | Where-Object { $_ -match "FAIL " }
        if ($failedTests) {
            Write-Host ""
            Write-Host "Failed Test Suites:" -ForegroundColor Gray
            $failedTests | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        }
    }
}

Write-Host ""
Write-Host "--- NEXT STEPS ---" -ForegroundColor Cyan
Write-Host "1. Review test output in: $logFile" -ForegroundColor Gray
Write-Host "2. Run specific test: npm test -- path/to/test.js" -ForegroundColor Gray
Write-Host "3. Debug mode: npm test -- --verbose --no-cache" -ForegroundColor Gray

Write-Host ""
Read-Host "Press Enter to exit"
