#!/usr/bin/env node

/**
 * TORI Conversation Extractor
 * 
 * Script to extract important content from CLINE conversation files
 * and organize into three separate files: code, notes, and conversation.
 * 
 * Usage:
 *   node extract_conversation.js <path-to-file>              # Process a single file with default settings
 *   node extract_conversation.js --dir <directory>           # Process all .md and .json files in directory
 *   node extract_conversation.js <file> --outdir <path>      # Specify custom output directory
 *   node extract_conversation.js --help                      # Show help information
 *   node extract_conversation.js <file> --format <format>    # Specify output format (default, json)
 *   node extract_conversation.js <file> --verbose            # Show detailed logs
 *   node extract_conversation.js <file> --quiet              # Suppress non-essential outputs
 * 
 * Examples:
 *   node extract_conversation.js conversation.md
 *   node extract_conversation.js --dir ./my_conversations
 *   node extract_conversation.js conversation.md --outdir ./extracted_data
 *   node extract_conversation.js conversation.md --format json
 */

const fs = require('fs');
const path = require('path');
const { EOL } = require('os');

// Load configuration if available
let config = {
  default_output_dir: "ingest_pdf/extracted_conversations",
  preserve_id_folder: true,
  use_timestamp_prefix: false,
  supported_extensions: [".md", ".json", ".txt"]
};

try {
  const configPath = path.join(__dirname, 'conversation_config.json');
  if (fs.existsSync(configPath)) {
    const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...loadedConfig };
    
    if (!config.default_output_dir) {
      config.default_output_dir = "ingest_pdf/extracted_conversations";
    }
  }
} catch (error) {
  console.warn(`Warning: Could not load configuration file: ${error.message}`);
  console.warn('Using default configuration settings');
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  files: [],
  directory: null,
  outputDir: null,
  format: 'default',
  verbose: false,
  quiet: false,
  help: false
};

// Process command-line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--help' || arg === '-h') {
    options.help = true;
  } else if (arg === '--dir' || arg === '-d') {
    options.directory = args[++i];
  } else if (arg === '--outdir' || arg === '-o') {
    options.outputDir = args[++i];
  } else if (arg === '--format' || arg === '-f') {
    options.format = args[++i];
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  } else if (arg === '--quiet' || arg === '-q') {
    options.quiet = true;
  } else if (!arg.startsWith('--')) {
    options.files.push(arg);
  }
}

// Display help information
function showHelp() {
  console.log(`
TORI Conversation Extractor - Help
=================================

This tool extracts and organizes content from CLINE conversation files,
separating code blocks, notes, and conversation text.

Usage:
  node extract_conversation.js <path-to-file>              # Process a single file
  node extract_conversation.js --dir <directory>           # Process all .md and .json files
  node extract_conversation.js <file> --outdir <path>      # Specify output directory
  node extract_conversation.js --help                      # Show this help

Optional arguments:
  --format, -f <format>     Output format (default, json)
  --verbose, -v             Show detailed processing information
  --quiet, -q               Suppress non-essential outputs

Examples:
  node extract_conversation.js conversation.md
  node extract_conversation.js --dir ./my_conversations
  node extract_conversation.js conversation.md --outdir ./extracted_data
  node extract_conversation.js conversation.md --format json
  `);
}

// If help flag is present, show help and exit
if (options.help) {
  showHelp();
  process.exit(0);
}

// Validate input options
if (options.files.length === 0 && !options.directory) {
  console.error('Error: No input files specified');
  console.log('Please provide a file path or use --dir to specify a directory.');
  console.log('For help: node extract_conversation.js --help');
  process.exit(1);
}

// Check if directory exists when --dir is used
if (options.directory && !fs.existsSync(options.directory)) {
  console.error(`Error: Directory not found: ${options.directory}`);
  process.exit(1);
}

