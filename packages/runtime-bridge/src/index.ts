/**
 * Runtime Bridge Package for ITORI IDE
 * 
 * This package provides shared runtime functionality between
 * different ITORI applications.
 */

// Re-export all WebSocket types and interfaces
export * from './types/websocket';

// Export Zod schemas for message validation
export * from './types/messages.schema';

// Export the WebSocket hook
export { 
  useAlanSocket, 
  type WebSocketStatus, 
  type UseWebSocketReturn 
} from './useAlanSocket';

// Export RuntimeProvider for context-based WebSocket access
export {
  RuntimeProvider,
  useRuntime,
  type RuntimeContextType
} from './RuntimeProvider';

// Default export for backwards compatibility
export { default } from './useAlanSocket';
