# PowerShell script to extract and merge Claude conversation history files into 10 chronological files
# This preserves ALL content from the original files

$sourceFolder = "C:\Users\jason\Desktop\tori\kha\docs\StrategicMarketingPlan\ClineTalk"
$outputFolder = $sourceFolder
$outputPrefixJson = "Merged_Cline_Conversations_Part"
$outputPrefixTxt = "Merged_Cline_Conversations_TXT_Part"

Write-Host "Creating 10 chronological files with complete content from all api_conversation_history.json files..."

# Get all folders sorted chronologically by folder name (which is a timestamp)
$allFolders = Get-ChildItem -Path $sourceFolder -Directory | 
    Sort-Object { [long]$_.Name }

$totalFolders = $allFolders.Count
Write-Host "Found $totalFolders folders to process."

# Calculate folders per output file
$foldersPerOutput = [Math]::Ceiling($totalFolders / 10)
Write-Host "Each output file will contain approximately $foldersPerOutput conversation files."

# Process both JSON and TXT output formats
foreach ($format in @("json", "txt")) {
    # Create 10 output files
    for ($i = 1; $i -le 10; $i++) {
        if ($format -eq "json") {
            $outputFile = Join-Path -Path $outputFolder -ChildPath "$($outputPrefixJson)$i.json"
        } else {
            $outputFile = Join-Path -Path $outputFolder -ChildPath "$($outputPrefixTxt)$i.txt"
        }
        
        Write-Host "Creating $outputFile..."
        
        # Calculate the range of folders for this output
        $startIndex = ($i - 1) * $foldersPerOutput
        $endIndex = [Math]::Min($i * $foldersPerOutput - 1, $totalFolders - 1)
        
        if ($format -eq "json") {
            # Create the container object for this batch (JSON format)
            $mergedData = @{
                "merged_conversations" = $true
                "source" = "Claude VS Code Extension"
                "part" = "$i of 10"
                "folders_included" = @()
                "conversations" = @()
            }
            
            # Process each folder in this range
            for ($j = $startIndex; $j -le $endIndex -and $j -lt $totalFolders; $j++) {
                $folder = $allFolders[$j]
                $folderName = $folder.Name
                $apiFilePath = Join-Path -Path $folder.FullName -ChildPath "api_conversation_history.json"
                
                Write-Host "  Processing folder $($j+1) of $totalFolders`: $folderName"
                
                # Add the folder name to the list of included folders
                $mergedData.folders_included += $folderName
                
                if (Test-Path $apiFilePath) {
                    try {
                        # Read the content of the api_conversation_history.json file
                        $content = Get-Content -Path $apiFilePath -Raw | ConvertFrom-Json
                        
                        # Add the file's content to the merged data with metadata
                        $conversationItem = @{
                            "folder" = $folderName
                            "timestamp" = [long]$folderName
                            "date" = (Get-Date).AddMilliseconds([long]$folderName - (Get-Date).Ticks / 10000).ToString("yyyy-MM-dd HH:mm:ss")
                            "content" = $content
                        }
                        
                        $mergedData.conversations += $conversationItem
                    }
                    catch {
                        $errorMessage = $_.Exception.Message
                        Write-Host "  Error processing $folderName`: $errorMessage" -ForegroundColor Red
                        
                        # Even if we can't parse the JSON, include the raw content to ensure no data is lost
                        $rawContent = Get-Content -Path $apiFilePath -Raw
                        
                        $conversationItem = @{
                            "folder" = $folderName
                            "timestamp" = [long]$folderName
                            "date" = (Get-Date).AddMilliseconds([long]$folderName - (Get-Date).Ticks / 10000).ToString("yyyy-MM-dd HH:mm:ss")
                            "raw_content" = $rawContent
                            "error" = "Could not parse JSON: $errorMessage"
                        }
                        
                        $mergedData.conversations += $conversationItem
                    }
                }
                else {
                    Write-Host "  Warning: No api_conversation_history.json found in $folderName" -ForegroundColor Yellow
                    
                    $conversationItem = @{
                        "folder" = $folderName
                        "timestamp" = [long]$folderName
                        "date" = (Get-Date).AddMilliseconds([long]$folderName - (Get-Date).Ticks / 10000).ToString("yyyy-MM-dd HH:mm:ss")
                        "error" = "File api_conversation_history.json not found"
                    }
                    
                    $mergedData.conversations += $conversationItem
                }
            }
            
            # Write the merged data to the output file
            # Using -Depth 32 to make sure all nested content is preserved
            $mergedData | ConvertTo-Json -Depth 32 | Set-Content -Path $outputFile
        }
        else {
            # Create text file with header (TXT format)
            @"
# Merged Claude Conversations - Part $i of 10
# Created: $(Get-Date)
# This file contains the complete content of api_conversation_history.json from the following folders:

"@ | Set-Content -Path $outputFile
            
            # List the folders included in this part
            for ($j = $startIndex; $j -le $endIndex -and $j -lt $totalFolders; $j++) {
                $folder = $allFolders[$j]
                $folderDate = (Get-Date).AddMilliseconds([long]$folder.Name - (Get-Date).Ticks / 10000).ToString("yyyy-MM-dd HH:mm:ss")
                "# $($j+1). $($folder.Name) - $folderDate" | Add-Content -Path $outputFile
            }
            
            # Add a separator before the content
            @"

# ================================================================
# BEGIN CONVERSATION CONTENTS
# ================================================================

"@ | Add-Content -Path $outputFile
            
            # Process each folder in this range
            for ($j = $startIndex; $j -le $endIndex -and $j -lt $totalFolders; $j++) {
                $folder = $allFolders[$j]
                $folderName = $folder.Name
                $apiFilePath = Join-Path -Path $folder.FullName -ChildPath "api_conversation_history.json"
                $folderDate = (Get-Date).AddMilliseconds([long]$folderName - (Get-Date).Ticks / 10000).ToString("yyyy-MM-dd HH:mm:ss")
                
                Write-Host "  Processing folder $($j+1) of $totalFolders`: $folderName"
                
                # Add folder marker
                @"

# ================================================================
# FOLDER: $folderName
# DATE: $folderDate
# ================================================================

"@ | Add-Content -Path $outputFile
                
                if (Test-Path $apiFilePath) {
                    # Add the raw content of the file
                    $rawContent = Get-Content -Path $apiFilePath -Raw
                    $rawContent | Add-Content -Path $outputFile
                }
                else {
                    "# WARNING: No api_conversation_history.json found in this folder" | Add-Content -Path $outputFile
                }
                
                # Add a separator after the folder
                @"

# ----------------------------------------------------------------
# END OF FOLDER: $folderName
# ----------------------------------------------------------------

"@ | Add-Content -Path $outputFile
            }
        }
        
        Write-Host "Completed output file $i of 10 ($format format)" -ForegroundColor Green
    }
    
    Write-Host "All 10 $format files have been created successfully!"
}

Write-Host "All files have been created successfully!"
Write-Host "The JSON files are named $($outputPrefixJson)1.json through $($outputPrefixJson)10.json"
Write-Host "The TXT files are named $($outputPrefixTxt)1.txt through $($outputPrefixTxt)10.txt"
