@echo off
echo Setting up MCP servers...

echo Running PowerShell script to update MCP settings...
powershell -ExecutionPolicy Bypass -File update-all-mcp-servers.ps1

echo Starting all MCP servers...
call start-all-mcp-servers.bat

echo MCP servers have been set up and started.
echo Please restart VS Code for the changes to take effect.
echo After restarting VS Code, you can use the MCP servers with Claude.

pause