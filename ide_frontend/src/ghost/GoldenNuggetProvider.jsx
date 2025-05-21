// GoldenNuggetProvider.jsx
// React component to integrate Golden Nugget reflections into the application
// Provides an overlay for displaying reflections and hooks for triggering them

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  NuggetTriggerType, 
  checkForNuggetOpportunity, 
  triggerGoldenNugget,
  nuggetDetectors
} from './goldenNuggetTrigger';
import { getAgentSettings, updateAgentSettings } from './agentSettings';
import { applyCadenceToElement } from './CadenceController';

// Create context with default values
const GoldenNuggetContext = createContext({
  activeReflection: null,
  triggerContradiction: () => {},
  triggerStability: () => {},
  triggerBreakthrough: () => {},
  triggerGrowth: () => {},
  manualTrigger: () => {},
  dismissReflection: () => {},
  disableGoldenNuggets: false,
  toggleGoldenNuggets: () => {},
  reflectionCount: 0,
  reflectionHistory: [],
});

// Custom hook for accessing Golden Nugget functionality
export const useGoldenNugget = () => useContext(GoldenNuggetContext);

// Maximum number of reflection history items to keep
const MAX_HISTORY_LENGTH = 20;

// The overlay styles for the reflection container
const overlayStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  pointerEvents: 'none', // Allow clicks to pass through to the underlying UI
};

