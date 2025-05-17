# MCP Servers Setup

This document provides an overview of the MCP (Model Context Protocol) servers that have been set up in this project and how to use them.

## Installed MCP Servers

The following MCP servers have been configured:

1. **Sequential Thinking MCP Server**
   - Helps Claude break down complex problems into steps
   - Useful for planning and reasoning through multi-step tasks

2. **Filesystem MCP Server**
   - Allows Claude to interact with your filesystem
   - Can read, write, and search files in allowed directories

3. **Puppeteer MCP Server**
   - Enables browser automation using Google's Puppeteer
   - Useful for web scraping, testing, and automation

4. **Playwright MCP Server**
   - Provides advanced browser automation using Microsoft's Playwright
   - Supports multiple browsers (Chromium, Firefox, WebKit)

## Setup Instructions

To set up and start all MCP servers:

1. Run `setup-mcp-servers.bat` to configure and start all MCP servers
2. Restart VS Code for the changes to take effect
3. Start a new conversation with Claude to use the MCP servers

## Starting Individual Servers

You can start each server individually:

- `start-filesystem-mcp.bat` - Start the Filesystem server
- `start-playwright-mcp.bat` - Start the Playwright server

Or start all servers at once:

- `start-all-mcp-servers.bat` - Start all MCP servers

## Restarting Servers

If you need to restart the servers:

- `restart-filesystem-mcp.bat` - Restart the Filesystem server
- `restart-playwright-mcp.bat` - Restart the Playwright server

Or restart all servers at once:

- `restart-all-mcp-servers.bat` - Restart all MCP servers

## Testing Connections

To verify that the MCP servers are properly connected:

1. Run `node test-mcp-connections.js` to see information about all available servers
2. For specific servers:
   - `node test-mcp-filesystem.js` - Test the Filesystem server
   - `node test-mcp-playwright.js` - Test the Playwright server

## Usage Examples

### Sequential Thinking

Ask Claude to break down a complex problem:
```
Break down the process of creating a React application with authentication
```

### Filesystem

Ask Claude to interact with your files:
```
List all JavaScript files in the src directory
```

### Puppeteer

Ask Claude to automate browser tasks:
```
Use Puppeteer to take a screenshot of example.com
```

### Playwright

Ask Claude to perform advanced browser automation:
```
Use Playwright to extract product information from example.com
```

## Troubleshooting

If you encounter issues with the MCP servers:

1. Check if the server processes are running in separate terminal windows
2. Restart VS Code to refresh the MCP connections
3. Run the restart scripts for the specific servers
4. Refer to `MCP_TROUBLESHOOTING_STEPS.md` for more detailed troubleshooting

## Additional Documentation

- `PLAYWRIGHT_README.md` - Detailed information about the Playwright MCP server
- `PUPPETEER_README.md` - Detailed information about the Puppeteer MCP server
- `MCP_TROUBLESHOOTING_STEPS.md` - Troubleshooting guide for MCP servers