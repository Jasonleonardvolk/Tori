#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('ALAN IDE Master Test Fix - Clean Version\n');
console.log('This script will:');
console.log('1. Apply all test configuration fixes');
console.log('2. Diagnose current issues');
console.log('3. Run tests systematically');
console.log('4. Generate coverage report');
console.log('5. Provide actionable next steps\n');

async function runSequentially() {
  console.log('Phase 1: Applying fixes...\n');
  
  await new Promise((resolve) => {
    exec('node fix-tests-clean.js', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('ERROR - Fix script failed:', error.message);
      } else {
        console.log('SUCCESS - Fixes applied successfully');
        console.log(stdout);
      }
      resolve();
    });
  });

  console.log('\nPhase 2: Running simple diagnostics...\n');
  
  await new Promise((resolve) => {
    exec('node test-diagnostics-clean.js', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('ERROR - Diagnostics failed:', error.message);
      } else {
        console.log('SUCCESS - Diagnostics completed');
        console.log(stdout);
      }
      resolve();
    });
  });

  console.log('\nPhase 3: Verifying test setup...\n');
  
  await new Promise((resolve) => {
    exec('node verify-tests-clean.js', { cwd: __dirname }, (error, stdout, stderr) => {
      console.log('\nVerification Results:');
      if (error) {
        console.log('ERROR - Tests still failing - needs specific fixes');
        console.log('\nError output:');
        console.log(stdout);
        console.log(stderr);
        
        // Try to identify specific test files that are failing
        const failPattern = /FAIL\s+(.+\.test\.jsx?)/g;
        const matches = [];
        let match;
        while ((match = failPattern.exec(stdout + stderr)) !== null) {
          matches.push(match[1]);
        }
        
        if (matches.length > 0) {
          console.log('\nIdentified failing test files:');
          matches.forEach(file => console.log(`   - ${file}`));
          
          console.log('\nNext steps:');
          console.log('1. Review and fix specific test files');
          console.log('2. Run individual tests with: node run-single-test-clean.js <test-file>');
          console.log('3. Common issues to check:');
          console.log('   - Missing imports');
          console.log('   - Incorrect mock implementations');
          console.log('   - Missing component props');
          console.log('   - Async/await issues');
        }
      } else {
        console.log('SUCCESS - Tests are now working!');
        console.log(stdout);
        
        // If tests pass, run coverage
        console.log('\nPhase 4: Generating coverage report...\n');
        exec('npm run test:coverage', { cwd: __dirname }, (coverageError, coverageStdout) => {
          if (coverageError) {
            console.error('ERROR - Coverage generation failed');
          } else {
            console.log('SUCCESS - Coverage report generated successfully!');
            
            // Extract coverage summary
            const coverageMatch = coverageStdout.match(/All files.*?\s+(\d+\.\d+)/);
            if (coverageMatch) {
              console.log(`Overall coverage: ${coverageMatch[1]}%`);
            }
            
            console.log('\nView coverage report:');
            console.log(`   file://${path.join(__dirname, 'coverage', 'lcov-report', 'index.html')}`);
          }
        });
      }
      resolve();
    });
  });

  // Final summary
  console.log('\nMaster Test Fix Complete!\n');
  console.log('Useful files created:');
  console.log('- fix-tests-clean.js: Apply all configuration fixes');
  console.log('- test-diagnostics-clean.js: Simple diagnostic tool');
  console.log('- verify-tests-clean.js: Verify and run tests');
  console.log('- run-single-test-clean.js: Debug individual tests');
  
  console.log('\nNext immediate action:');
  console.log('If tests are still failing, run:');
  console.log('   node run-single-test-clean.js <path-to-failing-test>');
  console.log('This will help identify the specific issue in each failing test.');
}

// Start the process
runSequentially().catch(console.error);
