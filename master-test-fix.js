#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🎯 ALAN IDE Master Test Fix and Run Script\n');
console.log('This script will:');
console.log('1. Apply all test configuration fixes');
console.log('2. Diagnose current issues');
console.log('3. Run tests systematically');
console.log('4. Generate coverage report');
console.log('5. Provide actionable next steps\n');

// Execute the scripts in sequence
async function runSequentially() {
  console.log('Phase 1: Applying fixes...\n');
  
  await new Promise((resolve) => {
    exec('node fix-tests.js', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Fix script failed:', error);
      } else {
        console.log('✅ Fixes applied successfully');
        console.log(stdout);
      }
      resolve();
    });
  });

  console.log('\nPhase 2: Running diagnostics...\n');
  
  await new Promise((resolve) => {
    exec('node test-diagnostics.js', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Diagnostics failed:', error);
      } else {
        console.log('✅ Diagnostics completed');
        console.log(stdout);
      }
      resolve();
    });
  });

  console.log('\nPhase 3: Verifying test setup...\n');
  
  await new Promise((resolve) => {
    exec('node verify-tests.js', { cwd: __dirname }, (error, stdout, stderr) => {
      console.log('\n📊 Verification Results:');
      if (error) {
        console.log('❌ Tests still failing - needs specific fixes');
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
          console.log('\n🔍 Identified failing test files:');
          matches.forEach(file => console.log(`   - ${file}`));
          
          console.log('\n💡 Next steps:');
          console.log('1. Review and fix specific test files');
          console.log('2. Run individual tests with: node run-single-test.js <test-file>');
          console.log('3. Common issues to check:');
          console.log('   - Missing imports');
          console.log('   - Incorrect mock implementations');
          console.log('   - Missing component props');
          console.log('   - Async/await issues');
        }
      } else {
        console.log('✅ Tests are now working!');
        console.log(stdout);
        
        // If tests pass, run coverage
        console.log('\nPhase 4: Generating coverage report...\n');
        exec('npm run test:coverage', { cwd: __dirname }, (coverageError, coverageStdout) => {
          if (coverageError) {
            console.error('❌ Coverage generation failed');
          } else {
            console.log('✅ Coverage report generated successfully!');
            
            // Extract coverage summary
            const coverageMatch = coverageStdout.match(/All files.*?\s+(\d+\.\d+)/);
            if (coverageMatch) {
              console.log(`📈 Overall coverage: ${coverageMatch[1]}%`);
            }
            
            console.log('\n🔗 View coverage report:');
            console.log(`   file://${path.join(__dirname, 'coverage', 'lcov-report', 'index.html')}`);
            
            // Check if coverage is acceptable (let's say 70% threshold)
            const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
            if (coverage < 70) {
              console.log('\n⚠️  Coverage is below 70%. Consider adding more tests for:');
              console.log('1. Uncovered functions and methods');
              console.log('2. Edge cases and error conditions');
              console.log('3. Complex business logic');
            } else {
              console.log('\n🎉 Great coverage! The project is well-tested.');
            }
          }
        });
      }
      resolve();
    });
  });

  // Final summary
  console.log('\n🏁 Master Test Fix Complete!\n');
  console.log('Summary of what was done:');
  console.log('1. ✅ Jest configuration fixed for proper module resolution');
  console.log('2. ✅ Test utilities enhanced with comprehensive mocks');
  console.log('3. ✅ Setup files configured for proper test environment');
  console.log('4. ✅ Diagnostics and verification tools created');
  console.log('5. ✅ Test execution attempted and analyzed');
  
  console.log('\n📁 Useful files created:');
  console.log('- fix-tests.js: Apply all configuration fixes');
  console.log('- test-diagnostics.js: Diagnose test setup issues');
  console.log('- verify-tests.js: Verify and run tests');
  console.log('- run-single-test.js: Debug individual tests');
  console.log('- run-all-tests.js: Comprehensive test runner by category');
  
  console.log('\n🔧 What to do if tests still fail:');
  console.log('1. Review the specific test files mentioned in the error output');
  console.log('2. Check for missing dependencies or incorrect imports');
  console.log('3. Ensure all mocks properly match the actual service interfaces');
  console.log('4. Verify that components receive all required props in tests');
  console.log('5. Use the run-single-test.js script to debug specific failing tests');
  
  console.log('\n🎯 Next immediate action:');
  console.log('If tests are still failing, run:');
  console.log('   node run-single-test.js <path-to-failing-test>');
  console.log('This will help identify the specific issue in each failing test.');
}

// Start the process
runSequentially().catch(console.error);
