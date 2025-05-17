#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Find the first actual test file that's not a mock
const testFile = 'client/src/simple.test.js'; // Start with the simple test

console.log(`Running specific test: ${testFile}\n`);

const testProcess = spawn('npx', ['jest', testFile, '--verbose'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell