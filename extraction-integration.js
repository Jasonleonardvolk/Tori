#!/usr/bin/env node

/**
 * TORI Conversation Extraction Integration
 * 
 * This script integrates the conversation extraction functionality with
 * the TORI deployment system. It can be called from both Windows and Unix
 * deployment scripts to provide a unified extraction experience.
 * 
 * Usage:
 *   node extraction-integration.js [options]
 * 
 * Options:
 *   --conversation <path>   Path to conversation file or directory to process
 *   --output <directory>    Custom output directory
 *   --verify                Verify extracted files after processing
 *   --auto-fix              Automatically attempt to fix any issues found
 *   --silent                Run in silent mode with minimal output
 *   --help                  Show this help message
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Load configuration if available
let config = {
  default_output_dir: "ingest_pdf/extracted_conversations",
  preserve_id_folder: true,
  use_timestamp_prefix: false,
  supported_extensions: [".md", ".json", ".txt"],
  integration: {
    extraction_timeout_ms: 30000,
    verification_timeout_ms: 15000,
    max_recent_conversations: 5
  }
};

try {
  const configPath = path.join(__dirname, 'conversation_config.json');
  if (fs.existsSync(configPath)) {
    const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...loadedConfig };
    
    // Ensure the integration section exists
    if (!config.integration) {
      config.integration = {
        extraction_timeout_ms: 30000,
        verification_timeout_ms: 15000,
        max_recent_conversations: 5
      };
    }
  }
} catch (error) {
  console.warn(`Warning: Could not load configuration file: ${error.message}`);
  console.warn('Using default configuration settings');
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  conversationPath: null,
  outputDirectory: null,
  verify: false,
  autoFix: false,
  silent: false,
  help: false
};

// Process command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--help' || arg === '-h') {
    options.help = true;
  } else if (arg === '--conversation' || arg === '-c') {
    options.conversationPath = args[++i];
  } else if (arg === '--output' || arg === '-o') {
    options.outputDirectory = args[++i];
  } else if (arg === '--verify' || arg === '-v') {
    options.verify = true;
  } else if (arg === '--auto-fix' || arg === '-f') {
    options.autoFix = true;
  } else if (arg === '--silent' || arg === '-s') {
    options.silent = true;
  }
}

// Display help information
function showHelp() {
  console.log(`
TORI Conversation Extraction Integration - Help
===============================================

This tool integrates conversation extraction with the TORI deployment system,
providing a unified extraction experience across Windows and Unix environments.

Usage:
  node extraction-integration.js [options]

Options:
  --conversation, -c <path>   Path to conversation file or directory to process
  --output, -o <directory>    Custom output directory for extracted files
  --verify, -v                Verify extracted files after processing
  --auto-fix, -f              Automatically attempt to fix any issues found
  --silent, -s                Run in silent mode with minimal output
  --help, -h                  Show this help message

Examples:
  node extraction-integration.js --conversation ./docs/conversations/3259/cline_task.md
  node extraction-integration.js --conversation ./docs/conversations --verify
  node extraction-integration.js --conversation file.md --output ./extracted --auto-fix
  `);
}

// Check if extraction tools are available
function checkToolsAvailability() {
  const extractorPath = path.join(__dirname, 'extract_conversation.js');
  const verifierPath = path.join(__dirname, 'verify-extraction.js');
  
  const extractorExists = fs.existsSync(extractorPath);
  const verifierExists = fs.existsSync(verifierPath);
  
  return {
    extractor: extractorExists,
    verifier: verifierExists
  };
}

// Run a command and capture output
function runCommand(command, args = [], silent = false) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { 
      stdio: silent ? 'ignore' : 'inherit'
    });
    
    let stdout = '';
    let stderr = '';
    
    if (silent) {
      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    process.on('error', (err) => {
      reject(err);
    });
  });
}

// Find recent conversation files
async function findRecentConversations(limit = 5) {
  const docsDir = path.join(__dirname, 'docs');
  const conversationDirs = [];
  
  if (!fs.existsSync(docsDir)) {
    return [];
  }
  
  try {
    // Look for conversation directories
    function searchConversationDirs(dir, results, depth = 0, maxDepth = 4) {
      if (depth > maxDepth) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(dir, entry.name);
          
          // Check if this is a conversations directory
          if (entry.name === 'conversations' || 
              entry.name.includes('conversation') ||
              entry.name.includes('cline')) {
            
            // Get the files in this directory
            try {
              const files = fs.readdirSync(fullPath)
                .filter(file => file.endsWith('.md') || file.endsWith('.json'))
                .map(file => {
                  const filePath = path.join(fullPath, file);
                  const stats = fs.statSync(filePath);
                  return {
                    path: filePath,
                    name: file,
                    mtime: stats.mtime
                  };
                });
              
              if (files.length > 0) {
                results.push(...files);
              }
            } catch (error) {
              // Continue if we can't access the files
            }
          }
          
          // Recurse into subdirectories
          searchConversationDirs(fullPath, results, depth + 1, maxDepth);
        }
      }
    }
    
    searchConversationDirs(docsDir, conversationDirs);
    
    // Sort by modification time, newest first
    conversationDirs.sort((a, b) => b.mtime - a.mtime);
    
    // Return the top N
    return conversationDirs.slice(0, limit);
  } catch (error) {
    console.error(`Error finding recent conversations: ${error.message}`);
    return [];
  }
}

// Main function
async function main() {
  // Show help if requested
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  // Check if the extraction tools are available
  const tools = checkToolsAvailability();
  
  if (!tools.extractor) {
    console.error('Error: extract_conversation.js not found in the current directory.');
    console.error('Please ensure the extraction tools are installed correctly.');
    process.exit(1);
  }
  
  // If no conversation path is provided, try to find recent ones
  if (!options.conversationPath) {
    const recentConversations = await findRecentConversations();
    
    if (recentConversations.length === 0) {
      console.error('Error: No conversation path provided and no recent conversations found.');
      console.error('Please specify a conversation file or directory using --conversation.');
      process.exit(1);
    }
    
    // Display recent conversations
    console.log(`
No conversation path provided. Found ${recentConversations.length} recent conversations:
`);
    
    for (let i = 0; i < recentConversations.length; i++) {
      const conv = recentConversations[i];
      console.log(`${i + 1}. ${conv.name}`);
      console.log(`   Path: ${conv.path}`);
      console.log(`   Modified: ${conv.mtime.toLocaleString()}`);
      console.log('');
    }
    
    // Ask for input
    console.log('Enter the number of the conversation to process or press Enter to exit: ');
    // Note: This will need user input handling in a real implementation
    // For this example, we'll just exit
    process.exit(0);
  }
  
  // Check if the conversation path exists
  if (!fs.existsSync(options.conversationPath)) {
    console.error(`Error: Conversation path not found: ${options.conversationPath}`);
    process.exit(1);
  }
  
  // Build extraction command
  const extractorArgs = [
    path.join(__dirname, 'extract_conversation.js')
  ];
  
  if (fs.statSync(options.conversationPath).isDirectory()) {
    extractorArgs.push('--dir', options.conversationPath);
  } else {
    extractorArgs.push(options.conversationPath);
  }
  
  if (options.outputDirectory) {
    extractorArgs.push('--outdir', options.outputDirectory);
  }
  
  if (options.silent) {
    extractorArgs.push('--quiet');
  }
  
  // Run extraction
  console.log(`
===================================================
  TORI Conversation Extraction Integration
===================================================

Starting extraction process...
`);
  
  try {
    await runCommand('node', extractorArgs, options.silent);
    console.log('Extraction completed successfully.');
    
    // Determine the output directory for verification
    let outputDir;
    if (options.outputDirectory) {
      outputDir = options.outputDirectory;
    } else {
      // Use the new canonical location
      outputDir = path.join(__dirname, 'ingest_pdf', 'extracted_conversations');
      
      // Try to determine a subfolder based on the input path
      if (fs.statSync(options.conversationPath).isDirectory()) {
        // For directories, check if we can find a numeric ID in the path
        const pathParts = options.conversationPath.split(/[\/\\]/);
        for (const part of pathParts) {
          const match = part.match(/(\d{4})/);
          if (match) {
            outputDir = path.join(outputDir, match[1]);
            break;
          }
        }
      } else {
        // For individual files, extract ID from filename
        const baseName = path.basename(options.conversationPath, path.extname(options.conversationPath));
        const match = baseName.match(/(\d{4})/);
        if (match) {
          outputDir = path.join(outputDir, match[1]);
        }
      }
    }
    
    // Verify if requested and the verifier is available
    if (options.verify && tools.verifier) {
      console.log('\nVerifying extracted files...');
      
      const verifierArgs = [
        path.join(__dirname, 'verify-extraction.js'),
        outputDir
      ];
      
      if (options.autoFix) {
        verifierArgs.push('--fix');
      }
      
      if (options.silent) {
        verifierArgs.push('--quiet');
      }
      
      await runCommand('node', verifierArgs, options.silent);
    }
    
    console.log(`
===================================================
  Extraction Integration Complete
===================================================
`);
    
  } catch (error) {
    console.error(`Error during extraction process: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
