#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Quick Fix for Common Infinite Loop Patterns...\n');

// Create a backup directory
const backupDir = path.join(__dirname, 'backup', new Date().getTime().toString());
fs.mkdirSync(backupDir, { recursive: true });

// Define fixes for common patterns
const fixes = [
  {
    name: 'Add empty dependency array to useEffect',
    pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*{([\s\S]*?)}\s*\);/g,
    replacement: (match, content) => {
      if (!content.includes('set') && !content.includes('setState')) {
        return match.replace('});', '}, []);');
      }
      return match;
    }
  },
  {
    name: 'Wrap setState in useCallback',
    pattern: /const\s+(\w+)\s*=\s*\(\s*\)\s*=>\s*{[\s\S]*?set\w+[\s\S]*?};/g,
    replacement: (match, funcName) => {
      if (!match.includes('useCallback')) {
        return match.replace(`const ${funcName} =`, `const ${funcName} = useCallback`).replace('};', '}, []);');
      }
      return match;
    }
  }
];

// Function to apply fixes to a file
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  
  // Create backup
  const relativePath = path.relative(__dirname, filePath);
  const backupPath = path.join(backupDir, relativePath);
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, content);
  
  // Apply fixes
  for (const fix of fixes) {
    const newContent = content.replace(fix.pattern, (...args) => {
      const result = fix.replacement(...args);
      if (result !== args[0]) {
        changes++;
      }
      return result;
    });
    
    if (newContent !== content) {
      content = newContent;
    }
  }
  
  // Only write if changes were made
  if (changes > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${changes} issues in: ${relativePath}`);
  }
  
  return changes;
}

// Find all React files and apply fixes
function findAndFixFiles(dir) {
  let totalChanges = 0;
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !entry.includes('node_modules') && !entry.includes('.git')) {
      totalChanges += findAndFixFiles(fullPath);
    } else if (stat.isFile() && (entry.endsWith('.jsx') || entry.endsWith('.js'))) {
      totalChanges += fixFile(fullPath);
    }
  }
  
  return totalChanges;
}

// Run the fixes
const startDir = path.join(__dirname, 'client', 'src');
console.log('Starting automatic fixes...\n');

const totalChanges = findAndFixFiles(startDir);

console.log(`\nSummary:`);
console.log(`- Total changes made: ${totalChanges}`);
console.log(`- Backup created at: ${backupDir}`);

if (totalChanges > 0) {
  console.log('\n⚠️  IMPORTANT: These are automatic fixes. Please review the changes!');
  console.log('\nNext steps:');
  console.log('1. Review the changes in your files');
  console.log('2. Add proper dependencies to useEffect hooks manually');
  console.log('3. Test your application thoroughly');
  console.log('4. Run tests again to check for infinite loops');
}

console.log('\nTo manually review a specific file:');
console.log('1. Open the original file and the backup side by side');
console.log('2. Look for added dependency arrays: }, [])');
console.log('3. Verify that the dependencies are correct');
