# Script to find JavaScript files containing JSX and rename them to .jsx
Write-Host "Finding .js files containing JSX syntax..."

# Define common folders to skip
$excludeDirs = @('node_modules', '.git', 'dist', 'build', 'out')

# JSX patterns to search for
$jsxPatterns = @(
    '<[A-Z][A-Za-z0-9]*',   # Opening JSX tags like <Component
    '<\/[A-Z][A-Za-z0-9]*', # Closing JSX tags like </Component>
    'React\.createElement',  # React.createElement calls
    'import React',          # React imports
    'React\.Fragment',       # React.Fragment usage
    '<>',                    # Fragment shorthand opening
    '</>'                    # Fragment shorthand closing
)

# Combine patterns into a single regex
$pattern = "($($jsxPatterns -join '|'))"

# Recursively get .js files excluding unwanted folders
$files = Get-ChildItem -Path "ide_frontend" -Filter "*.js" -Recurse -File | Where-Object {
    $path = $_.FullName
    -not ($excludeDirs | ForEach-Object { $path -like "*\$_\*" })
}

Write-Host "Found $($files.Count) .js files to check"

# Check each file for JSX patterns and rename if needed
$renamedCount = 0
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Check if the file contains JSX
    if ($content -match $pattern) {
        $newName = $file.FullName -replace "\.js$", ".jsx"
        Write-Host "Renaming to JSX: $($file.FullName)"
        
        # Rename the file
        Rename-Item -Path $file.FullName -NewName $newName -Force
        $renamedCount++
    }
}

Write-Host "Renamed $renamedCount files from .js to .jsx"
