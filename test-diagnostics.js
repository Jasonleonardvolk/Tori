#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔍 ALAN IDE Test Diagnostics Starting...\n');

// Step 1: Check for common configuration issues
console.log('1️⃣ Checking Jest configuration...');
const jestConfigPath = path.join(__dirname, 'jest.config.js');
if (fs.existsSync(jestConfigPath)) {
  const config = require(jestConfigPath);
  console.log('✅ Jest config found');
  console.log('   - Test environment:', config.testEnvironment);
  console.log('   - Setup files:', config.setupFilesAfterEnv);
  console.log('   - Module directories:', config.moduleDirectories);
  
  // Check if moduleDirectories includes src
  if (!config.moduleDirectories.includes('<rootDir>/client/src')) {
    console.log('⚠️  Warning: moduleDirectories might be missing src path');
  }
} else {
  console.log('❌ Jest config not found!');
}

// Step 2: Check for test-utils.js
console.log('\n2️⃣ Checking test utilities...');
const testUtilsPath = path.join(__dirname, 'client', 'src', 'test-utils.js');
if (fs.existsSync(testUtilsPath)) {
  console.log('✅ test-utils.js found');
  
  // Read and check contents
  const testUtils = fs.readFileSync(testUtilsPath, 'utf8');
  
  // Check for essential exports
  if (testUtils.includes('export * from') && testUtils.includes('export { customRender as render }')) {
    console.log('✅ test-utils exports look correct');
  } else {
    console.log('⚠️  test-utils exports might be incorrect');
  }
  
  // Check for provider wrapper
  if (testUtils.includes('AllTheProviders')) {
    console.log('✅ Provider wrapper found');
  } else {
    console.log('⚠️  Provider wrapper missing');
  }
} else {
  console.log('❌ test-utils.js not found!');
}

// Step 3: Check for common dependencies
console.log('\n3️⃣ Checking essential test dependencies...');
const packageJsonPath = path.join(__dirname, 'package.json');
const clientPackageJsonPath = path.join(__dirname, 'client', 'package.json');

if (fs.existsSync(packageJsonPath)) {
  const pkg = require(packageJsonPath);
  const devDeps = pkg.devDependencies || {};
  
  const essentialDeps = [
    '@testing-library/react',
    '@testing-library/jest-dom',
    'jest',
    'jest-environment-jsdom'
  ];
  
  essentialDeps.forEach(dep => {
    if (devDeps[dep]) {
      console.log(`✅ ${dep}: ${devDeps[dep]}`);
    } else {
      console.log(`❌ Missing: ${dep}`);
    }
  });
}

// Step 4: Run a test suite to get actual error output
console.log('\n4️⃣ Running test suite to capture errors...');
exec('npm run test -- --no-coverage --verbose', { cwd: __dirname }, (error, stdout, stderr) => {
  console.log('\n5️⃣ Test Results Analysis:');
  
  if (error) {
    console.log('❌ Tests failed. Analyzing errors...\n');
    
    const fullOutput = stdout + ' ' + stderr;
    
    // Common error patterns and solutions
    const errorPatterns = [
      {
        pattern: /Cannot resolve dependency '([^']+)'/,
        solution: 'Module resolution error - check import paths and moduleDirectories in jest config'
      },
      {
        pattern: /Cannot read propert/,
        solution: 'Undefined property access - check mocks and stubs'
      },
      {
        pattern: /Transform error/,
        solution: 'Babel transform error - check babel config and presets'
      },
      {
        pattern: /Unexpected token/,
        solution: 'Parsing error - likely JSX/ES modules transform issue'
      },
      {
        pattern: /ReferenceError: (.+) is not defined/,
        solution: 'Missing global definition or import'
      },
      {
        pattern: /No tests found/,
        solution: 'Test pattern matching issue - check test file naming'
      }
    ];
    
    let foundIssues = 0;
    errorPatterns.forEach(({pattern, solution}) => {
      const matches = fullOutput.match(pattern);
      if (matches) {
        foundIssues++;
        console.log(`🔍 Found: ${matches[0]}`);
        console.log(`💡 Solution: ${solution}\n`);
      }
    });
    
    if (foundIssues === 0) {
      console.log('🤔 Unknown error pattern. Raw output:');
      console.log('STDOUT:');
      console.log(stdout);
      console.log('\nSTDERR:');
      console.log(stderr);
    }
  } else {
    console.log('✅ Tests passed!');
    console.log('\nSummary:');
    
    // Extract test summary from output
    const summaryMatch = stdout.match(/Test Suites: (.+)/);
    if (summaryMatch) {
      console.log(summaryMatch[0]);
    }
  }
  
  console.log('\n6️⃣ Recommendations:');
  console.log('1. Ensure all imports use the correct paths');
  console.log('2. Check that all required mocks are properly set up');
  console.log('3. Verify all test files have proper access to test-utils');
  console.log('4. Consider running tests individually to isolate issues');
  
  console.log('\n📝 Next steps:');
  console.log('1. Run: node run-single-test.js <path-to-test> to debug specific tests');
  console.log('2. Fix identified issues one by one');
  console.log('3. Run: npm run test:coverage after fixing tests');
});
