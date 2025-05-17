#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Running tests with full logging...\n');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create timestamp for unique log file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logsDir, `test-output-${timestamp}.txt`);

console.log(`Logging all output to: ${logFile}\n`);

// Create write stream for log file
const logStream = fs.createWriteStream(logFile);

// Also create a summary file
const summaryFile = path.join(logsDir, `test-summary-${timestamp}.txt`);
const summaryStream = fs.createWriteStream(summaryFile);

console.log('Starting npm test...');
console.log('This will capture ALL output (including thousands of lines)\n');

// Run npm test
const testProcess = spawn('npm', ['test'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

// Variables to track test progress
let testOutput = '';
let errorCount = 0;
let passCount = 0;
let failCount = 0;
let totalTests = 0;

// Show progress dots while tests run
let dots = 0;
const progressInterval = setInterval(() => {
  process.stdout.write('.');
  dots++;
  if (dots >= 50) {
    process.stdout.write('\n');
    dots = 0;
  }
}, 200);

// Capture stdout
testProcess.stdout.on('data', (data) => {
  const str = data.toString();
  testOutput += str;
  logStream.write(str);
  
  // Track test results in realtime
  if (str.includes('PASS')) passCount++;
  if (str.includes('FAIL')) failCount++;
  if (str.includes('× ')) errorCount++;
});

// Capture stderr
testProcess.stderr.on('data', (data) => {
  const str = data.toString();
  testOutput += `[STDERR] ${str}`;
  logStream.write(`[STDERR] ${str}`);
});

// When process completes
testProcess.on('close', (code) => {
  clearInterval(progressInterval);
  logStream.end();
  
  console.log('\n\n' + '='.repeat(50));
  console.log('TEST EXECUTION COMPLETE');
  console.log('='.repeat(50));
  
  // Analyze the output
  const lines = testOutput.split('\n');
  
  // Find test summary
  const summaryLines = lines.filter(line => 
    line.includes('Test Suites:') || 
    line.includes('Tests:') || 
    line.includes('Snapshots:') || 
    line.includes('Time:')
  );
  
  // Find failing tests
  const failingTests = lines.filter(line => line.includes('FAIL '));
  
  // Find specific errors
  const errorTypes = {
    'Maximum update depth exceeded': 0,
    'TypeError': 0,
    'Cannot read property': 0,
    'Cannot read properties': 0,
    'ReferenceError': 0,
    'Cannot resolve dependency': 0,
    'subscribeToUpdates is not a function': 0,
    'clear is not a function': 0
  };
  
  lines.forEach(line => {
    Object.keys(errorTypes).forEach(errorType => {
      if (line.includes(errorType)) {
        errorTypes[errorType]++;
      }
    });
  });
  
  // Write summary
  summaryStream.write('ALAN IDE Test Execution Summary\n');
  summaryStream.write('===============================\n\n');
  summaryStream.write(`Timestamp: ${new Date().toISOString()}\n`);
  summaryStream.write(`Exit Code: ${code}\n\n`);
  
  if (summaryLines.length > 0) {
    summaryStream.write('Test Statistics:\n');
    summaryLines.forEach(line => {
      summaryStream.write(`  ${line}\n`);
    });
    summaryStream.write('\n');
  }
  
  summaryStream.write('Failing Test Suites:\n');
  if (failingTests.length > 0) {
    failingTests.forEach(test => {
      summaryStream.write(`  ${test}\n`);
    });
  } else {
    summaryStream.write('  None\n');
  }
  summaryStream.write('\n');
  
  summaryStream.write('Error Type Breakdown:\n');
  Object.entries(errorTypes).forEach(([error, count]) => {
    if (count > 0) {
      summaryStream.write(`  ${error}: ${count} occurrences\n`);
    }
  });
  
  // Add recommendations
  summaryStream.write('\nRecommended Actions:\n');
  if (errorTypes['Maximum update depth exceeded'] > 0) {
    summaryStream.write('  1. Fix infinite loop in useEffect hooks\n');
  }
  if (errorTypes['subscribeToUpdates is not a function'] > 0) {
    summaryStream.write('  2. Update mocks for conceptGraphService\n');
  }
  if (errorTypes['clear is not a function'] > 0) {
    summaryStream.write('  3. Add missing service methods to mocks\n');
  }
  if (failingTests.length > 0) {
    summaryStream.write('  4. Run tests individually to debug specific failures\n');
  }
  
  summaryStream.end();
  
  // Display summary to console
  console.log('\nSUMMARY:');
  console.log(`Exit Code: ${code}`);
  console.log(`Total Errors Detected: ${errorCount}`);
  
  if (summaryLines.length > 0) {
    console.log('\nTest Statistics:');
    summaryLines.forEach(line => console.log(`  ${line}`));
  }
  
  console.log('\nTop Error Types:');
  Object.entries(errorTypes)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([error, count]) => {
      console.log(`  ${error}: ${count} occurrences`);
    });
  
  console.log('\nFull logs saved to:');
  console.log(`  Detailed: ${logFile}`);
  console.log(`  Summary:  ${summaryFile}`);
  
  console.log('\n📝 To analyze the logs:');
  console.log(`  1. Review summary: type ${summaryFile}`);
  console.log(`  2. Search full log: findstr "error_type" ${logFile}`);
  console.log(`  3. View specific section: more ${logFile}`);
});

testProcess.on('error', (error) => {
  console.error('\nProcess error:', error);
  logStream.write(`\nProcess error: ${error}\n`);
  logStream.end();
  summaryStream.write(`\nProcess error: ${error}\n`);
  summaryStream.end();
});

// Graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\nTest execution interrupted by user');
  testProcess.kill();
  logStream.end();
  summaryStream.end();
  process.exit(0);
});
