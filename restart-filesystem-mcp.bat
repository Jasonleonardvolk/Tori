@echo off
echo Restarting Filesystem MCP Server...
taskkill /f /im node.exe /fi "WINDOWTITLE eq MCP: filesystem*" 2>nul
cd /d %~dp0
start "MCP: filesystem" cmd /k npx -y @modelcontextprotocol/server-filesystem "c:/Users/jason/Desktop/tori/kha" "c:/Users/jason/Desktop" "c:/Users/jason/Documents"
echo Filesystem MCP Server started in a new window
