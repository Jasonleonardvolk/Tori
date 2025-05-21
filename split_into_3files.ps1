$sourcePath = "C:\Users\jason\Desktop\tori\kha\docs\conversations\cline"
$outputPath = "C:\Users\jason\Desktop\tori\kha\docs\conversations\cline_split"
$numFiles = 3  # Exactly 3 files

# Create output directory if it doesn't exist
if (-not (Test-Path -Path $outputPath)) {
    New-Item -Path $outputPath -ItemType Directory | Out-Null
}

# Function to clean all formatting
function Clean-Content {
    param (
        [string]$content
    )
    
    # Remove all HTML tags
    $cleaned = $content -replace '<[^>]+>', ''
    
    # Remove HTML entities
    $cleaned = $cleaned -replace '&amp;', '&'
    $cleaned = $cleaned -replace '&lt;', '<'
    $cleaned = $cleaned -replace '&gt;', '>'
    $cleaned = $cleaned -replace '&quot;', '"'
    $cleaned = $cleaned -replace '&nbsp;', ' '
    $cleaned = $cleaned -replace '&[a-zA-Z]+;', ''
    
    # Clean up extra whitespace
    $cleaned = $cleaned -replace '\r\n\s*\r\n', "`r`n`r`n"
    $cleaned = $cleaned -replace '\n\s*\n', "`n`n"
    $cleaned = $cleaned -replace ' {2,}', ' '
    
    return $cleaned
}

# Function to extract conversation content from various file types
function Extract-ConversationContent {
    param (
        [string]$filePath
    )
    
    $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
    $content = Get-Content -Path $filePath -Raw
    
    if ($extension -eq ".json") {
        try {
            # Try to extract content from JSON structure
            $jsonObj = $content | ConvertFrom-Json
            $cleanedContent = ""
            
            # Different JSON structures we might encounter
            if ($jsonObj.PSObject.Properties.Name -contains 'messages') {
                foreach ($message in $jsonObj.messages) {
                    if ($message.PSObject.Properties.Name -contains 'role' -and 
                        $message.PSObject.Properties.Name -contains 'content') {
                        $role = $message.role
                        $messageContent = $message.content
                        
                        $cleanedContent += "[$role]:`n$messageContent`n`n"
                    }
                }
            }
            elseif ($null -ne $jsonObj -and $jsonObj -is [array]) {
                foreach ($item in $jsonObj) {
                    if ($item.PSObject.Properties.Name -contains 'role' -and 
                        $item.PSObject.Properties.Name -contains 'content') {
                        $role = $item.role
                        $messageContent = $item.content
                        
                        $cleanedContent += "[$role]:`n$messageContent`n`n"
                    }
                    elseif ($item.PSObject.Properties.Name -contains 'html' -or 
                            $item.PSObject.Properties.Name -contains 'content') {
                        $messageContent = if ($item.PSObject.Properties.Name -contains 'html') { 
                            $item.html 
                        } else { 
                            $item.content 
                        }
                        $cleanedContent += Clean-Content -content $messageContent
                        $cleanedContent += "`n`n"
                    }
                }
            }
            
            # If we couldn't extract structured content, use the raw content
            if ([string]::IsNullOrWhiteSpace($cleanedContent)) {
                $cleanedContent = Clean-Content -content $content
            }
            
            return $cleanedContent
        }
        catch {
            # If JSON parsing fails, just clean and return the content
            return Clean-Content -content $content
        }
    }
    else {
        # For markdown or text files, just clean the formatting
        return Clean-Content -content $content
    }
}

# Create ArrayList to store file information objects
$filesInfo = New-Object System.Collections.ArrayList

# Process all files and create file information objects
$files = Get-ChildItem -Path $sourcePath -File | Where-Object { $_.Extension -in ".json", ".md", ".txt" }
Write-Host "Found $($files.Count) files to process"

foreach ($file in $files) {
    Write-Host "Processing $($file.Name)..."
    $content = Extract-ConversationContent -filePath $file.FullName
    $bytesSize = [System.Text.Encoding]::UTF8.GetByteCount($content)
    
    $fileInfo = [PSCustomObject]@{
        Name = $file.Name
        Content = $content
        Size = $bytesSize
    }
    
    [void]$filesInfo.Add($fileInfo)
}

Write-Host "Processed $($filesInfo.Count) files"

# Sort files by size (largest first)
$filesInfo = $filesInfo | Sort-Object -Property Size -Descending

# Calculate total size
$totalSize = ($filesInfo | Measure-Object -Property Size -Sum).Sum
$maxSizePerFile = [Math]::Ceiling($totalSize / $numFiles)

Write-Host "Total content size: $([Math]::Round($totalSize / 1MB, 2)) MB"
Write-Host "Target size per file: $([Math]::Round($maxSizePerFile / 1MB, 2)) MB"

# Initialize arrays for the bins and their sizes
$bins = @(
    [System.Collections.ArrayList]::new(),
    [System.Collections.ArrayList]::new(),
    [System.Collections.ArrayList]::new()
)
$binSizes = @(0, 0, 0)

# First-fit decreasing algorithm
foreach ($file in $filesInfo) {
    $smallestBinIndex = 0
    $smallestBinSize = $binSizes[0]
    
    for ($i = 1; $i -lt $numFiles; $i++) {
        if ($binSizes[$i] -lt $smallestBinSize) {
            $smallestBinIndex = $i
            $smallestBinSize = $binSizes[$i]
        }
    }
    
    [void]$bins[$smallestBinIndex].Add($file)
    $binSizes[$smallestBinIndex] += $file.Size
}

# Create the output files
for ($i = 0; $i -lt $numFiles; $i++) {
    $outputFile = Join-Path -Path $outputPath -ChildPath "cline_content_part$($i+1).txt"
    $outputContent = ""
    
    foreach ($file in $bins[$i]) {
        $outputContent += "=== FILE: $($file.Name) ===`n`n$($file.Content)`n`n"
    }
    
    Set-Content -Path $outputFile -Value $outputContent -Encoding UTF8
    $fileSize = (Get-Item -Path $outputFile).Length / 1MB
    
    Write-Host "Created file $($i+1): $outputFile ($([Math]::Round($fileSize, 2)) MB) with $($bins[$i].Count) files"
}

# Create a summary file that lists what's in each part
$summaryContent = "# CLINE Content Split Summary`n`n"

for ($i = 0; $i -lt $numFiles; $i++) {
    $summaryContent += "## Part $($i+1) - $($bins[$i].Count) files`n`n"
    
    foreach ($file in $bins[$i]) {
        $summaryContent += "- $($file.Name)`n"
    }
    
    $summaryContent += "`n"
}

$summaryFile = Join-Path -Path $outputPath -ChildPath "split_summary.md"
Set-Content -Path $summaryFile -Value $summaryContent -Encoding UTF8
Write-Host "Created summary file: $summaryFile"

Write-Host "`nProcess completed. Files are ready for CLINE in VS Code."
