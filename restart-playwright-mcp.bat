@echo off
echo Restarting Playwright MCP Server...

echo Stopping Playwright MCP server process...
taskkill /f /fi "WINDOWTITLE eq MCP: Playwright" 2>nul

echo Starting Playwright MCP Server...
start "MCP: Playwright" cmd /k npx -y @modelcontextprotocol/server-playwright

echo Playwright MCP Server restarted in a separate window.
echo You can now use this MCP server with Claude.