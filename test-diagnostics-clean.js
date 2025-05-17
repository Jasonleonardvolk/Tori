#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Simple Test Diagnostics\n');

// Check config files
console.log('1. Checking configuration files...');
const files = [
  ['jest.config.js', 'Jest Configuration'],
  ['client/src/test-utils.js', 'Test Utilities'],
  ['package.json', 'Package.json']
];

files.forEach(([file, description]) => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${exists ? 'OK' : 'MISSING'} - ${description}: ${exists ? 'EXISTS' : 'MISSING'}`);
});

// Check dependencies
console.log('\n2. Checking dependencies...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = require(packagePath);
  const devDeps = pkg.devDependencies || {};
  
  const requiredDeps = [
    'jest',
    '@testing-library/react',
    '@testing-library/jest-dom',
  ];
  
  requiredDeps.forEach(dep => {
    console.log(`${devDeps[dep] ? 'OK' : 'MISSING'} - ${dep}: ${devDeps[dep] || 'MISSING'}`);
  });
}

// Try a simple test run
console.log('\n3. Testing configuration...');
exec('npm run test -- --listTests', { cwd: __dirname }, (error, stdout) => {
  if (error) {
    console.log('ERROR - Test discovery failed');
  } else {
    const testCount = stdout.split('\n').filter(line => line.includes('test.')).length;
    console.log(`SUCCESS - Found ${testCount} test files`);
  }
});
