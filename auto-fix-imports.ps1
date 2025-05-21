# Script to automatically fix import paths referencing old directory names
Write-Host "Auto-fixing import paths across the codebase..."

# Define replacements
$replacements = @(
    @{
        OldPath = "client/"
        NewPath = "ide_frontend/"
    },
    @{
        OldPath = "chat/"
        NewPath = "tori_chat_frontend/"
    }
)

# Track statistics
$filesScanned = 0
$filesModified = 0
$totalReplacements = 0

# Process files
Write-Host "Scanning for files with old import paths..."
$files = Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx -File | 
    Where-Object { 
        $_.DirectoryName -notmatch "node_modules" -and
        $_.DirectoryName -notmatch "dist" -and
        $_.DirectoryName -notmatch "build"
    }

foreach ($file in $files) {
    $filesScanned++
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    $modified = $false
    
    foreach ($replacement in $replacements) {
        # Import pattern matching with correct path delimiter
        $importPattern = "from\s+['\`"](.*)$($replacement.OldPath)(.+?)['\`"]"
        
        if ($content -match $importPattern) {
            Write-Host "Fixing imports in: $($file.FullName)" -ForegroundColor Yellow
            
            # Replace in content
            $content = [regex]::Replace(
                $content, 
                $importPattern, 
                { param($match)
                    $prefix = $match.Groups[1].Value
                    $suffix = $match.Groups[2].Value
                    $replacement = "from '$prefix$($replacement.NewPath)$suffix'"
                    $script:totalReplacements++
                    return $replacement
                }
            )
            
            $modified = $true
        }
    }
    
    # Save changes if the file was modified
    if ($modified) {
        Write-Host "  Saving changes to: $($file.FullName)" -ForegroundColor Green
        $content | Set-Content -Path $file.FullName -NoNewline
        $filesModified++
    }
}

# Report results
Write-Host "`n--------------------"
Write-Host "Import path auto-fix complete!" -ForegroundColor Green
Write-Host "--------------------"
Write-Host "Files scanned: $filesScanned"
Write-Host "Files modified: $filesModified"
Write-Host "Total replacements: $totalReplacements"

if ($filesModified -gt 0) {
    Write-Host "`nRecommendation: Run TypeScript compiler again to verify fixes:"
    Write-Host "  npx tsc --noEmit"
} else {
    Write-Host "`n✅ No files needed fixing! Your imports appear to be clean." -ForegroundColor Green
}
