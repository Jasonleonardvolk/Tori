import React, { useState, useEffect } from "react";
import QuickActionItem from "./QuickActionItem";
import "./QuickActionsBar.css";
import affectiveAgentSuggestionsService from "../../services/affectiveAgentSuggestionsService";

/**
 * Enhanced QuickActionsBar component that incorporates affective computing principles
 * 
 * Key enhancements:
 * 1. Displays confidence scores using fuzzy logic system
 * 2. Shows hierarchical categorization (immediate, tactical, strategic)
 * 3. Includes causal explanations with causes, effects, and alternatives
 * 4. Adapts UI based on developer state (focus, frustration, exploration)
 * 5. Provides interaction data to the affective agent service
 */

// Helper to render icon from string or JSX
const renderIcon = (icon) => {
  if (typeof icon === 'string') {
    return <span role="img" aria-label="Agent Icon">{icon}</span>;
  }
  return icon;
};

// Confidence visualizer component
const ConfidenceVisualizer = ({ confidence }) => {
  // Thresholds for confidence levels
  const highConfidence = 0.8;
  const mediumConfidence = 0.5;
  
  // Determine color based on confidence level
  let color = "#10b981"; // Green for high confidence
  if (confidence < mediumConfidence) {
    color = "#f59e0b"; // Orange for low confidence
  } else if (confidence < highConfidence) {
    color = "#6366f1"; // Indigo for medium confidence
  }
  
  return (
    <div className="confidence-visualizer" title={`Confidence: ${Math.round(confidence * 100)}%`}>
      <div className="confidence-bar-container">
        <div 
          className="confidence-bar" 
          style={{ 
            width: `${confidence * 100}%`,
            backgroundColor: color
          }}
        />
      </div>
      <span className="confidence-label">{Math.round(confidence * 100)}%</span>
    </div>
  );
};

// Hierarchical level badge component
const HierarchyBadge = ({ level }) => {
  // Determine style based on hierarchy level
  let style = {
    backgroundColor: "#6366f1", // Default indigo for tactical
    color: "white"
  };
  
  if (level === "immediate") {
    style.backgroundColor = "#10b981"; // Green for immediate
  } else if (level === "strategic") {
    style.backgroundColor = "#8b5cf6"; // Purple for strategic
  }
  
  // Capitalize first letter for display
  const displayText = level.charAt(0).toUpperCase() + level.slice(1);
  
  return (
    <span className="hierarchy-badge" style={style} title={`${displayText} suggestion`}>
      {displayText}
    </span>
  );
};

