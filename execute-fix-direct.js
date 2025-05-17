const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create output directory
const outputDir = path.join(__dirname, 'fix-outputs');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputFile = path.join(outputDir, `fix-execution-${timestamp}.txt`);

console.log('🚀 ALAN IDE Test Fix Execution');
console.log('==============================\n');

// Function to execute and capture output
function executeStep(command, description) {
    return new Promise((resolve) => {
        console.log(`\n🔄 ${description}...`);
        
        exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
            const output = `\n\n=== ${description} ===\n${stdout}\n${stderr}`;
            fs.appendFileSync(outputFile, output);
            
            if (error) {
                console.log(`❌ Error in ${description}`);
                console.log('Error:', error.message);
            } else {
                console.log(`✅ ${description} completed`);
            }
            
            // Show relevant output
            if (stdout) {
                console.log('Output preview:', stdout.substring(0, 200) + '...');
            }
            
            resolve({ error, stdout, stderr });
        });
    });
}

async function runFix() {
    console.log('Starting systematic fix execution...');
    
    // Step 1: Apply fixes
    await executeStep('node fix-tests.js', 'Applying Configuration Fixes');
    
    // Step 2: Run diagnostics
    await executeStep('node test-diagnostics.js', 'Running Diagnostics');
    
    // Step 3: Verify tests
    await executeStep('node verify-tests.js', 'Verifying Test Setup');
    
    // Step 4: Try coverage
    await executeStep('npm run test:coverage', 'Generating Coverage Report');
    
    console.log(`\n📄 Full execution log saved to: ${outputFile}`);
    console.log('\n📊 Summary:');
    console.log('1. Configuration fixes applied');
    console.log('2. Diagnostics completed');
    console.log('3. Test verification attempted');
    console.log('4. Coverage generation attempted');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Review the execution log for details');
    console.log('2. Run test-status-dashboard.js for current status');
    console.log('3. Check coverage/lcov-report/index.html if successful');
}

// Execute the fix
runFix().catch(console.error);
