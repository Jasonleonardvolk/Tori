#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Running tests with complete mocks...\n');

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create timestamp for files
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logsDir, `test-mocked-${timestamp}.txt`);

console.log(`Logging to: ${logFile}\n`);

// Create log stream
const logStream = fs.createWriteStream(logFile);

// Run tests with our complete configuration
const testProcess = spawn('npm', ['test', '--', '--config', 'jest.config.complete.js'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let output = '';
let passCount = 0;
let failCount = 0;

// Capture stdout
testProcess.stdout.on('data', (data) => {
  const str = data.toString();
  output += str;
  logStream.write(str);
  
  // Count passes and fails
  if (str.includes('PASS')) passCount++;
  if (str.includes('FAIL')) failCount++;
  
  // Show progress
  if (str.includes('PASS') || str.includes('FAIL')) {
    process.stdout.write(str.includes('PASS') ? '✓' : '✗');
  }
});

// Capture stderr
testProcess.stderr.on('data', (data) => {
  const str = data.toString();
  output += `[STDERR] ${str}`;
  logStream.write(`[STDERR] ${str}`);
});

// Handle completion
testProcess.on('close', (code) => {
  logStream.end();
  
  console.log('\n\n' + '='.repeat(50));
  console.log('TEST EXECUTION COMPLETE WITH MOCKS');
  console.log('='.repeat(50));
  
  // Find test summary
  const lines = output.split('\n');
  const summaryLines = lines.filter(line => 
    line.includes('Test Suites:') || 
    line.includes('Tests:') || 
    line.includes('Snapshots:') || 
    line.includes('Time:')
  );
  
  // Find failing tests
  const failingTests = lines.filter(line => line.includes('FAIL '));
  const actualErrors = lines.filter(line => line.includes('× ') && !line.includes('mock'));
  
  console.log('\nResults:');
  console.log(`Exit Code: ${code}`);
  console.log(`Pass Count: ${passCount}`);
  console.log(`Fail Count: ${failCount}`);
  
  if (summaryLines.length > 0) {
    console.log('\nTest Summary:');
    summaryLines.forEach(line => console.log(`  ${line}`));
  }
  
  if (failingTests.length > 0) {
    console.log('\nFailing Test Suites:');
    failingTests.slice(0, 5).forEach(test => console.log(`  ${test}`));
  }
  
  if (actualErrors.length > 0) {
    console.log('\nActual Errors:');
    actualErrors.slice(0, 5).forEach(error => console.log(`  ${error}`));
  }
  
  console.log(`\nFull log saved to: ${logFile}`);
  
  if (code === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The mock implementation worked!');
  } else {
    console.log('\n🔍 Some tests still failing. Check the log for details.');
    console.log('The exporterService mock is now complete, so any remaining failures');
    console.log('are likely due to other issues that need individual attention.');
  }
});

// Handle process errors
testProcess.on('error', (error) => {
  console.error('\nProcess error:', error);
});

console.log('Running tests with complete mocks...\n');
