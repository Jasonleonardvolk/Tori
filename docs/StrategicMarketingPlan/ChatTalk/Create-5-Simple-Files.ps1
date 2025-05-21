# PowerShell script to merge ChatGPT conversation files into 5 chronological files
# Simplified approach that focuses on reliability and preserving all content

$sourceFolder = "C:\Users\jason\Desktop\tori\kha\docs\StrategicMarketingPlan\ChatTalk"
$outputFolder = $sourceFolder
$outputPrefix = "Complete_ChatTalk_Part"

Write-Host "Creating 5 chronological files with complete content from all conversation files..."

# Get all JSON files in the source folder and sort them chronologically
$allFiles = Get-ChildItem -Path $sourceFolder -Filter "*.json" | Sort-Object CreationTime
$totalFiles = $allFiles.Count

Write-Host "Found $totalFiles files to process."

# Calculate how many files to include in each output file (ceiling division)
$filesPerOutput = [Math]::Ceiling($totalFiles / 5)
Write-Host "Each output file will contain approximately $filesPerOutput original files."

# Create 5 output files
for ($i = 1; $i -le 5; $i++) {
    $outputFile = Join-Path -Path $outputFolder -ChildPath "$($outputPrefix)$i.txt"
    Write-Host "Creating $outputFile..."
    
    # Create the file with a header
    @"
# Complete ChatTalk Conversations - Part $i of 5
# Created: $(Get-Date)
# This file contains the complete content of the following files:

"@ | Set-Content -Path $outputFile
    
    # Calculate the range of files for this output
    $startIndex = ($i - 1) * $filesPerOutput
    $endIndex = [Math]::Min($i * $filesPerOutput - 1, $totalFiles - 1)
    
    # List the files included in this part
    for ($j = $startIndex; $j -le $endIndex -and $j -lt $totalFiles; $j++) {
        $file = $allFiles[$j]
        "# $($j+1). $($file.Name)" | Add-Content -Path $outputFile
    }
    
    # Add a separator before the content
    @"

# ================================================================
# BEGIN CONVERSATION CONTENTS
# ================================================================

"@ | Add-Content -Path $outputFile
    
    # Process each file in this range
    for ($j = $startIndex; $j -le $endIndex -and $j -lt $totalFiles; $j++) {
        $file = $allFiles[$j]
        $fileName = $file.Name
        
        Write-Host "  Processing file $($j+1) of $totalFiles`: $fileName"
        
        # Add file marker
        @"

# ================================================================
# FILE: $fileName
# CREATED: $($file.CreationTime)
# ================================================================

"@ | Add-Content -Path $outputFile
        
        # Add the raw content of the file
        $rawContent = Get-Content -Path $file.FullName -Raw
        $rawContent | Add-Content -Path $outputFile
        
        # Add a separator after the file
        @"

# ----------------------------------------------------------------
# END OF FILE: $fileName
# ----------------------------------------------------------------

"@ | Add-Content -Path $outputFile
    }
    
    Write-Host "Completed output file $i of 5" -ForegroundColor Green
}

Write-Host "All 5 files have been created successfully!"
Write-Host "The files are named $($outputPrefix)1.txt through $($outputPrefix)5.txt"
