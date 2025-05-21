import React, { useState, useEffect, useRef } from "react";
import QuickActionItem from "./QuickActionItem";
import "./QuickActionsBar.css";

// Helper to render icon from string or JSX
const renderIcon = (icon) => {
  if (typeof icon === 'string') {
    return <span role="img" aria-label="Agent Icon">{icon}</span>;
  }
  return icon;
};

export default function QuickActionsBar({ 
  suggestions = [], 
  onOpenPanel,
  onApply: applyHandler,
  onDismiss: dismissHandler,
  reducedAnimations = false,
  onSuggestionSelect
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
  const [newSuggestions, setNewSuggestions] = useState(new Set());
  const previousSuggestionsRef = useRef([]);
  const suggestionsCountRef = useRef(suggestions.length);

  // Track new suggestions by comparing with previous suggestions
  useEffect(() => {
    const currentIds = new Set(suggestions.map(s => s.id));
    const previousIds = new Set(previousSuggestionsRef.current.map(s => s.id));
    
    // Find new suggestions (present in current but not in previous)
    const newIds = new Set();
    currentIds.forEach(id => {
      if (!previousIds.has(id)) {
        newIds.add(id);
      }
    });
    
    // Add animation flag if number of suggestions increases
    if (suggestions.length > suggestionsCountRef.current) {
      setNewSuggestions(newIds);
      
      // Clear new status after animation duration
      const animationTimeout = setTimeout(() => {
        setNewSuggestions(new Set());
      }, 3000); // slightly longer than animation duration
      
      return () => clearTimeout(animationTimeout);
    }
    
    // Update refs for next comparison
    previousSuggestionsRef.current = [...suggestions];
    suggestionsCountRef.current = suggestions.length;
  }, [suggestions]);

  // Check if user prefers reduced motion
  const prefersReducedMotion = 
    reducedAnimations || 
    (typeof window !== 'undefined' && window.matchMedia && 
     window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const handleApply = (suggestion) => {
    // Use the suggestion's onApply if available, otherwise use the passed handler
    if (suggestion.onApply) {
      suggestion.onApply();
    } else if (applyHandler) {
      applyHandler(suggestion);
    }
  };

  const handleDismiss = (suggestion) => {
    if (dismissHandler) {
      dismissHandler(suggestion);
    }
  };

  // Simplified view when collapsed - show as a horizontal bar
  if (!isExpanded) {
    return (
      <div className="quick-actions-bar">
        <div className="quick-actions-header">
          <div className="quick-actions-title" onClick={() => setIsExpanded(true)}>
            <span className="icon">💡</span>
            <span>Agent Suggestions ({suggestions.length})</span>
          </div>
          <div className="header-actions">
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
              isNew={newSuggestions.has(suggestion.id)}
              onApply={() => handleApply(suggestion)}
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Expanded view with details
  return (
    <div className="quick-actions-bar expanded">
      <div className="quick-actions-header">
        <div className="quick-actions-title">
          <span className="icon">💡</span>
          <span>Agent Suggestions ({suggestions.length})</span>
        </div>
        <div className="header-actions">
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
            className={`suggestion-item ${newSuggestions.has(suggestion.id) && !prefersReducedMotion ? 'new-suggestion' : ''}`}
            style={{ borderLeftColor: suggestion.color }}
            onMouseEnter={() => setHoveredSuggestion(suggestion)}
            onMouseLeave={() => setHoveredSuggestion(null)}
            onClick={() => onSuggestionSelect && onSuggestionSelect(suggestion)}
          >
            <div 
              className={`suggestion-icon ${newSuggestions.has(suggestion.id) && !prefersReducedMotion ? 'new' : ''}`} 
              style={{ backgroundColor: suggestion.color }}
            >
              {renderIcon(suggestion.icon)}
            </div>
            <div className="suggestion-content">
              <div className="suggestion-label">{suggestion.label}</div>
              
              {/* Show impact metrics with animation */}
              {suggestion.impact && (
                <div className={`impact-indicator ${!prefersReducedMotion ? 'animate-impact' : ''}`}>
                  <small style={{ color: "#aaa" }}>Impact:</small>
                  <div className={`impact-value ${suggestion.impact.type}`}>
                    {suggestion.impact.oldValue && (
                      <span className="impact-old-value">
                        {typeof suggestion.impact.oldValue === 'number'
                          ? `${suggestion.impact.oldValue}${suggestion.impact.unit || ''}`
                          : suggestion.impact.oldValue}
                      </span>
                    )}
                    <span className="impact-new-value">
                      {typeof suggestion.impact.newValue === 'number'
                        ? `${suggestion.impact.newValue}${suggestion.impact.unit || ''}`
                        : suggestion.impact.newValue}
                    </span>
                  </div>
                </div>
              )}
              
              {hoveredSuggestion === suggestion && (
                <div className="suggestion-explanation">{suggestion.explanation}</div>
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
