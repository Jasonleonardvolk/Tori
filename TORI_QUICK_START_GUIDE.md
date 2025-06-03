# TORI Quick Start Guide
**For Production Use** - June 3, 2025

## 🚀 IMMEDIATE STARTUP

### **Single Command Start**
```bash
cd C:\Users\jason\Desktop\tori\kha
.\START_TORI.bat
```
This starts both backend and frontend in separate windows.

### **Manual Start (Alternative)**
**Terminal 1** - Backend:
```bash
cd C:\Users\jason\Desktop\tori\kha
python start_dynamic_api.py
```

**Terminal 2** - Frontend:
```bash
cd C:\Users\jason\Desktop\tori\kha\tori_ui_svelte
npm run dev
```

## 🎯 ACCESS POINTS

- **Main Interface**: http://localhost:5173
- **API Health**: http://localhost:8002/health  
- **Soliton Health**: http://localhost:8002/api/soliton/health
- **API Docs**: http://localhost:8002/docs

## 📚 USING TORI

### **PDF Document Processing**
1. Look for **ScholarSphere** panel on the right
2. Drag & drop PDF files or click to browse
3. Watch real-time progress tracking
4. Concepts automatically added to knowledge base
5. Processing time: ~20-25 seconds per document

### **AI Conversation**
1. Type in the main chat interface
2. All systems process simultaneously:
   - 🌊 Soliton Memory (persistent storage)
   - 🧬 BraidMemory (loop detection)  
   - 🎯 Holographic Memory (3D visualization)
   - 👻 Ghost Collective (personas)
3. View system insights and processing methods
4. Memory automatically preserved between sessions

### **Memory Management**
- **Memory Vault**: Click 🔒 Vault button for sensitive content
- **Debug Panel**: Click 🧠 icon for detailed concept view
- **Auto-scroll**: Maintains position during conversations
- **Clear Chat**: 🗑️ button removes messages but keeps memory

## ⚙️ SYSTEM STATUS INDICATORS

### **Healthy System Shows:**
```
🌊 2 memories (95% integrity)
🧬 0 loops (0 crossings)  
🎯 0 3D nodes
👻 Personas active
🚀 Ultimate AI ready
```

### **Common Issues & Solutions**

**"Soliton backend not available"**
- Solution: Ensure backend is running on port 8002
- Check: `curl http://localhost:8002/health`

**PDF Upload Failed**  
- Solution: Check file size (max 50MB)
- Ensure backend API is responsive
- Try smaller PDF files first

**Emoji Display Issues**
- Run: `.\fix_encoding.ps1` 
- Restart dev server

## 🔧 TROUBLESHOOTING

### **Backend Won't Start**
```bash
# Check if port is busy
netstat -ano | findstr :8002

# Kill process if needed
taskkill /PID [process_id] /F

# Restart
python start_dynamic_api.py
```

### **Frontend Issues**
```bash
# Clear cache and restart
cd tori_ui_svelte
rm -rf node_modules/.vite
npm run dev
```

### **Memory System Warnings**
These are normal and don't affect functionality:
- "HolographicMemory: initialize() not found" ✅ FIXED
- "Some cognitive systems not available" - Non-critical

## 📊 EXPECTED PERFORMANCE

- **PDF Processing**: 20-25 seconds for comprehensive extraction
- **Chat Response**: 1-3 seconds with all systems
- **Memory Recall**: Instant via phase correlation
- **System Startup**: 10-15 seconds total

## 🎊 PRODUCTION FEATURES

✅ **No Database Required** - Pure in-memory performance  
✅ **Auto Port Detection** - Handles conflicts automatically  
✅ **Real-time Progress** - WebSocket-based updates  
✅ **Memory Persistence** - Survives browser refresh  
✅ **Multi-system Integration** - All cognitive systems connected  
✅ **Professional UI** - Auto-scroll, progress tracking, debug tools  

## 🚨 IMPORTANT NOTES

- **File Cleanup**: Temporary files automatically deleted
- **Memory Integrity**: 95%+ maintained across sessions  
- **System Resources**: Lightweight, runs on standard hardware
- **Browser Compatibility**: Modern browsers (Chrome, Firefox, Safari)

---

**Your TORI system is ready for production use!** 🎉