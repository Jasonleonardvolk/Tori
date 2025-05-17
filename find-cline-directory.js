#!/usr/bin/env node
/**
 * find-cline-directory.js
 * 
 * A utility script to help locate the .cline directory on your system.
 * This can be useful if you're not sure where Cline is storing its data.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Common places to look for the .cline directory
const commonLocations = [
  // Current directory
  process.cwd(),
  
  // Home directory
  os.homedir(),
  
  // VS Code extensions directories
  path.join(os.homedir(), '.vscode', 'extensions'),
  path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'globalStorage'),
  
  // On macOS
  path.join(os.homedir(), 'Library', 'Application Support', 'Code'),
  
  // On Linux
  path.join(os.homedir(), '.config', 'Code')
];

// For Windows, check additional locations
if (process.platform === 'win32') {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  
  commonLocations.push(
    appData,
    localAppData,
    path.join(appData, 'Code'),
    path.join(localAppData, 'Programs', 'Microsoft VS Code')
  );
}

// Custom recursive search function with a depth limit
function findDirectory(startPath, targetDir, depth = 3) {
  if (depth <= 0) return [];
  if (!fs.existsSync(startPath)) return [];
  
  const results = [];
  
  try {
    const files = fs.readdirSync(startPath, { withFileTypes: true });
    
    // First, check direct child directories
    for (const file of files) {
      if (file.isDirectory() && file.name === targetDir) {
        results.push(path.join(startPath, file.name));
      }
    }
    
    // Then recursively search subdirectories with reduced depth
    if (depth > 1) {
      for (const file of files) {
        if (file.isDirectory() && file.name !== targetDir && !file.name.startsWith('.')) {
          const subResults = findDirectory(path.join(startPath, file.name), targetDir, depth - 1);
          results.push(...subResults);
        }
      }
    }
  } catch (err) {
    // Skip directories we can't access
  }
  
  return results;
}

console.log('Searching for .cline directories on your system...');
console.log('This may take a minute...');
console.log();

let found = false;
const searchPromises = commonLocations.map(location => {
  return new Promise(resolve => {
    console.log(`Searching in: ${location}`);
    const clineDirectories = findDirectory(location, '.cline', 2);
    
    if (clineDirectories.length > 0) {
      found = true;
      console.log('\nFound .cline directories:');
      clineDirectories.forEach(dir => {
        console.log(`- ${dir}`);
        
        // Check if it contains a tasks directory
        const tasksDir = path.join(dir, 'tasks');
        if (fs.existsSync(tasksDir)) {
          console.log(`  ✓ Contains tasks directory with ${fs.readdirSync(tasksDir).length} tasks`);
        } else {
          console.log('  ✗ No tasks directory found');
        }
      });
      console.log();
    }
    
    resolve();
  });
});

Promise.all(searchPromises).then(() => {
  if (!found) {
    console.log('\nNo .cline directories found in common locations.');
    console.log('You may need to modify the export-cline.js script to specify the correct path.');
  }
  
  console.log('\nTo use the correct path in the exporter, update the "tasksDir" variable in export-cline-cjs.js:');
  console.log('const tasksDir = path.join("/path/to/your/.cline", "tasks");');
});
