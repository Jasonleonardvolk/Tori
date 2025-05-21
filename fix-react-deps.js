#!/usr/bin/env node

/**
 * TORI Chat React Dependency Fixer
 * 
 * This script fixes React dependency conflicts by either:
 * 1. Upgrading react-diff-viewer to a React 18 compatible version, or
 * 2. Removing it entirely if not needed for production
 * 
 * Usage:
 *   node fix-react-deps.js             # Interactive mode
 *   node fix-react-deps.js --ci        # Non-interactive mode (for CI)
 *   node fix-react-deps.js --upgrade   # Auto-upgrade without prompting
 *   node fix-react-deps.js --remove    # Auto-remove without prompting
 */

const { execSync } = require('child_process');
const readline = require('readline');

// Process command line arguments
const args = process.argv.slice(2);
const isCiMode = args.includes('--ci');
const autoUpgrade = args.includes('--upgrade') || isCiMode; // In CI mode, default to upgrade
const autoRemove = args.includes('--remove');

// Only create readline interface if we're in interactive mode
const rl = !autoUpgrade && !autoRemove ? readline.createInterface({
  input: process.stdin,
  output: process.stdout
}) : null;

console.log(`
===================================================
  TORI Chat React Dependency Conflict Fixer
===================================================

This script will fix React dependency conflicts that prevent
building the TORI Chat application.

The main issue is react-diff-viewer@3.1.1 which expects
React 15/16, but your project uses React 18.
`);

// Check if we have react-diff-viewer installed
let hasReactDiffViewer = false;
try {
  const output = execSync('npm ls react-diff-viewer').toString();
  hasReactDiffViewer = output.includes('react-diff-viewer@');
  
  if (hasReactDiffViewer) {
    const match = output.match(/react-diff-viewer@([\d.]+(-rc\.\d+)?)/);
  if (match) {
      const version = match[1];
      console.log(`Found react-diff-viewer version ${version}`);
      
      if (version === '4.0.0-rc.1' || version === '4.0.0') {
        console.log('\nGood news! You already have the React 18 compatible version installed.');
        process.exit(0);
      }
    }
  } else {
    console.log('react-diff-viewer is not installed. No action needed.');
    process.exit(0);
  }
} catch (error) {
  // Handle the error gracefully
  if (error.status === 1 && error.stdout.toString().includes('react-diff-viewer')) {
    hasReactDiffViewer = true;
    console.log('Found react-diff-viewer (incompatible with React 18)');
  } else {
    console.log('Error checking dependencies:', error.message);
  }
}

// Function to upgrade the package
function upgradePackage() {
  console.log('\nUpgrading to React 18 compatible version...');
  try {
    execSync('npm install react-diff-viewer-continued@4.0.0 --save-exact', { stdio: 'inherit' });
    console.log('\n✅ Successfully upgraded to react-diff-viewer-continued@4.0.0');
    console.log('\nYou can now run:');
    console.log('  npm ci --omit dev');
    console.log('  npm run build');
    return true;
  } catch (error) {
    console.error('\n❌ Error upgrading package:', error.message);
    console.log('\nTry manually running:');
    console.log('  npm install react-diff-viewer-continued@4.0.0 --save-exact');
    if (isCiMode) {
      process.exit(1); // Exit with error in CI mode
    }
    return false;
  }
}

// Function to remove the package
function removePackage() {
  console.log('\nRemoving react-diff-viewer...');
  try {
    execSync('npm uninstall react-diff-viewer', { stdio: 'inherit' });
    console.log('\n✅ Successfully removed react-diff-viewer');
    console.log('\nYou can now run:');
    console.log('  npm ci --omit dev');
    console.log('  npm run build');
    return true;
  } catch (error) {
    console.error('\n❌ Error removing package:', error.message);
    console.log('\nTry manually running:');
    console.log('  npm uninstall react-diff-viewer');
    if (isCiMode) {
      process.exit(1); // Exit with error in CI mode
    }
    return false;
  }
}

if (hasReactDiffViewer) {
  // Auto-upgrade or auto-remove based on arguments
  if (autoUpgrade) {
    upgradePackage();
    process.exit(0);
  } else if (autoRemove) {
    removePackage();
    process.exit(0);
  } else {
    // Interactive mode
    rl.question(`
Choose an action:
1. Upgrade to react-diff-viewer-continued@4.0.0 (React 18 compatible)
2. Remove react-diff-viewer (if not needed for production)
3. Exit without changes

Enter choice (1, 2, or 3): `, (answer) => {
      if (answer === '1') {
        upgradePackage();
      } else if (answer === '2') {
        removePackage();
      } else {
        console.log('\nNo changes made. Exiting...');
      }
      
      rl.close();
    });
  }
} else {
  console.log('\nNo dependency conflicts found. Your project should build correctly.');
  if (rl) rl.close();
}
