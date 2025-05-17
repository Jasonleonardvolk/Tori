#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('Running ALAN IDE Tests Directly...\n');

// Let's try to run tests without all the extra scripts
console.log('Phase 1: Simple test run...');

exec('npm run test -- --verbose', { cwd: __dirname, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
  console.log('\n--- TEST OUTPUT ---');
  
  if (error) {
    console.log('ERROR: Tests failed');
    console.log('Exit code:', error.code);
    
    // Show relevant parts of the output
    const lines = stdout.split('\n');
    const failedTests = lines.filter(line => line.includes('FAIL'));
    const errors = lines.filter(line => line.includes('Error:') || line.includes('Expected') || line.includes('Received'));
    
    console.log('\nFailed test suites:');
    failedTests.forEach(line => console.log(`  ${line}`));
    
    console.log('\nError details (first 10):');
    errors.slice(0, 10).forEach(line => console.log(`  ${line}`));
    
    // Extract test summary
    const summaryMatch = stdout.match(/Test Suites:.+\n.+Tests:.+\n.+Snapshots:.+\n.+Time:/s);
    if (summaryMatch) {
      console.log('\nTest Summary:');
      console.log(summaryMatch[0]);
    }
  } else {
    console.log('SUCCESS: All tests passed!');
    console.log(stdout);
  }
  
  console.log('\nPhase 2: Attempting coverage...');
  
  // If tests ran (even with failures), try to generate coverage
  exec('npm run test:coverage', { cwd: __dirname, maxBuffer: 1024 * 1024 * 10 }, (coverageError, coverageStdout) => {
    if (coverageError) {
      console.log('Coverage failed - this is normal if tests are failing');
    } else {
      console.log('Coverage report generated!');
      console.log('View at: coverage/lcov-report/index.html');
      
      // Try to extract coverage summary
      const coverageMatch = coverageStdout.match(/All files.*?\s+(\d+\.\d+)/);
      if (coverageMatch) {
        console.log(`Overall coverage: ${coverageMatch[1]}%`);
      }
    }
    
    console.log('\n--- COMPLETE ---');
    console.log('To debug specific test failures, run:');
    console.log('  npm run test -- path/to/specific/test.js --verbose');
  });
});
