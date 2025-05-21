$sourcePath = "C:\Users\jason\Desktop\tori\kha\docs\conversations\cline"
$outputPath = "C:\Users\jason\Desktop\tori\kha\docs\conversations\cline_split"

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
                    elseif ($item.PSObject.Properties.Name -contains 'html') {
                        $messageContent = $item.html
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

# Get all files
$allFiles = Get-ChildItem -Path $sourcePath -File | Where-Object { $_.Extension -in ".json", ".md", ".txt" }
Write-Host "Found $($allFiles.Count) files to process"

# Extract and combine all content
$allContent = ""
foreach ($file in $allFiles) {
    Write-Host "Processing $($file.Name)..."
    $fileContent = Extract-ConversationContent -filePath $file.FullName
    $allContent += "=== FILE: $($file.Name) ===`n`n$fileContent`n`n"
}

# Calculate total size and midpoint for splitting into exactly 2 files
$contentBytes = [System.Text.Encoding]::UTF8.GetBytes($allContent)
$totalSizeBytes = $contentBytes.Length
$midpointBytes = [int]($totalSizeBytes / 2)

Write-Host "Total size: $([Math]::Round($totalSizeBytes / 1MB, 2)) MB"

# Find a good split point near the middle (at a line break)
$goodSplitPoint = $midpointBytes
while ($goodSplitPoint -lt $totalSizeBytes -and $contentBytes[$goodSplitPoint] -ne 10) { # 10 is line feed
    $goodSplitPoint++
}

# Split the content into two parts
$part1 = [System.Text.Encoding]::UTF8.GetString($contentBytes, 0, $goodSplitPoint)
$part2 = [System.Text.Encoding]::UTF8.GetString($contentBytes, $goodSplitPoint, $totalSizeBytes - $goodSplitPoint)

# Save the two files
$part1File = Join-Path -Path $outputPath -ChildPath "combined_content_part1.txt"
$part2File = Join-Path -Path $outputPath -ChildPath "combined_content_part2.txt"

Set-Content -Path $part1File -Value $part1 -Encoding UTF8
Set-Content -Path $part2File -Value $part2 -Encoding UTF8

$part1Size = (Get-Item -Path $part1File).Length / 1MB
$part2Size = (Get-Item -Path $part2File).Length / 1MB

Write-Host "Created 2 files:"
Write-Host "1. $part1File ($([Math]::Round($part1Size, 2)) MB)"
Write-Host "2. $part2File ($([Math]::Round($part2Size, 2)) MB)"

# Create a summary file for the 2-file split
$summaryContent = "# CLINE Content Split Summary (2 Files)`n`n"
$summaryContent += "## Part 1 - $([Math]::Round($part1Size, 2)) MB`n"
$summaryContent += "## Part 2 - $([Math]::Round($part2Size, 2)) MB`n`n"

$summaryFile = Join-Path -Path $outputPath -ChildPath "two_part_summary.md"
Set-Content -Path $summaryFile -Value $summaryContent -Encoding UTF8

# If we need to split into 3 files of approximately 2MB each
Write-Host "`nSplitting content into 3 files..."

$allLines = $allContent -split "`n"
$totalLines = $allLines.Count
$linesPerFile = [Math]::Ceiling($totalLines / 3)

$part1End = [Math]::Min($linesPerFile, $totalLines)
$part2End = [Math]::Min(2 * $linesPerFile, $totalLines)

$part1Lines = $allLines[0..($part1End-1)]
$part2Lines = $allLines[$part1End..($part2End-1)]
$part3Lines = $allLines[$part2End..($totalLines-1)]

$part1Content = $part1Lines -join "`n"
$part2Content = $part2Lines -join "`n"
$part3Content = $part3Lines -join "`n"

# Save the three files
$part1File = Join-Path -Path $outputPath -ChildPath "triple_split_part1.txt"
$part2File = Join-Path -Path $outputPath -ChildPath "triple_split_part2.txt"
$part3File = Join-Path -Path $outputPath -ChildPath "triple_split_part3.txt"

Set-Content -Path $part1File -Value $part1Content -Encoding UTF8
Set-Content -Path $part2File -Value $part2Content -Encoding UTF8
Set-Content -Path $part3File -Value $part3Content -Encoding UTF8

$part1Size = (Get-Item -Path $part1File).Length / 1MB
$part2Size = (Get-Item -Path $part2File).Length / 1MB
$part3Size = (Get-Item -Path $part3File).Length / 1MB

Write-Host "Created 3 files:"
Write-Host "1. $part1File ($([Math]::Round($part1Size, 2)) MB)"
Write-Host "2. $part2File ($([Math]::Round($part2Size, 2)) MB)"
Write-Host "3. $part3File ($([Math]::Round($part3Size, 2)) MB)"

# Create a summary file for the 3-file split
$summaryContent = "# CLINE Content Split Summary (3 Files)`n`n"
$summaryContent += "## Part 1 - $([Math]::Round($part1Size, 2)) MB`n"
$summaryContent += "## Part 2 - $([Math]::Round($part2Size, 2)) MB`n"
$summaryContent += "## Part 3 - $([Math]::Round($part3Size, 2)) MB`n"

$summaryFile = Join-Path -Path $outputPath -ChildPath "three_part_summary.md"
Set-Content -Path $summaryFile -Value $summaryContent -Encoding UTF8

Write-Host "`nProcess completed. Files are ready for CLINE in VS Code."
