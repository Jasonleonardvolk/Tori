# Script to replace chat/ references with tori_chat_frontend/
$pattern = 'chat[/\\]'
$replacement = 'tori_chat_frontend/'

# Define folders to exclude (adjust as needed)
$excludeDirs = @('node_modules', '.git', 'dist', 'build', 'out')

Write-Host "Starting replacement of $pattern with $replacement..." -ForegroundColor Yellow

# Recursively get all files *excluding* the unwanted folders
$allFiles = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    foreach ($ex in $excludeDirs) {
        if ($_.FullName -like "*\$ex\*") { return $false }
    }
    return $true
}

# Find files containing the pattern
$files = $allFiles | 
    Select-String -Pattern $pattern -ErrorAction SilentlyContinue | 
    Select-Object -ExpandProperty Path -Unique

Write-Host "Found $($files.Count) files to process" -ForegroundColor Cyan

# Create a backup directory
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups/chat_replacement_$timestamp"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
Write-Host "Created backup directory: $backupDir" -ForegroundColor Green

foreach ($file in $files) {
    # Backup the file
    $relativePath = Resolve-Path -Path $file -Relative
    $backupPath = Join-Path -Path $backupDir -ChildPath $relativePath
    $backupFolder = Split-Path -Path $backupPath -Parent
    
    if (-not (Test-Path -Path $backupFolder)) {
        New-Item -Path $backupFolder -ItemType Directory -Force | Out-Null
    }
    
    Copy-Item -Path $file -Destination $backupPath -Force
    
    # Replace content
    $content = Get-Content -Path $file -Raw
    $newContent = $content -replace $pattern, $replacement
    Set-Content -Path $file -Value $newContent
    
    Write-Host "Patched: $relativePath" -ForegroundColor Green
}

Write-Host "`nReplacement complete!" -ForegroundColor Green
Write-Host "Backups saved to: $backupDir" -ForegroundColor Cyan
