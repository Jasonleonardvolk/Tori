/**
 * ES Module Test Runner
 * Run this file with: node src/esModuleTestRunner.js
 */

import MathUtility, { sum, multiply, apiData } from './utils/esModuleTest.js';

console.log('\n=== ES MODULE FUNCTIONALITY TEST ===\n');

// Test 1: Named exports
console.log('1. Testing named exports:');
console.log(`   sum(5, 3) = ${sum(5, 3)}`);
console.log(`   multiply(4, 6) = ${multiply(4, 6)}`);

// Test 2: Default export
console.log('\n2. Testing default export:');
console.log(`   MathUtility.subtract(10, 4) = ${MathUtility.subtract(10, 4)}`);
console.log(`   MathUtility.divide(20, 5) = ${MathUtility.divide(20, 5)}`);
console.log(`   MathUtility.square(7) = ${MathUtility.square(7)}`);

// Test 3: Top-level await functionality
console.log('\n3. Testing top-level await:');
console.log(`   apiData: ${JSON.stringify(apiData, null, 2)}`);

// Test 4: Dynamic import
console.log('\n4. Testing dynamic import:');
const dynamicImport = async () => {
  try {
    // Dynamic import (another ES Module feature)
    const dynamicModule = await import('./utils/esModuleTest.js');
    console.log(`   Dynamic import successful!`);
    console.log(`   dynamicModule.multiply(3, 7) = ${dynamicModule.multiply(3, 7)}`);
  } catch (error) {
    console.error(`   Dynamic import failed: ${error.message}`);
  }
};

await dynamicImport();

console.log('\n=== ALL TESTS COMPLETED ===\n');
