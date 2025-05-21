# PowerShell script to sort files chronologically

$sourceFolder = "C:\Users\jason\Desktop\tori\kha\docs\StrategicMarketingPlan\ChatTalk"
$outputFile = "C:\Users\jason\Desktop\tori\kha\docs\StrategicMarketingPlan\ChatTalk\SortedFilesList.txt"
$sortedFilesFolder = "C:\Users\jason\Desktop\tori\kha\docs\StrategicMarketingPlan\ChatTalk\SortedFiles"

# Create the sorted files folder if it doesn't exist
if (-not (Test-Path $sortedFilesFolder)) {
    New-Item -Path $sortedFilesFolder -ItemType Directory | Out-Null
}

Write-Host "Sorting files chronologically..."

# Get all files in the source folder
$files = Get-ChildItem -Path $sourceFolder -File | Where-Object { $_.Name -ne "SortedFilesList.txt" }

# Sort files by creation time
$sortedFiles = $files | Sort-Object CreationTime

# Create a numbered list of the sorted files
$sortedFilesList = @()
$counter = 1

foreach ($file in $sortedFiles) {
    $paddedCounter = "{0:D3}" -f $counter
    $newFileName = "$paddedCounter - $($file.Name)"
    $sortedFilesList += "$paddedCounter. $($file.Name) - Created: $($file.CreationTime)"
    
    # Copy the file to the sorted folder with a numbered prefix
    Copy-Item -Path $file.FullName -Destination (Join-Path $sortedFilesFolder $newFileName)
    
    $counter++
}

# Write the sorted list to a file
$sortedFilesList | Out-File -FilePath $outputFile -Encoding utf8

Write-Host "Files sorted chronologically!"
Write-Host "A sorted list has been saved to: $outputFile"
Write-Host "Numbered copies of the files have been placed in: $sortedFilesFolder"
Write-Host ""
Write-Host "The files in chronological order are:"
$sortedFilesList | ForEach-Object { Write-Host $_ }
