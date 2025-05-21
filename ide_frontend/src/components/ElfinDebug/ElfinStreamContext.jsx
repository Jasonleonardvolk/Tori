import React, { createContext, useContext, useRef, useState, useEffect } from 'react';

/**
 * Types for ELFIN state packets
 */

// Handshake packet sent when connection is established
/**
 * @typedef {Object} ElfinHandshakePacket
 * @property {string} type - Always "handshake"
 * @property {Object} schema - Schema information
 * @property {Object} schema.vars - Variable units mapping
 * @property {string[]} schema.barriers - Available barrier functions
 * @property {number} dt_nominal - Nominal timestep
 */

// State update packet sent during operation
/**
 * @typedef {Object} ElfinStatePacket
 * @property {string} type - Always "state"
 * @property {number} seq - Sequence number
 * @property {number} t - Simulation time
 * @property {Object} vars - State variables
 * @property {number} V - Lyapunov function value
 * @property {number} Vdot - Lyapunov derivative value
 * @property {Object} barriers - Barrier function values
 * @property {string|null} event - Event string if any
 * @property {Object} meta - Optional metadata
 */

/**
 * @typedef {ElfinHandshakePacket|ElfinStatePacket} ElfinPacket
 */

/**
 * Context state interface
 * @typedef {Object} ElfinStreamContextState
 * @property {boolean} connected - Whether we are connected to the stream
 * @property {ElfinHandshakePacket|null} handshake - Handshake information
 * @property {ElfinStatePacket|null} currentState - Current state
 * @property {ElfinStatePacket[]} history - State history buffer
 * @property {Error|null} error - Connection error if any
 * @property {Object} stats - Stream statistics
 * @property {number} stats.droppedFrames - Count of dropped frames
 * @property {number} stats.latency - Connection latency (ms)
 * @property {number} stats.fps - Updates per second
 */

// Create context with default values
const ElfinStreamContext = createContext(null);

/**
 * Props for ElfinStreamProvider
 * @typedef {Object} ElfinStreamProviderProps
 * @property {string} url - WebSocket URL
 * @property {React.ReactNode} children - Child components
 * @property {number} [bufferSize=300] - History buffer size
 * @property {boolean} [connectImmediately=true] - Whether to connect on mount
 */

/**
 * Provider component for ELFIN stream data
 */
