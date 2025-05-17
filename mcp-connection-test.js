const http = require('http');

// Function to make an HTTP request to the MCP server
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000, // Default MCP server port
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    console.log(`Making ${method} request to http://${options.hostname}:${options.port}${path}`);

    const req = http.request(options, (res) => {
      let responseData = '';
      
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers)}`);
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('Response received successfully');
        try {
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (error) {
          console.log('Response was not valid JSON:', responseData);
          resolve(responseData);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Request error: ${error.message}`);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Try both common MCP server ports
async function tryPorts() {
  const ports = [3000, 3030, 8000];
  let connected = false;
  
  for (const port of ports) {
    try {
      console.log(`\nTrying port ${port}...`);
      const options = {
        hostname: 'localhost',
        port,
        path: '/',
        method: 'GET',
      };
      
      await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          console.log(`Port ${port} is open! Status: ${res.statusCode}`);
          connected = true;
          resolve();
        });
        
        req.on('error', (error) => {
          console.log(`Port ${port} is not available: ${error.message}`);
          resolve();
        });
        
        req.end();
      });
      
      if (connected) break;
    } catch (error) {
      console.log(`Error testing port ${port}: ${error.message}`);
    }
  }
  
  return connected;
}

// Check if MCP server is running in stdio mode
function checkStdioServer() {
  console.log('\nChecking for stdio MCP server processes...');
  const { execSync } = require('child_process');
  
  try {
    // Get list of running Node processes
    const processes = execSync('tasklist /fi "imagename eq node.exe" /v', { encoding: 'utf8' });
    console.log(processes);
    
    // Check if any are running MCP servers
    const mcpProcesses = processes.toLowerCase().includes('modelcontextprotocol');
    
    if (mcpProcesses) {
      console.log('✅ Found running MCP server processes!');
      return true;
    } else {
      console.log('❌ No MCP server processes found running.');
      return false;
    }
  } catch (error) {
    console.error('Error checking processes:', error.message);
    return false;
  }
}

async function testMCPConnection() {
  console.log('===== MCP SERVER CONNECTION TEST =====');
  console.log('Testing connection to MCP servers...');
  
  // Check for stdio servers
  const stdioRunning = checkStdioServer();
  
  // Check for HTTP/SSE servers
  const portAvailable = await tryPorts();
  
  if (!stdioRunning && !portAvailable) {
    console.log('\n❌ ERROR: No MCP servers appear to be running!');
    console.log('Please start your MCP server using one of these methods:');
    console.log('1. Run start-mcp-servers.bat');
    console.log('2. Run start-filesystem-mcp.bat');
    console.log('3. Ensure VS Code or Cline has started the MCP server');
    return;
  }
  
  console.log('\n--- Diagnostic Information ---');
  console.log('1. MCP server appears to be running');
  console.log('2. Check VS Code output panel for MCP connection logs:');
  console.log('   - Run command "MCP: List Servers"');
  console.log('   - Click "Show Output" for your server');
  console.log('3. For Cline, check that server is enabled in settings');
  console.log('\n--- Next Steps ---');
  console.log('If the server is running but VS Code shows "Not connected":');
  console.log('1. Restart VS Code');
  console.log('2. Ensure your MCP configuration has the correct transportType (stdio/sse/http)');
  console.log('3. Try the CLI tool: npx @wong2/mcp-cli --stdio "npx -y @modelcontextprotocol/server-filesystem c:/Users/jason/Desktop/tori/kha"');
}

// Run the test
testMCPConnection();
