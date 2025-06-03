# Fix encoding issues in Svelte files
$files = @(
    "C:\Users\jason\Desktop\tori\kha\tori_ui_svelte\src\routes\+page.svelte",
    "C:\Users\jason\Desktop\tori\kha\tori_ui_svelte\src\lib\components\ScholarSpherePanel.svelte"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing encoding for: $file" -ForegroundColor Green
        
        # Read the file
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Create backup
        $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
        $backupPath = "$file.backup_encoding_$timestamp"
        Copy-Item $file $backupPath
        Write-Host "  Backup created: $backupPath" -ForegroundColor Gray
        
        # Write back with UTF-8 BOM
        $utf8WithBom = New-Object System.Text.UTF8Encoding $true
        [System.IO.File]::WriteAllText($file, $content, $utf8WithBom)
        
        Write-Host "  File re-encoded with UTF-8 BOM" -ForegroundColor Green
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "Done! Restart your Svelte dev server for changes to take effect." -ForegroundColor Cyan
