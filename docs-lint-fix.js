/**
 * Script to clean up linting errors in the docs folder
 * Skips PDF files and focuses on text-based files
 */

const { ESLint } = require('eslint');
const fs = require('fs');
const path = require('path');

// Configuration
const DOCS_DIR = path.join(__dirname, 'docs');
const REPORT_PATH = path.join(__dirname, 'docs', 'lint-fix-report.txt');
// Const below is explicitly disabled for ESLint with the underscore prefix
const _PDF_EXTENSION = '.pdf';
const BINARY_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.docx', '.xlsx', '.pptx'];
const LINTABLE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt'];

// Disable no-console rule for this utility script
/* eslint-disable no-console */

// Statistics
const stats = {
  scanned: 0,
  skipped: 0,
  fixed: 0,
  errors: 0
};

/**
 * Check if a file should be skipped based on extension
 */
function shouldSkipFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.includes(ext);
}

/**
 * Check if a file should be linted
 */
function shouldLintFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return LINTABLE_EXTENSIONS.includes(ext);
}

/**
 * Fix common issues in text files like Markdown and TXT
 */
function fixTextFile(filePath, content) {
  let updated = content;
  let changes = 0;
  
  // Fix common issues:
  // 1. Normalize line endings to LF
  if (updated.includes('\r\n')) {
    updated = updated.replace(/\r\n/g, '\n');
    changes++;
  }
  
  // 2. Remove trailing whitespace
  const originalLength = updated.length;
  updated = updated.replace(/[ \t]+$/gm, '');
  if (updated.length !== originalLength) {
    changes++;
  }
  
  // 3. Ensure file ends with a single newline
  if (!updated.endsWith('\n')) {
    updated += '\n';
    changes++;
  } else if (updated.endsWith('\n\n')) {
    updated = updated.replace(/\n+$/, '\n');
    changes++;
  }
  
  // 4. Fix consecutive blank lines (more than 2)
  const beforeBlankLines = updated.length;
  updated = updated.replace(/\n{3,}/g, '\n\n');
  if (updated.length !== beforeBlankLines) {
    changes++;
  }
  
  // Additional Markdown-specific fixes
  if (filePath.toLowerCase().endsWith('.md')) {
    // Fix heading space (# Title instead of #Title)
    const beforeHeadings = updated;
    updated = updated.replace(/^(#{1,6})([^ #])/gm, '$1 $2');
    if (updated !== beforeHeadings) {
      changes++;
    }
    
    // Standardize list items spacing
    const beforeLists = updated;
    updated = updated.replace(/^([ \t]*[-*+])([^ ])/gm, '$1 $2');
    if (updated !== beforeLists) {
      changes++;
    }
  }
  
  // Write back if changes were made
  if (changes > 0) {
    try {
      fs.writeFileSync(filePath, updated, 'utf8');
      return true;
    } catch (err) {
      console.error(`  Error writing to ${filePath}: ${err.message}`);
      return false;
    }
  }
  
  return false;
}

/**
 * Process a file with ESLint if applicable
 */
async function processFile(filePath, eslint) {
  stats.scanned++;
  
  if (shouldSkipFile(filePath)) {
    console.log(`Skipping binary file: ${filePath}`);
    stats.skipped++;
    return;
  }
  
  if (!shouldLintFile(filePath)) {
    console.log(`Skipping non-lintable file: ${filePath}`);
    stats.skipped++;
    return;
  }
  
  try {
    console.log(`Processing file: ${filePath}`);
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Special handling for JSON files
    if (path.extname(filePath).toLowerCase() === '.json') {
      try {
        JSON.parse(content); // Validate JSON syntax
        console.log(`  JSON is valid: ${filePath}`);
      } catch (jsonError) {
        console.error(`  JSON syntax error in: ${filePath}`);
        stats.errors++;
      }
      return;
    }
    
    // Special handling for Markdown and TXT files
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.md' || ext === '.txt') {
      const fixed = fixTextFile(filePath, content);
      if (fixed) {
        console.log(`  Fixed formatting issues in: ${filePath}`);
        stats.fixed++;
      } else {
        console.log(`  No formatting issues found in: ${filePath}`);
      }
      return;
    }
    
    // For JavaScript and TypeScript files, run ESLint
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      const results = await eslint.lintFiles([filePath]);
      
      if (results.length > 0 && results[0].messages.length > 0) {
        console.log(`  Found ${results[0].messages.length} issues in ${filePath}`);
        
        // Fix the issues if possible
        const fixResults = await eslint.lintFiles([filePath]);
        await ESLint.outputFixes(fixResults);
        stats.fixed++;
      } else {
        console.log(`  No issues found in ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`  Error processing ${filePath}: ${error.message}`);
    stats.errors++;
  }
}

/**
 * Recursively process all files in a directory
 */
async function processDirectory(dirPath, eslint) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      try {
        if (entry.isDirectory()) {
          await processDirectory(fullPath, eslint);
        } else {
          await processFile(fullPath, eslint);
        }
      } catch (error) {
        console.error(`Error processing ${fullPath}: ${error.message}`);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}: ${error.message}`);
    stats.errors++;
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`Starting lint cleanup of ${DOCS_DIR}`);
  console.log(`PDFs and binary files will be skipped`);
  
  // Initialize ESLint
  const eslint = new ESLint({
    fix: true,
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    overrideConfig: {
      rules: {
        // Common rules to enforce in docs folder
        'no-trailing-spaces': 'error',
        'eol-last': 'error',
        'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 1 }],
        'quotes': ['error', 'single', { 'avoidEscape': true }],
        'semi': ['error', 'always']
      }
    }
  });
  
  // Process all files
  await processDirectory(DOCS_DIR, eslint);
  
  // Generate report
  const report = `
Lint Cleanup Report
==================
Time: ${new Date().toISOString()}
Target directory: ${DOCS_DIR}

Statistics:
- Files scanned: ${stats.scanned}
- Files skipped: ${stats.skipped}
- Files fixed: ${stats.fixed}
- Errors encountered: ${stats.errors}
  `;
  
  fs.writeFileSync(REPORT_PATH, report, 'utf8');
  
  console.log('\nCleanup complete!');
  console.log(`Files scanned: ${stats.scanned}`);
  console.log(`Files skipped: ${stats.skipped}`);
  console.log(`Files fixed: ${stats.fixed}`);
  console.log(`Errors encountered: ${stats.errors}`);
  console.log(`Report saved to: ${REPORT_PATH}`);
}

/**
 * Check if an error is related to a known ESLint configuration issue
 */
function isESLintConfigError(error) {
  return error.message.includes('Cannot find module') || 
         error.message.includes('configuration') ||
         error.message.includes('eslint');
}

/**
 * Safely execute the main function with fallback for ESLint errors
 */
async function safeMain() {
  try {
    await main();
  } catch (error) {
    console.error('Script failed:', error.message);
    
    // If it's an ESLint configuration error, fall back to basic text processing
    if (isESLintConfigError(error)) {
      console.log('\nFalling back to basic text processing (without ESLint)...');
      await fallbackTextProcessing();
    } else {
      process.exit(1);
    }
  }
}

/**
 * Fallback processing without ESLint
 */
async function fallbackTextProcessing() {
  // Reset stats
  stats.scanned = 0;
  stats.skipped = 0;
  stats.fixed = 0;
  stats.errors = 0;
  
  console.log(`Starting basic text cleanup of ${DOCS_DIR}`);
  console.log(`PDFs and binary files will be skipped`);
  
  // Process function for basic text cleanup
  async function processFileBasic(filePath) {
    stats.scanned++;
    
    if (shouldSkipFile(filePath)) {
      console.log(`Skipping binary file: ${filePath}`);
      stats.skipped++;
      return;
    }
    
    // Only process text files
    const ext = path.extname(filePath).toLowerCase();
    if (['.md', '.txt', '.js', '.jsx', '.ts', '.tsx', '.json'].includes(ext)) {
      try {
        console.log(`Processing file: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (ext === '.json') {
          try {
            JSON.parse(content);
            console.log(`  JSON is valid: ${filePath}`);
          } catch (jsonError) {
            console.error(`  JSON syntax error in: ${filePath}`);
            stats.errors++;
          }
          return;
        }
        
        const fixed = fixTextFile(filePath, content);
        if (fixed) {
          console.log(`  Fixed formatting issues in: ${filePath}`);
          stats.fixed++;
        } else {
          console.log(`  No formatting issues found in: ${filePath}`);
        }
      } catch (error) {
        console.error(`  Error processing ${filePath}: ${error.message}`);
        stats.errors++;
      }
    } else {
      console.log(`Skipping non-text file: ${filePath}`);
      stats.skipped++;
    }
  }
  
  // Directory processor for fallback mode
  async function processDirectoryBasic(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        try {
          if (entry.isDirectory()) {
            await processDirectoryBasic(fullPath);
          } else {
            await processFileBasic(fullPath);
          }
        } catch (error) {
          console.error(`Error processing ${fullPath}: ${error.message}`);
          stats.errors++;
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}: ${error.message}`);
      stats.errors++;
    }
  }
  
  // Process all files with fallback method
  await processDirectoryBasic(DOCS_DIR);
  
  // Generate report
  const report = `
Lint Cleanup Report (Fallback Mode)
=================================
Time: ${new Date().toISOString()}
Target directory: ${DOCS_DIR}

Statistics:
- Files scanned: ${stats.scanned}
- Files skipped: ${stats.skipped}
- Files fixed: ${stats.fixed}
- Errors encountered: ${stats.errors}
  `;
  
  fs.writeFileSync(REPORT_PATH, report, 'utf8');
  
  console.log('\nCleanup complete (fallback mode)!');
  console.log(`Files scanned: ${stats.scanned}`);
  console.log(`Files skipped: ${stats.skipped}`);
  console.log(`Files fixed: ${stats.fixed}`);
  console.log(`Errors encountered: ${stats.errors}`);
  console.log(`Report saved to: ${REPORT_PATH}`);
}

// Run the script with error handling
safeMain();
