$directory = "C:\Users\jason\Desktop\tori\kha\docs\conversations\cline"
$outputFile = "C:\Users\jason\Desktop\tori\kha\file_sizes.txt"

# Get files and their sizes
$files = Get-ChildItem -Path $directory -File | 
    Select-Object Name, @{Name="SizeKB"; Expression={[math]::Round($_.Length/1KB, 2)}}, FullName |
    Sort-Object SizeKB -Descending

# Write information to file
"File sizes in $directory (as of $(Get-Date))" | Out-File $outputFile
"=============================================================" | Out-File $outputFile -Append
$files | Format-Table -Property Name, SizeKB, FullName -AutoSize | Out-File $outputFile -Append

# Calculate total file size
$totalSizeKB = ($files | Measure-Object -Property SizeKB -Sum).Sum
"Total size: $totalSizeKB KB" | Out-File $outputFile -Append

# Output on screen as well
Write-Host "File sizes information saved to: $outputFile"
