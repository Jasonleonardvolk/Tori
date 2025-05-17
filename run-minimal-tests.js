#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('Running minimal test suite...\n');

const testProcess = spawn('npx', ['jest', '--config', 'jest.config.minimal.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

testProcess.on('close', (code) => {
  console.log(`\nTest process exited with code ${code}`);
  
  if (code === 0) {
    console.log('\n✅ Basic tests passed! Now trying React tests...');
    
    // Try a simple React test
    const reactTestPath = 'client/src/simple.test.js';
    
    console.log(`\nRunning React test: ${reactTestPath}`);
    
    const reactProcess = spawn('npx', ['jest', reactTestPath, '--verbose'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });
    
    reactProcess.on('close', (reactCode) => {
      if (reactCode === 0) {
        console.log('\n✅ React test passed! Environment is working.');
        console.log('\nTo enable full tests:');
        console.log('1. Run: node enable-tests.js');
        console.log('2. Fix dependency issues incrementally');
      } else {
        console.log('\n❌ React test failed. Check environment setup.');
      }
    });
  } else {
    console.log('\n❌ Basic tests failed. Check Jest installation.');
  }
});

testProcess.on('error', (error) => {
  console.error('\nError running tests:', error);
});
