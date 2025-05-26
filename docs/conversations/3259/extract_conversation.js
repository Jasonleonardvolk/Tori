const fs = require('fs');
const path = require('path');

/**
 * Script to extract important content from CLINE conversation files
 * and organize into three separate files: code, notes, and conversation.
 */
function processConversationFile(inputFilePath) {
  console.log(`Processing file: ${inputFilePath}`);
  
  // Create output directory if it doesn't exist
  const outputDir = path.join(path.dirname(inputFilePath), 'extracted');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Read the original file
  let content;
  try {
    content = fs.readFileSync(inputFilePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    return;
  }
  
  // Define output file paths
  const baseName = path.basename(inputFilePath, path.extname(inputFilePath));
  const codeFilePath = path.join(outputDir, `${baseName}_code.js`);
  const notesFilePath = path.join(outputDir, `${baseName}_notes.md`);
  const cleanConversationPath = path.join(outputDir, `${baseName}_clean.md`);
  
  // Initialize storage for different content types
  let extractedCode = [];
  let extractedNotes = [];
  let cleanConversation = [];
  
  // Process content
  const lines = content.split('\n');
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
        currentLanguage = line.trim().replace('```', '');
        currentCodeBlock = [];
      } else {
        // End of code block
        inCodeBlock = false;
        if (currentCodeBlock.length > 0 && 
            !currentCodeBlock.join('\n').includes('antml:function_calls') &&
            !['plaintext', 'text', 'output'].includes(currentLanguage.toLowerCase())) {
          
          // Add a header comment to identify the source
          const codeWithHeader = [
            `/**`,
            ` * Code extracted from conversation`,
            ` * Language: ${currentLanguage}`,
            ` * Line number in original file: ~${i - currentCodeBlock.length}`,
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
      }
    }
  }
  
  // Write extracted content to files
  try {
    fs.writeFileSync(codeFilePath, extractedCode.join('\n\n'));
    console.log(`Code extracted to: ${codeFilePath}`);
    
    fs.writeFileSync(notesFilePath, extractedNotes.join('\n'));
    console.log(`Notes extracted to: ${notesFilePath}`);
    
    fs.writeFileSync(cleanConversationPath, cleanConversation.join('\n'));
    console.log(`Clean conversation saved to: ${cleanConversationPath}`);
  } catch (error) {
    console.error(`Error writing files: ${error.message}`);
  }
  
  // Calculate statistics
  const originalSize = Buffer.byteLength(content, 'utf8');
  const codeSize = fs.statSync(codeFilePath).size;
  const notesSize = fs.statSync(notesFilePath).size;
  const conversationSize = fs.statSync(cleanConversationPath).size;
  
  console.log('\nExtraction Complete:');
  console.log(`Original file size: ${formatBytes(originalSize)}`);
  console.log(`Code file size: ${formatBytes(codeSize)}`);
  console.log(`Notes file size: ${formatBytes(notesSize)}`);
  console.log(`Clean conversation size: ${formatBytes(conversationSize)}`);
  console.log(`Total extracted size: ${formatBytes(codeSize + notesSize + conversationSize)}`);
  console.log(`Size reduction: ${formatBytes(originalSize - (codeSize + notesSize + conversationSize))}`);
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
const inputFilePath = process.argv[2];
if (!inputFilePath) {
  console.error('Please provide the path to the conversation file');
  console.log('Usage: node extract_conversation.js <path-to-file>');
  process.exit(1);
}

processConversationFile(inputFilePath);