// Base styles for the reflection content (modified by the reflection's own styles)
const baseReflectionStyles = {
  maxWidth: '600px',
  padding: '2rem',
  borderRadius: '0.75rem',
  pointerEvents: 'auto', // Make just the reflection content clickable
  position: 'relative',
  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
  overflow: 'hidden',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

// Provider component
export const GoldenNuggetProvider = ({ children }) => {
  // State for the active reflection
  const [activeReflection, setActiveReflection] = useState(null);
  
  // State for tracking reflection history
  const [reflectionHistory, setReflectionHistory] = useState([]);
  
  // Settings state
  const [disableGoldenNuggets, setDisableGoldenNuggets] = useState(() => {
    const settings = getAgentSettings();
    return settings.disableGoldenNuggets;
  });
  
  // Effect to auto-dismiss the reflection after its duration
  useEffect(() => {
    if (!activeReflection) return;
    
    const timer = setTimeout(() => {
      setActiveReflection(null);
    }, activeReflection.duration);
    
    return () => clearTimeout(timer);
  }, [activeReflection]);
  
  // Effect to check for reflection opportunities on an interval
  useEffect(() => {
    if (disableGoldenNuggets) return;
    
    // This would connect to actual system state in a real implementation
    const checkInterval = setInterval(() => {
      // Example systemState - in a real app, this would be actual IDE telemetry
      const systemState = {
        activityLevel: Math.random(), // 0-1 activity level
        productivityTrend: Math.random() * 2 - 1, // -1 to 1
        sessionDuration: Date.now() - sessionStartTime,
        idleDuration: Math.random() > 0.8 ? 6 * 60 * 1000 : 1000, // Occasionally trigger idle
        editorFocused: true,
        fileNavCount: Math.floor(Math.random() * 20),
        editCount: Math.floor(Math.random() * 10),
        timespan: 5 * 60 * 1000
      };
      
      if (checkForNuggetOpportunity(systemState) && !activeReflection) {
        // Determine which trigger to use based on system state
        let triggerType = NuggetTriggerType.IDLE; // Default
        
        if (systemState.productivityTrend < -0.4) {
          triggerType = NuggetTriggerType.FATIGUE;
        } else if (systemState.idleDuration > 5 * 60 * 1000) {
          triggerType = NuggetTriggerType.IDLE;
        } else if (systemState.fileNavCount > 10 && systemState.editCount < 3) {
          triggerType = NuggetTriggerType.DRIFT;
        }
        
        const hour = new Date().getHours();
        if ((hour >= 22 || hour <= 5) && systemState.activityLevel > 0.3) {
          triggerType = NuggetTriggerType.LATE_NIGHT;
        }
        
        // Trigger the reflection
        const reflection = triggerGoldenNugget(triggerType, {
          sessionDuration: systemState.sessionDuration
        });
        
        if (reflection) {
          setActiveReflection(reflection);
          setReflectionHistory(prev => {
            const newHistory = [reflection, ...prev];
            return newHistory.slice(0, MAX_HISTORY_LENGTH);
          });
        }
      }
    }, 30000); // Check every 30 seconds
    
    const sessionStartTime = Date.now();
    
    return () => clearInterval(checkInterval);
  }, [disableGoldenNuggets, activeReflection]);
  
  // Toggle Golden Nuggets enabled/disabled
  const toggleGoldenNuggets = () => {
    const newValue = !disableGoldenNuggets;
    setDisableGoldenNuggets(newValue);
    updateAgentSettings({ disableGoldenNuggets: newValue });
  };
  
  // Manually dismiss the current reflection
  const dismissReflection = () => {
    setActiveReflection(null);
  };
  
  // Manually trigger a reflection (useful for testing or special cases)
  const manualTrigger = (type, context = {}) => {
    if (disableGoldenNuggets) return;
    
    const reflection = triggerGoldenNugget(type, context);
    if (reflection) {
      setActiveReflection(reflection);
      setReflectionHistory(prev => {
        const newHistory = [reflection, ...prev];
        return newHistory.slice(0, MAX_HISTORY_LENGTH);
      });
    }
  };
  
  // Create the context value
  const contextValue = {
    activeReflection,
    triggerContradiction: nuggetDetectors.detectContradiction,
    triggerStability: nuggetDetectors.detectStability,
    triggerBreakthrough: nuggetDetectors.detectBreakthrough,
    triggerGrowth: nuggetDetectors.detectGrowth,
    manualTrigger,
    dismissReflection,
    disableGoldenNuggets,
    toggleGoldenNuggets,
    reflectionCount: reflectionHistory.length,
    reflectionHistory
  };
  
  // Wait for a sound effect to load
  const [soundEffect, setSoundEffect] = useState(null);
  
  useEffect(() => {
    if (activeReflection?.soundEffect) {
      // Create audio element for the sound effect
      const audio = new Audio(`/assets/sounds/${activeReflection.soundEffect}`);
      audio.volume = 0.3; // Subtle sound
      setSoundEffect(audio);
      
      // Play when loaded
      audio.addEventListener('canplaythrough', () => {
        audio.play().catch(err => console.log('Sound playback prevented:', err));
      });
      
      return () => {
        audio.pause();
        setSoundEffect(null);
      };
    }
  }, [activeReflection]);
  
  // Reference for the message element
  const messageRef = useRef(null);
  
  // Calculate combined styles for the active reflection
  const combinedStyles = activeReflection
    ? { ...baseReflectionStyles, ...activeReflection.overlayStyle }
    : baseReflectionStyles;
  
  // Apply cadence to the message element when a reflection becomes active
  useEffect(() => {
    if (activeReflection && messageRef.current && activeReflection.cadencedText && activeReflection.timing) {
      // Apply cadence to the DOM element
      applyCadenceToElement(
        messageRef.current, 
        activeReflection.cadencedText, 
        activeReflection.timing
      );
    }
  }, [activeReflection]);
  
  return (
    <GoldenNuggetContext.Provider value={contextValue}>
      {children}
      
      {/* Overlay for displaying Golden Nugget reflections */}
      {activeReflection && (
        <div 
          className="golden-nugget-overlay"
          style={overlayStyles}
          onClick={dismissReflection}
        >
          <div 
            className={`golden-nugget-content ${activeReflection.animation}`}
            style={combinedStyles}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              ref={messageRef}
              className={`golden-nugget-message ${activeReflection.cadencePattern || ''}`}
            >
              {activeReflection.cadencedText?.rawHtml ? (
                <div dangerouslySetInnerHTML={{ __html: activeReflection.cadencedText.rawHtml }} />
              ) : (
                activeReflection.message
              )}
            </div>
            
            {/* Optional persona badge */}
            <div 
              className="golden-nugget-persona-badge"
              style={{
                position: 'absolute',
                bottom: '0.5rem',
                right: '0.5rem',
                fontSize: '0.75rem',
                opacity: 0.7,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(0,0,0,0.2)'
              }}
            >
              {activeReflection.persona}
            </div>
            
            {/* Close button */}
            <button
              className="golden-nugget-close"
              onClick={dismissReflection}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                fontSize: '1.25rem',
                cursor: 'pointer',
                opacity: 0.6
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </GoldenNuggetContext.Provider>
  );
};

// Hook for triggering Golden Nugget reflections from ψ-field systems
export function usePsiFieldNuggetTriggers() {
  const { 
    triggerContradiction, 
    triggerStability, 
    triggerBreakthrough, 
    disableGoldenNuggets 
  } = useGoldenNugget();
  
  return {
    onContradiction: (trace, lyapunovValue) => {
      if (!disableGoldenNuggets) {
        triggerContradiction(trace, lyapunovValue);
      }
    },
    
    onStability: (psiField, stability) => {
      if (!disableGoldenNuggets) {
        triggerStability(psiField, stability);
      }
    },
    
    onBreakthrough: (conceptField, insightMetric) => {
      if (!disableGoldenNuggets) {
        triggerBreakthrough(conceptField, insightMetric);
      }
    }
  };
}

// Utility component for dev/testing - triggers reflections on demand
export const GoldenNuggetDebugPanel = () => {
  const { 
    manualTrigger,
    disableGoldenNuggets,
    toggleGoldenNuggets,
    reflectionCount,
    activeReflection
  } = useGoldenNugget();
  
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        background: 'rgba(0,0,0,0.8)',
        padding: '1rem',
        borderRadius: '0.5rem',
        color: 'white',
        zIndex: 1000
      }}
    >
      <h3>Golden Nugget Debug</h3>
      <div>
        <label>
          <input 
            type="checkbox" 
            checked={!disableGoldenNuggets} 
            onChange={toggleGoldenNuggets} 
          /> 
          Enabled
        </label>
      </div>
      <div>Reflections: {reflectionCount}</div>
      <div>Active: {activeReflection ? activeReflection.triggerType : 'None'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
        {Object.values(NuggetTriggerType).map(type => (
          <button 
            key={type} 
            onClick={() => manualTrigger(type)}
            style={{
              padding: '0.25rem 0.5rem',
              background: '#444',
              border: 'none',
              borderRadius: '0.25rem',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
};
