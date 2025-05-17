#!/usr/bin/env node

/**
 * Simple Storybook runner script
 * 
 * This script starts the Storybook development server for the UI Kit package,
 * making it easier to develop and showcase components.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting ITORI UI Kit Storybook...');

// Check if storybook config exists
const storybookDir = path.join(__dirname, '..', '.storybook');
if (!fs.existsSync(storybookDir)) {
  console.error('❌ Storybook configuration not found. Make sure .storybook directory exists.');
  process.exit(1);
}

// Run storybook dev server
const storybook = spawn('npx', ['storybook', 'dev', '-p', '6006'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true
});

storybook.on('error', (error) => {
  console.error(`❌ Failed to start Storybook: ${error.message}`);
  process.exit(1);
});

storybook.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Storybook process exited with code ${code}`);
    process.exit(code);
  }
});

// Handle termination signals
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    console.log('\n👋 Shutting down Storybook server...');
    storybook.kill();
  });
});
