#!/usr/bin/env node

/**
 * TORI Conversation Extraction Verifier
 * 
 * This utility verifies the integrity of files extracted by extract_conversation.js
 * and generates a comprehensive report of any issues found.
 * 
 * Usage:
 *   node verify-extraction.js <directory>            # Verify files in a specific directory
 *   node verify-extraction.js --last                 # Verify most recently extracted files
 *   node verify-extraction.js --help                 # Show help information
 *   node verify-extraction.js <dir> --report <file>  # Save report to specified file
 *   node verify-extraction.js <dir> --fix            # Attempt to fix common issues
 *   node verify-extraction.js <dir> --verbose        # Show detailed verification info
 * 
 * Examples:
 *   node verify-extraction.js ./docs/conversations/3259/extracted
 *   node verify-extraction.js --last
 *   node verify-extraction.js ./extracted --report verification-report.md
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  directory: null,
  verifyLastRun: false,
  reportPath: null,
  fixIssues: false,
  verbose: false,
  help: false
};

// Process command-line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--help' || arg === '-h') {
    options.help = true;
  } else if (arg === '--last' || arg === '-l') {
    options.verifyLastRun = true;
  } else if (arg === '--report' || arg === '-r') {
    options.reportPath = args[++i];
  } else if (arg === '--fix' || arg === '-f') {
    options.fixIssues = true;
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  } else if (!arg.startsWith('--')) {
    options.directory = arg;
  }
}

// Display help information
function showHelp() {
  console.log(`
TORI Conversation Extraction Verifier - Help
============================================

This utility verifies the integrity of files extracted by the extract_conversation.js
tool and generates a report of any issues found.

Usage:
  node verify-extraction.js <directory>            # Verify files in a specific directory
  node verify-extraction.js --last                 # Verify most recently extracted files
  node verify-extraction.js --help                 # Show this help

Optional arguments:
  --report, -r <file>      Save verification report to specified file
  --fix, -f                Attempt to fix common issues automatically
  --verbose, -v            Show detailed verification information

Examples:
  node verify-extraction.js ./docs/conversations/3259/extracted
  node verify-extraction.js --last
  node verify-extraction.js ./extracted --report verification-report.md
  node verify-extraction.js ./extracted --fix
  `);
}

// If help flag is present, show help and exit
if (options.help) {
  showHelp();
  process.exit(0);
}

// Find the most recently created 'extracted' directory if --last is specified
if (options.verifyLastRun) {
  try {
    // Look for directories containing extracted content
    const extractedDirs = [];
    
    // First check the canonical location in ingest_pdf
    const ingestDir = path.join(__dirname, 'ingest_pdf', 'extracted_conversations');
    if (fs.existsSync(ingestDir)) {
      // Add the main dir
      const stats = fs.statSync(ingestDir);
      extractedDirs.push({
        path: ingestDir,
        ctime: stats.ctime
      });
      
      // Also check subdirectories
      searchExtractedDirs(ingestDir, extractedDirs);
    }
    
    // Then check docs directory if it exists (legacy location)
    const docsDir = path.join(__dirname, 'docs');
    if (fs.existsSync(docsDir)) {
      searchExtractedDirs(docsDir, extractedDirs);
    }
    
    // Also look in current directory
    searchExtractedDirs(__dirname, extractedDirs);
    
    if (extractedDirs.length === 0) {
      console.error('Error: No extracted directories found.');
      process.exit(1);
    }
    
    // Sort by creation time, newest first
    extractedDirs.sort((a, b) => b.ctime - a.ctime);
    
    options.directory = extractedDirs[0].path;
    console.log(`Verifying most recent extraction: ${options.directory}`);
    console.log(`Created: ${extractedDirs[0].ctime.toLocaleString()}`);
  } catch (error) {
    console.error(`Error finding recent extractions: ${error.message}`);
    process.exit(1);
  }
}

// Function to recursively find extracted directories
function searchExtractedDirs(startDir, results, depth = 0, maxDepth = 5) {
  if (depth > maxDepth) return; // Limit search depth to avoid excessive recursion
  
  try {
    const entries = fs.readdirSync(startDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(startDir, entry.name);
        
        // Check if this is an extracted directory
        if (entry.name === 'extracted' || entry.name.includes('extracted')) {
          const stats = fs.statSync(fullPath);
          results.push({
            path: fullPath,
            ctime: stats.ctime
          });
        }
        
        // Recurse into subdirectories
        searchExtractedDirs(fullPath, results, depth + 1, maxDepth);
      }
    }
  } catch (error) {
    // Silently skip directories we can't access
    if (options.verbose) {
      console.warn(`Could not access directory: ${startDir}`);
    }
  }
}

// Validate input options
if (!options.directory) {
  console.error('Error: No directory specified for verification');
  console.log('Please provide a directory path or use --last to verify the most recent extraction.');
  console.log('For help: node verify-extraction.js --help');
  process.exit(1);
}

// Check if directory exists
if (!fs.existsSync(options.directory)) {
  console.error(`Error: Directory not found: ${options.directory}`);
  process.exit(1);
}

// Main verification function
async function verifyExtraction(directory) {
  console.log(`
===================================================
  TORI Conversation Extraction Verifier
===================================================
  
Verifying extracted files in: ${directory}
`);
  
  const verificationResults = {
    directory,
    timestamp: new Date().toISOString(),
    fileGroups: [],
    issues: [],
    summary: {
      totalGroups: 0,
      filesWithIssues: 0,
      missingFiles: 0,
      emptyFiles: 0,
      syntaxErrors: 0,
      metadataMismatch: 0,
      unclosedCodeBlocks: 0,
      otherIssues: 0
    }
  };
  
  // Find all file groups (sets of files created from the same source)
  const files = fs.readdirSync(directory);
  const baseNames = new Set();
  
  // Extract base names without suffixes
  for (const file of files) {
    // Skip system files and directories
    if (file.startsWith('.') || fs.statSync(path.join(directory, file)).isDirectory()) {
      continue;
    }
    
    // Extract the base name (without _code.js, _notes.md, etc.)
    const match = file.match(/^(.+?)_(code|notes|clean|metadata|extracted)/);
    if (match) {
      baseNames.add(match[1]);
    }
  }
  
  // Process each file group
  for (const baseName of baseNames) {
    if (options.verbose) {
      console.log(`\nVerifying file group: ${baseName}`);
    }
    
    const fileGroup = {
      baseName,
      files: {
        code: path.join(directory, `${baseName}_code.js`),
        notes: path.join(directory, `${baseName}_notes.md`),
        conversation: path.join(directory, `${baseName}_clean.md`),
        metadata: path.join(directory, `${baseName}_metadata.json`),
        json: path.join(directory, `${baseName}_extracted.json`)
      },
      exists: {},
      fileSize: {},
      issues: []
    };
    
    // Check each file's existence and size
    for (const [type, filePath] of Object.entries(fileGroup.files)) {
      fileGroup.exists[type] = fs.existsSync(filePath);
      
      if (fileGroup.exists[type]) {
        try {
          const stats = fs.statSync(filePath);
          fileGroup.fileSize[type] = stats.size;
          
          // Check if file is empty
          if (stats.size === 0) {
            fileGroup.issues.push({
              type: 'emptyFile',
              file: filePath,
              description: `${type} file is empty (0 bytes)`
            });
            verificationResults.summary.emptyFiles++;
          }
          
          // Validate file content based on type
          validateFileContent(type, filePath, fileGroup);
          
        } catch (error) {
          fileGroup.issues.push({
            type: 'fileAccessError',
            file: filePath,
            description: `Error accessing file: ${error.message}`
          });
          verificationResults.summary.otherIssues++;
        }
      } else {
        // Only report missing files for standard output format (not JSON)
        if ((type !== 'json') || (type === 'json' && !fileGroup.exists.code)) {
          fileGroup.issues.push({
            type: 'missingFile',
            file: filePath,
            description: `${type} file is missing`
          });
          verificationResults.summary.missingFiles++;
        }
      }
    }
    
    // Cross-validate metadata with actual files
    if (fileGroup.exists.metadata) {
      try {
        const metadata = JSON.parse(fs.readFileSync(fileGroup.files.metadata, 'utf8'));
        
        // Check if metadata has warnings
        if (metadata.warnings && metadata.warnings.length > 0) {
          fileGroup.issues.push({
            type: 'metadataWarning',
            file: fileGroup.files.metadata,
            description: `Metadata contains warnings: ${metadata.warnings.join(', ')}`
          });
          
          // Count unclosed code blocks
          if (metadata.warnings.some(w => w.includes('Unclosed code block'))) {
            verificationResults.summary.unclosedCodeBlocks++;
          }
        }
        
        // Verify code block count matches metadata
        if (fileGroup.exists.code) {
          const codeContent = fs.readFileSync(fileGroup.files.code, 'utf8');
          const codeBlockHeaders = (codeContent.match(/\/\*\*[\s\S]+?\*\//g) || []).length;
          
          if (codeBlockHeaders !== metadata.codeBlocks && metadata.codeBlocks > 0) {
            fileGroup.issues.push({
              type: 'metadataMismatch',
              file: fileGroup.files.code,
              description: `Code block count mismatch: ${codeBlockHeaders} found vs ${metadata.codeBlocks} in metadata`
            });
            verificationResults.summary.metadataMismatch++;
          }
        }
        
      } catch (error) {
        fileGroup.issues.push({
          type: 'metadataError',
          file: fileGroup.files.metadata,
          description: `Error parsing metadata: ${error.message}`
        });
        verificationResults.summary.syntaxErrors++;
      }
    }
    
    // Add results for this file group
    verificationResults.fileGroups.push(fileGroup);
    verificationResults.summary.totalGroups++;
    
    if (fileGroup.issues.length > 0) {
      verificationResults.summary.filesWithIssues++;
    }
  }
  
  // Generate report
  const report = generateReport(verificationResults);
  
  // Display report
  console.log(report);
  
  // Save report if requested
  if (options.reportPath) {
    try {
      fs.writeFileSync(options.reportPath, report);
      console.log(`\nReport saved to: ${options.reportPath}`);
    } catch (error) {
      console.error(`Error saving report: ${error.message}`);
    }
  }
  
  // Attempt to fix issues if requested
  if (options.fixIssues && verificationResults.summary.filesWithIssues > 0) {
    console.log('\nAttempting to fix issues...');
    const fixResults = fixIssues(verificationResults);
    console.log(fixResults);
  }
  
  return verificationResults.summary.filesWithIssues === 0;
}

// Validate file content based on type
function validateFileContent(type, filePath, fileGroup) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    switch (type) {
      case 'code':
        // Check for complete code blocks (header comment + code)
        if (!content.includes('/**') || !content.includes('*/')) {
          fileGroup.issues.push({
            type: 'malformedCode',
            file: filePath,
            description: 'Code file missing standard header comments'
          });
        }
        break;
        
      case 'metadata':
        // Validate JSON syntax
        try {
          JSON.parse(content);
        } catch (error) {
          fileGroup.issues.push({
            type: 'syntaxError',
            file: filePath,
            description: `Invalid JSON in metadata file: ${error.message}`
          });
        }
        break;
        
      case 'json':
        // Validate JSON syntax
        try {
          JSON.parse(content);
        } catch (error) {
          fileGroup.issues.push({
            type: 'syntaxError',
            file: filePath,
            description: `Invalid JSON in output file: ${error.message}`
          });
        }
        break;
    }
    
  } catch (error) {
    fileGroup.issues.push({
      type: 'readError',
      file: filePath,
      description: `Error reading file: ${error.message}`
    });
  }
}

