$sourcePath = "C:\Users\jason\Desktop\tori\kha\docs\conversations\cline"
$outputPath = "C:\Users\jason\Desktop\tori\kha\docs\conversations"
$maxFileSizeMB = 40  # Maximum file size in MB to prevent VSCode parsing issues

# Create output filenames
$jsonOutputBase = "$outputPath\combined_json_conversations"
$textOutputBase = "$outputPath\combined_text_conversations"

# Function to clean HTML/formatting tags from content
function Clean-FormattingTags {
    param (
        [string]$content
    )

    # Remove HTML tags and data attributes
    $cleaned = $content -replace '<[^>]*(data-[^=]+="[^"]*")+[^>]*>', ''
    $cleaned = $cleaned -replace '</?[a-zA-Z][^>]*>', ''
    
    # Remove HTML entities
    $cleaned = $cleaned -replace '&amp;', '&'
    $cleaned = $cleaned -replace '&lt;', '<'
    $cleaned = $cleaned -replace '&gt;', '>'
    $cleaned = $cleaned -replace '&quot;', '"'
    $cleaned = $cleaned -replace '&nbsp;', ' '
    $cleaned = $cleaned -replace '&[a-zA-Z]+;', ''
    
    # Remove LaTeX display and other formatting blocks
    $cleaned = $cleaned -replace '<span class="katex-display">.*?</span>', ''
    
    # Remove escaped quotes and other escape sequences
    $cleaned = $cleaned -replace '\\\"', '"'
    
    # Clean up extra whitespace
    $cleaned = $cleaned -replace '\r\n\s*\r\n', "`r`n`r`n"
    $cleaned = $cleaned -replace '\n\s*\n', "`n`n"
    $cleaned = $cleaned -replace ' {2,}', ' '
    
    return $cleaned
}

# Function to add separator between files
function Add-FileSeparator {
    param (
        [string]$fileName,
        [string]$fileContent
    )
    
    # Clean formatting tags if content appears to be HTML or contains formatting tags
    if ($fileContent -match '<[^>]+>|data-[^=]+=' -or $fileContent -match '&[a-zA-Z]+;') {
        $fileContent = Clean-FormattingTags -content $fileContent
    }
    
    return @"

#====================================================================================
# FILE: $fileName
#====================================================================================

$fileContent

#====================================================================================
# END OF FILE: $fileName
#====================================================================================

"@
}

# Function to create a clickable table of contents for markdown
function Create-TableOfContents {
    param (
        [System.Collections.ArrayList]$files,
        [string]$outputType
    )
    
    $toc = @"
# Combined $outputType Files - Table of Contents
Created: $(Get-Date)

"@
    
    for ($i = 0; $i -lt $files.Count; $i++) {
        $file = $files[$i]
        $linkTarget = $file.Name -replace '\s', '-' -replace '[^a-zA-Z0-9-]', ''
        $toc += "[$($i+1). $($file.Name)](#file-$linkTarget)`n"
    }
    
    return $toc + "`n"
}

# Function to extract only relevant content from JSON files
function Extract-CleanContent {
    param (
        [string]$jsonContent
    )
    
    try {
        # Try to parse as JSON
        $jsonObj = $jsonContent | ConvertFrom-Json
        
        $cleanedContent = ""
        
        # Process conversation entries if they exist
        if ($jsonObj.PSObject.Properties.Name -contains 'messages') {
            foreach ($message in $jsonObj.messages) {
                if ($message.PSObject.Properties.Name -contains 'role' -and 
                    $message.PSObject.Properties.Name -contains 'content') {
                    $role = $message.role
                    $content = $message.content
                    
                    # Clean HTML from content if present
                    if ($content -match '<[^>]+>|data-[^=]+=' -or $content -match '&[a-zA-Z]+;') {
                        $content = Clean-FormattingTags -content $content
                    }
                    
                    $cleanedContent += "[$role]:`n$content`n`n"
                }
            }
        }
        # If it's a different format with role/content at the top level
        elseif ($jsonObj.PSObject.Properties.Name -contains 'role' -and 
                $jsonObj.PSObject.Properties.Name -contains 'content') {
            foreach ($item in $jsonObj) {
                $role = $item.role
                $content = $item.content
                
                # Clean HTML from content if present
                if ($content -match '<[^>]+>|data-[^=]+=' -or $content -match '&[a-zA-Z]+;') {
                    $content = Clean-FormattingTags -content $content
                }
                
                $cleanedContent += "[$role]:`n$content`n`n"
            }
        }
        # If we couldn't identify the format, just return a stripped version of the original
        else {
            $cleanedContent = Clean-FormattingTags -content $jsonContent
        }
        
        return $cleanedContent
    }
    catch {
        # If JSON parsing fails, just clean and return the content
        return Clean-FormattingTags -content $jsonContent
    }
}

