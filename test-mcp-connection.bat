@echo off
echo ===== MCP CONNECTION TROUBLESHOOTER =====
echo.

echo Step 1: Installing MCP CLI tool...
call npx -y @wong2/mcp-cli --version
if %ERRORLEVEL% NEQ 0 (
  echo Failed to install MCP CLI tool. Please check your internet connection.
  exit /b 1
)
echo MCP CLI tool installed successfully.
echo.

echo Step 2: Testing if an MCP server is already running...
node mcp-connection-test.js
echo.

echo Step 3: Starting a test session with the Filesystem MCP server...
echo This will attempt to connect directly to the server using the MCP CLI.
echo Press Ctrl+C to exit when done testing.
echo.
echo Starting connection...
call npx -y @wong2/mcp-cli --stdio "npx -y @modelcontextprotocol/server-filesystem c:/Users/jason/Desktop/tori/kha"

echo.
echo Troubleshooting completed. If the above command connected successfully,
echo but VS Code still shows "Not connected", you might need to:
echo.
echo 1. Restart VS Code
echo 2. Check VS Code's Output panel for MCP errors (Ctrl+Shift+U)
echo 3. Make sure your settings.json's mcpServers section has the correct configuration
echo 4. Update VS Code to the latest version (at least 1.99+ for MCP support)
