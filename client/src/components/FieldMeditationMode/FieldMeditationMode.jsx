import React, { useState, useEffect, useRef } from 'react';
import './FieldMeditationMode.css';
import ConceptFieldCanvas from '../ConceptFieldCanvas/ConceptFieldCanvas';
import executionTracerService from '../../services/executionTracerService';
import { usePersona } from '../PersonaSelector/PersonaContext';
// Import removed as it's not being used
// import { debounce } from '../../utils/performance';

/**
 * FieldMeditationMode Component
 * 
 * Enhanced for Sprint 3 to connect with live Python execution.
 * Shows semantic cognition at rest, in motion, and over time.
 * Visualizes Koopman spectrum, entropy waves, and phase fields.
 * Includes divergence detection and real-time monitoring.
 */
const FieldMeditationMode = ({ 
  conceptData,
  pythonCode,
  onClose,
  enablePlayback = true,
  enableSpectrum = true,
  enableEntropyWave = true,
  onStateChange,
  onDivergenceDetected
}) => {
  const { getFeature } = usePersona();
  
  // State for playback and time
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [timeScale, setTimeScale] = useState(1.0);
  // Removed unused state variables
  // const [alpha, setAlpha] = useState(1.2);
  const [geometry, setGeometry] = useState('hyperbolic');
  const [selectedRange] = useState([0, 100]);
  
  // Execution state
  const [isConnected, setIsConnected] = useState(false);
  const [isTracing, setIsTracing] = useState(false);
  const [executionState, setExecutionState] = useState({});
  // Changed to avoid unused variable while keeping the function
  const [, setTraceEvents] = useState([]);
  const [divergences, setDivergences] = useState([]);
  const [activeNodes, setActiveNodes] = useState([]);
  
  // Visualization state
  const [koopmanSpectrum, setKoopmanSpectrum] = useState([]);
  const [entropyValues, setEntropyValues] = useState([]);
  const [phaseAnimation, setPhaseAnimation] = useState(false);
  
  // Refs
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const entropyChartRef = useRef(null);
  const spectrumChartRef = useRef(null);
  
  // Connect to execution tracer on mount
  useEffect(() => {
    executionTracerService.initialize({
      serverUrl: 'ws://localhost:3002/execution-trace',
      autoConnect: true
    });
    
    // Subscribe to connection changes
    const connectionSub = executionTracerService.subscribe(
      'connectionChange', 
      ({ connected }) => {
        setIsConnected(connected);
      }
    );
    
    // Subscribe to trace updates
    const traceSub = executionTracerService.subscribe(
      'traceUpdate',
      ({ isTracing: tracing, executionState: state, currentEvent }) => {
        setIsTracing(tracing);
        setExecutionState(state || {});
        
        if (currentEvent) {
          // Update active nodes
          setActiveNodes(prevNodes => {
            const newNodes = [...prevNodes];
            if (!newNodes.includes(currentEvent.nodeId)) {
              newNodes.push(currentEvent.nodeId);
            }
            // Limit to most recent 5 active nodes
            return newNodes.slice(-5);
          });
        }
      }
    );
    
    // Subscribe to trace completion
    const completeSub = executionTracerService.subscribe(
      'traceComplete',
      ({ traceBuffer }) => {
        setTraceEvents(traceBuffer || []);
        setIsTracing(false);
        
        // Process trace buffer to compute Koopman spectrum
        computeKoopmanSpectrum(traceBuffer);
        
        // Compute entropy wave
        computeEntropyWave(traceBuffer);
      }
    );
    
    // Subscribe to divergence detection
    const divergenceSub = executionTracerService.subscribe(
      'divergenceDetected',
      (divergence) => {
        setDivergences(prev => [...prev, divergence]);
        
        if (onDivergenceDetected) {
          onDivergenceDetected(divergence);
        }
      }
    );
    
    // Clean up subscriptions on unmount
    return () => {
      connectionSub();
      traceSub();
      completeSub();
      divergenceSub();
    };
  }, [onDivergenceDetected]);
  
  // Compute Koopman spectrum from trace events
  const computeKoopmanSpectrum = (events) => {
    if (!events || events.length === 0) return;
    
    // This would be a complex calculation in a real implementation
    // Here we'll use a placeholder calculation for demonstration
    
    // Removed unused variable
    // const phases = events.map(event => event.phase || 0);
    
    // Create eigenvalues on unit circle (simplified)
    const spectrum = [];
    const numEigenvalues = Math.min(10, Math.floor(events.length / 10));
    
    for (let i = 0; i < numEigenvalues; i++) {
      const angle = 2 * Math.PI * i / numEigenvalues;
      const radius = 0.5 + 0.5 * Math.random(); // Randomize for visualization
      
      spectrum.push({
        real: radius * Math.cos(angle),
        imag: radius * Math.sin(angle),
        magnitude: radius,
        frequency: i,
        contribution: Math.random() // Randomize for visualization
      });
    }
    
    setKoopmanSpectrum(spectrum);
  };
  
  // Compute entropy wave from trace events
  const computeEntropyWave = (events) => {
    if (!events || events.length === 0) return;
    
    // This would be a complex calculation in a real implementation
    // Here we'll use a placeholder calculation for demonstration
    
    const entropyData = [];
    const timeSteps = events.length;
    
    for (let i = 0; i < timeSteps; i++) {
      const t = i / (timeSteps - 1);
      const event = events[i];
      
      // Calculate pseudo-entropy based on state at this time
      const baseEntropy = 0.5 + 0.3 * Math.sin(10 * t);
      
      // Add noise
      const noise = 0.05 * (Math.random() - 0.5);
      
      // Add spikes for divergences
      const hasDivergence = event?.context?.hasDivergence || false;
      const divergenceBoost = hasDivergence ? 0.2 : 0;
      
      entropyData.push({
        time: t * 100, // Scale to 0-100 for easier usage
        entropy: baseEntropy + noise + divergenceBoost,
        hasEvent: !!event,
        eventType: event?.context?.type || null,
        nodeName: event?.nodeName || null
      });
    }
    
    setEntropyValues(entropyData);
  };
  
  // Animation frame handler for playback
  useEffect(() => {
    if (!playing) return;
    
    const animate = (timestamp) => {
      if (!animationRef.current) {
        animationRef.current = timestamp;
      }
      
      const elapsed = timestamp - animationRef.current;
      animationRef.current = timestamp;
      
      // Update current time based on elapsed time and time scale
      setCurrentTime(time => {
        const newTime = time + (elapsed / 1000) * timeScale;
        
        // Loop playback within selected range
        if (newTime > selectedRange[1]) {
          return selectedRange[0];
        }
        return newTime;
      });
      
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
      animationRef.current = null;
    };
  }, [playing, timeScale, selectedRange]);
  
  // Execute Python code with tracing
  const executeCode = () => {
    if (!pythonCode) {
      console.warn('No Python code provided for execution');
      return;
    }
    
    // Reset state
    setDivergences([]);
    setActiveNodes([]);
    
    // Start tracing
    executionTracerService.startTracing(pythonCode)
      .then(result => {
        console.log('Execution completed:', result);
      })
      .catch(error => {
        console.error('Execution error:', error);
      });
  };
  
  // Toggle play state
  const togglePlay = () => {
    setPlaying(!playing);
  };
  
  // Step backward in time
  const stepBackward = () => {
    setCurrentTime(time => Math.max(selectedRange[0], time - 1));
  };
  
  // Step forward in time
  const stepForward = () => {
    setCurrentTime(time => Math.min(selectedRange[1], time + 1));
  };
  
  // Stop playback
  const stopPlayback = () => {
    setPlaying(false);
    setCurrentTime(selectedRange[0]);
  };
  
  // Change time scale
  const handleTimeScaleChange = (event) => {
    setTimeScale(parseFloat(event.target.value));
  };
  
  // Change geometry
  const handleGeometryChange = (newGeometry) => {
    setGeometry(newGeometry);
  };
  
  // Get phase animation state based on current time
  useEffect(() => {
    // Only animate when playing or when there are active trace events
    setPhaseAnimation(playing || isTracing);
    
    // Update canvas with current time
    if (canvasRef.current) {
      // Apply time-based settings to the canvas
      // This would interact with the ConceptFieldCanvas in a real implementation
    }
    
    // Notify parent of state change
    if (onStateChange) {
      onStateChange({
        currentTime,
        playing,
        timeScale,
        geometry,
        activeNodes,
        divergences
      });
    }
  }, [currentTime, playing, isTracing, activeNodes, divergences, timeScale, geometry, onStateChange]);
  
  // Render divergence alerts
  const renderDivergenceAlerts = () => {
    if (divergences.length === 0) return null;
    
    return (
      <div className="divergence-alerts">
        <h3>Divergence Warnings</h3>
        <div className="divergence-list">
          {divergences.map((divergence, index) => (
            <div key={index} className={`divergence-item ${divergence.severity}`}>
              <span className="divergence-type">{divergence.type}</span>
              <span className="divergence-node">{divergence.nodeName}</span>
              <span className="divergence-time">t={divergence.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render the current execution state
  const renderExecutionState = () => {
    if (!isTracing && !executionState.currentNode) return null;
    
    return (
      <div className="execution-state">
        <h3>Execution State</h3>
        <div className="execution-node">
          Current Node: {executionState.currentNode || 'None'}
        </div>
        <div className="execution-phase">
          Phase: {executionState.currentPhase?.toFixed(3) || 0}
        </div>
        {executionState.callStack && executionState.callStack.length > 0 && (
          <div className="execution-callstack">
            Call Stack: {executionState.callStack.join(' → ')}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="meditation-container">
      {/* Header with controls */}
      <div className="meditation-header">
        <div className="meditation-title">
          <span>🧘</span>
          <span>FIELD MEDITATION MODE</span>
          {isTracing && <span className="tracing-badge">LIVE</span>}
        </div>
        
        <div className="meditation-controls">
          {enablePlayback && (
            <>
              <button 
                className={`control-button ${playing ? 'playing' : ''}`}
                onClick={togglePlay}
                disabled={isTracing}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? '⏸️ Pause' : '▶️ Play'}
              </button>
              
              <button 
                className="control-button step-button"
                onClick={stepBackward}
                disabled={playing || isTracing}
                aria-label="Step backward"
              >
                ⏮️
              </button>
              
              <button 
                className="control-button step-button"
                onClick={stepForward}
                disabled={playing || isTracing}
                aria-label="Step forward"
              >
                ⏭️
              </button>
              
              <button 
                className="control-button"
                onClick={stopPlayback}
                disabled={isTracing}
                aria-label="Stop"
              >
                ⏹️ Stop
              </button>
            </>
          )}
          
          <div className="meditation-time">
            t = {currentTime.toFixed(1)}
          </div>
          
          {pythonCode && (
            <button 
              className={`execute-button ${isTracing ? 'executing' : ''}`}
              onClick={executeCode}
              disabled={isTracing}
            >
              {isTracing ? '⚡ Executing...' : '⚡ Execute Code'}
            </button>
          )}
        </div>
        
        <div className="meditation-params">
          <div className="meditation-param">
            <label htmlFor="timeScale">Speed:</label>
            <input 
              type="range" 
              id="timeScale"
              min="0.1" 
              max="3.0" 
              step="0.1" 
              value={timeScale}
              onChange={handleTimeScaleChange}
              disabled={isTracing}
            />
            <span>{timeScale.toFixed(1)}x</span>
          </div>
          
          <div className="meditation-param">
            <button 
              className={`geometry-button ${geometry === 'euclidean' ? 'active' : ''}`}
              onClick={() => handleGeometryChange('euclidean')}
              aria-label="Euclidean geometry"
              title="Euclidean geometry"
            >
              🔲
            </button>
            <button 
              className={`geometry-button ${geometry === 'hyperbolic' ? 'active' : ''}`}
              onClick={() => handleGeometryChange('hyperbolic')}
              aria-label="Hyperbolic geometry"
              title="Hyperbolic geometry"
            >
              🔄
            </button>
            <button 
              className={`geometry-button ${geometry === 'spherical' ? 'active' : ''}`}
              onClick={() => handleGeometryChange('spherical')}
              aria-label="Spherical geometry"
              title="Spherical geometry"
            >
              🔴
            </button>
          </div>
          
          {onClose && (
            <button 
              className="control-button"
              onClick={onClose}
              aria-label="Exit Meditation Mode"
            >
              Exit Mode
            </button>
          )}
        </div>
      </div>
      
      {/* Connection status */}
      {!isConnected && (
        <div className="connection-status error">
          ⚠️ Not connected to execution tracer server
        </div>
      )}
      
      {/* Meditation content grid */}
      <div className="meditation-content">
        {/* Koopman Spectrum Trail */}
        {enableSpectrum && (
          <div className="meditation-panel">
            <div className="meditation-panel-header">
              🌀 Koopman Spectrum Trail
            </div>
            <div className="meditation-panel-content" ref={spectrumChartRef}>
              {koopmanSpectrum.length > 0 ? (
                <div className="spectrum-placeholder">
                  {/* In a real implementation, this would be a D3 or React-Vis visualization */}
                  {koopmanSpectrum.map((eigenvalue, i) => (
                    <div 
                      key={i}
                      className="eigenvalue-point"
                      style={{
                        left: `${50 + 40 * eigenvalue.real}%`,
                        top: `${50 - 40 * eigenvalue.imag}%`,
                        opacity: eigenvalue.magnitude,
                        width: `${6 + 10 * eigenvalue.contribution}px`,
                        height: `${6 + 10 * eigenvalue.contribution}px`
                      }}
                      title={`λ${i}: ${eigenvalue.real.toFixed(2)} + ${eigenvalue.imag.toFixed(2)}i`}
                    />
                  ))}
                  <div className="unit-circle" />
                </div>
              ) : (
                <div className="placeholder-text">
                  {isTracing ? 'Recording spectrum...' : 'Execute code to see Koopman spectrum'}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Spectral Entropy Wave */}
        {enableEntropyWave && (
          <div className="meditation-panel">
            <div className="meditation-panel-header">
              📈 Spectral Entropy Wave
            </div>
            <div className="meditation-panel-content" ref={entropyChartRef}>
              {entropyValues.length > 0 ? (
                <div className="entropy-wave-placeholder">
                  {/* In a real implementation, this would be a line chart visualization */}
                  <div className="entropy-plot">
                    <div className="current-time-marker" style={{ left: `${currentTime}%` }} />
                    
                    {entropyValues.map((point, i) => (
                      <div 
                        key={i}
                        className={`entropy-point ${point.hasEvent ? 'has-event' : ''}`}
                        style={{
                          left: `${point.time}%`,
                          bottom: `${point.entropy * 100}%`,
                        }}
                        title={point.nodeName ? `${point.nodeName} (${point.entropy.toFixed(3)})` : `Entropy: ${point.entropy.toFixed(3)}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="placeholder-text">
                  {isTracing ? 'Recording entropy values...' : 'Execute code to see entropy wave'}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Phase Field Canvas */}
        <div className="meditation-panel" style={{ gridColumn: '1 / span 2' }}>
          <div className="meditation-panel-header">
            🔵 Phase Field Canvas {isTracing ? '(Live Execution)' : '(Over time)'}
          </div>
          <div className="meditation-panel-content">
            <ConceptFieldCanvas
              ref={canvasRef}
              data={conceptData}
              selectedNodeIds={activeNodes}
              showKoopmanOverlay={getFeature('showKoopmanOverlay')}
              showPhaseColors={getFeature('showPhaseColors')}
              animate={phaseAnimation}
              geometryMode={geometry}
              className="meditation-canvas"
            />
          </div>
        </div>
        
        {/* Execution details and divergences */}
        <div className="meditation-panel execution-panel" style={{ gridColumn: '1 / span 2' }}>
          <div className="execution-details">
            {renderExecutionState()}
            {renderDivergenceAlerts()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldMeditationMode;
