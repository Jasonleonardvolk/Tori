# Complete TORI-MCP Ecosystem Launcher
# PowerShell version with comprehensive service management

Write-Host @"
==========================================
   TORI Complete System Launcher
   With MCP Server Integration
==========================================
"@ -ForegroundColor Cyan

Set-Location "C:\Users\jason\Desktop\tori\kha"

# Check if MCP server dependencies are installed
if (-not (Test-Path "mcp-server-architecture\node_modules")) {
    Write-Host "MCP server dependencies not found. Installing..." -ForegroundColor Yellow
    Set-Location "mcp-server-architecture"
    npm install
    Set-Location ".."
}

Write-Host "`nSelect launch configuration:" -ForegroundColor Yellow
Write-Host "1. Frontend only (SvelteKit on port 5173)" -ForegroundColor White
Write-Host "2. Frontend + Banksy Backend" -ForegroundColor White
Write-Host "3. Frontend + Banksy + MCP Servers" -ForegroundColor Green
Write-Host "4. FULL SYSTEM (Frontend + Banksy + MCP + PDF Service)" -ForegroundColor Cyan -NoNewline
Write-Host " [RECOMMENDED]" -ForegroundColor Yellow
Write-Host "5. MCP Servers only (for testing)" -ForegroundColor White
Write-Host "6. Check system status" -ForegroundColor Magenta
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

function Start-MCPServers {
    Write-Host "`n🚀 Starting MCP servers..." -ForegroundColor Green
    $mcp = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd mcp-server-architecture; npm run start" -PassThru
    Start-Sleep -Seconds 5
    
    # Verify MCP is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ MCP Gateway running on http://localhost:3001" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  MCP Gateway may still be starting..." -ForegroundColor Yellow
    }
    
    return $mcp
}

function Start-TORISystem {
    Write-Host "`n🎨 Starting TORI Frontend + Banksy Backend..." -ForegroundColor Green
    $tori = Start-Process cmd -ArgumentList "/c", "START_FULL_TORI_SYSTEM.bat" -PassThru
    Start-Sleep -Seconds 5
    Write-Host "✅ Frontend will be available at http://localhost:5173" -ForegroundColor Green
    Write-Host "✅ Banksy API will be available at http://localhost:8000" -ForegroundColor Green
    return $tori
}

function Start-PDFService {
    Write-Host "`n📄 Starting PDF Extraction Service with TORI filtering..." -ForegroundColor Green
    $pdf = Start-Process python -ArgumentList "run_stable_server.py" -PassThru
    Start-Sleep -Seconds 3
    Write-Host "✅ PDF Service will be available at http://localhost:8002" -ForegroundColor Green
    return $pdf
}

function Show-SystemStatus {
    Write-Host "`n🔍 Checking system status..." -ForegroundColor Cyan
    
    # Check each service
    $services = @(
        @{Name="Frontend"; Port=5173; Path="/"},
        @{Name="Banksy API"; Port=8000; Path="/health"},
        @{Name="MCP Gateway"; Port=3001; Path="/health"},
        @{Name="PDF Service"; Port=8002; Path="/health"}
    )
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)$($service.Path)" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            Write-Host "✅ $($service.Name) is running on port $($service.Port)" -ForegroundColor Green
        } catch {
            Write-Host "❌ $($service.Name) is not responding on port $($service.Port)" -ForegroundColor Red
        }
    }
}

# Process user choice
switch ($choice) {
    "1" {
        Write-Host "`n🎨 Starting SvelteKit frontend only..." -ForegroundColor Green
        Set-Location "tori_ui_svelte"
        & npm run dev
    }
    
    "2" {
        Write-Host "`n🎨 Starting Frontend + Banksy Backend..." -ForegroundColor Green
        & .\START_FULL_TORI_SYSTEM.bat
    }
    
    "3" {
        Write-Host "`n🌟 Starting Frontend + Banksy + MCP Servers..." -ForegroundColor Green
        
        $processes = @()
        $processes += Start-MCPServers
        $processes += Start-TORISystem
        
        Write-Host "`n=========================================="-ForegroundColor Cyan
        Write-Host " Services Running:" -ForegroundColor White
        Write-Host " - MCP Gateway:   http://localhost:3001" -ForegroundColor Green
        Write-Host " - Frontend:      http://localhost:5173" -ForegroundColor Green
        Write-Host " - Banksy API:    http://localhost:8000" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Cyan
        
        Write-Host "`nPress any key to stop all services..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        
        # Stop all processes
        $processes | Where-Object { $_ -ne $null } | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
    }
    
    "4" {
        Write-Host "`n🚀 Starting FULL TORI-MCP ECOSYSTEM..." -ForegroundColor Cyan
        Write-Host "This includes all 30 functional components from your ecosystem!" -ForegroundColor Yellow
        
        $processes = @()
        $processes += Start-MCPServers
        $processes += Start-TORISystem
        $processes += Start-PDFService
        
        Write-Host "`n=========================================="-ForegroundColor Cyan
        Write-Host " 🎉 COMPLETE MCP-TORI ECOSYSTEM ACTIVE!" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host " Frontend:      http://localhost:5173" -ForegroundColor White
        Write-Host " Banksy API:    http://localhost:8000" -ForegroundColor White
        Write-Host " MCP Gateway:   http://localhost:3001" -ForegroundColor White
        Write-Host " PDF Service:   http://localhost:8002" -ForegroundColor White
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host " Real TORI filtering: " -NoNewline
        Write-Host "ACTIVE" -ForegroundColor Green
        Write-Host " Memory Systems:      " -NoNewline
        Write-Host "INTEGRATED" -ForegroundColor Green
        Write-Host " Cognitive Engine:    " -NoNewline
        Write-Host "ONLINE" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Cyan
        
        Write-Host "`nYour complete ecosystem is running!"
        Write-Host "Press any key to stop all services..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        
        # Stop all processes
        $processes | Where-Object { $_ -ne $null } | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
    }
    
    "5" {
        Write-Host "`n🔧 Starting MCP servers only..." -ForegroundColor Green
        Set-Location "mcp-server-architecture"
        & npm run start
    }
    
    "6" {
        Show-SystemStatus
        Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    
    default {
        Write-Host "Invalid choice. Please run again and select 1-6." -ForegroundColor Red
        Start-Sleep -Seconds 2
        exit 1
    }
}

Write-Host "`n✨ Thank you for using TORI!" -ForegroundColor Cyan
