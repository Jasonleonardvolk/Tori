# Final sweep to check for any remaining references to old directory names
Write-Host "Performing final sweep for any remaining references to old directory names..."

# Define the old directory names to search for
$oldPaths = @(
    "client", 
    "chat"
)

# Define directories to exclude from search
$excludeDirs = @(
    "node_modules",
    "dist",
    "build",
    ".git",
    "coverage"
)

# Define exclusion pattern
$excludePattern = ($excludeDirs | ForEach-Object { [regex]::Escape($_) }) -join '|'

# Track statistics
$filesScanned = 0
$problemFiles = @()

# First, search in all files
Write-Host "Searching all files for references to old directory names..."
foreach ($oldPath in $oldPaths) {
    # Use grep-like functionality to find references
    # -Pattern: The search term
    # -Path: The directory to search in
    # -Recurse: Search subdirectories
    # -Include: Only search in these file types (all files)
    # We'll exclude binary files and directories that match the exclude pattern
    $results = Get-ChildItem -Path . -Recurse -File | 
        Where-Object { 
            ($_.DirectoryName -notmatch $excludePattern) -and
            (-not [System.IO.Path]::GetExtension($_.Name) -match "\.(exe|dll|pdb|obj|bin|jpg|png|gif|ico|pdf|mp3|mp4|zip|rar|gz|7z)$")
        } | 
        Select-String -Pattern "\b$oldPath\b" -SimpleMatch

    foreach ($result in $results) {
        $problemFiles += [PSCustomObject]@{
            FilePath = $result.Path
            FileName = Split-Path $result.Path -Leaf
            LineNumber = $result.LineNumber
            Line = $result.Line.Trim()
            OldPath = $oldPath
        }
    }
}

# Report results
$filesScanned = (Get-ChildItem -Path . -Recurse -File | Where-Object { $_.DirectoryName -notmatch $excludePattern }).Count
Write-Host "`n--------------------"
Write-Host "Final sweep complete!" -ForegroundColor Green
Write-Host "--------------------"
Write-Host "Files scanned: $filesScanned"

if ($problemFiles.Count -gt 0) {
    Write-Host "`n❌ Found $($problemFiles.Count) references to old directory names:" -ForegroundColor Red
    
    # Group by filename to make the output more manageable
    $problemFiles | Group-Object -Property FileName | ForEach-Object {
        $fileName = $_.Name
        $filePath = ($_.Group | Select-Object -First 1).FilePath
        $matchCount = $_.Count
        
        Write-Host "`nFile: $fileName ($matchCount matches)" -ForegroundColor Yellow
        Write-Host "Path: $filePath"
        
        $_.Group | ForEach-Object {
            Write-Host "  Line $($_.LineNumber): $($_.Line)" -ForegroundColor Gray
        }
    }
    
    # Save problem references to CSV
    $problemFiles | Export-Csv -Path "final-sweep-results.csv" -NoTypeInformation
    Write-Host "`nDetailed results saved to final-sweep-results.csv"
    
    Write-Host "`nRecommendation: Review these references and update as needed."
    Write-Host "You can use auto-fix-imports.ps1 to fix import statements and manually update other references."
} else {
    Write-Host "`n✅ SUCCESS! No references to old directory names found!" -ForegroundColor Green
    Write-Host "The migration appears to be complete." -ForegroundColor Green
}

Write-Host "`nFinal verification steps:"
Write-Host "1. Run TypeScript compiler to verify type checking: npx tsc --noEmit"
Write-Host "2. Build both applications to verify functionality:"
Write-Host "   - pnpm --filter @itori/ide build --mode production.ide"
Write-Host "   - pnpm --filter @itori/chat build --mode production.chat"
Write-Host "3. Start the dev servers to verify local development:"
Write-Host "   - pnpm --filter @itori/ide dev"
Write-Host "   - pnpm --filter @itori/chat dev"