// Generate a human-readable report
function generateReport(results) {
  const lines = [
    '===================================================',
    '  Extraction Verification Report',
    '===================================================',
    '',
    `Verification Time: ${new Date().toLocaleString()}`,
    `Directory: ${results.directory}`,
    '',
    '--- Summary ---',
    `Total file groups: ${results.summary.totalGroups}`,
    `File groups with issues: ${results.summary.filesWithIssues}`,
    '',
    '--- Issue Counts ---',
    `Missing files: ${results.summary.missingFiles}`,
    `Empty files: ${results.summary.emptyFiles}`,
    `Syntax errors: ${results.summary.syntaxErrors}`,
    `Metadata mismatches: ${results.summary.metadataMismatch}`,
    `Unclosed code blocks: ${results.summary.unclosedCodeBlocks}`,
    `Other issues: ${results.summary.otherIssues}`,
    ''
  ];
  
  // Add details for file groups with issues
  if (results.summary.filesWithIssues > 0) {
    lines.push('--- Detailed Issues ---');
    
    for (const group of results.fileGroups) {
      if (group.issues.length > 0) {
        lines.push(`\nFile Group: ${group.baseName}`);
        lines.push('Files:');
        
        for (const [type, exists] of Object.entries(group.exists)) {
          const status = exists ? `✓ (${formatBytes(group.fileSize[type])})` : '✗ (missing)';
          lines.push(`  - ${type}: ${status}`);
        }
        
        lines.push('Issues:');
        for (const issue of group.issues) {
          lines.push(`  - ${issue.description}`);
        }
      }
    }
  } else {
    lines.push('All extracted files verified successfully! No issues found.');
  }
  
  return lines.join('\n');
}

