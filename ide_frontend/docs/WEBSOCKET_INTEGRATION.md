# WebSocket Integration for ITORI IDE

This document provides details on the WebSocket integration in the ITORI IDE, focusing on the real-time communication between the frontend and backend.

## Overview

The ITORI IDE uses WebSockets to facilitate real-time communication, enabling features such as:

- Live chat with the AI assistant
- Real-time concept extraction and visualization
- Phase/coherence stream for visualizations
- Connection status indicators throughout the UI

## Key Components

### 1. WebSocket Hook (`useAlanSocket`)

Located at `src/hooks/useAlanSocket.js`, this custom React hook handles:

- WebSocket connection management (connect, disconnect, reconnect)
- Automatic reconnection with exponential backoff
- Message serialization/deserialization
- Connection status tracking

```javascript
// Example usage in a component
import useAlanSocket from '../hooks/useAlanSocket';

function MyComponent() {
  const { status, send, reconnect } = useAlanSocket(handleMessage);
  
  function handleMessage(message) {
    // Process incoming message
    console.log('Received message:', message);
  }
  
  function sendPing() {
    send({ type: 'ping', timestamp: Date.now() });
  }
  
  return (
    <div>
      <p>Connection status: {status}</p>
      <button onClick={sendPing}>Send Ping</button>
      <button onClick={reconnect}>Reconnect</button>
    </div>
  );
}
```

### 2. WebSocket Status Component

Located at `src/components/WebSocketStatus.jsx`, this component provides a visual indicator of the WebSocket connection status:

- Green dot for connected state
- Yellow pulsing dot for connecting state
- Red dot for disconnected state
- Reconnect button when disconnected

### 3. Integration in IDE Layout

The main IDE layout (`ItoriIDELayout.jsx`) initializes the WebSocket connection and passes the connection status and send function to child components:

```javascript
// From ItoriIDELayout.jsx
const { status: wsStatus, send: wsSend, reconnect: wsReconnect } = useAlanSocket(handleWsMessage);

// AgentPanel receives connection status and send function
<AgentPanel wsStatus={wsStatus} onSendMessage={wsSend} />
```

## Message Protocol

Messages sent and received through the WebSocket follow this general format:

```typescript
type WebSocketMessage = {
  type: string;  // Indicates the message type/intent
  payload?: any; // Optional payload data specific to the message type
}
```

### Common Message Types

- `ping` / `ping_response`: Used for connection testing
- `user_msg` / `assistant_msg`: Chat messages between user and AI
- `concept_update`: Updates to the concept graph/field
- `phase_frame`: Phase coherence data for visualizations

## Environment Configuration

WebSocket connection URLs are configured through environment variables:

- `.env.development`: Development environment settings
- `.env.production`: Production environment settings

The WebSocket URL is accessed via:

```javascript
const wsUrl = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws';
```

## Backend Integration

The backend provides WebSocket endpoints that match the frontend expectations. The primary endpoint is:

```
ws://localhost:8000/ws
```

For production:

```
wss://www.itori.ai/ws
```

## Error Handling & Reconnection

The WebSocket implementation includes:

- Automatic reconnection on connection loss
- Exponential backoff to prevent overwhelming the server
- Connection attempt pausing when the tab is inactive
- Manual reconnection option through UI

## Future Improvements

Planned enhancements to the WebSocket integration include:

1. Message queuing for offline operation
2. Improved authentication flow through the WebSocket
3. Binary message support for more efficient data transfer
4. Subscription model for selective updates
