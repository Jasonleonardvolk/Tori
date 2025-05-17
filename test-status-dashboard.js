#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('📊 ALAN IDE Test Status Dashboard\n');
console.log('=====================================\n');

// Helper function to run command and return output
function runCommand(command) {
  return new Promise((resolve) => {
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  });
}

// Check file existence
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? 'EXISTS' : 'MISSING'}`);
  return exists;
}

async function generateDashboard() {
  console.log('📁 Configuration Files:');
  console.log('------------------------');
  checkFile(path.join(__dirname, 'jest.config.js'), 'Jest Configuration');
  checkFile(path.join(__dirname, 'client', 'src', 'test-utils.js'), 'Test Utilities');
  checkFile(path.join(__dirname, 'client', 'setupTests.js'), 'Setup Tests');
  checkFile(path.join(__dirname, 'package.json'), 'Package.json');
  
  console.log('\n📦 Dependencies:');
  console.log('------------------------');
  const pkgPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = require(pkgPath);
    const devDeps = pkg.devDependencies || {};
    
    const requiredDeps = [
      'jest',
      'jest-environment-jsdom',
      '@testing-library/react',
      '@testing-library/jest-dom',
      'babel-jest'
    ];
    
    requiredDeps.forEach(dep => {
      console.log(`${devDeps[dep] ? '✅' : '❌'} ${dep}: ${devDeps[dep] || 'MISSING'}`);
    });
  }
  
  console.log('\n🧪 Test Files:');
  console.log('------------------------');
  const { stdout: testFiles } = await runCommand('find client/src -name "*.test.js" -o -name "*.test.jsx" | wc -l');
  console.log(`Total Test Files: ${testFiles.trim()}`);
  
  // Count test categories
  const categories = [
    { name: 'Unit Tests', pattern: 'client/src/__tests__/components' },
    { name: 'Integration Tests', pattern: 'client/src/__tests__/integration' },
    { name: 'Security Tests', pattern: 'client/src/__tests__/security' },
    { name: 'Performance Tests', pattern: 'client/src/__tests__/performance' }
  ];
  
  for (const cat of categories) {
    const { stdout } = await runCommand(`find ${cat.pattern} -name "*.test.js" -o -name "*.test.jsx" 2>/dev/null | wc -l`);
    console.log(`${cat.name}: ${stdout.trim()} files`);
  }
  
  console.log('\n🏃‍♂️ Test Execution Status:');
  console.log('------------------------');
  
  // Try a quick test run
  const { error: testError, stdout: testOutput } = await runCommand('npm run test -- --listTests');
  
  if (testError) {
    console.log('❌ Test discovery failed');
    console.log('Issue: Unable to list tests');
  } else {
    const testCount = testOutput.split('\n').filter(line => line.trim()).length;
    console.log(`✅ Test discovery successful: ${testCount} tests found`);
  }
  
  // Check last test run status
  const { error: lastRunError, stdout: lastRunOutput } = await runCommand('npm run test -- --verbose --bail --no-coverage 2>&1 | head -50');
  
  console.log('\n📈 Last Test Run Preview:');
  console.log('------------------------');
  if (lastRunError || lastRunOutput.includes('FAIL')) {
    console.log('❌ Tests are currently failing');
    
    // Try to identify first failing test
    const failMatch = lastRunOutput.match(/✕(.+?)\n/);
    if (failMatch) {
      console.log(`First failing test: ${failMatch[1].trim()}`);
    }
    
    // Look for common error types
    if (lastRunOutput.includes('Cannot resolve dependency')) {
      console.log('Issue type: Module resolution error');
    } else if (lastRunOutput.includes('ReferenceError')) {
      console.log('Issue type: Missing imports/definitions');
    } else if (lastRunOutput.includes('TypeError')) {
      console.log('Issue type: Type/property access error');
    }
  } else {
    console.log('✅ Tests appear to be passing');
  }
  
  console.log('\n📊 Coverage Status:');
  console.log('------------------------');
  
  // Check for existing coverage
  const coverageReportPath = path.join(__dirname, 'coverage', 'lcov-report', 'index.html');
  const coverageExists = fs.existsSync(coverageReportPath);
  
  if (coverageExists) {
    console.log('✅ Coverage report exists');
    
    // Try to read coverage summary
    const summaryPath = path.join(__dirname, 'coverage', 'coverage-summary.json');
    if (fs.existsSync(summaryPath)) {
      try {
        const summary = require(summaryPath);
        const total = summary.total;
        console.log(`   Lines: ${total.lines.pct}%`);
        console.log(`   Branches: ${total.branches.pct}%`);
        console.log(`   Functions: ${total.functions.pct}%`);
        console.log(`   Statements: ${total.statements.pct}%`);
      } catch (e) {
        console.log('   Unable to read coverage details');
      }
    }
  } else {
    console.log('❌ No coverage report found');
    console.log('   Run: npm run test:coverage to generate');
  }
  
  console.log('\n🔧 Available Tools:');
  console.log('------------------------');
  const tools = {
    'master-test-fix.js': 'Complete test fix and run',
    'fix-tests.js': 'Apply all configuration fixes',
    'test-diagnostics.js': 'Diagnose test issues',
    'verify-tests.js': 'Verify test setup',
    'run-single-test.js': 'Debug specific tests',
    'run-all-tests.js': 'Run all test categories'
  };
  
  Object.entries(tools).forEach(([file, description]) => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`${exists ? '✅' : '❌'} ${file}: ${description}`);
  });
  
  console.log('\n🚀 Recommended Actions:');
  console.log('------------------------');
  
  if (lastRunError || lastRunOutput.includes('FAIL')) {
    console.log('1. Run: node master-test-fix.js');
    console.log('   This will apply all fixes and run tests');
    console.log('2. If still failing, use: node run-single-test.js <test-file>');
    console.log('   To debug specific test failures');
    console.log('3. Review test outputs for specific errors');
  } else {
    console.log('1. Run: npm run test:coverage');
    console.log('   To generate/update coverage report');
    console.log('2. Review coverage gaps and add tests');
    console.log('3. Document test patterns for team');
  }
  
  console.log('\n📋 Quick Commands:');
  console.log('------------------------');
  console.log('node master-test-fix.js     # Complete fix and test run');
  console.log('node test-status-dashboard.js  # View this dashboard');
  console.log('npm run test:coverage       # Generate coverage report');
  console.log('npm run test:watch          # Watch tests during development');
}

// Generate the dashboard
generateDashboard().catch(console.error);
