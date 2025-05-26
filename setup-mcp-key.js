const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔧 TORI Chat MCP Key Setup');
console.log('===========================\n');

// Use the existing key
const mcpKey = 'ed8c312bbb55b6e1fd9c81b44e0019ea';

// Paths
const frontendDir = path.join(__dirname, 'tori_chat_frontend');
const envProdPath = path.join(frontendDir, '.env.production');
const gatewayDir = path.join(__dirname, 'gateway');
const gatewaySecretsDir = path.join(gatewayDir, 'secrets');
const mcpKeyFile = path.join(gatewaySecretsDir, 'mcp_key.txt');

console.log(`🔑 Using MCP Key: ${mcpKey}\n`);

// Create directories if they don't exist
if (!fs.existsSync(gatewayDir)) {
    fs.mkdirSync(gatewayDir, { recursive: true });
    console.log('✅ Created gateway directory');
}

if (!fs.existsSync(gatewaySecretsDir)) {
    fs.mkdirSync(gatewaySecretsDir, { recursive: true });
    console.log('✅ Created gateway/secrets directory');
}

// Update .env.production
console.log('📝 Updating .env.production...');
let envContent = '';
if (fs.existsSync(envProdPath)) {
    envContent = fs.readFileSync(envProdPath, 'utf8');
    console.log('   • Found existing .env.production');
} else {
    console.log('   • Creating new .env.production');
}

// Remove any existing MCP key entries
envContent = envContent.replace(/^VITE_MCP_KEY=.*$/gm, '');
envContent = envContent.replace(/^MCP_KEY=.*$/gm, '');

// Ensure we have the basic entries
if (!envContent.includes('VITE_APP_MODE=chat')) {
    envContent = 'VITE_APP_MODE=chat\n' + envContent;
}
if (!envContent.includes('PUBLIC_URL=/')) {
    envContent = envContent + '\nPUBLIC_URL=/';
}

// Add MCP key entries
envContent = envContent.trim() + '\n\n# MCP Key for gateway RBAC authentication\n';
envContent += `VITE_MCP_KEY=${mcpKey}\n`;
envContent += `MCP_KEY=${mcpKey}\n`;

fs.writeFileSync(envProdPath, envContent);
console.log('✅ Updated .env.production with MCP key');

// Create gateway key file
console.log('🛡️ Creating gateway MCP key file...');
fs.writeFileSync(mcpKeyFile, mcpKey);
console.log('✅ Created gateway/secrets/mcp_key.txt');

// Create docker-compose snippet (informational)
const dockerComposeSnippet = `
# Add this to your docker-compose.yml services section:
services:
  gateway:
    image: tori/mcp-gateway
    environment:
      MCP_KEY_FILE: /run/secrets/mcp_key
    secrets:
      - mcp_key

# Add this to the root level of docker-compose.yml:
secrets:
  mcp_key:
    file: ./gateway/secrets/mcp_key.txt
`;

fs.writeFileSync(path.join(__dirname, 'docker-compose-mcp-snippet.yml'), dockerComposeSnippet.trim());
console.log('✅ Created docker-compose-mcp-snippet.yml for reference');

console.log('\n🎉 MCP Key setup complete!');
console.log('\n📋 What was configured:');
console.log('   • Frontend .env.production updated with VITE_MCP_KEY and MCP_KEY');
console.log('   • Gateway secrets directory created');
console.log('   • Gateway MCP key file created');
console.log('   • Docker compose snippet created for reference');

console.log('\n🚀 Next steps:');
console.log('   1. Run: node pre-deployment-check.js');
console.log('   2. If checks pass, run: deploy-tori-chat-with-mcp.bat');
console.log('   3. Or use PowerShell: .\\deploy-tori-chat-with-mcp.ps1');

console.log('\n💡 For local development:');
console.log('   • Copy .env.production to .env.development.local for hot reload');
console.log('   • Use npm run dev for development server');

console.log('\n🔒 Security note:');
console.log('   • Keep your MCP key secret');
console.log('   • Don\'t commit secrets to public repositories');
console.log('   • Use environment variables in production');
