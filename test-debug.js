#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('ALAN IDE Test Debug Tool\n');

// Let's try running tests in a more controlled way
console.log('Step 1: Check if Jest can start at all...\n');

// Use spawn instead of exec for better control
const testProcess = spawn('npm', ['run', 'test', '--', '--listTests'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let hasOutput = false;

// Set a timeout to kill the process if it hangs
const timeout = setTimeout(() => {
  console.log('\nProcess is hanging - killing it...');
  testProcess.kill();
  console.log('Process killed. This suggests Jest might be stuck during startup.');
  console.log('\nPossible issues:');
  console.log('1. Jest configuration problem');
  console.log('2. Module resolution issue');
  console.log('3. Infinite loop in test setup');
  console.log('\nLet\'s try a simpler approach...');
  
  // Try without Jest config
  console.log('\nStep 2: Trying minimal jest command...');
  const simpleProcess = spawn('npx', ['jest', '--version'], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  simpleProcess.on('close', (code) => {
    console.log('\nJest version check complete. Exit code:', code);
    
    if (code === 0) {
      console.log('\nJest is working. Let\'s try running a single test file...');
      console.log('Run: npm run test -- path/to/simple/test.js --verbose');
    } else {
      console.log('\nJest itself has issues. Check Jest installation.');
    }
  });
}, 10000); // 10 second timeout

// Capture output
testProcess.stdout.on('data', (data) => {
  output += data.toString();
  hasOutput = true;
  process.stdout.write(data);
});

testProcess.stderr.on('data', (data) => {
  output += data.toString();
  hasOutput = true;
  process.stderr.write(data);
});

testProcess.on('close', (code) => {
  clearTimeout(timeout);
  console.log('\n--- Process Completed ---');
  console.log('Exit code:', code);
  
  if (hasOutput) {
    console.log('\nFound test files successfully!');
    console.log('\nNext: Try running a simple test with:');
    console.log('  npm run test -- --testNamePattern="simple" --verbose');
  } else {
    console.log('\nNo output received. Jest might be hanging during test discovery.');
  }
});

testProcess.on('error', (error) => {
  clearTimeout(timeout);
  console.error('\nProcess error:', error);
});

// Show progress
let dots = 0;
const progressInterval = setInterval(() => {
  if (dots >= 3) {
    process.stdout.write('\r   ');
    dots = 0;
  } else {
    process.stdout.write('.');
    dots++;
  }
}, 500);

// Clean up progress indicator when done
testProcess.on('close', () => {
  clearInterval(progressInterval);
  process.stdout.write('\n');
});
