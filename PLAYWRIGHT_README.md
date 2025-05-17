# Playwright MCP Server

This document provides information about the Playwright MCP (Model Context Protocol) server and how to use it with Claude.

## Overview

The Playwright MCP server enables Claude to automate browser tasks using Microsoft's Playwright library. Playwright is a powerful browser automation framework that supports Chromium, Firefox, and WebKit browsers.

## Features

- **Multi-browser support**: Works with Chromium, Firefox, and WebKit
- **Headless or headed mode**: Run browsers visibly or in the background
- **Mobile device emulation**: Test responsive designs and mobile-specific features
- **Network interception**: Monitor, modify, or mock network requests
- **Screenshot and PDF generation**: Capture visual state of pages
- **Form automation**: Fill forms, click buttons, select options
- **Data extraction**: Extract text, HTML, or structured data from web pages
- **JavaScript execution**: Run custom JavaScript in the browser context
- **Cookie and storage management**: Manage browser state

## Setup

The Playwright MCP server is already configured in this project. To start it:

1. Run `start-playwright-mcp.bat` to start only the Playwright server
2. Or run `start-all-mcp-servers.bat` to start all MCP servers including Playwright

To restart the server if it's already running:

1. Run `restart-playwright-mcp.bat` to restart only the Playwright server
2. Or run `restart-all-mcp-servers.bat` to restart all MCP servers

## Usage Examples

Here are some examples of how to use the Playwright MCP server with Claude:

### Basic Navigation

Ask Claude to navigate to a website:
```
Can you navigate to example.com using Playwright?
```

### Taking Screenshots

Ask Claude to capture a screenshot:
```
Take a screenshot of example.com using Playwright
```

### Form Filling

Ask Claude to fill out a form:
```
Use Playwright to fill out the contact form on example.com with my name "John Doe" and email "john@example.com"
```

### Data Extraction

Ask Claude to extract data from a website:
```
Extract all product titles and prices from example.com using Playwright
```

### Complex Workflows

Ask Claude to perform multi-step operations:
```
Use Playwright to log into my account on example.com, navigate to my profile settings, and update my bio
```

## Troubleshooting

If you encounter issues with the Playwright MCP server:

1. Make sure the server is running (check for the terminal window titled "MCP: Playwright")
2. Restart VS Code to refresh the MCP connections
3. Try reinstalling Playwright with `npm install -g playwright`
4. Check if browser binaries are properly installed
5. For persistent issues, refer to the MCP_TROUBLESHOOTING_STEPS.md file

## Advanced Configuration

The Playwright MCP server can be configured with additional options. See the official Playwright documentation for more details: https://playwright.dev/docs/intro