import React, { useState, useEffect, useRef, useMemo } from 'react';
import './LyapunovThermometer.css';

/**
 * Maps Lyapunov derivative to stability using sigmoid function
 * 
 * @param {number} vdot Lyapunov derivative value (V̇)
 * @param {number} tau Time constant for sigmoid scaling (higher = steeper transition)
 * @returns {number} Stability value from 0.0 (unstable) to 1.0 (stable)
 */
function mapStabilityWithSigmoid(vdot, tau = 10) {
  // Sigmoid function: 1 / (1 + e^(vdot * tau))
  // When vdot is negative (stable), result approaches 1
  // When vdot is positive (unstable), result approaches 0
  return 1 / (1 + Math.exp(vdot * tau));
}

/**
 * Maps stability value to a color using a perceptually uniform and colorblind-friendly palette
 * 
 * @param {number} stability Stability value from 0.0 (unstable) to 1.0 (stable)
 * @returns {string} CSS color string
 */
function getStabilityColor(stability) {
  // Clamp stability to [0, 1]
  const s = Math.max(0, Math.min(1, stability));
  
  if (s < 0.25) {
    // Red (unstable) to orange
    const t = s / 0.25;
    return `rgb(255, ${Math.round(t * 165)}, 0)`;
  } else if (s < 0.5) {
    // Orange to yellow
    const t = (s - 0.25) / 0.25;
    return `rgb(255, ${Math.round(165 + t * 90)}, 0)`;
  } else if (s < 0.75) {
    // Yellow to green
    const t = (s - 0.5) / 0.25;
    return `rgb(${Math.round(255 - t * 128)}, 255, ${Math.round(t * 128)})`;
  } else {
    // Green to blue (most stable)
    const t = (s - 0.75) / 0.25;
    return `rgb(0, ${Math.round(255 - t * 100)}, ${Math.round(128 + t * 127)})`;
  }
}

/**
 * Custom hook to track previous value for state change detection
 * 
 * @param {any} value Value to track
 * @returns {any} Previous value
 */
function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Custom hook for connecting to ELFIN state stream
 * 
 * @param {string} url WebSocket URL
 * @param {Object} options Connection options
 * @returns {Object} Connection state and data
 */
