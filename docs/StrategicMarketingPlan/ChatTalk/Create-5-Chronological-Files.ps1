# PowerShell script to merge ChatGPT conversation files into 5 chronological files
# This preserves ALL content from the original files

$sourceFolder = "C:\Users\jason\Desktop\tori\kha\docs\StrategicMarketingPlan\ChatTalk"
$outputFolder = $sourceFolder
$outputPrefix = "Complete_Chronological_Content_Part"

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
    $outputFile = Join-Path -Path $outputFolder -ChildPath "$outputPrefix$i.json"
    Write-Host "Creating $outputFile..."
    
    # Calculate the range of files for this output
    $startIndex = ($i - 1) * $filesPerOutput
    $endIndex = [Math]::Min($i * $filesPerOutput - 1, $totalFiles - 1)
    
    # Create the container object for this batch
    $mergedData = @{
        "merged_conversations" = $true
        "source" = "ChatGPT Conversations"
        "part" = "$i of 5"
        "files_included" = @()
        "conversations" = @()
    }
    
    # Process each file in this range
    for ($j = $startIndex; $j -le $endIndex -and $j -lt $totalFiles; $j++) {
        $file = $allFiles[$j]
        $fileName = $file.Name
        
        Write-Host "  Processing file $($j+1) of $totalFiles`: $fileName"
        
        # Add the filename to the list of included files
        $mergedData.files_included += $fileName
        
        try {
            # Read the content of the file
            $content = Get-Content -Path $file.FullName -Raw | ConvertFrom-Json
            
            # Add the file's content to the merged data with metadata
            $conversationItem = @{
                "filename" = $fileName
                "created" = $file.CreationTime.ToString("yyyy-MM-dd HH:mm:ss")
                "content" = $content
            }
            
            $mergedData.conversations += $conversationItem
        }
        catch {
            $errorMessage = $_.Exception.Message
            Write-Host "  Error processing $fileName`: $errorMessage" -ForegroundColor Red
            
            # Even if we can't parse the JSON, include the raw content to ensure no data is lost
            $rawContent = Get-Content -Path $file.FullName -Raw
            
            $conversationItem = @{
                "filename" = $fileName
                "created" = $file.CreationTime.ToString("yyyy-MM-dd HH:mm:ss")
                "raw_content" = $rawContent
                "error" = "Could not parse JSON: $errorMessage"
            }
            
            $mergedData.conversations += $conversationItem
        }
    }
    
    # Write the merged data to the output file
    # Using -Depth 32 to make sure all nested content is preserved
    $mergedData | ConvertTo-Json -Depth 32 | Set-Content -Path $outputFile
    
    Write-Host "Completed output file $i of 5" -ForegroundColor Green
}

Write-Host "All 5 files have been created successfully!"
Write-Host "The files are named $outputPrefix`1.json through $outputPrefix`5.json"
