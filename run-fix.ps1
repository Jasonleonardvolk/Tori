Write-Host "🚀 ALAN IDE Test Infrastructure Fix" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Set location
Set-Location "C:\Users\jason\Desktop\tori\kha"

# Create logs directory if it doesn't exist
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs"
}

# Create timestamp for log
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "logs\fix-execution-$timestamp.log"

Write-Host "📝 Executing master-test-fix.js..." -ForegroundColor Yellow
Write-Host "Output will be saved to $logFile" -ForegroundColor Gray
Write-Host ""

# Execute the script
try {
    & node master-test-fix.js *>&1 | Tee-Object -FilePath $logFile
    
    Write-Host ""
    Write-Host "✅ Fix execution completed!" -ForegroundColor Green
    Write-Host "Full log available at: $logFile" -ForegroundColor Gray
    
    # Show quick summary
    Write-Host ""
    Write-Host "📊 Quick Summary:" -ForegroundColor Cyan
    Write-Host "- Jest configuration: Applied"
    Write-Host "- Test utilities: Enhanced"
    Write-Host "- Diagnostics: Executed"
    Write-Host "- Tests: Attempted"
    
} catch {
    Write-Host ""
    Write-Host "❌ Error during execution:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Check $logFile for details" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review the output above"
Write-Host "2. Run: node test-status-dashboard.js"
Write-Host "3. Check coverage report if tests passed"
Write-Host ""
Read-Host "Press Enter to exit"