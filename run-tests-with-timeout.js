#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Running tests with timeout and logging...\n');

// Configuration
const TIMEOUT_MS = 15000; // 15 seconds max
const EARLY_STOP_ERRORS = 50; // Stop after this many errors

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create timestamp for files
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logsDir, `test-output-${timestamp}.txt`);
const summaryFile = path.join(logsDir, `test-summary-${timestamp}.txt`);

console.log(`Logging to: ${logFile}`);
console.log(`Timeout: ${TIMEOUT_MS/1000} seconds`);
console.log(`Early stop: After ${EARLY_STOP_ERRORS} errors\n`);

// Create streams
const logStream = fs.createWriteStream(logFile);
const summaryStream = fs.createWriteStream(summaryFile);

// Start test process
const testProcess = spawn('npm', ['test', '--', '--bail'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

// Tracking variables
let errorCount = 0;
let output = '';
let killed = false;

// Set timeout
const timeoutId = setTimeout(() => {
  if (!killed) {
    console.log('\n⏰ TIMEOUT REACHED (15 seconds) - Stopping tests...');
    killed = true;
    testProcess.kill('SIGINT');
  }
}, TIMEOUT_MS);

// Track progress
let lastActivity = Date.now();
const activityChecker = setInterval(() => {
  const timeSinceActivity = Date.now() - lastActivity;
  if (timeSinceActivity > 5000 && !killed) {
    process.stdout.write(' (waiting...)');
  }
}, 5000);

// Capture stdout
testProcess.stdout.on('data', (data) => {
  lastActivity = Date.now();
  const str = data.toString();
  output += str;
  logStream.write(str);
  
  // Count errors
  if (str.includes('Error:') || str.includes('× ')) {
    errorCount++;
  }
  
  // Show progress
  if (str.includes('PASS') || str.includes('FAIL')) {
    process.stdout.write('.');
  }
  
  // Early stop if too many errors
  if (errorCount >= EARLY_STOP_ERRORS && !killed) {
    console.log(`\n⚠️  TOO MANY ERRORS (${errorCount}) - Stopping early...`);
    killed = true;
    testProcess.kill('SIGINT');
  }
});

// Capture stderr
testProcess.stderr.on('data', (data) => {
  lastActivity = Date.now();
  const str = data.toString();
  output += `[STDERR] ${str}`;
  logStream.write(`[STDERR] ${str}`);
});

// Handle completion
testProcess.on('close', (code) => {
  clearTimeout(timeoutId);
  clearInterval(activityChecker);
  
  console.log('\n\n' + '='.repeat(50));
  console.log('TEST EXECUTION STOPPED');
  console.log('='.repeat(50));
  
  // Analyze what we captured
  const lines = output.split('\n');
  
  // Find important patterns
  const patterns = {
    testSuites: lines.find(l => l.includes('Test Suites:')),
    tests: lines.find(l => l.includes('Tests:')),
    infiniteLoops: lines.filter(l => l.includes('Maximum update depth')).length,
    missingMocks: lines.filter(l => l.includes('is not a function')).length,
    typeErrors: lines.filter(l => l.includes('TypeError')).length,
    failingSuites: lines.filter(l => l.includes('FAIL '))
  };
  
  // Write summary
  summaryStream.write('ALAN IDE Test Execution Summary (15s Quick Run)\n');
  summaryStream.write('==========================================\n\n');
  summaryStream.write(`Timestamp: ${new Date().toISOString()}\n`);
  summaryStream.write(`Duration: ~15 seconds (timeout)\n`);
  summaryStream.write(`Exit Code: ${code || 'KILLED'}\n`);
  summaryStream.write(`Total Errors Counted: ${errorCount}\n\n`);
  
  if (patterns.testSuites) {
    summaryStream.write(`Test Stats: ${patterns.testSuites}\n`);
  }
  if (patterns.tests) {
    summaryStream.write(`Test Count: ${patterns.tests}\n`);
  }
  
  summaryStream.write('\nError Breakdown:\n');
  summaryStream.write(`  Infinite Loops: ${patterns.infiniteLoops}\n`);
  summaryStream.write(`  Missing Mocks: ${patterns.missingMocks}\n`);
  summaryStream.write(`  Type Errors: ${patterns.typeErrors}\n`);
  
  summaryStream.write('\nFailing Test Suites:\n');
  patterns.failingSuites.slice(0, 5).forEach(suite => {
    summaryStream.write(`  ${suite}\n`);
  });
  
  summaryStream.write('\nRecommended Next Steps:\n');
  if (patterns.infiniteLoops > 0) {
    summaryStream.write('1. Run: node find-infinite-loops.js\n');
  }
  if (patterns.missingMocks > 0) {
    summaryStream.write('2. Run: node fix-test-issues.js\n');
  }
  summaryStream.write('3. Focus on fixing the first failing test suite\n');
  summaryStream.write('4. Run individual tests to isolate issues\n');
  
  logStream.end();
  summaryStream.end();
  
  // Show summary to console
  console.log('\nQuick Summary:');
  console.log(`Errors Detected: ${errorCount}`);
  console.log(`Infinite Loops: ${patterns.infiniteLoops}`);
  console.log(`Missing Mocks: ${patterns.missingMocks}`);
  console.log(`Type Errors: ${patterns.typeErrors}`);
  
  console.log('\nFiles created:');
  console.log(`  Full log: ${logFile}`);
  console.log(`  Summary: ${summaryFile}`);
  
  console.log('\nNext actions:');
  if (patterns.infiniteLoops > 0) {
    console.log('  → Fix infinite loops first: node find-infinite-loops.js');
  } else if (patterns.missingMocks > 0) {
    console.log('  → Fix missing mocks: node fix-test-issues.js');
  } else {
    console.log('  → Check summary file for specific issues');
  }
});

// Handle process errors
testProcess.on('error', (error) => {
  console.error('\nProcess error:', error);
  clearTimeout(timeoutId);
  clearInterval(activityChecker);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\nUser interrupted - cleaning up...');
  killed = true;
  testProcess.kill('SIGINT');
  setTimeout(() => process.exit(0), 1000);
});

console.log('Running tests... Press Ctrl+C to stop manually\n');
