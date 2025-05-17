#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Re-enabling disabled tests...\n');

// Find all disabled test files
const findDisabledTests = (dir, files = []) => {
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !entry.includes('node_modules')) {
      findDisabledTests(fullPath, files);
    } else if (stat.isFile() && entry.endsWith('.test.disabled')) {
      files.push(fullPath);
    }
  }
  
  return files;
};

const disabledTests = findDisabledTests(path.join(__dirname, 'client'));

if (disabledTests.length === 0) {
  console.log('No disabled tests found.');
} else {
  console.log(`Found ${disabledTests.length} disabled tests:`);
  
  disabledTests.forEach(file => {
    const originalPath = file.replace('.test.disabled', '.test.js');
    fs.renameSync(file, originalPath);
    console.log(`✅ Enabled: ${path.relative(__dirname, originalPath)}`);
  });
  
  console.log('\nAll tests have been re-enabled.');
  console.log('Run: npm test');
}
