#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🧪 Verifying Test Setup...
');

// Run a simple test
console.log('Running tests with verbose output...');
exec('npm run test -- --verbose --bail', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Test run failed:');
    console.error('Error:', error.message);
    
    // Find first failing test
    const failMatch = stdout.match(/✕ (.+)\n/);
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
    console.log('✅ All tests passed!');
    
    // Extract test summary
    const summaryMatch = stdout.match(/Test Suites: (.+)/);
    if (summaryMatch) {
      console.log('\nSummary:', summaryMatch[0]);
    }
    
    // Run coverage
    console.log('\nGenerating coverage report...');
    exec('npm run test:coverage', { cwd: __dirname }, (coverageError, coverageStdout) => {
      if (coverageError) {
        console.error('❌ Coverage generation failed');
      } else {
        console.log('✅ Coverage report generated');
        console.log('View at: coverage/lcov-report/index.html');
      }
    });
  }
});
