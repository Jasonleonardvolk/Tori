# MCP Server Troubleshooting Guide

This guide will help you resolve common issues with MCP servers in VS Code.

## Quick Start

1. **Close all current MCP server windows** that were started with the batch script
2. **Restart VS Code** completely (File > Exit/Quit and then reopen)
3. **Start MCP servers** by running: `.\start-all-mcp-servers.bat`
4. **Test in a new conversation** with Claude to see if the servers are connected

## Common Issues and Solutions

### "Not Connected" Error

If you see "Not connected" errors when trying to use MCP tools:

1. **Restart VS Code** - VS Code needs to be restarted to pick up changes to MCP settings
2. **Check server windows** - Make sure all MCP server windows are running and don't show errors
3. **Examine server output** - Look for any error messages in the terminal windows
4. **Try a new conversation** - Sometimes connections only work in a new conversation with Claude

### Server Installation Issues

If NPM packages fail to install:

1. **Check network connectivity**
2. **Try installing individual packages** with `npm install -g <package-name>`
3. **Clear NPM cache** with `npm cache clean --force`

### Other Troubleshooting Steps

1. **Verify settings file** - Double-check the cline_mcp_settings.json file
2. **Use the -f flag** - Try `npx -y -f @modelcontextprotocol/server-xxx` to force a clean installation
3. **Check VS Code extension** - Make sure the Claude extension is up to date

## Server-Specific Issues

### Filesystem Server

- Ensure paths are correctly formatted with forward slashes: `c:/Users/...`
- Verify the directories you're trying to access are in the allowed paths
- Test with a simpler command like listing the current directory

### Puppeteer Server

- Check if Chrome or Chromium is installed and accessible
- May need additional setup for headless browser automation
- Try basic navigation commands first

### Playwright Server

- Ensure Playwright is properly installed
- Check if browser binaries (Chromium, Firefox, WebKit) are accessible
- Try simple navigation commands before complex operations
- For persistent issues, try reinstalling with `npm install -g playwright`

### Figma Server

- May require Figma API token configuration
- Not all Figma operations may be available without proper authentication

## Last Resort

If nothing works:

1. **Uninstall and reinstall** the MCP servers and dependencies
2. **Check logs** in VS Code's Output panel (View > Output > Claude)
3. **Ask for help** in the Claude or MCP community forums
