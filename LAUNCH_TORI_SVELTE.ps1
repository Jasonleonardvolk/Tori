# TORI SvelteKit Launcher
# PowerShell version with better error handling

Write-Host @"
==========================================
   TORI Chat System (SvelteKit)
   Full Cognitive Integration
==========================================
"@ -ForegroundColor Cyan

Set-Location "C:\Users\jason\Desktop\tori\kha"

Write-Host "`nSelect launch mode:" -ForegroundColor Yellow
Write-Host "1. Frontend only (SvelteKit on port 5173)" -ForegroundColor White
Write-Host "2. Full system (Frontend + Banksy Backend)" -ForegroundColor White
Write-Host "3. Full system + PDF Extraction Service" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`nStarting SvelteKit frontend only..." -ForegroundColor Green
        Set-Location "tori_ui_svelte"
        & npm run dev
    }
    "2" {
        Write-Host "`nStarting full TORI system..." -ForegroundColor Green
        & .\START_FULL_TORI_SYSTEM.bat
    }
    "3" {
        Write-Host "`nStarting full system with all services..." -ForegroundColor Green
        
        # Start frontend + backend in new window
        Start-Process cmd.exe -ArgumentList "/c", "START_FULL_TORI_SYSTEM.bat" -WorkingDirectory $PWD
        
        # Wait a bit for services to initialize
        Start-Sleep -Seconds 5
        
        # Start PDF extraction service
        Write-Host "Starting PDF extraction service..." -ForegroundColor Yellow
        & python run_stable_server.py
    }
    default {
        Write-Host "Invalid choice. Please run again and select 1-3." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}
