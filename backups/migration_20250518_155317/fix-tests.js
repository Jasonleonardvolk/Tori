#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 ALAN IDE Test Fix Script Starting...\n');

// Step 1: Fix Jest configuration to properly handle absolute imports
console.log('1️⃣ Checking and fixing Jest configuration...');

const jestConfigPath = path.join(__dirname, 'jest.config.js');
let jestConfig = `// jest.config.js  (root)
module.exports = {
  roots: ['<rootDir>/client'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/client/src/test-utils.js'],
  moduleDirectories: ['node_modules', '<rootDir>/client/src'], // for absolute imports
  moduleNameMapper: {
    '\\\\.(css|scss|svg|png)$': 'identity-obj-proxy',
    // Handle absolute imports from src
    '^components/(.*)$': '<rootDir>/client/src/components/$1',
    '^services/(.*)$': '<rootDir>/client/src/services/$1',
    '^utils/(.*)$': '<rootDir>/client/src/utils/$1',
    '^hooks/(.*)$': '<rootDir>/client/src/hooks/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/client/node_modules/',
    '/__mocks__/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
};`;

fs.writeFileSync(jestConfigPath, jestConfig);
console.log('✅ Jest config updated with proper module mapping');

// Step 2: Ensure test-utils.js is properly configured
console.log('\n2️⃣ Checking and fixing test utilities...');

const testUtilsPath = path.join(__dirname, 'client', 'src', 'test-utils.js');
let testUtilsContent = `// Patch for JSDOM missing APIs
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class {
  constructor() {}
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Patch for missing canvas context
const createMockCanvas = () => {
  const canvas = {
    getContext: () => ({
      beginPath: () => {},
      closePath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      fillRect: () => {},
      clearRect: () => {},
      measureText: () => ({ width: 0 }),
      fillText: () => {},
      strokeText: () => {},
      moveTo: () => {},
      lineTo: () => {},
      quadraticCurveTo: () => {},
      bezierCurveTo: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      transform: () => {},
      createLinearGradient: () => ({
        addColorStop: () => {}
      })
    }),
    width: 500,
    height: 500
  };
  return canvas;
};

document.createElement = (tagName) => {
  if (tagName === 'canvas') {
    return createMockCanvas();
  }
  return document.createElement.call(document, tagName);
};

import React from 'react';
import { render } from '@testing-library/react';
import { PersonaProvider } from './components/PersonaSelector/PersonaContext';

// Default stub conceptData for all tests
const defaultConceptData = { 
  alpha: 0, 
  epsilon: 0, 
  nodes: [
    { id: 'node_1', label: 'Node 1', phase: 0.0 },
    { id: 'node_2', label: 'Node 2', phase: 0.0 },
    { id: 'node_3', label: 'Node 3', phase: 0.0 }
  ], 
  links: [] 
};

// Mock services that are commonly used
jest.mock('./services/conceptGraphService', () => ({
  getNode: jest.fn((nodeId) => ({
    id: nodeId,
    label: \`Node \${nodeId}\`,
    type: 'function',
    phase: 0.0
  })),
  updateNode: jest.fn(),
  getConceptGraph: jest.fn(() => defaultConceptData),
  subscribeToUpdates: jest.fn(() => () => {}),
}));

jest.mock('./services/executionTracerService', () => ({
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn(),
  executionState: {
    currentNode: null,
    currentPhase: 0,
    divergences: []
  },
  detectDivergences: jest.fn(),
  handleExecutionStart: jest.fn(),
  emitTraceUpdate: jest.fn(),
  subscribeToExecutionUpdates: jest.fn(() => () => {}),
}));

const AllTheProviders = ({ children, conceptData = defaultConceptData }) => {
  // If children is a React element, clone it with conceptData
  // Otherwise, wrap it in a fragment
  const childElement = React.isValidElement(children) 
    ? React.cloneElement(children, { conceptData, ...children.props })
    : children;
    
  return (
    <PersonaProvider>
      {childElement}
    </PersonaProvider>
  );
};

const customRender = (ui, options = {}) => {
  const { wrapper, ...renderOptions } = options;
  
  const Wrapper = ({ children }) => {
    const providers = wrapper ? wrapper({ children }) : <AllTheProviders>{children}</AllTheProviders>;
    return providers;
  };
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export * from '@testing-library/react';
export { customRender as render };
export { defaultConceptData };
`;

fs.writeFileSync(testUtilsPath, testUtilsContent);
console.log('✅ test-utils.js updated with comprehensive mocks and polyfills');

// Step 3: Fix setupTests.js
console.log('\n3️⃣ Checking and fixing setupTests.js...');

const setupTestsPath = path.join(__dirname, 'client', 'setupTests.js');
let setupTestsContent = `// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Global test environment setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
});

afterEach(() => {
  // Clean up after each test
  jest.clearAllMocks();
  
  // Reset any timers
  jest.useRealTimers();
});

// Suppress console errors during tests unless needed for debugging
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
`;

fs.writeFileSync(setupTestsPath, setupTestsContent);
console.log('✅ setupTests.js updated');

// Step 4: Create a test verification script
console.log('\n4️⃣ Creating test verification script...');

