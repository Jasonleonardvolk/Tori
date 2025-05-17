// Node.js script to install Jest testing dependencies
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up ALAN IDE testing dependencies...');

// Check if we need to install in the root directory
if (!fs.existsSync(path.join(__dirname, 'node_modules', '@babel', 'preset-react'))) {
  console.log('\nInstalling root dependencies...');
  try {
    execSync('npm install --save-dev @babel/preset-env @babel/preset-react @babel/plugin-syntax-jsx babel-jest jest-environment-jsdom @testing-library/jest-dom', 
      { stdio: 'inherit' });
    console.log('Root test dependencies installed successfully.');
  } catch (error) {
    console.error('Failed to install root dependencies:', error.message);
  }
}

// Check if we need to install in the client directory
if (fs.existsSync(path.join(__dirname, 'client'))) {
  console.log('\nInstalling client dependencies...');
  const clientDir = path.join(__dirname, 'client');
  
  if (!fs.existsSync(path.join(clientDir, 'node_modules', '@babel', 'preset-react'))) {
    try {
      execSync('npm install --save-dev @babel/preset-env @babel/preset-react @babel/plugin-syntax-jsx babel-jest jest-environment-jsdom @testing-library/jest-dom @testing-library/react @testing-library/user-event', 
        { stdio: 'inherit', cwd: clientDir });
      console.log('Client test dependencies installed successfully.');
    } catch (error) {
      console.error('Failed to install client dependencies:', error.message);
    }
  } else {
    console.log('Client test dependencies already installed.');
  }
}

console.log('\nTest environment setup complete!');
console.log('\nYou can now run tests with:');
console.log('  npm test           # Run all tests');
console.log('  npm test -- --testPathPattern=client/src/__tests__/accessibility  # Run specific test suite');
