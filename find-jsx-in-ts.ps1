# Script to find .ts files containing JSX that should be renamed to .tsx
$pattern = 'jsx|tsx|<[A-Z][A-Za-z0-9]*|<\/[A-Z][A-Za-z0-9]*|React\.createElement'

# Define common folders to skip
$excludeDirs = @('node_modules', '.git', 'dist', 'build', 'out')

# Recursively get all .ts files excluding unwanted folders
$files = Get-ChildItem -Path . -Include "*.ts" -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $path = $_.FullName
    -not ($excludeDirs | ForEach-Object { $path -like "*\$_\*" })
}

# Search for JSX patterns in those files
$matches = $files | Select-String -Pattern $pattern -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Path -Unique

# Output each match
Write-Host "Potential .ts files containing JSX that should be renamed to .tsx:" -ForegroundColor Yellow
foreach ($file in $matches) {
    Write-Host $file -ForegroundColor Cyan
}
