#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Running tests step by step...\n');

// Step 1: Run minimal tests (Node environment)
console.log('Step 1: Running minimal Node tests...');
console.log('----------------------------------------\n');

const step1 = spawn('npx', ['jest', '--config', 'jest.config.minimal.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

step1.on('close', (code1) => {
  console.log(`\nStep 1 completed with code ${code1}`);
  
  if (code1 === 0) {
    console.log('\n✅ Node tests passed! Moving to React tests...\n');
    
    // Step 2: Run basic React tests
    console.log('Step 2: Running basic React tests...');
    console.log('----------------------------------------\n');
    
    const step2 = spawn('npx', ['jest', '--config', 'jest.config.react.js'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });
    
    step2.on('close', (code2) => {
      console.log(`\nStep 2 completed with code ${code2}`);
      
      if (code2 === 0) {
        console.log('\n✅ React tests passed! Environment is working.');
        console.log('\nSuccess! Your test environment is functional.');
        console.log('\n🚀 Next steps:');
        console.log('1. Run: node enable-tests.js');
        console.log('2. Run: npm test');
        console.log('3. Fix issues one by one');
      } else {
        console.log('\n❌ React tests failed. Check React/JSDOM setup.');
        console.log('\nTroubleshooting:');
        console.log('1. Ensure @testing-library/react is installed');
        console.log('2. Check for duplicate React versions');
        console.log('3. Try: npm install --save-dev jest-environment-jsdom');
      }
    });
    
    step2.on('error', (error) => {
      console.error('\nError in Step 2:', error);
    });
    
  } else {
    console.log('\n❌ Node tests failed. Check basic Jest installation.');
    console.log('\nTroubleshooting:');
    console.log('1. Check: npx jest --version');
    console.log('2. Remove duplicate package.json files in /data/');
    console.log('3. Try: npm install --save-dev jest');
  }
});

step1.on('error', (error) => {
  console.error('\nError in Step 1:', error);
});
