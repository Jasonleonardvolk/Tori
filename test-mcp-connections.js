// Test MCP Connections
// This script will help you verify if MCP servers are properly connected

console.log("===== MCP CONNECTION TEST =====");
console.log("Run this script to check if MCP servers are properly connected to Claude.");
console.log("If servers are working, Claude should be able to use their tools.");

console.log("\n----- Available MCP Servers -----");
console.log("1. Sequential Thinking Server");
console.log("   - Tool: sequential_thinking");
console.log("   - Use for: Breaking down complex problems into steps, planning with revision");

console.log("\n2. Filesystem Server");
console.log("   - Tools: list_directory, read_file, write_file, etc.");
console.log("   - Allowed directories:");
console.log("     - c:/Users/jason/Desktop/tori/kha");
console.log("     - c:/Users/jason/Desktop");
console.log("     - c:/Users/jason/Documents");

console.log("\n3. Puppeteer Server");
console.log("   - Tools: puppeteer_navigate, puppeteer_screenshot, puppeteer_click, etc.");
console.log("   - Use for: Browser automation and testing");

console.log("\n4. Playwright Server");
console.log("   - Tools: navigate, screenshot, pdf, click, type, extract_text, etc.");
console.log("   - Use for: Advanced browser automation and web scraping");

console.log("\n5. Figma Server");
console.log("   - May require Figma API token for full functionality");
console.log("   - Use for: Figma design operations");

console.log("\n----- Test Instructions -----");
console.log("1. Make sure you've restarted VS Code after updating MCP settings");
console.log("2. Run the start-all-mcp-servers.bat script");
console.log("3. Ask Claude to try a simple command for each server, such as:");
console.log("   - 'List files in my Desktop folder'");
console.log("   - 'Take a screenshot of example.com'");
console.log("   - 'Break down this problem: [your problem]'");

console.log("\nIf Claude responds with 'Not connected' errors, please refer to");
console.log("the MCP_TROUBLESHOOTING_STEPS.md file for solutions.");
