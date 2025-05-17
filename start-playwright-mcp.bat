@echo off
echo Starting Playwright MCP Server...
start "MCP: Playwright" cmd /k npx -y @modelcontextprotocol/server-playwright
echo Playwright MCP Server started in a separate window.
echo You can now use this MCP server with Claude.