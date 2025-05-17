import { useEffect, useRef, useState, useCallback } from 'react';
import { createMessage, parseMessage, isValidMessage, MessageKind } from '../types/websocket';

/**
 * WebSocket hook for ITORI IDE
 * 
 * Handles WebSocket connection with automatic reconnection logic
 * and message serialization/deserialization
 * 
 * @param {Function} onMessage - Callback function for handling incoming messages
 * @returns {Object} - { status, send, reconnect }
 */
export default function useAlanSocket(onMessage) {
  const [status, setStatus] = useState('disconnected'); // 'connecting' | 'open' | 'disconnected'
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectDelay = 30000; // Maximum reconnect delay in ms (30 seconds)
  const baseReconnectDelay = 1000; // Starting delay in ms (1 second)

  // Clean up any existing connection and timeouts
  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Connect to WebSocket with the given URL
  const connect = useCallback(() => {
    cleanup();
    
    // Get WebSocket URL from environment or use default
    const wsUrl = import.meta.env.VITE_ITORI_WS_URL ?? 'ws://localhost:8000/ws';
    
    try {
      setStatus('connecting');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('open');
        reconnectAttemptsRef.current = 0; // Reset reconnect counter on successful connection
        console.log('WebSocket connected');
      };

      ws.onmessage = (e) => {
        try {
          const message = parseMessage(e.data);
          if (message) {
            onMessage(message);
          }
        } catch (err) {
          console.error('Failed to process WebSocket message:', err);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
      };

      ws.onclose = (e) => {
        setStatus('disconnected');
        console.log(`WebSocket closed: ${e.code} ${e.reason}`);
        
        // Calculate reconnect delay with exponential backoff
        const attempt = Math.min(reconnectAttemptsRef.current++, 10); // Cap at 10 for backoff calculation
        const delay = Math.min(baseReconnectDelay * Math.pow(1.5, attempt), maxReconnectDelay);
        
        // Set timeout for reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          if (document.visibilityState !== 'hidden') {
            connect();
          }
        }, delay);
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setStatus('disconnected');
      
      // Retry connection after delay
      reconnectTimeoutRef.current = setTimeout(connect, baseReconnectDelay);
    }
  }, [cleanup, onMessage]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0; // Reset attempts on manual reconnect
    connect();
  }, [connect]);

  // Send message through WebSocket
  const send = useCallback((kindOrMessage, payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        // Support both direct message passing and kind+payload
        const message = typeof kindOrMessage === 'string' 
          ? createMessage(kindOrMessage, payload)
          : kindOrMessage;
        
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (err) {
        console.error('Failed to send WebSocket message:', err);
        return false;
      }
    }
    return false;
  }, []);

  // Send a ping to the server
  const ping = useCallback(() => {
    send(MessageKind.PING, { timestamp: Date.now() });
  }, [send]);

  // Handle initial connection and cleanup
  useEffect(() => {
    connect();
    
    // Reconnect when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && 
          (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
        reconnect();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanup();
    };
  }, [connect, reconnect, cleanup]);

  return { status, send, reconnect, ping };
}
