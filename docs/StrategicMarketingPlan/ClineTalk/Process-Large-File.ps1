# PowerShell script to process the problematic large JSON file
# C:\Users\jason\Desktop\tori\kha\docs\StrategicMarketingPlan\ClineTalk\1747599198541\api_conversation_history.json

$sourceFilePath = "C:\Users\jason\Desktop\tori\kha\docs\StrategicMarketingPlan\ClineTalk\1747599198541\api_conversation_history.json"
$outputFilePath = "C:\Users\jason\Desktop\tori\kha\docs\StrategicMarketingPlan\ClineTalk\1747599198541_Extracted.txt"

Write-Host "Processing large file: $sourceFilePath"
Write-Host "This might take a few moments..."

try {
    # Create an output file with header information
    @"
# Extracted Content from Large JSON File
# Source: $sourceFilePath
# Size: 4MB
# Processed: $(Get-Date)
# 
# This file contains the raw content extracted from a large JSON file
# that was causing issues in the normal processing pipeline.
# The content below is the complete, unaltered content of the original file.
# 
# ============================================================

"@ | Set-Content -Path $outputFilePath -Encoding UTF8

    # Use .NET StreamReader for efficient reading of large files
    $reader = New-Object System.IO.StreamReader($sourceFilePath)
    $buffer = New-Object System.Text.StringBuilder
    $bufferSize = 8192 # Read in 8KB chunks
    $charBuffer = New-Object char[] $bufferSize
    $bytesRead = 0
    $totalBytes = 0

    # Progress indicators
    $totalSize = (Get-Item $sourceFilePath).Length
    $progress = 0
    
    Write-Host "Total file size: $($totalSize / 1MB) MB"
    
    # Read the file in chunks and append to the output file
    while (($bytesRead = $reader.Read($charBuffer, 0, $bufferSize)) -gt 0) {
        $totalBytes += $bytesRead
        $progress = [Math]::Floor(($totalBytes / $totalSize) * 100)
        
        Write-Progress -Activity "Extracting file content" -Status "$progress% Complete" -PercentComplete $progress
        
        $buffer.Append($charBuffer, 0, $bytesRead) | Out-Null
        
        # When buffer gets large enough, write to file and clear
        if ($buffer.Length -ge 1MB) {
            Add-Content -Path $outputFilePath -Value $buffer.ToString() -Encoding UTF8 -NoNewline
            $buffer.Clear() | Out-Null
        }
    }
    
    # Write any remaining content
    if ($buffer.Length -gt 0) {
        Add-Content -Path $outputFilePath -Value $buffer.ToString() -Encoding UTF8 -NoNewline
    }
    
    # Close the reader
    $reader.Close()
    
    Write-Host "Extraction complete! File saved to: $outputFilePath" -ForegroundColor Green
    Write-Host "Processed $($totalBytes / 1MB) MB of data."
} 
catch {
    Write-Host "Error processing the file: $_" -ForegroundColor Red
    
    # Try a simpler approach as fallback
    if (-not (Test-Path $outputFilePath) -or (Get-Item $outputFilePath).Length -eq 0) {
        Write-Host "Attempting simpler extraction method..." -ForegroundColor Yellow
        
        try {
            # Create header for the output file
            @"
# Extracted Content from Large JSON File (Fallback Method)
# Source: $sourceFilePath
# Size: 4MB
# Processed: $(Get-Date)
# 
# This file contains the raw content extracted using a fallback method
# after the primary extraction method encountered an error.
# 
# ============================================================

"@ | Set-Content -Path $outputFilePath -Encoding UTF8
            
            # Use Get-Content with -Raw to read the entire file
            $content = Get-Content -Path $sourceFilePath -Raw -Encoding UTF8
            Add-Content -Path $outputFilePath -Value $content -Encoding UTF8
            
            Write-Host "Fallback extraction complete! File saved to: $outputFilePath" -ForegroundColor Green
        }
        catch {
            Write-Host "Fallback extraction also failed: $_" -ForegroundColor Red
            
            # Last resort - use cmd.exe's type command
            Write-Host "Attempting last-resort method using cmd.exe..." -ForegroundColor Yellow
            
            @"
# Extracted Content from Large JSON File (Last Resort Method)
# Source: $sourceFilePath
# Size: 4MB
# Processed: $(Get-Date)
# 
# This file contains the raw content extracted using a last-resort method
# after other extraction methods failed.
# 
# ============================================================

"@ | Set-Content -Path $outputFilePath -Encoding UTF8
            
            # Use cmd.exe's type command
            Start-Process -FilePath "cmd.exe" -ArgumentList "/c type `"$sourceFilePath`" >> `"$outputFilePath`"" -Wait -NoNewWindow
            
            if ((Get-Item $outputFilePath).Length -gt 1000) {
                Write-Host "Last-resort extraction appears successful! File saved to: $outputFilePath" -ForegroundColor Green
            } else {
                Write-Host "All extraction methods failed. Please process this file manually." -ForegroundColor Red
            }
        }
    }
}

Write-Host "Press any key to continue..."
$null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
