# Script to check for old directory references in script files
Write-Host "Checking for old directory references in script files (bat, sh, ps1)..."

# Define the old directory names to search for
$oldPaths = @(
    "client", 
    "chat"
)

# Track statistics
$filesScanned = 0
$problemFiles = @()

# Process script files
$scriptFiles = Get-ChildItem -Recurse -Include *.bat,*.sh,*.ps1,*.cmd,Makefile -File | 
    Where-Object { 
        $_.DirectoryName -notmatch "node_modules" -and
        $_.DirectoryName -notmatch "dist" -and
        $_.DirectoryName -notmatch "build"
    }

foreach ($file in $scriptFiles) {
    $filesScanned++
    $content = Get-Content -Path $file.FullName -Raw
    
    foreach ($oldPath in $oldPaths) {
        # Look for direct references to old directory names
        # Using word boundaries to avoid partial matches
        $pattern = "\b$oldPath\b"
        
        if ($content -match $pattern) {
            $matches = [regex]::Matches($content, $pattern)
            $lineNumbers = @()
            
            # Find line numbers for references
            $contentLines = Get-Content -Path $file.FullName
            for ($i = 0; $i -lt $contentLines.Length; $i++) {
                if ($contentLines[$i] -match $pattern) {
                    $lineNumbers += $i + 1
                }
            }
            
            # Add to problem files list
            $problemFiles += [PSCustomObject]@{
                FilePath = $file.FullName
                FileName = $file.Name
                OldPath = $oldPath
                Matches = $matches.Count
                Lines = $lineNumbers -join ', '
            }
            
            break  # Once we've found a match in this file, move to the next file
        }
    }
}

# Report results
Write-Host "`n--------------------"
Write-Host "Script reference check complete!" -ForegroundColor Green
Write-Host "--------------------"
Write-Host "Script files scanned: $filesScanned"

if ($problemFiles.Count -gt 0) {
    Write-Host "`n❌ Found $($problemFiles.Count) script files with old directory references:" -ForegroundColor Red
    $problemFiles | Format-Table FileName, OldPath, Matches, Lines -AutoSize
    
    # Save problem files list to CSV
    $problemFiles | Export-Csv -Path "problem-scripts.csv" -NoTypeInformation
    Write-Host "Problem script files saved to problem-scripts.csv"
    
    Write-Host "`nRecommendation: Review these script files manually and update the references."
} else {
    Write-Host "`n✅ No script files contain references to old directory names!" -ForegroundColor Green
}

Write-Host "`nTo manually fix a script file, replace references to:"
foreach ($oldPath in $oldPaths) {
    switch ($oldPath) {
        "client" { 
            Write-Host "  - '$oldPath' with 'ide_frontend'" -ForegroundColor Yellow
        }
        "chat" { 
            Write-Host "  - '$oldPath' with 'tori_chat_frontend'" -ForegroundColor Yellow
        }
    }
}
