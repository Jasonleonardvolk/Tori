import { promises as fs } from 'fs';
import path from 'path';

// Directories to scan
const directories = [
  './src',
  './src/components',
  './src/services'
];

// File extensions to process
const extensions = ['.js', '.jsx'];

// Regex patterns to find relative imports without extensions
const importRegex = /import\s+(?:(?:{[^}]*}|\*\s+as\s+[^,]+|[^,{}\s*]+)(?:\s*,\s*(?:{[^}]*}|\*\s+as\s+[^,]+|[^,{}\s*]+))*\s+from\s+)?['"](\.[^'"]*)['"]/g;
const dynamicImportRegex = /import\(\s*['"](\.[^'"]*)['"]\s*\)/g;

/**
 * Check if a path lacks a file extension
 */
function lacksExtension(importPath) {
  const ext = path.extname(importPath);
  return ext === '';
}

/**
 * Fix imports in a file
 */
async function fixImportsInFile(filePath) {
  try {
    console.log(`Processing ${filePath}...`);
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;

    // Fix static imports
    content = content.replace(importRegex, (match, importPath) => {
      if (lacksExtension(importPath)) {
        // Try to determine if it's a .js or .jsx file
        for (const ext of ['.jsx', '.js']) {
          try {
            const fullPath = path.resolve(path.dirname(filePath), importPath + ext);
            if (fs.existsSync(fullPath)) {
              modified = true;
              return match.replace(`'${importPath}'`, `'${importPath}${ext}'`)
                          .replace(`"${importPath}"`, `"${importPath}${ext}"`);
            }
          } catch (err) {
            // File doesn't exist with this extension, continue
          }
        }
      }
      return match;
    });

    // Fix dynamic imports
    content = content.replace(dynamicImportRegex, (match, importPath) => {
      if (lacksExtension(importPath)) {
        // Try to determine if it's a .js or .jsx file
        for (const ext of ['.jsx', '.js']) {
          try {
            const fullPath = path.resolve(path.dirname(filePath), importPath + ext);
            if (fs.existsSync(fullPath)) {
              modified = true;
              return match.replace(`'${importPath}'`, `'${importPath}${ext}'`)
                          .replace(`"${importPath}"`, `"${importPath}${ext}"`);
            }
          } catch (err) {
            // File doesn't exist with this extension, continue
          }
        }
      }
      return match;
    });

    if (modified) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Updated imports in ${filePath}`);
      return 1;
    }
    
    console.log(`No changes needed for ${filePath}`);
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return 0;
  }
}

/**
 * Scan directory for JS/JSX files and fix imports
 */
async function scanDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let updateCount = 0;

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
          updateCount += await scanDirectory(fullPath);
        }
      } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
        updateCount += await fixImportsInFile(fullPath);
      }
    }
    
    return updateCount;
  } catch (error) {
    console.error(`❌ Error scanning directory ${dirPath}:`, error);
    return 0;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Scanning for JavaScript files with relative imports...');
  let totalUpdates = 0;
  
  for (const dir of directories) {
    const fullPath = path.resolve(dir);
    console.log(`\nScanning directory: ${fullPath}`);
    totalUpdates += await scanDirectory(fullPath);
  }
  
  if (totalUpdates > 0) {
    console.log(`\n✅ Done! Updated ${totalUpdates} files to include file extensions in imports.`);
  } else {
    console.log('\n✅ Done! No files needed updates.');
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
