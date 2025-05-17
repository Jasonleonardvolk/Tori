/**
 * Script to fix common linting errors in client files
 * Addresses class extension and TypeScript property issues
 */

const { ESLint } = require('eslint');
const fs = require('fs');
const path = require('path');

/* eslint-disable no-console */

// Configuration
const CLIENT_DIR = path.join(__dirname, 'client');
const REPORT_PATH = path.join(__dirname, 'client-lint-fix-report.txt');

// Target files with known issues
const TARGET_FILES = [
  path.join(CLIENT_DIR, 'src/services/accessibilityBridgeService.js'),
  path.join(CLIENT_DIR, 'src/timecapsule/AgentNuggetGifting.ts'),
];

// Statistics
const stats = {
  scanned: 0,
  fixed: 0,
  errors: 0
};

/**
 * Fix common React class extension issues
 * Problem: "Class extends value is not a constructor or null"
 */
function fixClassExtensionIssue(content) {
  let updated = content;
  let changed = false;

  // Fix 1: Change import React, { Component } from 'react' format if needed
  if (updated.includes('extends Component') && !updated.includes('{ Component }')) {
    updated = updated.replace(
      /import React from ['"]react['"];/,
      'import React, { Component } from \'react\';'
    );
    changed = true;
  }

  // Fix 2: Change import statements with default and named imports if using a problematic pattern
  const problematicImportRegex = /import ([A-Za-z0-9_]+) from ['"]([^'"]+)['"];/g;
  const importMatches = [...updated.matchAll(problematicImportRegex)];
  
  for (const match of importMatches) {
    const [fullImport, importName, importPath] = match;
    
    // Look for places where this import is extended
    if (updated.includes(`extends ${importName}`)) {
      // Try to fix by using require syntax instead
      const requireLine = `const ${importName} = require('${importPath}');`;
      updated = updated.replace(fullImport, requireLine);
      changed = true;
    }
  }

  // Fix 3: If extending React.Component but not importing Component
  if (updated.includes('extends React.Component') && !updated.includes('{ Component }')) {
    // This is actually a valid pattern, so we don't need to change it
  }

  return { content: updated, changed };
}

/**
 * Fix TypeScript property access issues
 * Problem: "Property 'X' does not exist on type 'never'"
 */
function fixTypeScriptPropertyIssues(content) {
  let updated = content;
  let changed = false;

  // Fix 1: Add type assertions for variables that might be 'never'
  const propertyAccessRegex = /(\w+)\.(\w+)/g;
  const propertyAccesses = [...updated.matchAll(propertyAccessRegex)];
  
  // Track variables with property access
  const accessedVars = new Set();
  for (const match of propertyAccesses) {
    accessedVars.add(match[1]);
  }

  // For each variable with property access, look for places where it's assigned
  // but might have a 'never' type
  for (const varName of accessedVars) {
    // Find variable declarations
    const declarationRegex = new RegExp(`(const|let|var)\\s+${varName}\\s*=`, 'g');
    const declarations = [...updated.matchAll(declarationRegex)];
    
    for (const match of declarations) {
      const declarationPos = match.index + match[0].length;
      const nextChars = updated.substring(declarationPos, declarationPos + 40);
      
      // If it looks like a variable that might be untyped, add an assertion
      if (nextChars.includes('find(') || nextChars.includes('filter(') || 
          nextChars.includes('map(') || nextChars.includes('forEach(')) {
        
        // Add a type assertion for arrays/objects if needed
        const lineEndPos = updated.indexOf('\n', declarationPos);
        if (lineEndPos > declarationPos) {
          const line = updated.substring(declarationPos, lineEndPos);
          
          // Only add assertion if there isn't one already
          if (!line.includes(' as ') && !line.includes('<')) {
            const beforeLine = updated.substring(0, lineEndPos);
            const afterLine = updated.substring(lineEndPos);
            
            // Add assertion based on context
            if (line.includes('find(')) {
              updated = `${beforeLine} as any${afterLine}`;
              changed = true;
            } else if (line.includes('filter(')) {
              updated = `${beforeLine} as any[]${afterLine}`;
              changed = true;
            }
          }
        }
      }
    }
  }

  // Fix 2: Add explicit checks for undefined or null
  const nullChecks = new Set();
  for (const varName of accessedVars) {
    if (updated.includes(`${varName}.`)) {
      nullChecks.add(varName);
    }
  }

  // Add null checks where needed
  for (const varName of nullChecks) {
    // Find places where properties are accessed without null checks
    const propAccessRegex = new RegExp(`(?<!if\\s*\\(\\s*${varName}\\s*\\)\\s*\\{)(?<!if\\s*\\(${varName}\\s*&&)(?<!\\?\\.)\\b${varName}\\.`, 'g');
    const propAccesses = [...updated.matchAll(propAccessRegex)];
    
    // If we find property accesses without null checks, refactor them
    if (propAccesses.length > 0) {
      // Replace direct property accesses with optional chaining (?.)
      updated = updated.replace(
        new RegExp(`\\b${varName}\\.`, 'g'),
        `${varName}?.`
      );
      changed = true;
    }
  }

  return { content: updated, changed };
}

/**
 * Process a file to fix common issues
 */
async function processFile(filePath) {
  stats.scanned++;
  
  try {
    console.log(`Processing file: ${filePath}`);
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    let updated = content;
    let changed = false;
    
    const ext = path.extname(filePath).toLowerCase();
    
    // Apply fixes based on file type
    if (ext === '.js' || ext === '.jsx') {
      // Fix class extension issues in JS files
      const result = fixClassExtensionIssue(updated);
      updated = result.content;
      changed = changed || result.changed;
    }
    
    if (ext === '.ts' || ext === '.tsx') {
      // Fix TypeScript property issues
      const result = fixTypeScriptPropertyIssues(updated);
      updated = result.content;
      changed = changed || result.changed;
    }
    
    // Write back if changes were made
    if (changed) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`  Fixed issues in: ${filePath}`);
      stats.fixed++;
    } else {
      console.log(`  No automatic fixes applied to: ${filePath}`);
    }
    
    // Run ESLint to fix additional issues
    const eslint = new ESLint({
      fix: true,
      overrideConfig: {
        rules: {
          // Common rules to enforce
          'no-trailing-spaces': 'error',
          'eol-last': 'error',
          'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 1 }],
          'quotes': ['error', 'single', { 'avoidEscape': true }],
          'semi': ['error', 'always']
        }
      }
    });
    
    const results = await eslint.lintFiles([filePath]);
    
    if (results.length > 0 && results[0].messages.length > 0) {
      console.log(`  Found ${results[0].messages.length} linting issues in ${filePath}`);
      
      // Fix the issues if possible
      const fixResults = await eslint.lintFiles([filePath]);
      await ESLint.outputFixes(fixResults);
      if (!changed) stats.fixed++; // Only increment if not already counted
    }
    
  } catch (error) {
    console.error(`  Error processing ${filePath}: ${error.message}`);
    stats.errors++;
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`Starting lint cleanup of client files with known issues`);
  
  // Process each target file
  for (const filePath of TARGET_FILES) {
    if (fs.existsSync(filePath)) {
      await processFile(filePath);
    } else {
      console.error(`File not found: ${filePath}`);
      stats.errors++;
    }
  }
  
  // Generate report
  const report = `
Client Lint Cleanup Report
========================
Time: ${new Date().toISOString()}

Statistics:
- Files scanned: ${stats.scanned}
- Files fixed: ${stats.fixed}
- Errors encountered: ${stats.errors}
  `;
  
  fs.writeFileSync(REPORT_PATH, report, 'utf8');
  
  console.log('\nCleanup complete!');
  console.log(`Files scanned: ${stats.scanned}`);
  console.log(`Files fixed: ${stats.fixed}`);
  console.log(`Errors encountered: ${stats.errors}`);
  console.log(`Report saved to: ${REPORT_PATH}`);
  
  console.log('\nNote: For remaining TypeScript errors, you may need to:');
  console.log('1. Check import statements and make sure correct modules are imported');
  console.log('2. Add proper type definitions for variables with property access');
  console.log('3. Add proper null/undefined checks where needed');
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
