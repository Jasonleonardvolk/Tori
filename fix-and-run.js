#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 ALAN IDE Test Environment Fix & Run\n');

// Step 1: Fix Haste collision
console.log('Step 1: Creating .jestignore file...');
const jestIgnorePath = path.join(__dirname, '.jestignore');
const jestIgnoreContent = `# Ignore USB drive path with duplicate packages
/data/USB Drive/
/data/USB Drive/**/*

# Ignore node_modules
node_modules/
*/node_modules/

# Ignore common build artifacts
build/
dist/
coverage/

# Ignore disabled tests
*.test.disabled
*.mock.js
`;

fs.writeFileSync(jestIgnorePath, jestIgnoreContent);
console.log('✅ Created .jestignore file\n');

// Step 2: Run tests step by step
console.log('Step 2: Running tests progressively...\n');
console.log('=' .repeat(50));

const testSteps = [
  {
    name: 'Basic Node Tests',
    command: ['npx', 'jest', '--config', 'jest.config.minimal.js'],
    successMessage: 'Basic Jest is working!',
    errorMessage: 'Jest installation issues detected'
  },
  {
    name: 'React Environment Tests',
    command: ['npx', 'jest', '--config', 'jest.config.react.js'],
    successMessage: 'React test environment is working!',
    errorMessage: 'React/JSDOM setup issues detected'
  }
];

function runTestStep(stepIndex = 0) {
  if (stepIndex >= testSteps.length) {
    console.log('\n🎉 SUCCESS! All test environments are working!');
    console.log('\n🚀 Next steps:');
    console.log('1. Run: node enable-tests.js');
    console.log('2. Run: npm test');
    console.log('3. Fix remaining test issues incrementally');
    return;
  }
  
  const step = testSteps[stepIndex];
  console.log(`\nRunning: ${step.name}`);
  console.log('-'.repeat(30));
  
  const process = spawn(step.command[0], step.command.slice(1), {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });
  
  process.on('close', (code) => {
    if (code === 0) {
      console.log(`\n✅ ${step.successMessage}`);
      console.log(`Step ${stepIndex + 1}/${testSteps.length} completed successfully`);
      
      // Continue to next step
      runTestStep(stepIndex + 1);
    } else {
      console.log(`\n❌ ${step.errorMessage}`);
      console.log(`Step ${stepIndex + 1}/${testSteps.length} failed with code ${code}`);
      
      // Provide troubleshooting info
      console.log('\n🔍 Troubleshooting:');
      switch (stepIndex) {
        case 0:
          console.log('- Check: npx jest --version');
          console.log('- Try: npm install --save-dev jest');
          console.log('- Ensure Node.js version >= 14');
          break;
        case 1:
          console.log('- Check: npm list @testing-library/react');
          console.log('- Try: npm install --save-dev jest-environment-jsdom');
          console.log('- Ensure React version compatibility');
          break;
      }
      
      console.log('\n📝 To debug further:');
      console.log(`   ${step.command.join(' ')} --verbose`);
    }
  });
  
  process.on('error', (error) => {
    console.error(`\nError running step ${stepIndex + 1}:`, error);
  });
}

// Start the test sequence
console.log('Starting test environment verification...');
runTestStep();
