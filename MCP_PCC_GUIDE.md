# MCP 2.0 PCC State Broadcasting Guide

This guide explains how to use the MCP 2.0 server for real-time PCC state broadcasting in the TORI platform.

## Overview

The Model Context Protocol (MCP) 2.0 implementation provides real-time broadcasting of Phase-Coupled Computation (PCC) states from the ALAN backend to the TORI Chat and IDE frontends. The system uses a WebSocket connection to deliver updates in real-time, enabling live visualization of the PCC state.

## Architecture

```
┌────────────────┐    HTTP POST     ┌──────────────┐    WebSocket    ┌────────────────┐
│  ALAN Backend  │ ---------------➤ │  MCP Server  │ ---------------➤ │  TORI Frontend │
│  (Banksy/PCC)  │ /pcc_state (JSON)│  (FastAPI)   │     (JSON)      │  (Chat/IDE)    │
└────────────────┘                  └──────────────┘                  └────────────────┘
```

## Components

1. **MCP Server**: FastAPI server that receives PCC state updates and broadcasts them to WebSocket clients
   - Location: `backend/routes/mcp/`
   - Endpoints: 
     - `/pcc_state` (POST): Receive state updates
     - `/ws` (WebSocket): Client connection endpoint
     - `/health` (GET): Server status

2. **Broadcast Module**: Utilities for sending PCC state from the backend to the MCP server
   - Location: `alan_backend/banksy/broadcast.py`
   - Main function: `emit_pcc(step, phases, spins, energy)`

3. **WebSocket Hook**: React hook for connecting to the MCP server WebSocket
   - Location: `ide_frontend/src/hooks/useMcpSocket.ts`
   - Usage: `const { pccState, connected } = useMcpSocket(url)`

4. **PCC Status Component**: Visualization component for displaying PCC state
   - Location: `tori_chat_frontend/src/components/PccStatus/`
   - Shows live updates of phases, spins, energy, and more

## Setup & Usage

### Server Setup

1. Start the MCP server:
   ```bash
   start-mcp-server.bat
   ```
   
   This launches the FastAPI server on `http://127.0.0.1:8787`.

2. Verify the server is running by visiting:
   - `http://127.0.0.1:8787/health` in your browser

### Backend Integration

To broadcast PCC states from your computation:

```python
from alan_backend.banksy.broadcast import emit_pcc

# During computation loop
emit_pcc(
    step=current_step,         # Iteration counter
    phases=oscillator_phases,  # Array of phase values [0, 2π)
    spins=node_spins,          # Array of spin values (±1)
    energy=system_energy       # Current energy value
)
```

For testing, you can use the sample generator:

```bash
python examples/pcc_sample.py
```

### Frontend Integration

To display PCC states in your React component:

```jsx
import { useMcpSocket } from '../../hooks/useMcpSocket';
import { PccStatus } from '../../components/PccStatus/PccStatus';

function MyComponent() {
  // Option 1: Use the hook directly
  const { pccState, connected } = useMcpSocket();
  
  // Option 2: Use the pre-built component
  return <PccStatus />;
}
```

## Data Format

The PCC state is transmitted as JSON with the following structure:

```json
{
  "step": 42,                           // Current simulation step
  "phases": [0.1, 0.5, 1.2, ...],       // Array of phase values in radians
  "spins": [1, -1, 1, ...],             // Array of spin values
  "energy": -0.75                       // System energy
}
```

## Troubleshooting

1. **Server won't start**
   - Check if port 8787 is already in use
   - Ensure all dependencies are installed: `pip install fastapi uvicorn pydantic`

2. **Client can't connect**
   - Verify the server is running with `/health` endpoint
   - Check WebSocket URL (default: `ws://127.0.0.1:8787/ws`)
   - Check browser console for connection errors

3. **No data is displayed**
   - Ensure the backend is sending updates to `/pcc_state`
   - Check for JavaScript errors in the browser console
   - Try running the sample generator for testing

## Future Enhancements

1. **Protobuf Support**
   - Create schema_v2.proto file
   - Generate Python and JavaScript stubs
   - Update content type to application/x-protobuf

2. **CI/CD Integration**
   - Setup GitHub Actions testing
   - Add systemd service for production

## Additional Resources

- `examples/pcc_sample.py`: Test generator for PCC states
- `start-mcp-server.bat`: Convenience script to start the server
