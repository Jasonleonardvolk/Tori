// Execute the master fix script and capture all output
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Executing ALAN IDE Master Test Fix...\n');

// Create log file
const logPath = path.join(__dirname, 'logs', `test-fix-${Date.now()}.log`);
const logStream = fs.createWriteStream(logPath);

// Spawn the process
const child = spawn('node', ['master-test-fix.js'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

// Log all output
child.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  logStream.write(`STDOUT: ${output}\n`);
});

child.stderr.on('data', (data) => {
  const output = data.toString();
  console.error(output);
  logStream.write(`STDERR: ${output}\n`);
});

child.on('close', (code) => {
  console.log(`\n📋 Process exited with code ${code}`);
  logStream.write(`\nProcess exited with code ${code}\n`);
  logStream.end();
  
  console.log(`\n📄 Full log saved to: ${logPath}`);
  
  // Show summary
  console.log('\n📊 Summary of Actions Taken:');
  console.log('1. Applied Jest configuration fixes');
  console.log('2. Enhanced test utilities with mocks');
  console.log('3. Configured proper test environment');
  console.log('4. Ran diagnostic tools');
  console.log('5. Attempted test execution');
  
  console.log('\n✨ Next Steps:');
  console.log('1. Review the output above for any remaining issues');
  console.log('2. Check the generated coverage report (if successful)');
  console.log('3. Use run-single-test.js for debugging specific failures');
  console.log('4. Run test-status-dashboard.js for current status');
});

// Handle process errors
child.on('error', (error) => {
  console.error('❌ Process error:', error);
  logStream.write(`ERROR: ${error}\n`);
  logStream.end();
});