const verifyTestsPath = path.join(__dirname, 'verify-tests.js');
let verifyTestsContent = `#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🧪 Verifying Test Setup...\n');

// Step 1: Run tests with verbose output
console.log('Running tests with verbose output...');
exec('npm run test -- --verbose --bail', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Test run failed:');
    console.error('Error:', error.message);
    
    // Find first failing test for targeted debugging
    const failMatch = stdout.match(/✕ (.+)\\n/);
    if (failMatch) {
      console.log('\nFirst failing test:', failMatch[1]);
      console.log('Run with: node run-single-test.js "path/to/failing/test"');
    }
    
    // Show relevant error context
    const lines = stdout.split('\n');
    const errorLines = lines.filter(line => 
      line.includes('Expected') || 
      line.includes('Received') || 
      line.includes('Error:') ||
      line.includes('Cannot resolve')
    );
    
    if (errorLines.length > 0) {
      console.log('\nKey error details:');
      errorLines.forEach(line => console.log('  ', line.trim()));
    }
  } else {
    console.log('✅ All tests passed!');
    
    // Extract test summary
    const summaryMatch = stdout.match(/Test Suites: (.+)/);
    if (summaryMatch) {
      console.log('\nSummary:', summaryMatch[0]);
    }
    
    // Run coverage if tests passed
    console.log('\nGenerating coverage report...');
    exec('npm run test:coverage', { cwd: __dirname }, (coverageError, coverageStdout) => {
      if (coverageError) {
        console.error('❌ Coverage generation failed');
      } else {
        console.log('✅ Coverage report generated');
        console.log('View at: coverage/lcov-report/index.html');
      }
    });
  }
});
`;

fs.writeFileSync(verifyTestsPath, verifyTestsContent);
console.log('✅ verify-tests.js created');

// Step 5: Create a comprehensive test runner
console.log('\n5️⃣ Creating comprehensive test runner...');

const runAllTestsPath = path.join(__dirname, 'run-all-tests.js');
let runAllTestsContent = `#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 ALAN IDE Comprehensive Test Runner\n');

// Test categories
const testCategories = [
  {
    name: 'Unit Tests',
    pattern: 'client/src/__tests__/**/!(*.integration.test|*.e2e.test).js',
    timeout: 30000
  },
  {
    name: 'Integration Tests',
    pattern: 'client/src/__tests__/**/*.integration.test.js',
    timeout: 60000
  },
  {
    name: 'Security Tests',
    pattern: 'client/src/__tests__/security/**/*.test.js',
    timeout: 45000
  },
  {
    name: 'Performance Tests',
    pattern: 'client/src/__tests__/performance/**/*.test.js',
    timeout: 90000
  }
];

let allPassed = true;
const results = [];

function runTestCategory(category) {
  return new Promise((resolve) => {
    console.log(\`\n📋 Running \${category.name}...\`);
    
    const command = \`jest "\${category.pattern}" --verbose --testTimeout=\${category.timeout}\`;
    
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        allPassed = false;
        results.push({
          category: category.name,
          status: 'FAILED',
          error: error.message,
          output: stdout
        });
      } else {
        results.push({
          category: category.name,
          status: 'PASSED',
          output: stdout
        });
      }
      resolve();
    });
  });
}

async function runAllTests() {
  // Run each category
  for (const category of testCategories) {
    await runTestCategory(category);
  }
  
  // Generate summary
  console.log('\n📊 Test Summary:\n');
  results.forEach(result => {
    console.log(\`\${result.status === 'PASSED' ? '✅' : '❌'} \${result.category}: \${result.status}\`);
  });
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Generating coverage...');
    
    // Generate coverage
    exec('npm run test:coverage', { cwd: __dirname }, (error, stdout) => {
      if (error) {
        console.error('❌ Coverage generation failed');
      } else {
        console.log('✅ Coverage report generated');
        
        // Parse coverage summary
        const coverageMatch = stdout.match(/All files.*?(\\d+\\.\\d+)/);
        if (coverageMatch) {
          console.log(\`📈 Overall coverage: \${coverageMatch[1]}%\`);
        }
        
        console.log('\n🔗 View coverage report:');
        console.log(\`   file://\${path.join(__dirname, 'coverage', 'lcov-report', 'index.html')}\`);
      }
    });
  } else {
    console.log('\n❌ Some tests failed. Please review and fix issues.');
    
    // Show first failure details
    const firstFailure = results.find(r => r.status === 'FAILED');
    if (firstFailure) {
      console.log('\n🔍 First failure details:');
      console.log('Category:', firstFailure.category);
      console.log('Error:', firstFailure.error);
    }
  }
}

// Start the test run
runAllTests();
`;

fs.writeFileSync(runAllTestsPath, runAllTestsContent);
console.log('✅ run-all-tests.js created');

// Final summary
console.log('\n✨ Test Infrastructure Fix Complete!\n');
console.log('What was fixed:');
console.log('1. ✅ Jest configuration with proper module resolution');
console.log('2. ✅ test-utils.js with comprehensive mocks and polyfills');
console.log('3. ✅ setupTests.js with proper test environment setup');
console.log('4. ✅ Verification and test runner scripts created');

console.log('\n📝 Next steps:');
console.log('1. Run: node verify-tests.js - to check if tests are now working');
console.log('2. Run: node run-all-tests.js - for comprehensive test execution');
console.log('3. Run: npm run test:coverage - for coverage report');

console.log('\n🎯 Expected outcome:');
console.log('- Tests should now run without configuration errors');
console.log('- Coverage report should be properly generated');
console.log('- Failed tests should be due to actual code issues, not configuration');
`;

exec('node test-diagnostics.js', { cwd: __dirname }, (error, stdout, stderr) => {
  if (stdout) {
    console.log('\n📊 Diagnostic Results:');
    console.log(stdout);
  }
});
