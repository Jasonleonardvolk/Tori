#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 ALAN IDE Test Fix Script v2.0\n');

// Step 1: Fix Jest configuration
console.log('1️⃣ Fixing Jest configuration...');

const jestConfigPath = path.join(__dirname, 'jest.config.js');
const jestConfig = `// jest.config.js  (root)
module.exports = {
  roots: ['<rootDir>/client'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/client/src/test-utils.js'],
  moduleDirectories: ['node_modules', '<rootDir>/client/src'],
  moduleNameMapper: {
    '\\\\.(css|scss|svg|png)$': 'identity-obj-proxy',
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
    'node_modules/(?!(.*\\\\.mjs$))',
  ],
};`;

fs.writeFileSync(jestConfigPath, jestConfig);
console.log('✅ Jest config updated');

// Step 2: Fix test-utils.js
console.log('\n2️⃣ Updating test utilities...');

const testUtilsPath = path.join(__dirname, 'client', 'src', 'test-utils.js');
const testUtilsContent = `// Patch for JSDOM missing APIs
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

// Simple mock canvas
const mockCanvas = {
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
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    createLinearGradient: () => ({
      addColorStop: () => {}
    })
  }),
  width: 500,
  height: 500
};

const originalCreateElement = document.createElement.bind(document);
document.createElement = (tagName) => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  return originalCreateElement(tagName);
};

import React from 'react';
import { render } from '@testing-library/react';
import { PersonaProvider } from './components/PersonaSelector/PersonaContext';

// Default concept data for all tests
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

// Mock common services
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
console.log('✅ test-utils.js updated');

// Step 3: Create simple verify script
console.log('\n3️⃣ Creating verification script...');

const verifyTestsPath = path.join(__dirname, 'verify-tests.js');
const verifyTestsContent = `#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🧪 Verifying Test Setup...\n');

// Run a simple test
console.log('Running tests with verbose output...');
exec('npm run test -- --verbose --bail', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Test run failed:');
    console.error('Error:', error.message);
    
    // Find first failing test
    const failMatch = stdout.match(/✕ (.+)\\n/);
    if (failMatch) {
      console.log('\\nFirst failing test:', failMatch[1]);
    }
    
    // Show error context
    const lines = stdout.split('\\n');
    const errorLines = lines.filter(line => 
      line.includes('Expected') || 
      line.includes('Received') || 
      line.includes('Error:') ||
      line.includes('Cannot resolve')
    );
    
    if (errorLines.length > 0) {
      console.log('\\nKey error details:');
      errorLines.forEach(line => console.log('  ', line.trim()));
    }
  } else {
    console.log('✅ All tests passed!');
    
    // Extract test summary
    const summaryMatch = stdout.match(/Test Suites: (.+)/);
    if (summaryMatch) {
      console.log('\\nSummary:', summaryMatch[0]);
    }
    
    // Run coverage
    console.log('\\nGenerating coverage report...');
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

// Step 4: Create simple diagnostic script
console.log('\n4️⃣ Creating diagnostic script...');

const diagnosticsPath = path.join(__dirname, 'test-diagnostics-simple.js');
const diagnosticsContent = `#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔍 Simple Test Diagnostics\n');

// Check config files
console.log('1️⃣ Checking configuration files...');
const files = [
  ['jest.config.js', 'Jest Configuration'],
  ['client/src/test-utils.js', 'Test Utilities'],
  ['package.json', 'Package.json']
];

files.forEach(([file, description]) => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(\`\${exists ? '✅' : '❌'} \${description}: \${exists ? 'EXISTS' : 'MISSING'}\`);
});

// Check dependencies
console.log('\\n2️⃣ Checking dependencies...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = require(packagePath);
  const devDeps = pkg.devDependencies || {};
  
  const requiredDeps = [
    'jest',
    '@testing-library/react',
    '@testing-library/jest-dom',
  ];
  
  requiredDeps.forEach(dep => {
    console.log(\`\${devDeps[dep] ? '✅' : '❌'} \${dep}: \${devDeps[dep] || 'MISSING'}\`);
  });
}

// Try a simple test run
console.log('\\n3️⃣ Testing configuration...');
exec('npm run test -- --listTests', { cwd: __dirname }, (error, stdout) => {
  if (error) {
    console.log('❌ Test discovery failed');
  } else {
    const testCount = stdout.split('\\n').filter(line => line.includes('test.')).length;
    console.log(\`✅ Found \${testCount} test files\`);
  }
});
`;

fs.writeFileSync(diagnosticsPath, diagnosticsContent);
console.log('✅ test-diagnostics-simple.js created');

// Step 5: Create run-single-test script
console.log('\n5️⃣ Creating single test runner...');

const singleTestPath = path.join(__dirname, 'run-single-test.js');
const singleTestContent = `#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

const testFile = process.argv[2];

if (!testFile) {
  console.log('Usage: node run-single-test.js <test-file-path>');
  console.log('Example: node run-single-test.js client/src/__tests__/components/PersonaSelector.test.js');
  process.exit(1);
}

console.log(\`🔍 Running single test: \${testFile}\n\`);

const testCommand = \`jest "\${testFile}" --verbose --no-cache\`;

exec(testCommand, { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Test failed:');
    console.error('Error:', error.message);
    
    if (stderr) {
      console.error('\\nError details:');
      console.error(stderr);
    }
    
    if (stdout) {
      console.log('\\nTest output:');
      console.log(stdout);
    }
  } else {
    console.log('✅ Test passed!');
    console.log('\\nOutput:');
    console.log(stdout);
  }
});
`;

fs.writeFileSync(singleTestPath, singleTestContent);
console.log('✅ run-single-test.js created');

console.log('\n✨ Fix complete!\n');
console.log('Next steps:');
console.log('1. Run: node verify-tests.js');
console.log('2. If tests still fail, use: node run-single-test.js <test-file>');
console.log('3. Check: node test-diagnostics-simple.js for issues');
