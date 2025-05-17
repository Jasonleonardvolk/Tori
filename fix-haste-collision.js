#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Fixing Haste module naming collision...\n');

// The issue is duplicate package.json files with same name "auto-auction"
// Let's find and list them
const problematicPath = path.resolve('C:/Users/jason/Desktop/tori/kha/data/USB Drive');

console.log('Checking for problematic files...');

if (fs.existsSync(problematicPath)) {
  console.log(`Found problematic path: ${problematicPath}`);
  console.log('\nRecommended solutions:');
  console.log('1. Move or remove the duplicate package.json files');
  console.log('2. Add pattern to Jest config to ignore this directory');
  console.log('3. Use a .jestignore file');
  
  // Create a .jestignore file
  const jestIgnorePath = path.join(__dirname, '.jestignore');
  const jestIgnoreContent = `# Ignore USB drive path with duplicate packages
/data/USB Drive/
/data/USB Drive/**/*

# Ignore node_modules
node_modules/
*/node_modules/

# Ignore common build artifacts
build/
dist/
coverage/

# Ignore disabled tests
*.test.disabled
`;
  
  fs.writeFileSync(jestIgnorePath, jestIgnoreContent);
  console.log('\n✅ Created .jestignore file');
  
} else {
  console.log(`Path not found: ${problematicPath}`);
  console.log('The collision might be resolved by Jest config changes.');
}

console.log('\n🔧 Next steps:');
console.log('1. Remove or move the duplicate package.json files if possible');
console.log('2. Run: node run-tests-step-by-step.js');
console.log('3. If issues persist, check Jest documentation for Haste config');
