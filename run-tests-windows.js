#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Running ALAN IDE Tests - Windows Version...\n');

// Create a logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logsDir, `test-run-${timestamp}.log`);

console.log('Phase 1: Running tests with proper buffer handling...');

// Use npm.cmd for Windows
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// Try to run Jest directly first
const testArgs = ['--verbose', '--runInBand', '--forceExit'];
const testProcess = spawn(path.join('node_modules', '.bin', 'jest'), testArgs, {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let testOutput = '';
let errorOutput = '';
let dots = 0;

// Create log stream
const logStream = fs.createWriteStream(logFile);

// Show progress
const progressInterval = setInterval(() => {
  process.stdout.write('.');
  dots++;
  if (dots >= 50) {
    process.stdout.write('\n');
    dots = 0;
  }
}, 100);

// Handle stdout
testProcess.stdout.on('data', (data) => {
  const str = data.toString();
  testOutput += str;
  logStream.write(str);
});

// Handle stderr  
testProcess.stderr.on('data', (data) => {
  const str = data.toString();
  errorOutput += str;
  logStream.write(`STDERR: ${str}`);
});

// When process completes
testProcess.on('close', (code) => {
  clearInterval(progressInterval);
  logStream.end();
  
  console.log('\n\n--- TEST RESULTS ---');
  console.log(`Exit code: ${code}`);
  console.log(`Full log saved to: ${logFile}`);
  
  // If Jest couldn't run, try npm run test as fallback
  if (code === null || testOutput.length === 0) {
    console.log('\nJest direct execution failed. Trying npm run test...\n');
    runWithNpm();
    return;
  }
  
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
  
  // Show next steps
  console.log('\n--- NEXT STEPS ---');
  if (code === 0) {
    console.log('✅ All tests passed! Running coverage...');
    runCoverage();
  } else {
    console.log('❌ Tests failed. To debug specific issues:');
    console.log('  npx jest path/to/specific/test.js --verbose');
    console.log('\nTo view full details:');
    console.log(`  type ${logFile}`);
  }
});

testProcess.on('error', (error) => {
  clearInterval(progressInterval);
  console.error('\nDirect Jest execution failed:', error.message);
  console.log('Trying npm run test as fallback...\n');
  runWithNpm();
});

function runWithNpm() {
  const npmProcess = spawn(npmCommand, ['run', 'test', '--', '--verbose'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });
  
  npmProcess.on('close', (code) => {
    console.log(`\nNPM test execution completed with code: ${code}`);
    
    if (code === 0) {
      console.log('\n✅ All tests passed! Running coverage...');
      runCoverage();
    } else {
      console.log('\n❌ Tests failed. Please check the output above.');
    }
  });
  
  npmProcess.on('error', (error) => {
    console.error('\nNPM execution failed:', error);
    console.log('\nPlease try manually running:');
    console.log('  npm test');
    console.log('Or:');
    console.log('  npx jest --version');
  });
}

function runCoverage() {
  console.log('\nPhase 2: Generating coverage report...');
  
  const coverageProcess = spawn(npmCommand, ['run', 'test:coverage'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
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
