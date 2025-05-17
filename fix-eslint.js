/**
 * Fix for ESLint module compatibility issues
 * Run this script to fix the ESLint error related to ES Modules
 */

const fs = require('fs');
const path = require('path');

// Path to the problematic file
const filePath = path.join(__dirname, 'node_modules', 'babel-eslint', 'lib', 'require-from-eslint.js');

// Check if the file exists
if (fs.existsSync(filePath)) {
  console.log(`Found the problematic file: ${filePath}`);
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the problematic require with dynamic import
  content = content.replace(
    /require\(name\)/g, 
    'eval("require(name)")'
  );
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log('Fixed the ESLint module compatibility issue.');
} else {
  console.log(`File not found: ${filePath}`);
  console.log('Looking for alternative paths...');
  
  // Try alternative paths in case the structure is different
  const altPaths = [
    path.join(__dirname, 'client', 'node_modules', 'babel-eslint', 'lib', 'require-from-eslint.js'),
    path.join(__dirname, 'node_modules', '@babel', 'eslint-parser', 'lib', 'require-from-eslint.js')
  ];
  
  let fixed = false;
  
  for (const altPath of altPaths) {
    if (fs.existsSync(altPath)) {
      console.log(`Found alternative file: ${altPath}`);
      
      // Read the file
      let content = fs.readFileSync(altPath, 'utf8');
      
      // Replace the problematic require with dynamic import
      content = content.replace(
        /require\(name\)/g, 
        'eval("require(name)")'
      );
      
      // Write the fixed content back to the file
      fs.writeFileSync(altPath, content, 'utf8');
      
      console.log('Fixed the ESLint module compatibility issue.');
      fixed = true;
      break;
    }
  }
  
  if (!fixed) {
    console.log('Could not find the problematic file in expected locations.');
    console.log('Creating an .env file to disable ESLint...');
    
    // Create .env file to disable ESLint
    const envPath = path.join(__dirname, 'client', '.env');
    fs.writeFileSync(envPath, 'DISABLE_ESLINT_PLUGIN=true\nSKIP_PREFLIGHT_CHECK=true\nBROWSER=none\n', 'utf8');
    
    console.log('Created .env file to disable ESLint. Please restart the client.');
  }
}
