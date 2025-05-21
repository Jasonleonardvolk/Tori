/**
 * WebSocket message types and interfaces for ITORI IDE
 * 
 * This file provides type definitions for WebSocket communication
 * between the ITORI IDE client and backend services.
 */

/**
 * WebSocket message kinds
 * 
 * Defines the valid message types that can be sent/received over WebSocket
 */
export const MessageKind = {
  // System messages
  PING: 'ping',
  PING_RESPONSE: 'ping_response',
  ERROR: 'error',
  
  // Chat messages
  USER_MESSAGE: 'user_msg',
  ASSISTANT_MESSAGE: 'assistant_msg',
  THINKING_START: 'thinking_start',
  THINKING_END: 'thinking_end',
  
  // IDE-specific messages
  CONCEPT_UPDATE: 'concept_update',
  PHASE_FRAME: 'phase_frame',
  CODE_ANALYSIS: 'code_analysis',
  REFACTOR_SUGGESTION: 'refactor_suggestion',
  
  // Connection management
  RECONNECT: 'reconnect',
  AUTH: 'auth',
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILURE: 'auth_failure',
};

/**
 * Message kind type - used for type checking message kinds
 */
export type MessageKindType = 
  | 'ping'
  | 'ping_response'
  | 'error'
  | 'user_msg'
  | 'assistant_msg'
  | 'thinking_start'
  | 'thinking_end'
  | 'concept_update'
  | 'phase_frame'
  | 'code_analysis'
  | 'refactor_suggestion'
  | 'reconnect'
  | 'auth'
  | 'auth_success'
  | 'auth_failure';

/**
 * Message version - increment when payload structure changes
 * to support backward compatibility
 */
export const MESSAGE_PROTOCOL_VERSION = 1;

/**
 * WebSocket message interface
 */
export interface WebSocketMessage<T = any> {
  v: number;                // Protocol version
  kind: string;             // Message type/kind
  payload?: T;              // Optional payload data
  timestamp: number;        // Unix timestamp in milliseconds
  id?: string;              // Optional message ID for tracking
  correlationId?: string;   // Optional ID for linking related messages
}

/**
 * Create a properly formatted WebSocket message
 * 
 * @param {string} kind - Message kind (use MessageKind constants)
 * @param {any} payload - Message payload
 * @returns {WebSocketMessage} - Formatted message with version
 */
export function createMessage(kind: string, payload: any = {}): WebSocketMessage {
  return {
    v: MESSAGE_PROTOCOL_VERSION,
    kind,
    payload,
    timestamp: Date.now()
  };
}

/**
 * Validate incoming WebSocket message
 * 
 * @param {object} message - Message to validate
 * @returns {boolean} - True if message is valid, false otherwise
 */
export function isValidMessage(message: any): boolean {
  if (!message || typeof message !== 'object') return false;
  
  // Must have kind and version properties
  if (!message.kind || !message.v) return false;
  
  // Version must be supported
  if (message.v > MESSAGE_PROTOCOL_VERSION) {
    console.warn(`Received message with unsupported version: ${message.v}`);
    return false;
  }
  
  return true;
}

/**
 * Parse and validate WebSocket message
 * 
 * @param {string|object} data - Raw message data
 * @returns {WebSocketMessage|null} - Parsed message or null if invalid
 */
export function parseMessage(data: string | object): WebSocketMessage | null {
  let message;
  
  // Parse string messages
  if (typeof data === 'string') {
    try {
      message = JSON.parse(data);
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
      return null;
    }
  } else {
    message = data;
  }
  
  // Validate message structure
  if (!isValidMessage(message)) {
    return null;
  }
  
  return message;
}

/**
 * Message handler type definition
 */
export type MessageHandler = (message: WebSocketMessage) => void;
