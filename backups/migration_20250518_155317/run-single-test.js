#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

const testFile = process.argv[2];

if (!testFile) {
  console.log('Usage: node run-single-test.js <test-file-path>');
  console.log('Example: node run-single-test.js client/src/__tests__/components/PersonaSelector.test.js');
  process.exit(1);
}

console.log(`🔍 Running single test: ${testFile}
`);

const testCommand = `jest "${testFile}" --verbose --no-cache`;

exec(testCommand, { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Test failed:');
    console.error('Error:', error.message);
    
    if (stderr) {
      console.error('\nError details:');
      console.error(stderr);
    }
    
    if (stdout) {
      console.log('\nTest output:');
      console.log(stdout);
    }
  } else {
    console.log('✅ Test passed!');
    console.log('\nOutput:');
    console.log(stdout);
  }
});