function useElfinStream(url, options = {}) {
  const {
    reconnectInterval = 3000,
    processBeforeUpdate = (data) => data,
    bufferSize = 100
  } = options;
  
  const [state, setState] = useState({
    data: null,
    history: [],
    status: 'disconnected',
    error: null,
    latency: 0
  });
  
  const wsRef = useRef(null);
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
  
  useEffect(() => {
    // Connection setup function
    const connect = () => {
      // Clear any pending reconnect timer
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      // Update status
      setState(prev => ({ ...prev, status: 'connecting' }));
      
      try {
        // Create WebSocket
        const ws = new WebSocket(url);
        wsRef.current = ws;
        
        // Set up event handlers
        ws.onopen = () => {
          setState(prev => ({ ...prev, status: 'connected', error: null }));
          console.log('Connected to ELFIN stream');
        };
        
        ws.onmessage = (event) => {
          try {
            // Parse data
            const data = JSON.parse(event.data);
            
            // Process data
            const processedData = processBeforeUpdate(data);
            
            // Handle different packet types
            if (data.type === 'handshake') {
              // Store handshake information
              setState(prev => ({
                ...prev,
                handshake: processedData
              }));
              return;
            }
            
            if (data.type === 'state') {
              // Update history - efficient ring buffer
              if (historyRef.current.length >= bufferSize) {
                // Use the ring buffer
                historyRef.current[historyIndexRef.current] = processedData;
                historyIndexRef.current = (historyIndexRef.current + 1) % bufferSize;
              } else {
                // Still filling the buffer
                historyRef.current.push(processedData);
              }
              
              // Check for dropped frames
              if (lastSeqRef.current !== -1 && processedData.seq > lastSeqRef.current + 1) {
                const dropped = processedData.seq - lastSeqRef.current - 1;
                statsRef.current.droppedFrames += dropped;
              }
              lastSeqRef.current = processedData.seq;
              
              // Update FPS counter
              statsRef.current.frameCount++;
              
              // Update state with latest data
              setState(prev => ({
                ...prev,
                data: processedData,
                stats: {
                  droppedFrames: statsRef.current.droppedFrames,
                  latency: statsRef.current.latency,
                  fps: statsRef.current.fps
                }
              }));
            }
          } catch (err) {
            console.error('Error processing ELFIN stream data:', err);
          }
        };
        
        ws.onerror = (error) => {
          console.error('ELFIN stream WebSocket error:', error);
          setState(prev => ({ 
            ...prev, 
            status: 'error', 
            error: new Error('WebSocket error') 
          }));
        };
        
        ws.onclose = () => {
          console.log('Disconnected from ELFIN stream');
          setState(prev => ({ ...prev, status: 'disconnected' }));
          
          // Schedule reconnect
          reconnectTimerRef.current = setTimeout(connect, reconnectInterval);
        };
      } catch (err) {
        console.error('Error connecting to ELFIN stream:', err);
        setState(prev => ({ 
          ...prev, 
          status: 'error', 
          error: err instanceof Error ? err : new Error(String(err)) 
        }));
        
        // Schedule reconnect
        reconnectTimerRef.current = setTimeout(connect, reconnectInterval);
      }
    };
    
    // Update FPS counter
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
    
    // Cleanup
    return () => {
      clearInterval(fpsInterval);
      
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [url, reconnectInterval, processBeforeUpdate, bufferSize]);
  
  // Return the state and history
  return {
    ...state,
    history: historyRef.current
  };
}

/**
 * LyapunovThermometer Component
 * 
 * A visual indicator for system stability based on Lyapunov analysis.
 * Displays a thermometer-like bar that shows the current stability
 * of the system based on the Lyapunov derivative (V̇).
 */
const LyapunovThermometer = ({ streamUrl = "ws://localhost:8642/state" }) => {
  // Connect to ELFIN state stream
  const { data, status, stats } = useElfinStream(streamUrl);
  
  // Track previous value for change detection
  const prevVdot = usePrevious(data?.Vdot);
  const vdotChanged = data?.Vdot !== prevVdot;
  
  // Compute thermometer properties
  const thermometerProps = useMemo(() => {
    if (!data) {
      return { 
        height: 0, 
        color: '#888', 
        pulsing: false,
        stability: 0,
        vdot: null
      };
    }
    
    // Compute stability using sigmoid function
    const stability = mapStabilityWithSigmoid(data.Vdot);
    
    // Height as percentage (0-100%)
    const height = stability * 100;
    
    // Color based on stability
    const color = getStabilityColor(stability);
    
    // Pulsing effect only when state changes and we're very stable or unstable
    const pulsing = vdotChanged && (stability > 0.9 || stability < 0.1);
    
    return { 
      height, 
      color, 
      pulsing,
      stability,
      vdot: data.Vdot
    };
  }, [data, vdotChanged]);

  return (
    <div className="elfin-thermometer-container">
      <div className="thermometer-header">
        <h3>Stability Thermometer</h3>
        {status === 'connected' && stats && (
          <div className="stats">
            <span>{stats.fps} fps</span>
          </div>
        )}
      </div>
      
      <div className="thermometer-description">
        <p>Lyapunov stability: V̇ = {thermometerProps.vdot?.toFixed(2) || 'N/A'}</p>
        <p className="stability-hint">
          {thermometerProps.stability > 0.8 ? (
            <span className="stable">Very stable</span>
          ) : thermometerProps.stability > 0.5 ? (
            <span className="mostly-stable">Stable</span>
          ) : thermometerProps.stability > 0.2 ? (
            <span className="marginally-stable">Marginally stable</span>
          ) : (
            <span className="unstable">Unstable</span>
          )}
        </p>
      </div>
      
      {status === 'connected' ? (
        <div className="thermometer">
          <div 
            className={`thermometer-fill ${thermometerProps.pulsing ? 'pulsing' : ''}`}
            style={{ 
              height: `${thermometerProps.height}%`, 
              backgroundColor: thermometerProps.color,
              transition: 'height 0.1s linear, background-color 0.1s linear' // Smooth transitions
            }}
          />
          <div className="thermometer-marks">
            <div className="mark" style={{ bottom: '75%' }}><span>0.75</span></div>
            <div className="mark" style={{ bottom: '50%' }}><span>0.50</span></div>
            <div className="mark" style={{ bottom: '25%' }}><span>0.25</span></div>
            <div className="mark" style={{ bottom: '0%' }}><span>0.00</span></div>
          </div>
        </div>
      ) : (
        <div className="thermometer-disconnected">
          {status === 'connecting' ? 'Connecting...' : 'Disconnected'}
        </div>
      )}
      
      {data?.event && (
        <div className={`event-notification ${data.event.startsWith('break:') ? 'break-event' : 'warn-event'}`}>
          {data.event}
        </div>
      )}
    </div>
  );
};

export default LyapunovThermometer;
