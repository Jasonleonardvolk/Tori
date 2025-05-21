# patch-paths.ps1
# Script to safely replace client/ → ide_frontend/ and chat/ → tori_chat_frontend/ references

# Create a backup directory with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups/migration_$timestamp"
New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
Write-Host "Created backup directory: $backupDir" -ForegroundColor Green

# Define patterns and replacements
$patterns = @(
    @{
        Pattern = 'client[/\\]'
        Replacement = 'ide_frontend/'
        Description = "client/ → ide_frontend/"
    },
    @{
        Pattern = 'chat[/\\]'
        Replacement = 'tori_chat_frontend/'
        Description = "chat/ → tori_chat_frontend/"
    }
)

# Create log file
$logFile = "$backupDir/migration_log.txt"
"Migration log - $timestamp" | Out-File -FilePath $logFile
"===================================" | Out-File -FilePath $logFile -Append

# Function to process a single replacement
function Process-Replacement {
    param (
        [string]$pattern,
        [string]$replacement,
        [string]$description,
        [switch]$DryRun
    )
    
    Write-Host "`nSearching for files containing $description..." -ForegroundColor Yellow
    "$description" | Out-File -FilePath $logFile -Append
    
    # Find all files containing the pattern
    $files = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | 
        Select-String -Pattern $pattern -ErrorAction SilentlyContinue | 
        Select-Object -ExpandProperty Path -Unique
    
    if ($files.Count -eq 0) {
        Write-Host "No files found containing $description" -ForegroundColor Cyan
        "No files found containing $description" | Out-File -FilePath $logFile -Append
        return
    }
    
    Write-Host "Found $($files.Count) files containing $description" -ForegroundColor Cyan
    "Found $($files.Count) files containing $description" | Out-File -FilePath $logFile -Append
    
    foreach ($file in $files) {
        # Get the content
        $content = Get-Content -Path $file -Raw
        # Create the replacement
        $newContent = $content -replace $pattern, $replacement
        
        # Only process if there were actual changes
        if ($content -ne $newContent) {
            # Backup the file
            $relativePath = Resolve-Path -Path $file -Relative
            $backupPath = Join-Path -Path $backupDir -ChildPath $relativePath
            $backupFolder = Split-Path -Path $backupPath -Parent
            
            if (-not (Test-Path -Path $backupFolder)) {
                New-Item -Path $backupFolder -ItemType Directory -Force | Out-Null
            }
            
            Copy-Item -Path $file -Destination $backupPath -Force
            
            # Log the change
            "Modified: $relativePath" | Out-File -FilePath $logFile -Append
            
            if ($DryRun) {
                Write-Host "Would modify: $relativePath" -ForegroundColor Magenta
            } else {
                # Apply the change
                Set-Content -Path $file -Value $newContent
                Write-Host "Modified: $relativePath" -ForegroundColor Green
            }
        }
    }
}

# First run in dry-run mode to preview changes
Write-Host "`n==== DRY RUN - PREVIEW CHANGES ====`n" -ForegroundColor Cyan
"==== DRY RUN - PREVIEW CHANGES ====" | Out-File -FilePath $logFile -Append

foreach ($p in $patterns) {
    Process-Replacement -pattern $p.Pattern -replacement $p.Replacement -description $p.Description -DryRun
}

# Ask for confirmation
Write-Host "`n==== CONFIRMATION ====`n" -ForegroundColor Cyan
$confirmation = Read-Host "Do you want to proceed with the actual replacements? (y/n)"

if ($confirmation -eq 'y') {
    Write-Host "`n==== APPLYING CHANGES ====`n" -ForegroundColor Cyan
    "==== APPLYING CHANGES ====" | Out-File -FilePath $logFile -Append
    
    foreach ($p in $patterns) {
        Process-Replacement -pattern $p.Pattern -replacement $p.Replacement -description $p.Description
    }
    
    Write-Host "`nMigration completed successfully!" -ForegroundColor Green
    Write-Host "Backup files are stored in: $backupDir" -ForegroundColor Green
    Write-Host "Log file: $logFile" -ForegroundColor Green
} else {
    Write-Host "`nMigration cancelled. No files were modified." -ForegroundColor Yellow
    "Migration cancelled by user" | Out-File -FilePath $logFile -Append
}
