#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('Verifying Test Setup...\n');

// Run a simple test
console.log('Running tests with verbose output...');
exec('npm run test -- --verbose --bail', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('ERROR - Test run failed:');
    console.error('Error message:', error.message);
    
    // Find first failing test
    const failMatch = stdout.match(/fail (.+)\n/i);
    if (failMatch) {
      console.log('\nFirst failing test:', failMatch[1]);
    }
    
    // Show error context
    const lines = stdout.split('\n');
    const errorLines = lines.filter(line => 
      line.includes('Expected') || 
      line.includes('Received') || 
      line.includes('Error:') ||
      line.includes('Cannot resolve')
    );
    
    if (errorLines.length > 0) {
      console.log('\nKey error details:');
      errorLines.forEach(line => console.log('  ', line.trim()));
    }
  } else {
    console.log('SUCCESS - All tests passed!');
    
    // Extract test summary
    const summaryMatch = stdout.match(/Test Suites: (.+)/);
    if (summaryMatch) {
      console.log('\nSummary:', summaryMatch[0]);
    }
    
    // Run coverage
    console.log('\nGenerating coverage report...');
    exec('npm run test:coverage', { cwd: __dirname }, (coverageError, coverageStdout) => {
      if (coverageError) {
        console.error('ERROR - Coverage generation failed');
      } else {
        console.log('SUCCESS - Coverage report generated');
        console.log('View at: coverage/lcov-report/index.html');
      }
    });
  }
});
