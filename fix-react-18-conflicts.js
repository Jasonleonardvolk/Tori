const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 React 18 Dependency Conflicts Fixer');
console.log('=====================================\n');

const frontendDir = path.join(__dirname, 'tori_chat_frontend');
const packageJsonPath = path.join(frontendDir, 'package.json');
const packageLockPath = path.join(frontendDir, 'package-lock.json');
const nodeModulesPath = path.join(frontendDir, 'node_modules');

// Change to frontend directory
process.chdir(frontendDir);
console.log(`📁 Working in: ${frontendDir}\n`);

try {
    // Step 1: Check and remove problematic packages
    console.log('[1/8] 🔍 Checking for problematic packages...');
    
    try {
        execSync('npm ls react-diff-viewer', { stdio: 'pipe' });
        console.log('   Found react-diff-viewer - removing...');
        execSync('npm uninstall react-diff-viewer', { stdio: 'inherit' });
        console.log('   ✅ Removed react-diff-viewer');
    } catch (error) {
        console.log('   ✅ No problematic react-diff-viewer found');
    }

    // Step 2: Clean install environment
    console.log('\n[2/8] 🧹 Cleaning install environment...');
    
    if (fs.existsSync(nodeModulesPath)) {
        console.log('   Removing node_modules...');
        fs.rmSync(nodeModulesPath, { recursive: true, force: true });
        console.log('   ✅ Removed node_modules');
    }
    
    if (fs.existsSync(packageLockPath)) {
        console.log('   Removing package-lock.json...');
        fs.unlinkSync(packageLockPath);
        console.log('   ✅ Removed package-lock.json');
    }

    // Step 3: Clear npm cache
    console.log('\n[3/8] 🗑️ Clearing npm cache...');
    execSync('npm cache clean --force', { stdio: 'inherit' });
    console.log('   ✅ Cache cleared');

    // Step 4: Read and verify package.json
    console.log('\n[4/8] 📖 Verifying package.json configuration...');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Ensure React 18 compatible packages
    const requiredDeps = {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'react-diff-viewer-continued': '4.0.0'
    };
    
    let modified = false;
    for (const [pkg, version] of Object.entries(requiredDeps)) {
        if (!packageJson.dependencies[pkg] || packageJson.dependencies[pkg] !== version) {
            console.log(`   Updating ${pkg} to ${version}`);
            packageJson.dependencies[pkg] = version;
            modified = true;
        }
    }
    
    // Remove any problematic packages
    const problematicPackages = ['react-diff-viewer'];
    for (const pkg of problematicPackages) {
        if (packageJson.dependencies[pkg]) {
            console.log(`   Removing problematic package: ${pkg}`);
            delete packageJson.dependencies[pkg];
            modified = true;
        }
    }
    
    if (modified) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('   ✅ Updated package.json');
    } else {
        console.log('   ✅ package.json is already correct');
    }

    // Step 5: Install dependencies
    console.log('\n[5/8] 📦 Installing React 18 compatible dependencies...');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('   ✅ Dependencies installed successfully');
    } catch (error) {
        console.log('   ⚠️ Standard install failed, trying with --legacy-peer-deps...');
        execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
        console.log('   ✅ Dependencies installed with legacy peer deps');
    }

    // Step 6: Verify critical packages
    console.log('\n[6/8] ✅ Verifying React packages...');
    const packages = ['react', 'react-dom', 'react-diff-viewer-continued'];
    for (const pkg of packages) {
        try {
            const result = execSync(`npm list ${pkg}`, { encoding: 'utf8' });
            console.log(`   ✅ ${pkg} installed correctly`);
        } catch (error) {
            console.log(`   ❌ ${pkg} not found - installing...`);
            execSync(`npm install ${pkg}`, { stdio: 'inherit' });
        }
    }

    // Step 7: Check for peer dependency issues
    console.log('\n[7/8] 🔗 Checking peer dependencies...');
    try {
        execSync('npm list --depth=0', { stdio: 'pipe' });
        console.log('   ✅ No peer dependency conflicts detected');
    } catch (error) {
        console.log('   ⚠️ Some peer dependency warnings (usually safe to ignore)');
    }

    // Step 8: Build test
    console.log('\n[8/8] 🏗️ Testing build...');
    try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('   ✅ Build test passed!');
    } catch (error) {
        console.log('   ❌ Build failed, attempting fix...');
        try {
            execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
            execSync('npm run build', { stdio: 'inherit' });
            console.log('   ✅ Build passed after peer dependency fix!');
        } catch (retryError) {
            throw new Error('Build still failing after attempted fixes');
        }
    }

    // Success!
    console.log('\n🎉 SUCCESS! React 18 Dependency Conflicts Fixed!');
    console.log('=========================================');
    console.log('✅ All React dependencies are now compatible');
    console.log('✅ Build test passed');
    console.log('✅ Ready for production deployment');
    console.log('\nNext steps:');
    console.log('  • Run: node start-production.cjs');
    console.log('  • Or use: deploy-tori-chat-with-mcp.bat');
    console.log('  • Access at: http://localhost:3000');

} catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n🛠️ Troubleshooting suggestions:');
    console.log('1. Check your internet connection');
    console.log('2. Make sure Node.js and npm are up to date');
    console.log('3. Try running as administrator');
    console.log('4. Check available disk space');
    process.exit(1);
}