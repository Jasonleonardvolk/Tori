# PowerShell script to update VSCode settings.json with MCP filesystem server

$settingsPath = "c:\Users\jason\AppData\Roaming\Code\User\settings.json"
$settings = Get-Content -Path $settingsPath -Raw | ConvertFrom-Json

# Create the mcpServers property if it doesn't exist
if (-not (Get-Member -InputObject $settings -Name "roo-cline.mcpServers" -MemberType Properties)) {
    $settings | Add-Member -NotePropertyName "roo-cline.mcpServers" -NotePropertyValue @{}
}

# Add/update the filesystem server configuration
$filesystemServer = @{
    command = "npx"
    args = @(
        "-y", 
        "@modelcontextprotocol/server-filesystem", 
        "c:/Users/jason/Desktop/tori/kha",
        "c:/Users/jason/Desktop",
        "c:/Users/jason/Documents"
    )
    disabled = $false
}

$settings."roo-cline.mcpServers".filesystem = $filesystemServer

# Convert the settings object back to JSON and save it
$settingsJson = $settings | ConvertTo-Json -Depth 10
$settingsJson | Set-Content -Path $settingsPath

Write-Host "Updated VSCode settings.json with MCP filesystem server configuration"
