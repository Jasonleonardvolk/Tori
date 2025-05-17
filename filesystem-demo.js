const fs = require('fs');
const path = require('path');

// Function to list directory contents
function listDirectory(dirPath) {
  console.log(`\n--- Listing directory: ${dirPath} ---`);
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    items.forEach(item => {
      const type = item.isDirectory() ? '[DIR]' : '[FILE]';
      console.log(`${type} ${item.name}`);
    });
    return items;
  } catch (error) {
    console.error(`Error listing directory: ${error.message}`);
    return [];
  }
}

// Function to get file info
function getFileInfo(filePath) {
  console.log(`\n--- File information: ${filePath} ---`);
  try {
    const stats = fs.statSync(filePath);
    console.log({
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      accessedAt: stats.atime,
      isDirectory: stats.isDirectory(),
      permissions: stats.mode.toString(8).slice(-3)
    });
    return stats;
  } catch (error) {
    console.error(`Error getting file info: ${error.message}`);
    return null;
  }
}

// Function to read file contents
function readFile(filePath) {
  console.log(`\n--- Reading file: ${filePath} ---`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`File content preview (first 200 chars):`);
    console.log(content.slice(0, 200) + (content.length > 200 ? '...' : ''));
    return content;
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    return null;
  }
}

// Function to write to a file
function writeFile(filePath, content) {
  console.log(`\n--- Writing to file: ${filePath} ---`);
  try {
    fs.writeFileSync(filePath, content);
    console.log(`Successfully wrote to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error writing to file: ${error.message}`);
    return false;
  }
}

// Function to create directory
function createDirectory(dirPath) {
  console.log(`\n--- Creating directory: ${dirPath} ---`);
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Successfully created directory ${dirPath}`);
    return true;
  } catch (error) {
    console.error(`Error creating directory: ${error.message}`);
    return false;
  }
}

// Function to search files by name pattern
function searchFiles(startPath, pattern) {
  console.log(`\n--- Searching for files matching "${pattern}" starting from ${startPath} ---`);
  let results = [];
  
  function recursiveSearch(currentPath) {
    const items = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item.name);
      
      if (item.name.includes(pattern)) {
        results.push(itemPath);
        console.log(`Found: ${itemPath}`);
      }
      
      if (item.isDirectory()) {
        recursiveSearch(itemPath);
      }
    }
  }
  
  try {
    recursiveSearch(startPath);
    console.log(`Found ${results.length} matches`);
    return results;
  } catch (error) {
    console.error(`Error searching files: ${error.message}`);
    return results;
  }
}

// Demonstrate filesystem operations
function demonstrateFilesystemOperations() {
  const currentDir = process.cwd();
  console.log(`Current working directory: ${currentDir}`);
  
  // 1. List directory contents
  const items = listDirectory(currentDir);
  
  // 2. Create a demo directory and file
  const demoDir = path.join(currentDir, 'filesystem-demo');
  createDirectory(demoDir);
  
  const demoFile = path.join(demoDir, 'test-file.txt');
  writeFile(demoFile, 'This is a test file created to demonstrate filesystem operations.\nIt contains multiple lines of text.\n');
  
  // 3. Get file info
  if (items.length > 0) {
    const sampleFilePath = path.join(currentDir, '.mcp.json');
    getFileInfo(sampleFilePath);
    readFile(sampleFilePath);
  }
  
  // 4. Search for files
  searchFiles(currentDir, '.json');
  
  console.log('\nFilesystem operations demonstration completed successfully!');
}

// Run the demonstration
demonstrateFilesystemOperations();
