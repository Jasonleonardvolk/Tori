const fs = require('fs');
const path = require('path');

// List of files with useEffect hooks needing dependency arrays from the infinite-loop report
const filesToFix = [
  'client/src/AffectiveApp.jsx',
  'client/src/AffectiveIntegrationExample.jsx',
  'client/src/components/AgentPanel/ConsoleAgent.jsx',
  'client/src/components/AgentPanel/DocAgent.jsx',
  'client/src/components/AgentPanel/MemoryAgent.jsx',
  'client/src/components/ChatHistory/ChatHistory.jsx',
  'client/src/components/ConceptEditorPanel/ConceptEditorPanel.jsx',
  'client/src/components/ConceptFieldCanvas/ConceptFieldCanvas.jsx',
  'client/src/components/ConceptGraphVisualizer/ConceptGraphVisualizer.jsx',
  'client/src/components/DeveloperStateMonitor/DeveloperStateMonitor.jsx',
  'client/src/components/FieldMeditationMode/FieldMeditationMode.jsx',
  'client/src/components/QuickActionsBar/AffectiveQuickActionsBar.jsx',
  'client/src/components/QuickActionsBar/QuickActionsBar.jsx',
  'client/src/components/SemanticCommitDemo/SemanticCommitDemo.jsx',
  'client/src/components/SemanticCommitPanel/SemanticCommitPanel.jsx',
  'client/src/components/SemanticSearchPanel/SemanticSearchPanel.jsx',
  'client/src/DemoApp.jsx'
];

// Function to fix a file
function fixFile(filePath) {
  try {
    console.log(`Processing ${filePath}...`);
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace useEffect without dependency array with useEffect with empty dependency array
    // This regex matches useEffect(() => {...}) without a dependency array
    const fixedContent = content.replace(
      /useEffect\(\s*\(\s*\)\s*=>\s*\{(?:\n|.)*?\n\s*\}\s*\)/g, 
      match => `${match}, []`
    );
    
    // Write fixed content back to file
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    
    console.log(`Fixed ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
    return false;
  }
}

// Process each file
let successCount = 0;
let failCount = 0;

for (const file of filesToFix) {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const success = fixFile(fullPath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  } else {
    console.warn(`File not found: ${fullPath}`);
    failCount++;
  }
}

console.log('\nSummary:');
console.log(`Total files processed: ${filesToFix.length}`);
console.log(`Successfully fixed: ${successCount}`);
console.log(`Failed to fix: ${failCount}`);
