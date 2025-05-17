#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Running ALAN IDE Tests in Safe Mode (Stops on Infinite Loops)...\n');

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logsDir, `safe-test-run-${timestamp}.log`);

console.log('Phase 1: Running tests with temporary configuration...');
console.log('This will stop on the first infinite loop detection\n');

// Use the temporary Jest config
const jestArgs = [
  '--config', 'jest.config.temp.js',
  '--verbose',
  '--bail',
  '--runInBand'
];

// Spawn Jest process
const testProcess = spawn('npx', ['jest', ...jestArgs], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let hasInfiniteLoop = false;
const logStream = fs.createWriteStream(logFile);

// Monitor output for infinite loop warnings
testProcess.stdout.on('data', (data) => {
  const str = data.toString();
  logStream.write(str);
  
  // Check for infinite loop warning
  if (str.includes('Maximum update depth exceeded')) {
    hasInfiniteLoop = true;
    console.log('\n❌ INFINITE LOOP DETECTED!');
    
    // Extract component name if possible
    const componentMatch = str.match(/in (\w+) \(at/);
    if (componentMatch) {
      console.log(`Component: ${componentMatch[1]}`);
    }
    
    // Extract file if possible
    const fileMatch = str.match(/\((.*?):(\d+):(\d+)\)/);
    if (fileMatch) {
      console.log(`File: ${fileMatch[1]}`);
      console.log(`Line: ${fileMatch[2]}`);
    }
  }
  
  // Show progress
  if (str.includes('PASS') || str.includes('FAIL')) {
    process.stdout.write('.');
  }
});

testProcess.stderr.on('data', (data) => {
  const str = data.toString();
  logStream.write(`STDERR: ${str}`);
  
  if (str.includes('Maximum update depth exceeded')) {
    hasInfiniteLoop = true;
  }
});

testProcess.on('close', (code) => {
  logStream.end();
  
  console.log('\n\n--- TEST RESULTS ---');
  console.log(`Exit code: ${code}`);
  console.log(`Full log saved to: ${logFile}`);
  
  if (hasInfiniteLoop) {
    console.log('\n🚨 INFINITE LOOP DETECTED!');
    console.log('\nTo fix this issue:');
    console.log('1. Run: node find-infinite-loops.js');
    console.log('2. Review the identified problem files');
    console.log('3. Add proper dependency arrays to useEffect hooks');
    console.log('4. Consider using useCallback for event handlers');
    
    console.log('\nNext steps:');
    console.log('1. Check the component mentioned in the error');
    console.log('2. Look for useEffect without dependencies');
    console.log('3. Ensure state updates have proper deps');
  } else if (code === 0) {
    console.log('\n✅ All tests passed! No infinite loops detected.');
  } else {
    console.log('\n❌ Tests failed for other reasons.');
    console.log('Check the log file for details.');
  }
  
  console.log('\nTo run specific tests:');
  console.log('  npx jest --config jest.config.temp.js path/to/test.js');
});

testProcess.on('error', (error) => {
  console.error('\nProcess error:', error);
  console.log('\nAlternative: Run with npm');
  console.log('  npm test -- --config jest.config.temp.js');
});
