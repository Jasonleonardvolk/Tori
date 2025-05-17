# ITORI Runtime Bridge

This package provides shared runtime functionality between different ITORI applications, including WebSocket communication, event handling, and cross-application state management.

## Installation

Since this package is part of the ITORI monorepo, it's available as an internal dependency:

```bash
pnpm add @itori/runtime-bridge
```

## Usage

### WebSocket Hook

The primary feature of this package is the WebSocket hook that provides real-time communication with the backend:

```jsx
import { useAlanSocket } from '@itori/runtime-bridge';

function MyComponent() {
  const handleMessage = (message) => {
    console.log('Received message:', message);
    
    // Handle different message types
    if (message.kind === 'assistant_msg') {
      // Handle assistant message
    }
  };

  const { status, send, reconnect, ping } = useAlanSocket(handleMessage);
  
  // Status can be 'connecting', 'open', or 'disconnected'
  const statusColor = 
    status === 'open' ? 'green' : 
    status === 'connecting' ? 'yellow' : 'red';
  
  const sendMessage = () => {
    send('user_msg', { text: 'Hello, server!' });
  };
  
  return (
    <div>
      <div className="status-indicator" style={{ backgroundColor: statusColor }}></div>
      
      <button onClick={sendMessage}>Send Message</button>
      
      {status === 'disconnected' && (
        <button onClick={reconnect}>Reconnect</button>
      )}
    </div>
  );
}
```

### Message Types

The package includes standard message types for communication:

```js
import { MessageKind } from '@itori/runtime-bridge';

// Send a chat message
socket.send(MessageKind.USER_MESSAGE, { text: 'Hello' });

// Send a ping
socket.ping();
```

### Environment Configuration

The WebSocket hook reads connection information from environment variables:

- `VITE_ITORI_WS_URL`: WebSocket server URL (defaults to `ws://localhost:8000/ws`)
- `VITE_ITORI_API_URL`: REST API URL

## API Reference

### useAlanSocket

```typescript
function useAlanSocket(onMessage: MessageHandler): UseWebSocketReturn
```

**Parameters:**
- `onMessage`: Callback function that receives parsed WebSocket messages

**Returns:**
- `status`: Current connection status ('connecting', 'open', 'disconnected')
- `send`: Function to send messages
- `reconnect`: Function to manually reconnect
- `ping`: Function to send a ping message

### MessageKind

Constants for standard message types:

```typescript
const MessageKind = {
  // System messages
  PING: 'ping',
  PING_RESPONSE: 'ping_response',
  ERROR: 'error',
  
  // Chat messages
  USER_MESSAGE: 'user_msg',
  ASSISTANT_MESSAGE: 'assistant_msg',
  
  // ... and more
};
