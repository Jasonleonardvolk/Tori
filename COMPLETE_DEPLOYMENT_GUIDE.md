# TORI Chat Complete Deployment Guide
## With MCP Key Configuration & Memory-v2 Integration

This guide provides the complete deployment process for TORI Chat with the new Memory-v2 stack and MCP key authentication.

## 🎯 Quick Start (Recommended)

### Option 1: Automated Deployment (Windows)
```cmd
# Run the comprehensive deployment script
deploy-tori-chat-with-mcp.bat
```

### Option 2: PowerShell (Enhanced Error Handling)
```powershell
# Run with better error handling
.\deploy-tori-chat-with-mcp.ps1
```

### Option 3: Step-by-Step Manual Process
```cmd
# 1. Check readiness
node pre-deployment-check.js

# 2. If needed, setup MCP key
node setup-mcp-key.js

# 3. Deploy
deploy-tori-chat-with-mcp.bat
```

## 📋 What's Included

### Generated Files:
- ✅ `tori_chat_frontend\.env.production` - Updated with MCP key
- ✅ `gateway\secrets\mcp_key.txt` - Gateway authentication key
- ✅ `deploy-tori-chat-with-mcp.bat` - Windows deployment script
- ✅ `deploy-tori-chat-with-mcp.ps1` - PowerShell deployment script
- ✅ `pre-deployment-check.js` - Readiness validator
- ✅ `setup-mcp-key.js` - MCP key configuration utility
- ✅ `docker-compose-mcp-snippet.yml` - Docker reference

### Your MCP Key:
```
ed8c312bbb55b6e1fd9c81b44e0019ea
```

## 🔧 Manual Deployment Steps

If you prefer to understand each step or need to troubleshoot:

### 1. Verify MCP Key Configuration
```cmd
# Check that everything is set up correctly
node pre-deployment-check.js
```

### 2. Navigate to Frontend Directory
```cmd
cd C:\Users\jason\Desktop\tori\kha\tori_chat_frontend
```

### 3. Fix React Dependencies (if needed)
```cmd
# Remove incompatible React diff viewer
npm uninstall react-diff-viewer
npm install react-diff-viewer-continued@4.0.0 --save-exact
```

### 4. Install Dependencies
```cmd
npm ci --omit dev
```

### 5. Build Application
```cmd
npm run build
```

### 6. Start Production Server
```cmd
node start-production.cjs
```

## 🌐 Access Your Application

Once deployed, access TORI Chat at:
- **Primary URL**: http://localhost:3000
- **Fallback URL**: http://localhost:3001 (if port 3000 is in use)

## 🧪 Testing the MCP Integration

### Frontend Test (Browser Console):
```javascript
// Test MCP connection
await window.mcp('memory.health', {})
// Expected: {status: "ok"}

// Test memory search
await window.mcp('kb.search', {query: 'autism early intervention'})
// Expected: search results from knowledge base
```

### Gateway Test (Command Line):
```cmd
# Test direct gateway connection
curl -H "X-MCP-Key: ed8c312bbb55b6e1fd9c81b44e0019ea" http://localhost:8000/memory.health
```

## 🔍 Troubleshooting

### Common Issues:

**Build Fails with React Conflicts:**
```cmd
# Clean install
rmdir /s /q node_modules
del package-lock.json
npm ci --omit dev
```

**Port 3000 Already in Use:**
```cmd
# Find what's using the port
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /f /pid <PID>
```

**MCP Authentication Fails:**
- Verify `VITE_MCP_KEY` in `.env.production`
- Check `gateway\secrets\mcp_key.txt` exists
- Ensure both files contain: `ed8c312bbb55b6e1fd9c81b44e0019ea`

**Build Verification Fails:**
```cmd
# Check if build is complete
dir tori_chat_frontend\dist\index.html
findstr "ReactDOM" tori_chat_frontend\dist\index.html
```

## 📁 File Structure After Setup

```
C:\Users\jason\Desktop\tori\kha\
├── tori_chat_frontend\
│   ├── .env.production          # ✅ Updated with MCP key
│   ├── dist\                    # Built application
│   └── start-production.cjs     # Production server
├── gateway\
│   └── secrets\
│       └── mcp_key.txt         # ✅ Gateway auth key
├── deploy-tori-chat-with-mcp.bat    # ✅ Main deployment script
├── deploy-tori-chat-with-mcp.ps1    # ✅ PowerShell version
├── pre-deployment-check.js          # ✅ Readiness checker
└── setup-mcp-key.js                # ✅ MCP setup utility
```

## 🚀 Production Deployment

For production environments:

### Environment Variables:
```bash
VITE_MCP_KEY=ed8c312bbb55b6e1fd9c81b44e0019ea
NODE_ENV=production
PORT=3000
```

### Docker Integration:
Reference the generated `docker-compose-mcp-snippet.yml` for Docker setup.

## 🔒 Security Notes

- **Keep your MCP key secure**: `ed8c312bbb55b6e1fd9c81b44e0019ea`
- Don't commit secrets to public repositories
- Use different keys for different environments (dev/staging/prod)
- Rotate keys periodically

## 🎯 Next Steps

1. **Deploy**: Run `deploy-tori-chat-with-mcp.bat`
2. **Test**: Verify MCP integration with browser console commands
3. **Upload**: Try uploading a PDF to test the memory.put functionality
4. **Monitor**: Check gateway logs for successful authentication

## 📞 Support

If you encounter issues:
1. Run `node pre-deployment-check.js` for diagnostics
2. Check the specific error messages in the deployment script output
3. Verify Node.js and npm versions are compatible (Node 16+ recommended)

---

**Ready to deploy? Run:** `deploy-tori-chat-with-mcp.bat`