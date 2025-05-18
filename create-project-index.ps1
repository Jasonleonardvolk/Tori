$base = "C:\Users\jason\Desktop\tori\kha"
$exclude = "$base\data"

# Use proper backtick escaping for the paths with special characters
Get-ChildItem -Path $base -Recurse -File `
| Where-Object {
    $_.FullName -notlike "$exclude*" `
    -and $_.Extension -in @(".py", ".ts", ".tsx", ".js", ".json", ".md", ".html")
} `
| ForEach-Object {
    $_.FullName.Replace("$base\", "docs/kha/")
} `
| Set-Content "$base\project-index.txt"

Write-Host "Project index has been created at $base\project-index.txt"
