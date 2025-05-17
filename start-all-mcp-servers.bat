@echo off
echo Starting All MCP Servers...

echo Starting Sequential Thinking MCP Server...
start "MCP: SequentialThinking" cmd /k npx -y @modelcontextprotocol/server-sequential-thinking

echo Starting Filesystem MCP Server...
start "MCP: Filesystem" cmd /k npx -y @modelcontextprotocol/server-filesystem "c:/Users/jason/Desktop/tori/kha" "c:/Users/jason/Desktop" "c:/Users/jason/Documents"

echo Starting Puppeteer MCP Server...
start "MCP: Puppeteer" cmd /k npx -y @modelcontextprotocol/server-puppeteer

echo Starting Figma MCP Server...
start "MCP: Figma" cmd /k npx -y figma-mcp

echo Starting Playwright MCP Server...
start "MCP: Playwright" cmd /k npx -y @modelcontextprotocol/server-playwright

echo All MCP Servers started in separate windows.
echo You can now use these MCP servers with Claude.
