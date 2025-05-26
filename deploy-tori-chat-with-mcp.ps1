# TORI Chat Build and Deploy Script with MCP Key Configuration
# PowerShell version with enhanced error handling

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "    TORI Chat Build and Deploy Script" -ForegroundColor Cyan
Write-Host "    With MCP Key Configuration" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Set error action preference
$ErrorActionPreference = "Stop"

try {
    # Change to the frontend directory
    $frontendDir = "C:\Users\jason\Desktop\tori\kha\tori_chat_frontend"
    Write-Host "Changing to frontend directory: $frontendDir" -ForegroundColor Yellow
    Set-Location $frontendDir
    Write-Host "✓ Changed to: $(Get-Location)" -ForegroundColor Green
    Write-Host ""

    # Step 1: Check MCP key configuration
    Write-Host "[1/7] Checking MCP key configuration..." -ForegroundColor Yellow
    $envContent = Get-Content ".env.production" -Raw -ErrorAction SilentlyContinue
    if ($envContent -match "VITE_MCP_KEY=ed8c312bbb55b6e1fd9c81b44e0019ea") {
        Write-Host "✓ MCP key configured correctly" -ForegroundColor Green
    } else {
        throw "MCP key not found in .env.production. Please ensure VITE_MCP_KEY=ed8c312bbb55b6e1fd9c81b44e0019ea is present."
    }
    Write-Host ""

    # Step 2: Fix React dependency conflicts
    Write-Host "[2/7] Fixing React 18 dependency conflicts..." -ForegroundColor Yellow
    $reactDiffInstalled = npm ls react-diff-viewer 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Removing incompatible react-diff-viewer..." -ForegroundColor Yellow
        npm uninstall react-diff-viewer
        if ($LASTEXITCODE -ne 0) { throw "Failed to uninstall react-diff-viewer" }
        
        Write-Host "Installing React 18 compatible version..." -ForegroundColor Yellow
        npm install react-diff-viewer-continued@4.0.0 --save-exact
        if ($LASTEXITCODE -ne 0) { throw "Failed to install react-diff-viewer-continued" }
        Write-Host "✓ React dependency conflicts resolved" -ForegroundColor Green
    } else {
        Write-Host "✓ No React dependency conflicts found" -ForegroundColor Green
    }
    Write-Host ""

    # Step 3: Clean install dependencies
    Write-Host "[3/7] Installing dependencies..." -ForegroundColor Yellow
    npm ci --omit dev
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Initial install failed, trying clean reinstall..." -ForegroundColor Yellow
        if (Test-Path "node_modules") { Remove-Item "node_modules" -Recurse -Force }
        if (Test-Path "package-lock.json") { Remove-Item "package-lock.json" -Force }
        npm ci --omit dev
        if ($LASTEXITCODE -ne 0) { throw "Clean reinstall also failed" }
    }
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
    Write-Host ""

    # Step 4: Build the application
    Write-Host "[4/7] Building the application..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    Write-Host "✓ Build completed successfully" -ForegroundColor Green
    Write-Host ""

    # Step 5: Verify the build
    Write-Host "[5/7] Verifying build output..." -ForegroundColor Yellow
    if (-not (Test-Path "dist\index.html")) {
        throw "Build output not found - dist\index.html missing"
    }

    # Check if it's a proper React build
    $indexContent = Get-Content "dist\index.html" -Raw
    if ($indexContent -notmatch "ReactDOM") {
        Write-Host "WARNING: Build may be a redirect page, checking file size..." -ForegroundColor Red
        $fileSize = (Get-Item "dist\index.html").Length
        if ($fileSize -lt 1000) {
            throw "dist\index.html is too small ($fileSize bytes) - likely a redirect page"
        }
    }
    Write-Host "✓ Build verification passed" -ForegroundColor Green
    Write-Host ""

    # Step 6: Check port availability
    Write-Host "[6/7] Checking port availability..." -ForegroundColor Yellow
    $port3000InUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    $usePort = 3000
    
    if ($port3000InUse) {
        Write-Host "WARNING: Port 3000 is in use" -ForegroundColor Red
        $processes = Get-Process -Id $port3000InUse.OwningProcess -ErrorAction SilentlyContinue
        foreach ($proc in $processes) {
            Write-Host "Process using port 3000: $($proc.Name) (PID: $($proc.Id))" -ForegroundColor Yellow
        }
        
        $kill = Read-Host "Kill the process using port 3000? (y/N)"
        if ($kill -eq "y" -or $kill -eq "Y") {
            foreach ($proc in $processes) {
                Write-Host "Killing process $($proc.Name) (PID: $($proc.Id))..." -ForegroundColor Yellow
                Stop-Process -Id $proc.Id -Force
            }
        } else {
            Write-Host "Using alternative port 3001..." -ForegroundColor Yellow
            $usePort = 3001
        }
    } else {
        Write-Host "✓ Port 3000 is available" -ForegroundColor Green
    }
    Write-Host ""

    # Step 7: Start the production server
    Write-Host "[7/7] Starting production server..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  TORI Chat is starting..." -ForegroundColor Cyan
    Write-Host "  " -ForegroundColor Cyan
    Write-Host "  Access the application at:" -ForegroundColor Cyan
    Write-Host "  http://localhost:$usePort" -ForegroundColor White -BackgroundColor Blue
    Write-Host "  " -ForegroundColor Cyan
    Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""

    # Set the port environment variable and start the server
    $env:PORT = $usePort
    node start-production.cjs

} catch {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "For troubleshooting, check:" -ForegroundColor Yellow
    Write-Host "1. Node.js and npm are installed and updated" -ForegroundColor Yellow
    Write-Host "2. The tori_chat_frontend directory exists" -ForegroundColor Yellow
    Write-Host "3. Internet connection for npm downloads" -ForegroundColor Yellow
    Write-Host "4. Available disk space for node_modules" -ForegroundColor Yellow
    Write-Host ""
    
    Read-Host "Press Enter to exit"
    exit 1
}