# Process JSON files
$jsonFiles = Get-ChildItem -Path $sourcePath -Filter "*.json" | Sort-Object Name
$textFiles = Get-ChildItem -Path $sourcePath -Filter "*.md" | Sort-Object Name
$textFiles += Get-ChildItem -Path $sourcePath -Filter "*.txt" | Sort-Object Name

# Create arrays to hold file data
[System.Collections.ArrayList]$jsonContents = @()
[System.Collections.ArrayList]$textContents = @()

# Process JSON files - extract only relevant content
foreach ($file in $jsonFiles) {
    Write-Host "Processing $($file.Name)..."
    $fileContent = Get-Content -Path $file.FullName -Raw
    
    # Clean and extract relevant content from JSON
    $cleanedContent = Extract-CleanContent -jsonContent $fileContent
    
    $formattedContent = Add-FileSeparator -fileName $file.Name -fileContent $cleanedContent
    $null = $jsonContents.Add(@{
        Name = $file.Name
        Content = $formattedContent
        Size = [System.Text.Encoding]::UTF8.GetByteCount($formattedContent)
    })
}

# Process text files (MD and TXT)
foreach ($file in $textFiles) {
    Write-Host "Processing $($file.Name)..."
    $fileContent = Get-Content -Path $file.FullName -Raw
    $formattedContent = Add-FileSeparator -fileName $file.Name -fileContent $fileContent
    $null = $textContents.Add(@{
        Name = $file.Name
        Content = $formattedContent
        Size = [System.Text.Encoding]::UTF8.GetByteCount($formattedContent)
    })
}

# Helper function to split content into files of manageable size
function Split-ContentIntoFiles {
    param (
        [System.Collections.ArrayList]$contents,
        [string]$baseFilename,
        [string]$fileType
    )

    $fileIndex = 1
    $currentFileContent = Create-TableOfContents -files $contents -outputType $fileType
    $currentSize = [System.Text.Encoding]::UTF8.GetByteCount($currentFileContent)
    $filePaths = @()
    
    foreach ($item in $contents) {
        $contentSize = $item.Size
        
        # If adding this content would exceed our limit, save current file and start a new one
        if ($currentSize + $contentSize -gt ($maxFileSizeMB * 1MB)) {
            $outputFile = "$baseFilename-part$fileIndex.md"
            $filePaths += $outputFile
            Set-Content -Path $outputFile -Value $currentFileContent -Encoding UTF8
            Write-Host "Created $outputFile ($('{0:N2}' -f ($currentSize / 1MB)) MB)"
            
            $fileIndex++
            $currentFileContent = Create-TableOfContents -files $contents -outputType "$fileType (Part $fileIndex)"
            $currentSize = [System.Text.Encoding]::UTF8.GetByteCount($currentFileContent)
        }
        
        # Add an anchor for TOC linking
        $anchorName = $item.Name -replace '\s', '-' -replace '[^a-zA-Z0-9-]', ''
        $currentFileContent += "<a id='file-$anchorName'></a>`n"
        $currentFileContent += $item.Content
        $currentSize += $contentSize
    }
    
    # Save the last file
    if ($currentFileContent -ne "") {
        $outputFile = "$baseFilename-part$fileIndex.md"
        $filePaths += $outputFile
        Set-Content -Path $outputFile -Value $currentFileContent -Encoding UTF8
        Write-Host "Created $outputFile ($('{0:N2}' -f ($currentSize / 1MB)) MB)"
    }
    
    return $filePaths
}

# Split and write the combined files
$jsonFiles = Split-ContentIntoFiles -contents $jsonContents -baseFilename $jsonOutputBase -fileType "JSON Conversations"
$textFiles = Split-ContentIntoFiles -contents $textContents -baseFilename $textOutputBase -fileType "Text Conversations"

# Create a summary file
$summaryContent = @"
# Conversation Files Summary
Created: $(Get-Date)

## Original Files
Total JSON files: $($jsonFiles.Count)
Total Text files: $($textFiles.Count)

## Combined Files
"@

foreach ($file in $jsonFiles) {
    $fileInfo = Get-Item $file
    $summaryContent += "`n- $($fileInfo.Name) ($('{0:N2}' -f ($fileInfo.Length / 1MB)) MB)"
}

foreach ($file in $textFiles) {
    $fileInfo = Get-Item $file
    $summaryContent += "`n- $($fileInfo.Name) ($('{0:N2}' -f ($fileInfo.Length / 1MB)) MB)"
}

$summaryFile = "$outputPath\conversations_summary.md"
Set-Content -Path $summaryFile -Value $summaryContent -Encoding UTF8
Write-Host "Created summary file at $summaryFile"

Write-Host "`nProcess completed successfully!"
Write-Host "JSON files were combined into $($jsonFiles.Count) files"
Write-Host "Text files were combined into $($textFiles.Count) files"
Write-Host "All HTML formatting and unnecessary tags were removed"
Write-Host "Open these files in VS Code for browsing with table of contents navigation"
