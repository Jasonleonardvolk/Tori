#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Running ALAN IDE Tests with Fixed Configuration...\n');

// Create a logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logsDir, `test-run-${timestamp}.log`);

console.log('Phase 1: Running tests with proper buffer handling...');

// Use spawn instead of exec for better buffer handling
const testProcess = spawn('npm', ['run', 'test', '--', '--verbose', '--runInBand'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

let testOutput = '';
let errorOutput = '';

// Create log stream
const logStream = fs.createWriteStream(logFile);

// Handle stdout
testProcess.stdout.on('data', (data) => {
  const str = data.toString();
  testOutput += str;
  logStream.write(str);
  process.stdout.write('.');
});

// Handle stderr  
testProcess.stderr.on('data', (data) => {
  const str = data.toString();
  errorOutput += str;
  logStream.write(`STDERR: ${str}`);
  process.stderr.write('.');
});

// When process completes
testProcess.on('close', (code) => {
  logStream.end();
  
  console.log('\n\n--- TEST RESULTS ---');
  console.log(`Exit code: ${code}`);
  console.log(`Full log saved to: ${logFile}`);
  
  // Parse and show summary
  const lines = testOutput.split('\n');
  
  // Find test summary
  const summaryStart = lines.findIndex(line => line.includes('Test Suites:'));
  if (summaryStart !== -1) {
    console.log('\nTest Summary:');
    for (let i = summaryStart; i < summaryStart + 4 && i < lines.length; i++) {
      console.log(lines[i]);
    }
  }
  
  // Find failing tests
  const failedTests = lines.filter(line => line.includes('FAIL '));
  if (failedTests.length > 0) {
    console.log('\nFailed Test Suites:');
    failedTests.forEach(test => console.log(`  ${test}`));
  }
  
  // Find specific errors (excluding network errors)
  const errors = lines.filter(line => 
    line.includes('Error:') && 
    !line.includes('Network error') &&
    !line.includes('fetch')
  );
  
  if (errors.length > 0) {
    console.log('\nSpecific Errors:');
    errors.slice(0, 5).forEach(error => console.log(`  ${error.trim()}`));
  }
  
  // Show next steps
  console.log('\n--- NEXT STEPS ---');
  if (code === 0) {
    console.log('✅ All tests passed! Running coverage...');
    runCoverage();
  } else {
    console.log('❌ Tests failed. Common issues found:');
    console.log('1. window.matchMedia is not a function - Fixed in test-utils-complete.js');
    console.log('2. Network errors - Normal in test environment');
    console.log('\nTo debug specific tests:');
    console.log('  npm run test -- path/to/specific/test.js --verbose');
    console.log('\nTo view full details:');
    console.log(`  cat ${logFile}`);
  }
});

function runCoverage() {
  console.log('\nPhase 2: Generating coverage report...');
  
  const coverageProcess = spawn('npm', ['run', 'test:coverage'], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  coverageProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Coverage report generated!');
      console.log('View at: coverage/lcov-report/index.html');
      
      // Try to show coverage summary
      const summaryPath = path.join(__dirname, 'coverage', 'coverage-summary.json');
      if (fs.existsSync(summaryPath)) {
        try {
          const summary = require(summaryPath);
          const total = summary.total;
          console.log('\nCoverage Summary:');
          console.log(`  Lines: ${total.lines.pct}%`);
          console.log(`  Branches: ${total.branches.pct}%`);
          console.log(`  Functions: ${total.functions.pct}%`);
          console.log(`  Statements: ${total.statements.pct}%`);
        } catch (e) {
          console.log('Could not read coverage summary');
        }
      }
    } else {
      console.log('\n❌ Coverage generation failed');
    }
  });
}
