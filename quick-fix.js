#!/usr/bin/env node

console.log('🚀 Quick Test Infrastructure Fix\n');

// First, let's run the updated fix script
const { exec } = require('child_process');

console.log('Running master-fix-v2.js...\n');

exec('node master-fix-v2.js', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('Error during execution:', error);
  }
  
  if (stdout) {
    console.log('Output:', stdout);
  }
  
  if (stderr) {
    console.log('Errors:', stderr);
  }
  
  console.log('\n✅ Quick fix execution complete!');
  console.log('\nNext steps:');
  console.log('1. Review the output above');
  console.log('2. Check if tests are now passing');
  console.log('3. Run individual tests if needed');
});
