# MCP Servers Integration Guide

## Yes! MCP Servers ARE Included (with the right options)

Based on your comprehensive MCP-TORI ecosystem documentation, here's how the MCP servers fit in:

### MCP Server Components:
Your MCP ecosystem includes these key components running on **port 3001**:
- **MCP Gateway** - Main entry point for all MCP services
- **Real TORI Filtering** - Advanced content filtering
- **Memory Integration** - Connects to Soliton/Braid/Holographic memory systems
- **Observability** - Monitoring and diagnostics
- **Resilience** - Fault tolerance and recovery

### Launch Options Breakdown:

| Option | Frontend | Banksy | MCP Servers | PDF Service | Best For |
|--------|----------|---------|-------------|-------------|----------|
| 1 | ✅ | ❌ | ❌ | ❌ | Frontend development only |
| 2 | ✅ | ✅ | ❌ | ❌ | Basic chat without MCP features |
| 3 | ✅ | ✅ | ✅ | ❌ | Full chat with MCP integration |
| 4 | ✅ | ✅ | ✅ | ✅ | **COMPLETE ECOSYSTEM** (Recommended) |
| 5 | ❌ | ❌ | ✅ | ❌ | Testing MCP servers only |

### What Each Option Gives You:

#### Option 1 & 2: Basic (NO MCP)
- Basic chat interface
- Limited AI capabilities
- No real-time filtering
- No advanced memory features

#### Option 3: With MCP (NEW!)
- Real TORI filtering active
- Enhanced memory integration
- MCP gateway for advanced features
- Better AI response processing

#### Option 4: FULL ECOSYSTEM (RECOMMENDED)
- All 30 functional components from your ecosystem
- Complete TORI filtering pipeline
- PDF ingestion with MCP integration
- Full memory systems (Soliton, Braid, Holographic)
- Production-ready configuration

### To Launch With MCP:

```bash
# Recommended - Full ecosystem
cd C:\Users\jason\Desktop\tori\kha
LAUNCH_TORI_COMPLETE.bat
# Choose option 4

# Or if you don't need PDF processing
# Choose option 3
```

### MCP Server Details:

The MCP servers provide:
- **Real-time content filtering** using TORI algorithms
- **Memory synchronization** across all cognitive systems
- **WebSocket support** for live updates
- **Health monitoring** endpoints
- **Resilience features** for production stability

### Service URLs When Running:

- **Frontend**: http://localhost:5173
- **Banksy API**: http://localhost:8000
- **MCP Gateway**: http://localhost:3001
- **PDF Service**: http://localhost:8002 (option 4 only)

### Why You Want MCP Running:

Without MCP servers:
- ❌ No TORI filtering
- ❌ Limited memory integration
- ❌ No real-time capabilities
- ❌ Reduced AI quality

With MCP servers:
- ✅ Full TORI filtering active
- ✅ Complete memory system integration
- ✅ Real-time WebSocket updates
- ✅ Production-quality AI responses

The previous launchers (LAUNCH_TORI_SVELTE) didn't explicitly include MCP. The new LAUNCH_TORI_COMPLETE scripts properly integrate your entire MCP ecosystem!
