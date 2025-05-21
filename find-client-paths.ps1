# Define the pattern we're looking for
$pattern = 'client[/\\]'

# Define common folders to skip
$excludeDirs = @('node_modules', '.git', 'dist', 'build', 'out')

# Get matching files excluding noisy dirs
$files = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $path = $_.FullName
    -not ($excludeDirs | ForEach-Object { $path -like "*\$_\*" })
}

# Search those files for the pattern and list paths
$matches = $files | Select-String -Pattern $pattern -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Path -Unique

# Output each match
foreach ($file in $matches) {
    Write-Host "Would patch: $file"
}
