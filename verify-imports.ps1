# Script to verify import paths after renaming directories
Write-Host "Verifying import paths across the codebase..."

# 1. Extract all import statements from JS/TS/JSX/TSX files
Write-Host "Step 1: Extracting import statements..."
$importResults = Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx -File -Exclude node_modules | 
    Select-String -Pattern 'import .* from' | 
    Select-Object Filename, LineNumber, Line

Write-Host "Found $($importResults.Count) import statements"

# 2. Check for any remaining references to old paths
Write-Host "`nStep 2: Checking for references to old directory names..."
$oldPaths = @("client/", "chat/")
$problemImports = @()

foreach ($import in $importResults) {
    foreach ($oldPath in $oldPaths) {
        if ($import.Line -match $oldPath) {
            $problemImports += [PSCustomObject]@{
                Filename = $import.Filename
                LineNumber = $import.LineNumber
                Line = $import.Line
                Problem = "Contains reference to '$oldPath'"
            }
        }
    }
}

# Output problem imports
if ($problemImports.Count -gt 0) {
    Write-Host "`n❌ Found $($problemImports.Count) import statements with old directory references:" -ForegroundColor Red
    $problemImports | Format-Table -AutoSize
    
    # Save problem imports to file for further analysis
    $problemImports | Export-Csv -Path "problem-imports.csv" -NoTypeInformation
    Write-Host "Problem imports saved to problem-imports.csv"
} else {
    Write-Host "`n✅ No references to old directory names found in import statements!" -ForegroundColor Green
}

# 3. Run TypeScript compiler to check for type errors
Write-Host "`nStep 3: Running TypeScript compiler to check for module resolution issues..."
Write-Host "Running: npx tsc --noEmit"
$tscOutput = npx tsc --noEmit 2>&1

# Check for module resolution errors
$moduleErrors = $tscOutput | Where-Object { $_ -match "Cannot find module" }

if ($moduleErrors.Count -gt 0) {
    Write-Host "`n❌ TypeScript found $($moduleErrors.Count) module resolution errors:" -ForegroundColor Red
    $moduleErrors | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
} else {
    Write-Host "`n✅ TypeScript compiler found no module resolution errors!" -ForegroundColor Green
}

# 4. Generate a more detailed module resolution log if needed
Write-Host "`nStep 4: Would you like to generate a detailed module resolution log? (y/n)"
$response = Read-Host

if ($response -eq 'y') {
    Write-Host "Generating detailed module resolution log..."
    npx tsc --traceResolution --noEmit > import-resolution.log
    Write-Host "Resolution log saved to import-resolution.log"
}

# 5. Check for ESLint errors (if ESLint is installed)
Write-Host "`nStep 5: Running ESLint to check for import errors..."
if (Test-Path node_modules/.bin/eslint) {
    Write-Host "Running: npx eslint . --ext .ts,.tsx,.js,.jsx --quiet --rule 'import/no-unresolved: error' --plugin import"
    $eslintOutput = npx eslint . --ext .ts,.tsx,.js,.jsx --quiet --rule "import/no-unresolved: error" --plugin import 2>&1
    
    if ($eslintOutput.Count -gt 0) {
        Write-Host "`n❌ ESLint found potential import issues:" -ForegroundColor Red
        $eslintOutput | ForEach-Object { Write-Host "  $_" }
    } else {
        Write-Host "`n✅ ESLint found no import resolution issues!" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️ ESLint not found. Skipping ESLint verification." -ForegroundColor Yellow
}

Write-Host "`n--------------------"
Write-Host "✅ Import verification complete!"
Write-Host "--------------------"