export const ElfinStreamProvider = ({ 
  url, 
  children, 
  bufferSize = 300, 
  connectImmediately = true 
}) => {
  // State for the stream
  const [state, setState] = useState({
    connected: false,
    handshake: null,
    currentState: null,
    history: [],
    error: null,
    stats: {
      droppedFrames: 0,
      latency: 0,
      fps: 0
    }
  });
  
  // Refs to avoid unnecessary renders and optimize performance
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(0);
  const lastSeqRef = useRef(-1);
  const statsRef = useRef({
    droppedFrames: 0,
    latency: 0,
    fps: 0,
    frameCount: 0,
    lastFpsUpdate: 0
  });
  
  // Connect to the stream
  useEffect(() => {
    if (!connectImmediately) return;
    
    // Connection setup function
    const connect = () => {
      // Clear any pending reconnect timer
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      // Update status
      setState(prev => ({ ...prev, connected: false, status: 'connecting' }));
      
      try {
        // Create WebSocket
        const ws = new WebSocket(url);
        socketRef.current = ws;
        
        // Support for binary messages
        ws.binaryType = 'arraybuffer';
        
        ws.onopen = () => {
          console.log('Connected to ELFIN stream');
          setState(prev => ({
            ...prev,
            connected: true,
            error: null
          }));
        };
        
        ws.onmessage = (event) => {
          try {
            // Parse the message (handle both JSON and binary formats)
            let packet;
            
            if (event.data instanceof ArrayBuffer) {
              // Use CBOR decoding if available, otherwise fallback
              if (typeof window.cbor !== 'undefined') {
                packet = window.cbor.decode(event.data);
              } else {
                // Try to decode as JSON if CBOR is not available
                const textDecoder = new TextDecoder();
                const jsonText = textDecoder.decode(event.data);
                packet = JSON.parse(jsonText);
              }
            } else {
              packet = JSON.parse(event.data);
            }
            
            // Process the packet
            processPacket(packet);
          } catch (err) {
            console.error('Error processing ELFIN packet:', err);
          }
        };
        
        ws.onclose = () => {
          console.log('Disconnected from ELFIN stream');
          setState(prev => ({
            ...prev,
            connected: false
          }));
          
          // Attempt to reconnect after a delay
          reconnectTimerRef.current = setTimeout(connect, 3000);
        };
        
        ws.onerror = (err) => {
          console.error('ELFIN stream socket error:', err);
          setState(prev => ({
            ...prev,
            connected: false,
            error: new Error('WebSocket error')
          }));
        };
      } catch (err) {
        console.error('Error connecting to ELFIN stream:', err);
        setState(prev => ({
          ...prev,
          connected: false,
          error: err instanceof Error ? err : new Error(String(err))
        }));
        
        // Attempt to reconnect after a delay
        reconnectTimerRef.current = setTimeout(connect, 3000);
      }
    };
    
    // Process an incoming packet
    const processPacket = (packet) => {
      switch (packet.type) {
        case 'handshake':
          // Store the handshake information
          setState(prev => ({
            ...prev,
            handshake: packet
          }));
          break;
          
        case 'state': {
          // Calculate latency if real_t is available
          const now = performance.now();
          if ('real_t' in packet) {
            statsRef.current.latency = now - packet.real_t * 1000;
          }
          
          // Check for dropped frames
          if (lastSeqRef.current !== -1 && packet.seq > lastSeqRef.current + 1) {
            const dropped = packet.seq - lastSeqRef.current - 1;
            statsRef.current.droppedFrames += dropped;
          }
          lastSeqRef.current = packet.seq;
          
          // Update FPS counter
          statsRef.current.frameCount++;
          
          // Update the buffer - efficient ring buffer
          if (historyRef.current.length >= bufferSize) {
            // Use the ring buffer
            historyRef.current[historyIndexRef.current] = packet;
            historyIndexRef.current = (historyIndexRef.current + 1) % bufferSize;
          } else {
            // Still filling the buffer
            historyRef.current.push(packet);
          }
          
          // Update state with the new packet (but not the whole history)
          setState(prev => ({
            ...prev,
            currentState: packet,
            stats: {
              droppedFrames: statsRef.current.droppedFrames,
              latency: statsRef.current.latency,
              fps: statsRef.current.fps
            }
          }));
          break;
        }
      }
    };
    
    // Update FPS counter periodically
    const fpsInterval = setInterval(() => {
      const now = performance.now();
      const elapsed = (now - statsRef.current.lastFpsUpdate) / 1000;
      
      if (elapsed > 0) {
        statsRef.current.fps = statsRef.current.frameCount / elapsed;
        statsRef.current.frameCount = 0;
        statsRef.current.lastFpsUpdate = now;
        
        // Update stats in state (throttled)
        setState(prev => ({
          ...prev,
          stats: {
            droppedFrames: statsRef.current.droppedFrames,
            latency: statsRef.current.latency,
            fps: Math.round(statsRef.current.fps)
          }
        }));
      }
    }, 1000);
    
    // Initial connection
    connect();
    
    // Cleanup on unmount
    return () => {
      clearInterval(fpsInterval);
      
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [url, connectImmediately, bufferSize]);
  
  // Construct the full context value
  const contextValue = {
    ...state,
    history: historyRef.current // Use the ref directly to avoid copying large history
  };
  
  return (
    <ElfinStreamContext.Provider value={contextValue}>
      {children}
    </ElfinStreamContext.Provider>
  );
};

/**
 * Custom hook to use the ELFIN stream context
 * @returns {ElfinStreamContextState} Stream context state
 */
export function useElfinStream() {
  const context = useContext(ElfinStreamContext);
  
  if (context === null) {
    throw new Error('useElfinStream must be used within an ElfinStreamProvider');
  }
  
  return context;
}

/**
 * Custom hook to subscribe to a specific variable
 * @param {string} name Variable name 
 * @returns {Object} Variable data with value, units, timestamp and sequence
 */
export function useElfinVariable(name) {
  const { currentState, handshake } = useElfinStream();
  
  return {
    value: currentState?.vars[name],
    units: handshake?.schema?.vars[name],
    timestamp: currentState?.t,
    sequence: currentState?.seq
  };
}

/**
 * Custom hook to subscribe to all barrier function values
 * @returns {Object} Barrier functions with values and thresholds
 */
export function useElfinBarriers() {
  const { currentState, handshake } = useElfinStream();
  
  const barriers = currentState?.barriers || {};
  const barrierNames = handshake?.schema?.barriers || [];
  
  // Return values for all known barriers
  return {
    values: barriers,
    names: barrierNames
  };
}

export default ElfinStreamContext;
