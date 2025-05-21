/**
 * ψ-ELFIN Binding Demo
 * 
 * This component demonstrates the binding between ψ-oscillator patterns
 * and ELFIN symbols, showing real-time pattern recognition and binding.
 */

import React, { useEffect, useState, useRef } from 'react';
import { PsiTrajectory, PatternMatchingAlgorithm } from '../index';
import ExportPanel from './export-panel';

const VISUALIZATION_WIDTH = 800;
const VISUALIZATION_HEIGHT = 600;
const OSCILLATOR_COUNT = 32;
const EMOTION_DIMENSIONS = 8;

/**
 * Main demo component
 */
export const PsiElfinDemo = () => {
  const [psi, setPsi] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elfinSymbols, setElfinSymbols] = useState([]);
  const [boundPatterns, setBoundPatterns] = useState([]);
  const [error, setError] = useState(null);
  const [matchAlgorithm, setMatchAlgorithm] = useState(PatternMatchingAlgorithm.LSH);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('visualization');
  const [sessionId, setSessionId] = useState(null);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  // Initialize the ψ-Trajectory system on component mount
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        
        // Initialize the PsiTrajectory system
        const instance = await PsiTrajectory.getInstance();
        await instance.initialize({
          oscillatorCount: OSCILLATOR_COUNT,
          emotionDimensions: EMOTION_DIMENSIONS,
          outputDir: './archives',
          elfinSymbolsPath: './elfin_symbols.json',
          // Use band-aware var-bit quantization and static dictionary
          compressionLevel: 15, // Higher compression for archive storage
        });
        
        // Set up event listeners
        instance.on('initialized', () => console.log('PsiTrajectory initialized'));
        instance.on('error', (err) => setError(err.message));
        instance.on('patternBound', handlePatternBound);
        instance.on('recordingStarted', () => setIsRecording(true));
        instance.on('recordingStopped', () => setIsRecording(false));
        instance.on('playbackStarted', () => setIsPlaying(true));
        instance.on('playbackPaused', () => setIsPlaying(false));
        
        // Store instance
        setPsi(instance);
        
        // Load demo ELFIN symbols
        await loadDemoElfinSymbols();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize:', error);
        setError(`Initialization failed: ${error.message}`);
        setIsLoading(false);
      }
    };
    
    init();
    
    // Clean up on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Load demo ELFIN symbols
  const loadDemoElfinSymbols = async () => {
    // In a real app, these would come from the Rust side
    // For demo purposes, we'll just create some mock symbols
    const mockSymbols = [
      { name: 'wheelDiameter', hash: '8a7b3e9f2c1d5e6f', unit: 'meters' },
      { name: 'engineRPM', hash: '7c3f9e2a1b8d7c5f', unit: 'rpm' },
      { name: 'acceleration', hash: '6d2e8f4a1c7b3e5d', unit: 'm/s²' },
      { name: 'voltage', hash: '5e1d7c3f9e2a1b8d', unit: 'V' },
      { name: 'current', hash: '4f2e8d7c6b5a3e9d', unit: 'A' },
    ];
    
    setElfinSymbols(mockSymbols);
  };
  
  // Handle pattern binding events
  const handlePatternBound = (data) => {
    const { nodeId, signature } = data;
    
    // Find a matching ELFIN symbol (in a real app, this would be done in Rust)
    // For demo purposes, we'll just pick a random one
    const symbolIndex = Math.floor(Math.random() * elfinSymbols.length);
    const symbol = elfinSymbols[symbolIndex];
    
    // Add to bound patterns
    setBoundPatterns((patterns) => [
      ...patterns,
      {
        nodeId,
        signature,
        symbol,
        timestamp: new Date(),
      }
    ]);
  };
  
  // Start a recording session
  const handleStartRecording = async () => {
    if (!psi) return;
    
    try {
      const sessionId = `demo-${Date.now()}`;
      await psi.startRecording(sessionId);
      // Start oscillator animation
      startOscillatorAnimation();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError(`Recording failed: ${error.message}`);
    }
  };
  
  // Stop the recording session
  const handleStopRecording = async () => {
    if (!psi) return;
    
    try {
      await psi.stopRecording();
      // Stop oscillator animation
      stopOscillatorAnimation();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setError(`Stop recording failed: ${error.message}`);
    }
  };
  
  // Start the oscillator animation
  const startOscillatorAnimation = () => {
    if (!canvasRef.current) return;
    
    // Generate some initial oscillator states
    const oscillators = Array(OSCILLATOR_COUNT).fill(0).map(() => ({
      phase: Math.random() * 2 * Math.PI - Math.PI,
      amplitude: Math.random(),
      frequency: 0.5 + Math.random() * 2,
    }));
    
    // Emotion vector
    const emotions = Array(EMOTION_DIMENSIONS).fill(0).map(() => Math.random());
    
    // Update function
    const updateOscillators = () => {
      // Update oscillator phases
      for (let i = 0; i < oscillators.length; i++) {
        oscillators[i].phase += oscillators[i].frequency * 0.01;
        if (oscillators[i].phase > Math.PI) {
          oscillators[i].phase -= 2 * Math.PI;
        }
        
        // Randomly adjust amplitude and frequency occasionally
        if (Math.random() < 0.01) {
          oscillators[i].amplitude = Math.max(0, Math.min(1, oscillators[i].amplitude + (Math.random() * 0.2 - 0.1)));
          oscillators[i].frequency = Math.max(0.1, Math.min(3, oscillators[i].frequency + (Math.random() * 0.4 - 0.2)));
        }
      }
      
      // Update emotions occasionally
      if (Math.random() < 0.05) {
        for (let i = 0; i < emotions.length; i++) {
          emotions[i] = Math.max(0, Math.min(1, emotions[i] + (Math.random() * 0.2 - 0.1)));
        }
      }
      
      // Extract phases and amplitudes
      const phases = new Float32Array(oscillators.map(o => o.phase));
      const amplitudes = new Float32Array(oscillators.map(o => o.amplitude));
      const emotionVector = new Float32Array(emotions);
      
      // Capture frame
      if (psi) {
        psi.captureFrame(phases, amplitudes, emotionVector);
        
        // Occasionally try to detect a pattern
        if (Math.random() < 0.1) {
          // Generate a signature (in a real app, this would be more sophisticated)
          const signature = new Float32Array([...phases.slice(0, 8), ...emotionVector]);
          // Process the pattern
          psi.processOscillatorPattern(Date.now(), signature);
        }
        
        // Update statistics
        setStats(psi.getRecorderStats());
      }
      
      // Draw the oscillators
      drawOscillators(oscillators, emotions);
      
      // Continue animation
      animationRef.current = requestAnimationFrame(updateOscillators);
    };
    
    // Start the animation
    animationRef.current = requestAnimationFrame(updateOscillators);
  };
  
  // Stop the oscillator animation
  const stopOscillatorAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };
  
  // Draw oscillators on the canvas
  const drawOscillators = (oscillators, emotions) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw emotion vector as background color
    const r = Math.floor(emotions[0] * 64);
    const g = Math.floor(emotions[1] * 64);
    const b = Math.floor(emotions[2] * 64);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw oscillators
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw oscillator points
    for (let i = 0; i < oscillators.length; i++) {
      const angle = (i / oscillators.length) * 2 * Math.PI;
      const phase = oscillators[i].phase;
      const amplitude = oscillators[i].amplitude;
      
      const x = centerX + Math.cos(angle) * radius * amplitude;
      const y = centerY + Math.sin(angle) * radius * amplitude;
      
      // Use phase to determine color
      const phaseNorm = (phase + Math.PI) / (2 * Math.PI);
      const hue = Math.floor(phaseNorm * 360);
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      
      // Draw oscillator
      ctx.beginPath();
      ctx.arc(x, y, 5 + amplitude * 10, 0, 2 * Math.PI);
      ctx.fill();
      
      // Connect to center
      ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.5)`;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    // Draw bound patterns
    boundPatterns.forEach((pattern, index) => {
      // Draw connection lines to the bound ELFIN symbol
      const symbolX = 100;
      const symbolY = 100 + index * 40;
      
      // Use the first oscillator as a connection point
      const angle = (0 / oscillators.length) * 2 * Math.PI;
      const amplitude = oscillators[0].amplitude;
      const x = centerX + Math.cos(angle) * radius * amplitude;
      const y = centerY + Math.sin(angle) * radius * amplitude;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(symbolX, symbolY);
      ctx.stroke();
      
      // Draw the symbol name
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText(pattern.symbol.name, symbolX + 10, symbolY + 5);
    });
  };
  
  // Handle algorithm change
  const handleAlgorithmChange = (e) => {
    setMatchAlgorithm(e.target.value);
  };
  
  return (
    <div className="psi-elfin-demo">
      <h1>ψ-ELFIN Binding Demo</h1>
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'visualization' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualization')}
        >
          Visualization
        </button>
        <button 
          className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Export
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="loading">Loading ψ-Trajectory system...</div>
      ) : activeTab === 'visualization' ? (
        <>
          <div className="controls">
            <div className="control-group">
              <label>Pattern Matching Algorithm:</label>
              <select value={matchAlgorithm} onChange={handleAlgorithmChange}>
                <option value={PatternMatchingAlgorithm.COSINE}>Cosine Similarity</option>
                <option value={PatternMatchingAlgorithm.LSH}>LSH (Locality-Sensitive Hashing)</option>
                <option value={PatternMatchingAlgorithm.HEBBIAN}>Hebbian Learning</option>
              </select>
            </div>
            
            <div className="control-group">
              {!isRecording ? (
                <button onClick={handleStartRecording}>Start Recording</button>
              ) : (
                <button onClick={handleStopRecording}>Stop Recording</button>
              )}
            </div>
          </div>
          
          <div className="visualization">
            <canvas 
              ref={canvasRef} 
              width={VISUALIZATION_WIDTH} 
              height={VISUALIZATION_HEIGHT}
              className="oscillator-canvas"
            />
          </div>
          
          <div className="stats">
            <h2>Statistics</h2>
            {stats && (
              <table>
                <tbody>
                  <tr>
                    <td>Frames Captured:</td>
                    <td>{stats.frames_captured}</td>
                  </tr>
                  <tr>
                    <td>Frames Processed:</td>
                    <td>{stats.frames_processed}</td>
                  </tr>
                  <tr>
                    <td>Compression Ratio:</td>
                    <td>{stats.compression_ratio.toFixed(2)}x</td>
                  </tr>
                  <tr>
                    <td>Bound Patterns:</td>
                    <td>{boundPatterns.length}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
          
          <div className="bound-patterns">
            <h2>Bound ELFIN Symbols</h2>
            {boundPatterns.length === 0 ? (
              <p>No patterns bound yet. Start recording to detect patterns.</p>
            ) : (
              <ul>
                {boundPatterns.map((pattern) => (
                  <li key={pattern.nodeId}>
                    <strong>{pattern.symbol.name}</strong> ({pattern.symbol.unit})
                    <span className="timestamp">
                      {pattern.timestamp.toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <div className="export-tab">
          <ExportPanel 
            psi={psi} 
            archivePath={sessionId ? `./archives/${sessionId}.psiarc` : './demo-recording.psiarc'} 
          />
        </div>
      )}
      
      <style jsx>{`
        .tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 2px solid #ddd;
        }
        
        .tab-button {
          padding: 10px 20px;
          border: none;
          background: none;
          font-size: 16px;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.3s, border-bottom 0.3s;
          margin-right: 10px;
        }
        
        .tab-button.active {
          opacity: 1;
          font-weight: bold;
          border-bottom: 3px solid #4CAF50;
        }
        
        .tab-button:hover {
          opacity: 1;
        }
        
        .export-tab {
          padding: 10px;
        }
        
        .psi-elfin-demo {
          font-family: Arial, sans-serif;
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .error-message {
          background-color: #ffdddd;
          color: #ff0000;
          padding: 10px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        
        .loading {
          text-align: center;
          padding: 20px;
          font-style: italic;
        }
        
        .controls {
          display: flex;
          margin-bottom: 20px;
          gap: 20px;
        }
        
        .control-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .visualization {
          margin-bottom: 20px;
        }
        
        .oscillator-canvas {
          border: 1px solid #ccc;
          border-radius: 4px;
          background-color: #f5f5f5;
        }
        
        .stats {
          margin-bottom: 20px;
        }
        
        .stats table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .stats td {
          padding: 5px;
          border-bottom: 1px solid #eee;
        }
        
        .bound-patterns ul {
          list-style-type: none;
          padding: 0;
        }
        
        .bound-patterns li {
          padding: 10px;
          margin-bottom: 5px;
          background-color: #f0f0f0;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
        }
        
        .timestamp {
          color: #666;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
};

export default PsiElfinDemo;
