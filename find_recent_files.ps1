$directory = "C:\Users\jason\Desktop\tori\kha"
$cutoffTime = (Get-Date).AddHours(-36)
$outputFile = "$directory\recent_files.txt"

# Get all files created in the last 36 hours
$recentFiles = Get-ChildItem -Path $directory -Recurse -File | 
    Where-Object { $_.CreationTime -gt $cutoffTime } |
    Sort-Object CreationTime -Descending

# Output to console
Write-Host "Files created in the last 36 hours in $directory`:"
Write-Host "============================================================="
$recentFiles | Format-Table -Property FullName, CreationTime, Length -AutoSize

# Write to file
"Files created in the last 36 hours in $directory (as of $(Get-Date))" | Out-File -FilePath $outputFile
"=============================================================" | Out-File -FilePath $outputFile -Append
$recentFiles | 
    Select-Object FullName, CreationTime, @{Name="Size(KB)"; Expression={[math]::Round($_.Length/1KB, 2)}} | 
    Format-Table -AutoSize | 
    Out-File -FilePath $outputFile -Append

Write-Host "`nFound $($recentFiles.Count) recently created files."
Write-Host "Results have been saved to: $outputFile"
