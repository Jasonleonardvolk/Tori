# TORI Production Environment Startup Script
# Run with: .\start-tori-production.ps1 [-All]

param(
    [switch]$All = $false
)

Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          TORI PRODUCTION ENVIRONMENT STARTUP          ║" -ForegroundColor Cyan
Write-Host "║                   48-Hour Sprint Mode                 ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path

function Start-Service {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command,
        [int]$Port
    )
    
    Write-Host "Starting $Name on port $Port..." -ForegroundColor Yellow
    
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "cmd.exe"
    $processInfo.Arguments = "/c cd /d `"$Path`" && $Command"
    $processInfo.UseShellExecute = $true
    $processInfo.WindowStyle = "Normal"
    $processInfo.CreateNoWindow = $false
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    [void]$process.Start()
    
    Start-Sleep -Seconds 2
    
    # Check if port is listening
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "✓ $Name is running on port $Port" -ForegroundColor Green
    } else {
        Write-Host "⚠ $Name may not have started correctly on port $Port" -ForegroundColor Yellow
    }
}

if ($All) {
    Write-Host "Starting ALL TORI Services...`n" -ForegroundColor Cyan
    
    # Start PDF Upload Server
    Start-Service -Name "PDF Upload Server" `
                  -Path $rootPath `
                  -Command "python pdf_upload_server.py" `
                  -Port 5000
    
    # Start ALAN Backend
    Start-Service -Name "ALAN Backend" `
                  -Path "$rootPath\alan_backend\server" `
                  -Command "python simulation_api.py" `
                  -Port 8000
}

# Always start Chat Frontend
Write-Host "`nStarting TORI Chat Frontend..." -ForegroundColor Yellow
Set-Location "$rootPath\tori_chat_frontend"

# Check for dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    & yarn install
}

# Check for build
if (-not (Test-Path "dist")) {
    Write-Host "Building frontend..." -ForegroundColor Yellow
    & yarn build
}

# Start the chat server
Write-Host "Starting chat server on port 3000..." -ForegroundColor Green
& yarn start
