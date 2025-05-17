import React, { useEffect, useState } from 'react';
import './DeveloperStateMonitor.css';

/**
 * DeveloperStateMonitor Component
 * 
 * Displays real-time visualization of the developer's cognitive and emotional state
 * based on affective computing analysis of their interactions.
 * 
 * Props:
 * - developerState: Object containing the developer's state metrics
 * - showDetailed: Boolean to toggle detailed view
 * - onStateChange: Callback when state changes significantly
 */
const DeveloperStateMonitor = ({ developerState, showDetailed = false, onStateChange }) => {
  const [prevState, setPrevState] = useState(null);
  const [stateChanged, setStateChanged] = useState(false);
  
  // Default state if not provided
  const state = developerState || {
    focusLevel: 0.5,
    frustrationLevel: 0.1,
    explorationLevel: 0.5
  };
  
  // Determine which state is dominant
  let dominantState = "balanced";
  let dominantLevel = 0.5; // default threshold
  
  if (state.focusLevel > dominantLevel && state.focusLevel > state.frustrationLevel && state.focusLevel > state.explorationLevel) {
    dominantState = "focused";
    dominantLevel = state.focusLevel;
  } else if (state.frustrationLevel > dominantLevel && state.frustrationLevel > state.focusLevel && state.frustrationLevel > state.explorationLevel) {
    dominantState = "frustrated";
    dominantLevel = state.frustrationLevel;
  } else if (state.explorationLevel > dominantLevel && state.explorationLevel > state.focusLevel && state.explorationLevel > state.frustrationLevel) {
    dominantState = "exploring";
    dominantLevel = state.explorationLevel;
  }
  
  // Check for significant state changes
  useEffect(() => {
    if (prevState) {
      // Calculate change magnitude
      const focusDelta = Math.abs(state.focusLevel - prevState.focusLevel);
      const frustrationDelta = Math.abs(state.frustrationLevel - prevState.frustrationLevel);
      const explorationDelta = Math.abs(state.explorationLevel - prevState.explorationLevel);
      
      // If any state changes significantly (20%+)
      if (focusDelta > 0.2 || frustrationDelta > 0.2 || explorationDelta > 0.2) {
        setStateChanged(true);
        
        // Call the state change callback if provided
        if (onStateChange) {
          onStateChange(state, prevState);
        }
        
        // Reset the state changed flag after 2 seconds
        setTimeout(() => {
          setStateChanged(false);
        }, 2000);
      }
    }
    
    // Update previous state
    setPrevState({ ...state });
  }, [state.focusLevel, state.frustrationLevel, state.explorationLevel]);
  
  // State icons
  const stateIcons = {
    focused: "🧠",
    frustrated: "😓",
    exploring: "🔍",
    balanced: "⚖️"
  };
  
  // State colors
  const stateColors = {
    focused: "#3b82f6", // blue
    frustrated: "#ef4444", // red
    exploring: "#8b5cf6", // purple
    balanced: "#6b7280"  // gray
  };
  
  // State descriptions
  const stateDescriptions = {
    focused: "You appear to be deeply focused on a specific task. Suggestions are prioritized for minimal disruption.",
    frustrated: "You may be experiencing some challenges. Quick wins and helpful suggestions are prioritized.",
    exploring: "You seem to be in exploration mode. Strategic and architectural suggestions are prioritized.",
    balanced: "You're in a balanced state. Suggestions are prioritized based on their confidence scores."
  };
  
  // Compact view just shows the icon and state
  if (!showDetailed) {
    return (
      <div 
        className={`developer-state-monitor compact ${stateChanged ? 'state-changed' : ''}`}
        title={`Developer State: ${dominantState.charAt(0).toUpperCase() + dominantState.slice(1)} (${Math.round(dominantLevel * 100)}%)`}
        style={{ backgroundColor: stateColors[dominantState] }}
        data-state={dominantState}
      >
        <span className="state-icon">{stateIcons[dominantState]}</span>
        <span className="state-label">{dominantState}</span>
      </div>
    );
  }
  
  // Detailed view shows all metrics and a description
  return (
    <div 
      className={`developer-state-monitor detailed ${stateChanged ? 'state-changed' : ''}`}
      data-state={dominantState}
    >
      <div className="monitor-header" style={{ backgroundColor: stateColors[dominantState] }}>
        <span className="state-icon">{stateIcons[dominantState]}</span>
        <span className="state-label">
          {dominantState.charAt(0).toUpperCase() + dominantState.slice(1)} State
        </span>
        <span className="state-level">{Math.round(dominantLevel * 100)}%</span>
      </div>
      
      <div className="monitor-content">
        <div className="state-description">
          {stateDescriptions[dominantState]}
        </div>
        
        <div className="state-metrics">
          <div className="metric">
            <label>Focus:</label>
            <div className="metric-bar-container">
              <div 
                className="metric-bar" 
                style={{ 
                  width: `${state.focusLevel * 100}%`,
                  backgroundColor: stateColors.focused
                }}
              />
            </div>
            <span className="metric-value">{Math.round(state.focusLevel * 100)}%</span>
          </div>
          
          <div className="metric">
            <label>Frustration:</label>
            <div className="metric-bar-container">
              <div 
                className="metric-bar" 
                style={{ 
                  width: `${state.frustrationLevel * 100}%`,
                  backgroundColor: stateColors.frustrated
                }}
              />
            </div>
            <span className="metric-value">{Math.round(state.frustrationLevel * 100)}%</span>
          </div>
          
          <div className="metric">
            <label>Exploration:</label>
            <div className="metric-bar-container">
              <div 
                className="metric-bar" 
                style={{ 
                  width: `${state.explorationLevel * 100}%`,
                  backgroundColor: stateColors.exploring
                }}
              />
            </div>
            <span className="metric-value">{Math.round(state.explorationLevel * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperStateMonitor;
