# PowerShell script to update MCP server configurations for Roo

# Update local .roo/mcp.json
$localMcpPath = ".\.roo\mcp.json"
$localMcp = Get-Content -Path $localMcpPath -Raw | ConvertFrom-Json

# Create the mcpServers property if it doesn't exist
if (-not $localMcp.mcpServers) {
    $localMcp.mcpServers = @{}
}

# Update global Roo MCP settings
$globalMcpPath = "c:\Users\jason\AppData\Roaming\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\mcp_settings.json"
$globalMcp = Get-Content -Path $globalMcpPath -Raw | ConvertFrom-Json

# Create the mcpServers property if it doesn't exist
if (-not $globalMcp.mcpServers) {
    $globalMcp.mcpServers = @{}
}

# Add/update the Sequential Thinking server configuration
$sequentialThinkingServer = @{
    command = "npx"
    args = @(
        "-y", 
        "@modelcontextprotocol/server-sequential-thinking"
    )
    disabled = $false
    autoApprove = @()
}

# Add/update the Filesystem server configuration
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
    autoApprove = @()
}

# Add/update the Puppeteer server configuration
$puppeteerServer = @{
    command = "npx"
    args = @(
        "-y", 
        "@modelcontextprotocol/server-puppeteer"
    )
    disabled = $false
    autoApprove = @()
}

# Add/update the Playwright server configuration
$playwrightServer = @{
    command = "npx"
    args = @(
        "-y", 
        "@modelcontextprotocol/server-playwright"
    )
    disabled = $false
    autoApprove = @()
}

# Update local MCP settings
$localMcp.mcpServers."github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking" = $sequentialThinkingServer
$localMcp.mcpServers.filesystem = $filesystemServer
$localMcp.mcpServers.puppeteer = $puppeteerServer
$localMcp.mcpServers.playwright = $playwrightServer

# Update global MCP settings
$globalMcp.mcpServers."github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking" = $sequentialThinkingServer
$globalMcp.mcpServers.filesystem = $filesystemServer
$globalMcp.mcpServers.puppeteer = $puppeteerServer
$globalMcp.mcpServers.playwright = $playwrightServer

# Convert the settings objects back to JSON and save them
$localMcpJson = $localMcp | ConvertTo-Json -Depth 10
$localMcpJson | Set-Content -Path $localMcpPath

$globalMcpJson = $globalMcp | ConvertTo-Json -Depth 10
$globalMcpJson | Set-Content -Path $globalMcpPath

Write-Host "Updated MCP server configurations for Roo"
Write-Host "Please restart VS Code for the changes to take effect"