// Check if output directory exists and is writable
if (options.outputDir) {
  try {
    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true });
      if (!options.quiet) console.log(`Created output directory: ${options.outputDir}`);
    } else {
      // Test if directory is writable
      fs.accessSync(options.outputDir, fs.constants.W_OK);
    }
  } catch (error) {
    console.error(`Error: Unable to access or create output directory: ${options.outputDir}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Collect all files to process
const filesToProcess = [];

if (options.directory) {
  try {
    const dirFiles = fs.readdirSync(options.directory);
    for (const file of dirFiles) {
      const filePath = path.join(options.directory, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile() && 
          (file.endsWith('.md') || file.endsWith('.json') || file.endsWith('.txt'))) {
        filesToProcess.push(filePath);
      }
    }
    
    if (filesToProcess.length === 0) {
      console.error(`Error: No .md, .json, or .txt files found in directory: ${options.directory}`);
      process.exit(1);
    }
    
    if (options.verbose) {
      console.log(`Found ${filesToProcess.length} files to process in ${options.directory}`);
    }
  } catch (error) {
    console.error(`Error accessing directory: ${error.message}`);
    process.exit(1);
  }
} else {
  // Validate that all specified files exist
  for (const file of options.files) {
    if (!fs.existsSync(file)) {
      console.error(`Error: File not found: ${file}`);
      process.exit(1);
    }
    filesToProcess.push(file);
  }
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

// Process a single conversation file
function processConversationFile(inputFilePath, stats) {
  if (!options.quiet) {
    console.log(`Processing file: ${inputFilePath}`);
  }
  
  // Create or determine output directory
  let outputDir;
  if (options.outputDir) {
    outputDir = options.outputDir;
  } else {
    // Use the canonical location from config
    outputDir = path.join(__dirname, config.default_output_dir);
    
    // Create a subfolder based on conversation ID or date if needed
    if (config.preserve_id_folder) {
      const baseName = path.basename(inputFilePath, path.extname(inputFilePath));
      const match = baseName.match(/(\d{4})/); // Extract numeric ID if present
      if (match) {
        outputDir = path.join(outputDir, match[1]);
      } else if (config.use_timestamp_prefix) {
        // Use today's date if no ID is found and timestamp is enabled
        const today = new Date();
        const dateFolder = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        outputDir = path.join(outputDir, dateFolder);
      }
    }
  }
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir, { recursive: true });
    } catch (error) {
      console.error(`Error creating output directory: ${error.message}`);
      return false;
    }
  }
  
  // Read the original file
  let content;
  try {
    content = fs.readFileSync(inputFilePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    return false;
  }
  
  // Quick validation - check if the file has content
  if (!content || content.trim().length === 0) {
    console.error(`Error: ${inputFilePath} is empty`);
    return false;
  }
  
  // Define output file paths
  const baseName = path.basename(inputFilePath, path.extname(inputFilePath));
  const codeFilePath = path.join(outputDir, `${baseName}_code.js`);
  const notesFilePath = path.join(outputDir, `${baseName}_notes.md`);
  const cleanConversationPath = path.join(outputDir, `${baseName}_clean.md`);
  const metadataPath = path.join(outputDir, `${baseName}_metadata.json`);
  
  // Initialize storage for different content types
  let extractedCode = [];
  let extractedNotes = [];
  let cleanConversation = [];
  let metadata = {
    originalFile: inputFilePath,
    extractionDate: new Date().toISOString(),
    totalLines: 0,
    codeBlocks: 0,
    codeLanguages: {},
    noteItems: 0,
    conversationLines: 0
  };
  
  // Process content
  const lines = content.split(/\r?\n/);
  metadata.totalLines = lines.length;
  
  let inCodeBlock = false;
  let currentCodeBlock = [];
  let currentLanguage = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Code block detection
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        // Start of code block
        inCodeBlock = true;
        currentLanguage = line.trim().replace('```', '').trim();
        currentCodeBlock = [];
        
        // Track language statistics
        if (currentLanguage && currentLanguage !== '') {
          if (!metadata.codeLanguages[currentLanguage]) {
            metadata.codeLanguages[currentLanguage] = 0;
          }
          metadata.codeLanguages[currentLanguage]++;
        }
      } else {
        // End of code block
        inCodeBlock = false;
        metadata.codeBlocks++;
        
        if (currentCodeBlock.length > 0 && 
            !currentCodeBlock.join('\n').includes('antml:function_calls') &&
            !['plaintext', 'text', 'output'].includes(currentLanguage.toLowerCase())) {
          
          // Add a header comment to identify the source
          const codeWithHeader = [
            `/**`,
            ` * Code extracted from conversation`,
            ` * Language: ${currentLanguage || 'unspecified'}`,
            ` * Line number in original file: ~${i - currentCodeBlock.length}`,
            ` * Extraction timestamp: ${new Date().toISOString()}`,
            ` */`,
            currentCodeBlock.join('\n'),
            '\n'
          ].join('\n');
          
          extractedCode.push(codeWithHeader);
        }
      }
      continue;
    }
    
    if (inCodeBlock) {
      currentCodeBlock.push(line);
      continue;
    }
    
    // Notes detection - look for bullet points, numbering, and headers
    if (line.trim().match(/^(#{1,6}|\*|\-|\d+\.)\s+/) && 
        !line.includes('antml:') && line.length > 5) {
      extractedNotes.push(line);
      metadata.noteItems++;
      continue;
    }
    
    // Clean conversation - remove system prompts, metadata, and redundant formatting
    if (!line.includes('antml:') && 
        !line.match(/^\s*\<\/?[a-zA-Z]+.*\>\s*$/) && // Skip XML-like tags
        !line.match(/^\s*\{.*\}\s*$/) && // Skip likely JSON blocks
        !line.includes('{"type":"error"') && // Skip error messages
        line.trim().length > 0) { // Skip empty lines
      
      // Further clean the line of any unwanted patterns
      let cleanLine = line
        .replace(/\[\d+m/g, '') // ANSI color codes
        .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, ''); // More ANSI escape sequences
        
      if (cleanLine.trim().length > 0) {
        cleanConversation.push(cleanLine);
        metadata.conversationLines++;
      }
    }
  }
  
  // Handle case where a file might have unclosed code blocks
  if (inCodeBlock) {
    console.warn(`Warning: Unclosed code block detected in ${inputFilePath}`);
    metadata.warnings = metadata.warnings || [];
    metadata.warnings.push("Unclosed code block detected");
    
    // Still add the code block if it has content
    if (currentCodeBlock.length > 0) {
      const codeWithHeader = [
        `/**`,
        ` * Code extracted from conversation (WARNING: UNCLOSED BLOCK)`,
        ` * Language: ${currentLanguage || 'unspecified'}`,
        ` * Line number in original file: ~${lines.length - currentCodeBlock.length}`,
        ` * Note: This code block was unclosed in the original file`,
        ` */`,
        currentCodeBlock.join('\n'),
        '\n'
      ].join('\n');
      
      extractedCode.push(codeWithHeader);
    }
  }
  
  // Handle format option - JSON output
  if (options.format === 'json') {
    try {
      const jsonOutput = {
        metadata: {
          sourceFile: inputFilePath,
          extractionDate: new Date().toISOString(),
          statistics: {
            totalLines: metadata.totalLines,
            codeBlocks: metadata.codeBlocks,
            noteItems: metadata.noteItems,
            conversationLines: metadata.conversationLines
          }
        },
        code: extractedCode.join('\n\n'),
        notes: extractedNotes.join('\n'),
        conversation: cleanConversation.join('\n')
      };
      
      const jsonFilePath = path.join(outputDir, `${baseName}_extracted.json`);
      fs.writeFileSync(jsonFilePath, JSON.stringify(jsonOutput, null, 2));
      
      if (!options.quiet) {
        console.log(`JSON output saved to: ${jsonFilePath}`);
      }
      
      // Update stats
      stats.processedFiles++;
      stats.totalCodeBlocks += metadata.codeBlocks;
      stats.totalNotes += metadata.noteItems;
      stats.totalConversationLines += metadata.conversationLines;
      
      return true;
    } catch (error) {
      console.error(`Error creating JSON output: ${error.message}`);
      return false;
    }
  } else {
    // Default format: separate files
    try {
      fs.writeFileSync(codeFilePath, extractedCode.join('\n\n'));
      fs.writeFileSync(notesFilePath, extractedNotes.join('\n'));
      fs.writeFileSync(cleanConversationPath, cleanConversation.join('\n'));
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      if (!options.quiet) {
        console.log(`Code extracted to: ${codeFilePath}`);
        console.log(`Notes extracted to: ${notesFilePath}`);
        console.log(`Clean conversation saved to: ${cleanConversationPath}`);
        console.log(`Metadata saved to: ${metadataPath}`);
      }
      
      // Calculate statistics
      const originalSize = Buffer.byteLength(content, 'utf8');
      const codeSize = fs.statSync(codeFilePath).size;
      const notesSize = fs.statSync(notesFilePath).size;
      const conversationSize = fs.statSync(cleanConversationPath).size;
      const metadataSize = fs.statSync(metadataPath).size;
      const totalExtractedSize = codeSize + notesSize + conversationSize + metadataSize;
      
      if (!options.quiet) {
        console.log('\nExtraction Complete:');
        console.log(`Original file size: ${formatBytes(originalSize)}`);
        console.log(`Code file size: ${formatBytes(codeSize)}`);
        console.log(`Notes file size: ${formatBytes(notesSize)}`);
        console.log(`Clean conversation size: ${formatBytes(conversationSize)}`);
        console.log(`Metadata file size: ${formatBytes(metadataSize)}`);
        console.log(`Total extracted size: ${formatBytes(totalExtractedSize)}`);
        console.log(`Size reduction: ${formatBytes(originalSize - totalExtractedSize)}`);
      }
      
      // Update stats
      stats.processedFiles++;
      stats.totalCodeBlocks += metadata.codeBlocks;
      stats.totalNotes += metadata.noteItems;
      stats.totalConversationLines += metadata.conversationLines;
      
      return true;
    } catch (error) {
      console.error(`Error writing files: ${error.message}`);
      return false;
    }
  }
}

