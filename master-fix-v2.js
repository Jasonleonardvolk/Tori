#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🎯 ALAN IDE Master Test Fix v2.0\n');
console.log('This script will:');
console.log('1. Apply all test configuration fixes');
console.log('2. Diagnose current issues');
console.log('3. Run tests systematically');
console.log('4. Generate coverage report');
console.log('5. Provide actionable next steps\n');

async function runSequentially() {
  console.log('Phase 1: Applying fixes...\n');
  
  await new Promise((resolve) => {
    exec('node fix-tests-v2.js', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Fix script failed:', error.message);
      } else {
        console.log('✅ Fixes applied successfully');
        console.log(stdout);
      }
      resolve();
    });
  });

  console.log('\nPhase 2: Running simple diagnostics...\n');
  
  await new Promise((resolve) => {
    exec('node test-diagnostics-simple.js', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Diagnostics failed:', error.message);
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
          }
        });
      }
      resolve();
    });
  });

  // Final summary
  console.log('\n🏁 Master Test Fix Complete!\n');
  console.log('📁 Useful files created:');
  console.log('- fix-tests-v2.js: Apply all configuration fixes');
  console.log('- test-diagnostics-simple.js: Simple diagnostic tool');
  console.log('- verify-tests.js: Verify and run tests');
  console.log('- run-single-test.js: Debug individual tests');
  
  console.log('\n🎯 Next immediate action:');
  console.log('If tests are still failing, run:');
  console.log('   node run-single-test.js <path-to-failing-test>');
  console.log('This will help identify the specific issue in each failing test.');
}

// Start the process
runSequentially().catch(console.error);
