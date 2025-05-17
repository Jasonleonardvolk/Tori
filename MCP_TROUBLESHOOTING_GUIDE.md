# MCP Server Connection Troubleshooting Guide

This guide will help you diagnose and fix connection issues with MCP (Model Context Protocol) servers in VS Code and Cline.

## Quick Solutions

1. **For Cline extension**: The filesystem server was disabled in your Cline settings. We've already fixed this by changing `"disabled": true` to `"disabled": false` in your Cline MCP settings file.

2. **For VS Code**: Ensure your MCP server is properly configured and running. Use the tools provided in this guide to diagnose connection issues.

## Diagnostic Tools

We've created two diagnostic tools to help troubleshoot MCP server connections:

1. **mcp-connection-test.js**: Checks if your MCP servers are running and accessible.
2. **test-mcp-connection.bat**: A comprehensive troubleshooter that:
   - Installs the MCP CLI tool
   - Checks for running MCP servers
   - Attempts to connect directly to the filesystem server

## Common Issues and Solutions

### 1. "Not Connected" Status in VS Code

**Possible causes:**
- MCP server is not running
- MCP server configuration is incorrect
- VS Code extension has a bug
- Server process failing to start or crashing

**Solutions:**
- Run `test-mcp-connection.bat` to diagnose the issue
- Check VS Code's output panel for MCP errors:
  - Run the command "MCP: List Servers"
  - Click "Show Output" for your server
- Ensure your MCP configuration has the correct transportType (stdio/sse/http)
- Restart VS Code

### 2. MCP Server Process Exits Immediately

**Possible causes:**
- Missing dependencies
- Configuration errors
- Build failures

**Solutions:**
- Check for errors in the VS Code output panel
- Try running the server manually using `npx -y @modelcontextprotocol/server-filesystem c:/Users/jason/Desktop/tori/kha`
- Look for error messages in the console

### 3. Cline Extension Not Connecting

**Solutions:**
- We've already fixed the disabled flag in your Cline settings
- Restart VS Code to apply the changes
- Make sure Cline is using the latest version of the MCP server

## Configuration Reference

### VS Code (Native) MCP Configuration
```json
"mcpServers": {
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"]
  },
  "github.com/modelcontextprotocol/servers/tree/main/src/filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "c:/Users/jason/Desktop/tori/kha"]
  },
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
    }
  }
}
```

### Cline MCP Configuration
```json
"mcpServers": {
  "github.com/modelcontextprotocol/servers/tree/main/src/filesystem": {
    "autoApprove": [],
    "disabled": false,
    "timeout": 60,
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "c:/Users/jason/Desktop/tori/kha"
    ],
    "transportType": "stdio"
  }
}
```

## Alternative Connection Methods

If VS Code or Cline still won't connect to your MCP server, try these alternatives:

1. **Use MCP CLI directly**:
   ```
   npx @wong2/mcp-cli --stdio "npx -y @modelcontextprotocol/server-filesystem c:/Users/jason/Desktop/tori/kha"
   ```
   
2. **Try a different client**:
   - Cursor IDE
   - Claude Desktop App
   - Anthropic's web interfaces

3. **Run in WSL** (if on Windows):
   - Some MCP servers work better in WSL due to native module dependencies
   - Configure your MCP server to run via WSL in the settings

## Next Steps

1. Run `test-mcp-connection.bat` to diagnose any remaining issues
2. Restart VS Code to apply the configuration changes
3. Check that both VS Code and Cline can connect to your MCP servers
4. If issues persist, examine the error logs for specific error messages