// Causal explanation component
const CausalExplanation = ({ explanation }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!explanation) return null;
  
  return (
    <div className="causal-explanation">
      <div 
        className="causal-explanation-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span>Why this matters {expanded ? "▼" : "▶"}</span>
      </div>
      
      {expanded && (
        <div className="causal-explanation-content">
          <div className="explanation-section">
            <h4>Root Cause</h4>
            <p>{explanation.cause.description}</p>
            {explanation.cause.evidence && explanation.cause.evidence.length > 0 && (
              <div className="evidence">
                <strong>Evidence:</strong>
                <ul>
                  {explanation.cause.evidence.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="explanation-section">
            <h4>Benefits</h4>
            <p><strong>Short-term:</strong> {explanation.effect.immediate}</p>
            <p><strong>Long-term:</strong> {explanation.effect.longTerm}</p>
          </div>
          
          {explanation.alternatives && explanation.alternatives.length > 0 && (
            <div className="explanation-section">
              <h4>Alternatives</h4>
              <ul>
                {explanation.alternatives.map((alt, index) => (
                  <li key={index}>
                    <strong>{alt.approach}:</strong> {alt.consequence}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Developer state indicator
const DeveloperStateIndicator = ({ state }) => {
  // Skip rendering if no state is available
  if (!state) return null;
  
  const { focusLevel, frustrationLevel, explorationLevel } = state;
  
  // Determine which state is dominant
  let dominantState = "balanced";
  let dominantLevel = 0.5; // default threshold
  
  if (focusLevel > dominantLevel && focusLevel > frustrationLevel && focusLevel > explorationLevel) {
    dominantState = "focused";
    dominantLevel = focusLevel;
  } else if (frustrationLevel > dominantLevel && frustrationLevel > focusLevel && frustrationLevel > explorationLevel) {
    dominantState = "frustrated";
    dominantLevel = frustrationLevel;
  } else if (explorationLevel > dominantLevel && explorationLevel > focusLevel && explorationLevel > frustrationLevel) {
    dominantState = "exploring";
    dominantLevel = explorationLevel;
  }
  
  const stateIcons = {
    focused: "🧠",
    frustrated: "😓",
    exploring: "🔍",
    balanced: "⚖️"
  };
  
  const stateColors = {
    focused: "#3b82f6", // blue
    frustrated: "#ef4444", // red
    exploring: "#8b5cf6", // purple
    balanced: "#6b7280"  // gray
  };
  
  return (
    <div 
      className="developer-state-indicator"
      title={`Developer State: ${dominantState.charAt(0).toUpperCase() + dominantState.slice(1)} (${Math.round(dominantLevel * 100)}%)`}
      style={{ backgroundColor: stateColors[dominantState] }}
    >
      <span className="state-icon">{stateIcons[dominantState]}</span>
      <span className="state-label">{dominantState}</span>
    </div>
  );
};

export default function AffectiveQuickActionsBar({ 
  onOpenPanel,
  onApply: applyHandler,
  onDismiss: dismissHandler
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [developerState, setDeveloperState] = useState(null);
  const [wsConnection, setWsConnection] = useState(null);
  
  // Set up WebSocket connection and cleanup
  useEffect(() => {
    // Simulated interaction data - in a real implementation this would
    // come from monitoring actual editor interactions
    const simulatedInteractionData = {
      typingSpeed: 0.7, // normalized value (0-1)
      deletionRate: 0.2, // normalized value (0-1)
      pauseDetected: false // whether a significant pause was detected
    };
    
    // Connect to WebSocket and handle developer state updates
    const connection = affectiveAgentSuggestionsService.connectWebSocket(
      // Suggestions callback
      (newSuggestions) => {
        setSuggestions(newSuggestions);
      },
      // Developer state callback
      (newState) => {
        setDeveloperState(newState);
      }
    );
    
    setWsConnection(connection);
    
    // Send simulated interaction data every 5 seconds
    const intervalId = setInterval(() => {
      // Update interaction data with random variations to simulate real typing
      const updatedData = {
        typingSpeed: Math.max(0, Math.min(1, simulatedInteractionData.typingSpeed + (Math.random() * 0.4 - 0.2))),
        deletionRate: Math.max(0, Math.min(1, simulatedInteractionData.deletionRate + (Math.random() * 0.3 - 0.15))),
        pauseDetected: Math.random() > 0.85 // 15% chance of detecting a pause
      };
      
      connection.sendInteractionData(updatedData);
    }, 5000);
    
    // Initial fetch
    affectiveAgentSuggestionsService.fetchSuggestions()
      .then(setSuggestions)
      .catch(error => console.error("Error fetching suggestions:", error));
    
    // Cleanup
    return () => {
      if (connection) {
        connection.disconnect();
      }
      clearInterval(intervalId);
    };
  }, []);
  
  const handleApply = (suggestion) => {
    // Use the suggestion's onApply if available, otherwise use the passed handler
    if (suggestion.onApply) {
      suggestion.onApply();
    } else if (applyHandler) {
      applyHandler(suggestion);
      
      // Call the affective service to track the acceptance
      affectiveAgentSuggestionsService.applySuggestion(suggestion.id)
        .catch(error => console.error("Error applying suggestion:", error));
    }
  };

  const handleDismiss = (suggestion, reason = "unspecified") => {
    if (dismissHandler) {
      dismissHandler(suggestion);
      
      // Call the affective service to track the dismissal
      affectiveAgentSuggestionsService.dismissSuggestion(suggestion.id, reason)
        .catch(error => console.error("Error dismissing suggestion:", error));
    }
  };

  // Simplified view when collapsed - show as a horizontal bar
  if (!isExpanded) {
    return (
      <div 
        className="quick-actions-bar affective"
        style={{
          // Subtle UI adaptation based on developer state - adjust border color
          borderColor: developerState?.frustrationLevel > 0.7 ? '#ef4444' : 
                      (developerState?.focusLevel > 0.7 ? '#3b82f6' : 
                      (developerState?.explorationLevel > 0.7 ? '#8b5cf6' : '#d1d5db'))
        }}
      >
        <div className="quick-actions-header">
          <div className="quick-actions-title" onClick={() => setIsExpanded(true)}>
            <span className="icon">🧠</span>
            <span>Affective Agent Suggestions ({suggestions.length})</span>
          </div>
          <div className="header-actions">
            {developerState && <DeveloperStateIndicator state={developerState} />}
            <button className="view-all-button" onClick={onOpenPanel || (() => alert("Show all suggestions panel"))}>
              View All
            </button>
            <button className="expand-button" onClick={() => setIsExpanded(true)}>
              ▲
            </button>
          </div>
        </div>
        
        <div className="quick-actions-horizontal" style={{ display: "flex", paddingLeft: "16px", paddingBottom: "8px" }}>
          {suggestions.map((suggestion) => (
            <QuickActionItem
              key={suggestion.id}
              {...suggestion}
              onApply={() => handleApply(suggestion)}
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Expanded view with details - includes confidence, hierarchy level, and causal explanations
  return (
    <div 
      className="quick-actions-bar expanded affective"
      style={{
        // Subtle UI adaptation based on developer state - adjust border color
        borderColor: developerState?.frustrationLevel > 0.7 ? '#ef4444' : 
                    (developerState?.focusLevel > 0.7 ? '#3b82f6' : 
                    (developerState?.explorationLevel > 0.7 ? '#8b5cf6' : '#d1d5db'))
      }}
    >
      <div className="quick-actions-header">
        <div className="quick-actions-title">
          <span className="icon">🧠</span>
          <span>Affective Agent Suggestions ({suggestions.length})</span>
        </div>
        <div className="header-actions">
          {developerState && <DeveloperStateIndicator state={developerState} />}
          <button className="view-all-button" onClick={onOpenPanel || (() => alert("Show all suggestions panel"))}>
            View All
          </button>
          <button className="expand-button" onClick={() => setIsExpanded(false)}>
            ▼
          </button>
        </div>
      </div>
      
      <div className="quick-actions-suggestions">
        {suggestions.map((suggestion) => (
          <div 
            key={suggestion.id}
            className="suggestion-item"
            style={{ 
              borderLeftColor: suggestion.color,
              // When focused, make non-immediate suggestions more transparent
              opacity: developerState?.focusLevel > 0.7 && suggestion.hierarchyLevel !== 'immediate' ? 0.7 : 1
            }}
            onMouseEnter={() => setHoveredSuggestion(suggestion)}
            onMouseLeave={() => setHoveredSuggestion(null)}
          >
            <div className="suggestion-metadata">
              <div className="suggestion-icon" style={{ backgroundColor: suggestion.color }}>
                {renderIcon(suggestion.icon)}
              </div>
              
              {/* Show hierarchy level badge */}
              <HierarchyBadge level={suggestion.hierarchyLevel || "tactical"} />
            </div>
            
            <div className="suggestion-content">
              <div className="suggestion-label">{suggestion.label}</div>
              
              {/* Show confidence score */}
              <ConfidenceVisualizer confidence={suggestion.confidence || 0.5} />
              
              {/* Explanation and causal reasoning */}
              {hoveredSuggestion === suggestion && (
                <>
                  <div className="suggestion-explanation">{suggestion.explanation}</div>
                  <CausalExplanation explanation={suggestion.causalExplanation} />
                </>
              )}
            </div>
            
            <div className="suggestion-actions">
              <button 
                className="apply-button"
                onClick={() => handleApply(suggestion)}
              >
                Apply
              </button>
              <button 
                className="dismiss-button"
                onClick={() => handleDismiss(suggestion)}
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
