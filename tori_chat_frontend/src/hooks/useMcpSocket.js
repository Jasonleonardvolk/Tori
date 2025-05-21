/**
 * MCP Socket Hook
 * 
 * React hook for connecting to the MCP 2.0 WebSocket server
 * and receiving real-time PCC state updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';

// Default WebSocket URL (can be overridden via env or props)
const DEFAULT_WS_URL = process.env.REACT_APP_MCP_WS_URL || 'ws://localhost:8787/ws';

/**
 * Hook for connecting to the MCP WebSocket server
 * 
 * @param {Object} options Configuration options
 * @param {string} [options.url] WebSocket URL (defaults to env var or localhost)
 * @param {boolean} [options.autoConnect=true] Whether to auto-connect on mount
 * @param {Function} [options.onMessage] Optional callback for all messages
 * @param {Function} [options.onPccState] Optional callback specifically for PCC state updates
 * @param {Function} [options.onConnectionChange] Optional callback for connection state changes
 * @returns {Object} Connection status and methods
 */
export function useMcpSocket({
  url = DEFAULT_WS_URL,
  autoConnect = true,
  onMessage,
  onPccState,
  onConnectionChange,
} = {}) {
  // State
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [lastPccState, setLastPccState] = useState(null);
  const [error, setError] = useState(null);
  
  // Optional Redux integration
  const dispatch = useDispatch();
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    // Clean up any existing connection
    if (socket) {
      socket.close();
    }
    
    try {
      // Create new WebSocket connection
      const ws = new WebSocket(url);
      
      // Set up event handlers
      ws.onopen = () => {
        console.log('MCP WebSocket connected');
        setIsConnected(true);
        setError(null);
        if (onConnectionChange) onConnectionChange(true);
      };
      
      ws.onclose = () => {
        console.log('MCP WebSocket disconnected');
        setIsConnected(false);
        if (onConnectionChange) onConnectionChange(false);
      };
      
      ws.onerror = (event) => {
        console.error('MCP WebSocket error:', event);
        setError('WebSocket connection error');
      };
      
      ws.onmessage = (event) => {
        try {
          // Parse message
          const message = JSON.parse(event.data);
          setLastMessage(message);
          
          // Call generic message handler if provided
          if (onMessage) onMessage(message);
          
          // Handle specific message types
          if (message.type === 'pcc_state') {
            setLastPccState(message.data);
            
            // Call PCC state handler if provided
            if (onPccState) onPccState(message.data);
            
            // Dispatch to Redux store if available
            if (dispatch) {
              dispatch({
                type: 'pcc/stateUpdate',
                payload: message.data
              });
            }
          }
        } catch (e) {
          console.error('Error parsing MCP WebSocket message:', e);
        }
      };
      
      // Store socket in state
      setSocket(ws);
      
    } catch (e) {
      console.error('Error connecting to MCP WebSocket:', e);
      setError(`Connection error: ${e.message}`);
    }
  }, [url, socket, onMessage, onPccState, onConnectionChange, dispatch]);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
  }, [socket]);
  
  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    // Clean up on unmount
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [autoConnect, connect, socket]);
  
  // Send a message to the server
  const sendMessage = useCallback((message) => {
    if (socket && isConnected) {
      const messageStr = typeof message === 'string' 
        ? message 
        : JSON.stringify(message);
      
      socket.send(messageStr);
      return true;
    }
    return false;
  }, [socket, isConnected]);
  
  // Return hook API
  return {
    isConnected,
    lastMessage,
    lastPccState,
    error,
    connect,
    disconnect,
    sendMessage
  };
}

export default useMcpSocket;
