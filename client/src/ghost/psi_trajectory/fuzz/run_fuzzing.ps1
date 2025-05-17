#!/usr/bin/env pwsh
# ψ-Trajectory Fuzzing Helper Script
# This script guides users through running the fuzzing tests interactively

# Define color functions for better readability
function Write-Cyan { param($Text) Write-Host $Text -ForegroundColor Cyan }
function Write-Green { param($Text) Write-Host $Text -ForegroundColor Green }
function Write-Yellow { param($Text) Write-Host $Text -ForegroundColor Yellow }
function Write-Red { param($Text) Write-Host $Text -ForegroundColor Red }

# Script banner
Clear-Host
Write-Cyan @"
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   ψ-Trajectory Fuzzing Framework Assistant        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
"@

# Check if Rust and Cargo are installed
Write-Host "Checking if Rust and Cargo are installed..." -NoNewline
$rustInstalled = $false
try {
    $rustVersion = (rustc --version)
    $cargoVersion = (cargo --version)
    $rustInstalled = $true
    Write-Host " ✓" -ForegroundColor Green
    Write-Host "  Found: $rustVersion"
    Write-Host "  Found: $cargoVersion"
} catch {
    Write-Host " ✗" -ForegroundColor Red
    Write-Yellow @"
Rust and Cargo are not installed or not in PATH.
Please install Rust first using the instructions in INSTALLATION.md:
  1. Visit https://rustup.rs/
  2. Follow the installation instructions
  3. Restart your terminal and run this script again
"@
    exit 1
}

# Check if cargo-fuzz is installed
Write-Host "Checking if cargo-fuzz is installed..." -NoNewline
$fuzzInstalled = $false
try {
    $fuzzVersion = (cargo fuzz --version)
    $fuzzInstalled = $true
    Write-Host " ✓" -ForegroundColor Green
    Write-Host "  Found: $fuzzVersion"
} catch {
    Write-Host " ✗" -ForegroundColor Red
    Write-Yellow @"
cargo-fuzz is not installed. Would you like to install it now? (y/n)
"@
    $install = Read-Host
    if ($install -eq 'y') {
        Write-Green "Installing cargo-fuzz..."
        cargo install cargo-fuzz
        if ($LASTEXITCODE -eq 0) {
            $fuzzInstalled = $true
            Write-Green "cargo-fuzz installed successfully!"
        } else {
            Write-Red "Failed to install cargo-fuzz. Please check your internet connection and try again."
            exit 1
        }
    } else {
        Write-Yellow "Skipping installation. You can install it manually with: cargo install cargo-fuzz"
        exit 1
    }
}

# Main menu
function Show-Menu {
    Write-Cyan "`nFuzzing Operations:"
    Write-Host "  1. Run frame_decoder fuzzer (1 minute)"
    Write-Host "  2. Run crypto_layer fuzzer (1 minute)"
    Write-Host "  3. Run kernel_dispatcher fuzzer (1 minute)"
    Write-Host "  4. Run all fuzzers in sequence (1 minute each)"
    Write-Host "  5. Generate coverage reports for all targets"
    Write-Host "  6. Exit"
    Write-Host
    Write-Host "Enter your choice [1-6]: " -NoNewline
    return Read-Host
}

# Function to run a specific fuzzer
function Run-Fuzzer {
    param (
        [string]$Target,
        [int]$TimeSeconds = 60
    )
    
    Write-Green "`nRunning $Target fuzzer for $TimeSeconds seconds..."
    try {
        # Navigate to psi_trajectory directory
        Push-Location "client/src/ghost/psi_trajectory"
        
        # Create fuzzing target directory if it doesn't exist
        if (-not (Test-Path "fuzz/corpus/$Target")) {
            Write-Yellow "Corpus directory for $Target not found, creating it..."
            New-Item -Path "fuzz/corpus/$Target" -ItemType Directory -Force | Out-Null
        }
        
        # Run the fuzzer
        Write-Host "Executing: cargo fuzz run $Target -- -max_total_time=$TimeSeconds"
        cargo fuzz run $Target -- -max_total_time=$TimeSeconds
        
        if ($LASTEXITCODE -eq 0) {
            Write-Green "Fuzzing completed successfully!"
        } else {
            Write-Red "Fuzzing encountered an error. Exit code: $LASTEXITCODE"
        }
    } catch {
        Write-Red "Error running fuzzer: $_"
    } finally {
        # Return to original directory
        Pop-Location
    }
}

# Function to generate coverage reports
function Generate-Coverage {
    Write-Green "`nGenerating coverage reports..."
    try {
        # Make script executable on Unix systems
        if ($IsLinux -or $IsMacOS) {
            chmod +x ci/generate_fuzz_coverage.sh
        }
        
        # Run the coverage script
        if ($IsWindows) {
            # On Windows, we need to run it with bash if available
            if (Get-Command "bash" -ErrorAction SilentlyContinue) {
                bash -c "./ci/generate_fuzz_coverage.sh"
            } else {
                Write-Yellow "Bash not found. Please install Git Bash or WSL to run the coverage script on Windows."
                return
            }
        } else {
            # On Unix systems, run directly
            ./ci/generate_fuzz_coverage.sh
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Green "Coverage reports generated successfully!"
            Write-Yellow "You can view the reports by opening client/src/ghost/psi_trajectory/fuzz/coverage/index.html in a browser."
        } else {
            Write-Red "Error generating coverage reports. Exit code: $LASTEXITCODE"
        }
    } catch {
        Write-Red "Error generating coverage: $_"
    }
}

# Main loop
$running = $true
while ($running) {
    $choice = Show-Menu
    
    switch ($choice) {
        "1" { Run-Fuzzer -Target "frame_decoder" }
        "2" { Run-Fuzzer -Target "crypto_layer" }
        "3" { Run-Fuzzer -Target "kernel_dispatcher" }
        "4" { 
            Run-Fuzzer -Target "frame_decoder"
            Run-Fuzzer -Target "crypto_layer"
            Run-Fuzzer -Target "kernel_dispatcher"
        }
        "5" { Generate-Coverage }
        "6" { 
            Write-Cyan "`nThank you for using the ψ-Trajectory Fuzzing Framework!"
            $running = $false 
        }
        default { Write-Red "`nInvalid choice. Please enter a number between 1 and 6." }
    }
    
    if ($running) {
        Write-Host "`nPress Enter to continue..." -NoNewline
        Read-Host
        Clear-Host
        Write-Cyan "╔═══════════════════════════════════════════════════╗"
        Write-Cyan "║   ψ-Trajectory Fuzzing Framework Assistant        ║"
        Write-Cyan "╚═══════════════════════════════════════════════════╝"
    }
}
