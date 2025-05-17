/**
 * Test script for ESM compatibility with Node.js packages
 * Run with: node src/esmPackageTest.js
 */

// ESM packages tests
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import util from 'util';
import os from 'os';

// Get current file information (ESM way)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n=== ESM PACKAGE COMPATIBILITY TEST ===\n');

console.log('1. Native Node.js modules in ESM:');
console.log('   Current file:', __filename);
console.log('   Directory:', __dirname);
console.log('   Platform:', os.platform());
console.log('   Architecture:', os.arch());
console.log('   Node.js version:', process.version);

// Test file operations with fs promises
async function testFileOperations() {
  console.log('\n2. Testing file operations with fs/promises:');
  
  const testFile = path.join(os.tmpdir(), 'esm-test.txt');
  
  try {
    // Write file
    await fs.writeFile(testFile, 'This is an ESM test file.\nCreated on: ' + new Date().toISOString());
    console.log('   ✅ File written successfully.');
    
    // Read file
    const content = await fs.readFile(testFile, 'utf8');
    console.log(`   ✅ File read successfully: "${content.split('\n')[0]}"`);
    
    // File stats
    const stats = await fs.stat(testFile);
    console.log(`   ✅ File stats: Size = ${stats.size} bytes, Created: ${stats.birthtime.toLocaleString()}`);
    
    // Delete file
    await fs.unlink(testFile);
    console.log('   ✅ File deleted successfully.');
  } catch (error) {
    console.error(`   ❌ File operation failed: ${error.message}`);
  }
}

// Test import.meta features
function testImportMeta() {
  console.log('\n3. Testing import.meta features:');
  console.log('   import.meta.url:', import.meta.url);
  
  // Check if resolved correctly
  const urlPath = fileURLToPath(import.meta.url);
  const expectedPath = __filename;
  
  if (urlPath === expectedPath) {
    console.log('   ✅ import.meta.url resolves correctly to the file path.');
  } else {
    console.log('   ❌ import.meta.url does not resolve to the expected path:');
    console.log(`      Expected: ${expectedPath}`);
    console.log(`      Actual: ${urlPath}`);
  }
}

// Test dynamic imports
async function testDynamicImports() {
  console.log('\n4. Testing dynamic imports:');
  
  try {
    // Dynamically import a local module
    const utilsModule = await import('./utils/esModuleTest.js');
    console.log('   ✅ Dynamic import of local module successful.');
    console.log(`   Sample call: multiply(5, 7) = ${utilsModule.multiply(5, 7)}`);
    
    // Check if apiData (from top-level await) is available
    if (utilsModule.apiData && utilsModule.apiData.status) {
      console.log(`   ✅ Top-level await data accessible: status = ${utilsModule.apiData.status}`);
    } else {
      console.log('   ❌ Top-level await data not accessible.');
    }
  } catch (error) {
    console.error(`   ❌ Dynamic import failed: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testFileOperations();
    testImportMeta();
    await testDynamicImports();
    
    console.log('\n=== ESM PACKAGE TESTS COMPLETED ===\n');
    console.log('✅ All tests completed. If you see successful results above, your ES Module setup is compatible with Node.js packages.');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

runAllTests();