// Main execution
async function main() {
  console.log(`
===================================================
  TORI Conversation Extractor
===================================================
  
Processing ${filesToProcess.length} file(s)...
`);
  
  // Stats tracking
  const stats = {
    totalFiles: filesToProcess.length,
    processedFiles: 0,
    failedFiles: 0,
    totalCodeBlocks: 0,
    totalNotes: 0,
    totalConversationLines: 0,
    startTime: Date.now()
  };
  
  // Process all files
  for (const file of filesToProcess) {
    try {
      const success = processConversationFile(file, stats);
      if (!success) {
        stats.failedFiles++;
        console.error(`Failed to process: ${file}`);
      }
      
      // Add a separator between files in verbose mode
      if (options.verbose && filesToProcess.length > 1) {
        console.log('\n---------------------------------------------------\n');
      }
    } catch (error) {
      stats.failedFiles++;
      console.error(`Error processing file ${file}: ${error.message}`);
      if (options.verbose) {
        console.error(error.stack);
      }
    }
  }
  
  // Print summary
  const elapsedTime = (Date.now() - stats.startTime) / 1000;
  console.log(`
===================================================
  Extraction Summary
===================================================

Files processed: ${stats.processedFiles}/${stats.totalFiles}
Files failed: ${stats.failedFiles}
Total code blocks extracted: ${stats.totalCodeBlocks}
Total note items extracted: ${stats.totalNotes}
Total conversation lines extracted: ${stats.totalConversationLines}
Execution time: ${elapsedTime.toFixed(2)} seconds
`);
  
  // Exit with appropriate code
  process.exit(stats.failedFiles > 0 ? 1 : 0);
}

// Start processing
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
