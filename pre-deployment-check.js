const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 TORI Chat Pre-Deployment Checker');
console.log('=====================================\n');

const frontendDir = path.join(__dirname, 'tori_chat_frontend');
const envProdPath = path.join(frontendDir, '.env.production');
const packageJsonPath = path.join(frontendDir, 'package.json');

let issues = [];
let warnings = [];

// Check 1: Frontend directory exists
console.log('📁 Checking frontend directory...');
if (!fs.existsSync(frontendDir)) {
    issues.push('Frontend directory not found: ' + frontendDir);
} else {
    console.log('✅ Frontend directory found');
}

// Check 2: .env.production exists and has MCP key
console.log('\n🔑 Checking MCP key configuration...');
if (!fs.existsSync(envProdPath)) {
    issues.push('.env.production file not found');
} else {
    const envContent = fs.readFileSync(envProdPath, 'utf8');
    if (!envContent.includes('VITE_MCP_KEY=ed8c312bbb55b6e1fd9c81b44e0019ea')) {
        issues.push('MCP key not found or incorrect in .env.production');
    } else {
        console.log('✅ MCP key configured correctly');
    }
}

// Check 3: Gateway secrets directory and key file
console.log('\n🛡️ Checking gateway secrets...');
const gatewaySecretsDir = path.join(__dirname, 'gateway', 'secrets');
const mcpKeyFile = path.join(gatewaySecretsDir, 'mcp_key.txt');

if (!fs.existsSync(gatewaySecretsDir)) {
    issues.push('Gateway secrets directory not found: ' + gatewaySecretsDir);
} else if (!fs.existsSync(mcpKeyFile)) {
    issues.push('MCP key file not found: ' + mcpKeyFile);
} else {
    const keyContent = fs.readFileSync(mcpKeyFile, 'utf8').trim();
    if (keyContent !== 'ed8c312bbb55b6e1fd9c81b44e0019ea') {
        issues.push('MCP key file content does not match expected key');
    } else {
        console.log('✅ Gateway MCP key file configured correctly');
    }
}

// Check 4: Node.js and npm versions
console.log('\n🔧 Checking Node.js and npm...');
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js: ${nodeVersion}`);
    console.log(`✅ npm: ${npmVersion}`);
    
    // Check if Node version is compatible
    const nodeMajor = parseInt(nodeVersion.substring(1).split('.')[0]);
    if (nodeMajor < 16) {
        warnings.push(`Node.js version ${nodeVersion} may be too old. Recommended: 16+ or 18+`);
    }
} catch (error) {
    issues.push('Node.js or npm not found in PATH');
}

// Check 5: Package.json exists
console.log('\n📦 Checking package.json...');
if (!fs.existsSync(packageJsonPath)) {
    issues.push('package.json not found in frontend directory');
} else {
    console.log('✅ package.json found');
    
    // Check for React dependency conflicts
    try {
        process.chdir(frontendDir);
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        if (packageJson.dependencies && packageJson.dependencies['react-diff-viewer']) {
            warnings.push('react-diff-viewer dependency found - may cause React 18 conflicts');
        }
        
        console.log('✅ package.json is readable');
    } catch (error) {
        issues.push('Could not read or parse package.json: ' + error.message);
    }
}

// Check 6: Port availability
console.log('\n🌐 Checking port availability...');
try {
    const netstatOutput = execSync('netstat -ano | findstr :3000', { encoding: 'utf8' });
    if (netstatOutput.trim()) {
        warnings.push('Port 3000 is currently in use');
        console.log('⚠️ Port 3000 is in use - will use port 3001 as fallback');
    } else {
        console.log('✅ Port 3000 is available');
    }
} catch (error) {
    // No output means port is free
    console.log('✅ Port 3000 appears to be available');
}

// Summary
console.log('\n📊 DEPLOYMENT READINESS SUMMARY');
console.log('=================================');

if (issues.length === 0) {
    console.log('🎉 All checks passed! Ready for deployment.');
    
    if (warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    console.log('\n🚀 Run one of these commands to deploy:');
    console.log('   • deploy-tori-chat-with-mcp.bat');
    console.log('   • deploy-tori-chat-with-mcp.ps1');
    
    process.exit(0);
} else {
    console.log('❌ Issues found that need to be resolved:');
    issues.forEach(issue => console.log(`   • ${issue}`));
    
    if (warnings.length > 0) {
        console.log('\n⚠️ Additional warnings:');
        warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    console.log('\n🛠️ Recommended actions:');
    console.log('   1. Fix the issues listed above');
    console.log('   2. Run this checker again');
    console.log('   3. Then proceed with deployment');
    
    process.exit(1);
}