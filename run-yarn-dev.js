/**
 * Run Yarn Dev Script for Puppeteer
 * 
 * This script runs 'yarn dev' in the project directory
 * and creates a server to allow Puppeteer to connect to the application.
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}============================================${colors.reset}`);
console.log(`${colors.magenta}ALAN IDE Yarn Dev Runner for Puppeteer${colors.reset}`);
console.log(`${colors.cyan}============================================${colors.reset}`);

// Start the application with yarn dev
console.log(`${colors.yellow}Starting application with 'yarn dev'...${colors.reset}`);

const yarnProcess = spawn('yarn', ['dev'], {
  cwd: __dirname,
  shell: true,
  stdio: 'pipe'
});

// Process output with colored logs
yarnProcess.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line.includes('server')) {
      console.log(`${colors.green}[SERVER] ${line}${colors.reset}`);
    } else if (line.includes('client')) {
      console.log(`${colors.blue}[CLIENT] ${line}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}${line}${colors.reset}`);
    }
  });
});

yarnProcess.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    console.log(`${colors.red}${line}${colors.reset}`);
  });
});

// Handle process exit
yarnProcess.on('close', (code) => {
  console.log(`${colors.yellow}Process exited with code ${code}${colors.reset}`);
});

// Create a simple status server that Puppeteer can connect to
const statusServer = http.createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'running', 
      clientUrl: 'http://localhost:3000',
      serverUrl: 'http://localhost:3003',
      wsUrl: 'ws://localhost:8082'
    }));
  } else if (req.url === '/') {
    const htmlPath = path.join(__dirname, 'start-app.html');
    fs.readFile(htmlPath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error loading start-app.html: ${err.message}`);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Status server port that Puppeteer can connect to
const STATUS_PORT = 8088;
statusServer.listen(STATUS_PORT, () => {
  console.log(`${colors.cyan}Status server running at http://localhost:${STATUS_PORT}${colors.reset}`);
  console.log(`${colors.cyan}Puppeteer can check status at http://localhost:${STATUS_PORT}/status${colors.reset}`);
});

// Create a simple HTML file to help monitor the application
const monitorHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ALAN IDE Monitor</title>
    <style>
        body { font-family: Arial, sans-serif; background: #1a1a1a; color: #e0e0e0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: #252525; padding: 20px; border-radius: 5px; }
        h1 { color: #4da6ff; }
        .status { margin: 20px 0; padding: 10px; border-radius: 4px; }
        .online { background: #1a3a1a; border-left: 4px solid #5cff5c; }
        .offline { background: #3a1a1a; border-left: 4px solid #ff5c5c; }
        button { background: #4da6ff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .links { margin-top: 20px; }
        .links a { display: inline-block; margin-right: 10px; background: #4da6ff; color: white; padding: 10px 15px; 
                   text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>ALAN IDE Application Monitor</h1>
        <div id="clientStatus" class="status offline">Client Status: Checking...</div>
        <div id="serverStatus" class="status offline">Server Status: Checking...</div>
        <div class="links">
            <a href="http://localhost:3000" target="_blank">Open Client</a>
            <a href="http://localhost:3003" target="_blank">Open Server</a>
            <a href="http://localhost:8082" target="_blank">WebSocket</a>
        </div>
        <div style="margin-top: 20px;">
            <button id="checkButton">Check Status</button>
        </div>
    </div>

    <script>
        function checkStatus() {
            // Check client
            fetch('http://localhost:3000', { method: 'HEAD' })
                .then(() => {
                    document.getElementById('clientStatus').className = 'status online';
                    document.getElementById('clientStatus').textContent = 'Client Status: Online';
                })
                .catch(() => {
                    document.getElementById('clientStatus').className = 'status offline';
                    document.getElementById('clientStatus').textContent = 'Client Status: Offline';
                });
            
            // Check server
            fetch('http://localhost:3003', { method: 'HEAD' })
                .then(() => {
                    document.getElementById('serverStatus').className = 'status online';
                    document.getElementById('serverStatus').textContent = 'Server Status: Online';
                })
                .catch(() => {
                    document.getElementById('serverStatus').className = 'status offline';
                    document.getElementById('serverStatus').textContent = 'Server Status: Offline';
                });
        }
        
        // Initial check
        checkStatus();
        
        // Setup periodic check every 5 seconds
        setInterval(checkStatus, 5000);
        
        // Button click
        document.getElementById('checkButton').addEventListener('click', checkStatus);
    </script>
</body>
</html>
`;

const monitorPath = path.join(__dirname, 'monitor.html');
fs.writeFileSync(monitorPath, monitorHtml);
console.log(`${colors.yellow}Created monitor page at: ${monitorPath}${colors.reset}`);
console.log(`${colors.yellow}You can open this file in a browser to monitor the application${colors.reset}`);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(`${colors.magenta}Shutting down...${colors.reset}`);
  yarnProcess.kill();
  statusServer.close();
  process.exit(0);
});

console.log(`\n${colors.green}Started 'yarn dev' - application should be running soon...${colors.reset}`);
console.log(`${colors.green}Client will be available at: http://localhost:3000${colors.reset}`);
console.log(`${colors.green}Server will be available at: http://localhost:3003${colors.reset}`);
console.log(`${colors.green}WebSocket will be available at: ws://localhost:8082${colors.reset}`);
console.log(`${colors.cyan}Press Ctrl+C to stop the application${colors.reset}`);