// Attempt to fix common issues
function fixIssues(results) {
  const fixResults = {
    fixed: 0,
    failed: 0,
    details: []
  };
  
  for (const group of results.fileGroups) {
    for (const issue of group.issues) {
      let fixed = false;
      let message = '';
      
      // Handle different issue types
      switch (issue.type) {
        case 'emptyFile':
          // For empty files, we can't do much except delete them
          try {
            if (options.verbose) {
              console.log(`Removing empty file: ${issue.file}`);
            }
            fs.unlinkSync(issue.file);
            fixed = true;
            message = `Removed empty file: ${path.basename(issue.file)}`;
          } catch (error) {
            message = `Failed to remove empty file: ${error.message}`;
          }
          break;
          
        case 'metadataError':
          // Try to recreate metadata
          try {
            if (options.verbose) {
              console.log(`Recreating metadata file: ${issue.file}`);
            }
            
            // Get base name to find related files
            const baseName = path.basename(issue.file).replace('_metadata.json', '');
            const codeFile = path.join(path.dirname(issue.file), `${baseName}_code.js`);
            const notesFile = path.join(path.dirname(issue.file), `${baseName}_notes.md`);
            const conversationFile = path.join(path.dirname(issue.file), `${baseName}_clean.md`);
            
            // Count code blocks in code file
            let codeBlocks = 0;
            if (fs.existsSync(codeFile)) {
              const codeContent = fs.readFileSync(codeFile, 'utf8');
              codeBlocks = (codeContent.match(/\/\*\*[\s\S]+?\*\//g) || []).length;
            }
            
            // Count note items in notes file
            let noteItems = 0;
            if (fs.existsSync(notesFile)) {
              const notesContent = fs.readFileSync(notesFile, 'utf8');
              noteItems = notesContent.split('\n').filter(line => line.trim().length > 0).length;
            }
            
            // Count conversation lines
            let conversationLines = 0;
            if (fs.existsSync(conversationFile)) {
              const conversationContent = fs.readFileSync(conversationFile, 'utf8');
              conversationLines = conversationContent.split('\n').filter(line => line.trim().length > 0).length;
            }
            
            // Create new metadata
            const metadata = {
              originalFile: 'unknown',
              extractionDate: new Date().toISOString(),
              totalLines: 0,
              codeBlocks,
              codeLanguages: {},
              noteItems,
              conversationLines,
              regenerated: true
            };
            
            fs.writeFileSync(issue.file, JSON.stringify(metadata, null, 2));
            fixed = true;
            message = `Recreated metadata file: ${path.basename(issue.file)}`;
          } catch (error) {
            message = `Failed to recreate metadata: ${error.message}`;
          }
          break;
          
        // Add more fix cases for other issue types
      }
      
      // Update fix results
      if (fixed) {
        fixResults.fixed++;
      } else {
        fixResults.failed++;
      }
      
      fixResults.details.push({
        file: issue.file,
        issue: issue.type,
        fixed,
        message
      });
    }
  }
  
  // Generate fix report
  const lines = [
    '',
    '===================================================',
    '  Automatic Fix Results',
    '===================================================',
    '',
    `Issues fixed: ${fixResults.fixed}`,
    `Issues not fixed: ${fixResults.failed}`,
    ''
  ];
  
  if (fixResults.details.length > 0) {
    lines.push('--- Fix Details ---');
    for (const detail of fixResults.details) {
      const status = detail.fixed ? '✓' : '✗';
      lines.push(`${status} ${detail.message}`);
    }
  }
  
  return lines.join('\n');
}

// Utility function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Main execution
verifyExtraction(options.directory)
  .then(success => {
    if (success) {
      console.log('\nVerification completed successfully.');
      process.exit(0);
    } else {
      console.log('\nVerification completed with issues.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\nVerification failed:', error);
    process.exit(1);
  });
