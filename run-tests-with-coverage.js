#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting test execution with coverage...\n');

// Run tests with coverage
const testCommand = 'npm run test:coverage';

exec(testCommand, { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error running tests:');
    console.error(error.message);
    
    // Try to parse the error output for more details
    if (stderr) {
      console.error('\n📋 Error details:');
      console.error(stderr);
    }
    
    if (stdout) {
      console.log('\n📋 Test output:');
      console.log(stdout);
    }
    return;
  }

  console.log('✅ Tests completed!');
  console.log('\n📊 Test Output:');
  console.log(stdout);

  if (stderr) {
    console.log('\n⚠️  Warnings/Errors:');
    console.log(stderr);
  }

  // Try to find and display coverage report path
  console.log('\n📈 Coverage report should be available at:');
  console.log(`file://${path.join(__dirname, 'coverage', 'lcov-report', 'index.html')}`);
});
