import React from 'react';
import './ConceptFieldCanvas.css';

/**
 * CanvasControls Component
 * 
 * Provides toolbar controls for the Concept Field Canvas.
 * Manages geometry switching, parameter adjustment, and morph controls.
 */
const CanvasControls = ({
  geometry,
  setGeometry,
  alpha,
  setAlpha,
  morph,
  setMorph,
  metrics,
  onExecuteMorph
}) => {
  // Handle parameter adjustments
  const increaseAlpha = () => {
    const newValue = Math.min(alpha + 0.1, 3).toFixed(1) * 1;
    setAlpha(newValue);
  };
  
  const decreaseAlpha = () => {
    const newValue = Math.max(alpha - 0.1, 0.1).toFixed(1) * 1;
    setAlpha(newValue);
  };
  
  const increaseEpsilon = () => {
    const newEpsilon = Math.min(morph.epsilon + 0.1, 1.0).toFixed(1) * 1;
    setMorph({ ...morph, epsilon: newEpsilon });
  };
  
  const decreaseEpsilon = () => {
    const newEpsilon = Math.max(morph.epsilon - 0.1, 0.1).toFixed(1) * 1;
    setMorph({ ...morph, epsilon: newEpsilon });
  };
  
  // Handle morph mode selection
  const handleMorphModeChange = (e) => {
    setMorph({ ...morph, mode: e.target.value });
  };
  
  return (
    <div className="concept-field-toolbar">
      {/* Left section - Geometry controls */}
      <div className="concept-field-toolbar-section">
        <div className="geometry-selector">
          <span>Geometry:</span>
          <label className="geometry-option">
            <input 
              type="radio" 
              name="geometry" 
              value="euclidean" 
              checked={geometry === 'euclidean'} 
              onChange={() => setGeometry('euclidean')} 
            />
            <span>Euclidean</span>
          </label>
          <label className="geometry-option">
            <input 
              type="radio" 
              name="geometry" 
              value="spherical" 
              checked={geometry === 'spherical'} 
              onChange={() => setGeometry('spherical')} 
            />
            <span>Spherical</span>
          </label>
          <label className="geometry-option">
            <input 
              type="radio" 
              name="geometry" 
              value="hyperbolic" 
              checked={geometry === 'hyperbolic'} 
              onChange={() => setGeometry('hyperbolic')} 
            />
            <span>Hyperbolic</span>
          </label>
        </div>
        
        <div className="alpha-control">
          <span>α:</span>
          <span className="alpha-value">{alpha}</span>
          <button onClick={increaseAlpha} className="param-control-btn">+</button>
          <button onClick={decreaseAlpha} className="param-control-btn">-</button>
        </div>
      </div>
      
      {/* Middle section - Metrics display */}
      <div className="metrics-display">
        <div>Sync: {metrics.syncPercentage}%</div>
        <div>Entropy: {metrics.entropy}</div>
        <div className="attractor-selector">
          <span>▼ Attractor:</span>
          <span>"{metrics.attractor}"</span>
        </div>
      </div>
      
      {/* Right section - Morph controls */}
      <div className="morph-controls">
        <div>
          <select 
            value={morph.mode} 
            onChange={handleMorphModeChange}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'var(--color-text-primary)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 6px'
            }}
          >
            <option value="Koopman #1">Koopman #1</option>
            <option value="Koopman #2">Koopman #2</option>
            <option value="Koopman #3">Koopman #3</option>
            <option value="Phase Sync">Phase Sync</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
        <div className="epsilon-control">
          <span>ε = {morph.epsilon}</span>
          <button onClick={increaseEpsilon} className="param-control-btn">+</button>
          <button onClick={decreaseEpsilon} className="param-control-btn">-</button>
        </div>
        <button onClick={onExecuteMorph} className="morph-button">
          Morph 🔁
        </button>
      </div>
    </div>
  );
};

export default CanvasControls;
