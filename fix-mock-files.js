#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing mock files that Jest is trying to run as tests...\n');

// Files that are mocks but Jest is trying to run them as tests
const mockFiles = [
  'client/src/__tests__/integration/MCPClient_DebugAgent/mockMcpClientService.js',
  'client/src/__tests__/integration/ExecutionTracer_FieldMeditationMode/mockExecutionTracerService.js',
  'client/src/__tests__/integration/RefactorService_EditorSyncService/mockEditorSyncService.js',
  'client/src/__tests__/integration/ExecutionTracer_FieldMeditationMode/mockComponents.js',
  'client/src/__tests__/integration/Exporter_ConceptGraphService/mockConceptGraphService.js',
];

let fixedCount = 0;

mockFiles.forEach(mockFile => {
  const fullPath = path.join(__dirname, mockFile);
  
  if (fs.existsSync(fullPath)) {
    // Rename mock files to not be detected as tests
    const newPath = fullPath.replace('.js', '.mock.js');
    
    try {
      fs.renameSync(fullPath, newPath);
      console.log(`✅ Renamed: ${mockFile} → ${path.basename(newPath)}`);
      fixedCount++;
      
      // Also check if there's any content we need to preserve
      const content = fs.readFileSync(newPath, 'utf8');
      if (!content.trim() || content.length < 50) {
        console.log(`   ℹ️  Empty/minimal mock file - might need proper mock implementation`);
      }
    } catch (error) {
      console.log(`❌ Error renaming ${mockFile}:`, error.message);
    }
  } else {
    console.log(`ℹ️  File not found: ${mockFile}`);
  }
});

// Update .jestignore to ignore .mock.js files
const jestIgnorePath = path.join(__dirname, '.jestignore');
let jestIgnoreContent = '';

if (fs.existsSync(jestIgnorePath)) {
  jestIgnoreContent = fs.readFileSync(jestIgnorePath, 'utf8');
}

if (!jestIgnoreContent.includes('*.mock.js')) {
  jestIgnoreContent += '\n# Ignore mock files\n*.mock.js\n';
  fs.writeFileSync(jestIgnorePath, jestIgnoreContent);
  console.log('\n✅ Updated .jestignore to ignore .mock.js files');
}

console.log(`\n📊 Summary:`);
console.log(`Files fixed: ${fixedCount}`);
console.log(`Mock files are now renamed to .mock.js and ignored by Jest`);

console.log('\n🚀 Next steps:');
console.log('1. Run: npm test (should be much cleaner now)');
console.log('2. Address any remaining actual test failures');
console.log('3. If needed, implement proper mock content in the .mock.js files');
