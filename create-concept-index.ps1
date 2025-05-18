# Script to inventory all .md and .json files in the kha directory
# This creates an index for ψ-mapping and concept embedding

# Navigate to the kha directory
Set-Location "C:\Users\jason\Desktop\tori\kha"

# Create output file
$outputFile = "concept-files-index.txt"

# Add header to the file
"# Concept Files Index for Chopin Project" | Out-File -FilePath $outputFile
"# Generated: $(Get-Date)" | Out-File -FilePath $outputFile -Append
"" | Out-File -FilePath $outputFile -Append

# Find all markdown files
"## Markdown Files (.md)" | Out-File -FilePath $outputFile -Append
Get-ChildItem -Path . -Filter *.md -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace("$PWD\", "").Replace("\", "/")
    "docs/kha/$relativePath | $($_.FullName)" | Out-File -FilePath $outputFile -Append
}
"" | Out-File -FilePath $outputFile -Append

# Find all JSON files
"## JSON Files (.json)" | Out-File -FilePath $outputFile -Append
Get-ChildItem -Path . -Filter *.json -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace("$PWD\", "").Replace("\", "/")
    "docs/kha/$relativePath | $($_.FullName)" | Out-File -FilePath $outputFile -Append
}

# Count the files
$mdCount = (Get-ChildItem -Path . -Filter *.md -Recurse -File).Count
$jsonCount = (Get-ChildItem -Path . -Filter *.json -Recurse -File).Count
"" | Out-File -FilePath $outputFile -Append
"## Summary" | Out-File -FilePath $outputFile -Append
"Total Markdown files: $mdCount" | Out-File -FilePath $outputFile -Append
"Total JSON files: $jsonCount" | Out-File -FilePath $outputFile -Append
"Total concept files: $($mdCount + $jsonCount)" | Out-File -FilePath $outputFile -Append

# Create a version ready for upload to Google Cloud Storage
$gcsOutputFile = "gcs-concept-files-index.txt"
"# Concept Files Index for Chopin Project" | Out-File -FilePath $gcsOutputFile
"# Generated: $(Get-Date)" | Out-File -FilePath $gcsOutputFile -Append
"" | Out-File -FilePath $gcsOutputFile -Append

# Markdown files in GCS format
"## Markdown Files (.md)" | Out-File -FilePath $gcsOutputFile -Append
Get-ChildItem -Path . -Filter *.md -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace("$PWD\", "").Replace("\", "/")
    "gs://chopinbucket1/docs/kha/$relativePath" | Out-File -FilePath $gcsOutputFile -Append
}
"" | Out-File -FilePath $gcsOutputFile -Append

# JSON files in GCS format
"## JSON Files (.json)" | Out-File -FilePath $gcsOutputFile -Append
Get-ChildItem -Path . -Filter *.json -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace("$PWD\", "").Replace("\", "/")
    "gs://chopinbucket1/docs/kha/$relativePath" | Out-File -FilePath $gcsOutputFile -Append
}

# Also create a version with public URLs
$publicOutputFile = "public-concept-files-index.txt"
"# Concept Files Index for Chopin Project (Public URLs)" | Out-File -FilePath $publicOutputFile
"# Generated: $(Get-Date)" | Out-File -FilePath $publicOutputFile -Append
"" | Out-File -FilePath $publicOutputFile -Append

# Markdown files with public URLs
"## Markdown Files (.md)" | Out-File -FilePath $publicOutputFile -Append
Get-ChildItem -Path . -Filter *.md -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace("$PWD\", "").Replace("\", "/")
    "https://storage.googleapis.com/chopinbucket1/docs/kha/$relativePath" | Out-File -FilePath $publicOutputFile -Append
}
"" | Out-File -FilePath $publicOutputFile -Append

# JSON files with public URLs
"## JSON Files (.json)" | Out-File -FilePath $publicOutputFile -Append
Get-ChildItem -Path . -Filter *.json -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace("$PWD\", "").Replace("\", "/")
    "https://storage.googleapis.com/chopinbucket1/docs/kha/$relativePath" | Out-File -FilePath $publicOutputFile -Append
}

Write-Host "Inventory complete. Found $mdCount Markdown files and $jsonCount JSON files."
Write-Host "Results saved to:"
Write-Host "- $outputFile (Standard format)"
Write-Host "- $gcsOutputFile (Google Cloud Storage paths)"
Write-Host "- $publicOutputFile (Public URLs)"
Write-Host ""
Write-Host "To upload the index file to Google Cloud Storage, run:"
Write-Host "gsutil cp $gcsOutputFile gs://chopinbucket1/Chopin/concept-files-index.txt"
