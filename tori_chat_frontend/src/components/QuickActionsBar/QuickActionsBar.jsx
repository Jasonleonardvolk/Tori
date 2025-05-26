import React from 'react';
import './QuickActionsBar.css';

/**
 * QuickActionsBar Component
 * 
 * Displays a condensed view of agent suggestions at the bottom of the editor.
 * Provides quick access to apply or dismiss suggestions without opening the full panel.
 */
const QuickActionsBar = ({ suggestions, onOpenPanel, onApply, onDismiss }) => {
  // Don't render if no suggestions
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  // Show only high priority suggestions in the bar
  const prioritySuggestions = suggestions
    .filter(s => s.priority === 'high')
    .slice(0, 3); // Max 3 in the bar

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'concept_extraction': return '🧠';
      case 'refactoring': return '🔧';
      case 'optimization': return '⚡';
      case 'memory': return '💾';
      case 'bug_fix': return '🐛';
      default: return '💡';
    }
  };

  return (
    <div className="quick-actions-bar">
      <div className="bar-header">
        <span className="bar-title">
          {getCategoryIcon('concept_extraction')} Agent Suggestions
        </span>
        <span className="suggestion-count">
          {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bar-suggestions">
        {prioritySuggestions.map((suggestion) => (
          <div key={suggestion.id} className={`suggestion-item priority-${suggestion.priority}`}>
            <div className="suggestion-info">
              <span className="suggestion-icon">
                {getPriorityIcon(suggestion.priority)} {getCategoryIcon(suggestion.category)}
              </span>
              <span className="suggestion-title">{suggestion.title}</span>
              <span className="suggestion-confidence">
                {Math.round(suggestion.confidence * 100)}%
              </span>
            </div>
            
            <div className="suggestion-actions">
              <button
                className="action-button apply"
                onClick={() => onApply(suggestion)}
                title="Apply this suggestion"
              >
                ✓
              </button>
              <button
                className="action-button dismiss"
                onClick={() => onDismiss(suggestion)}
                title="Dismiss this suggestion"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        
        {suggestions.length > prioritySuggestions.length && (
          <button
            className="show-all-button"
            onClick={onOpenPanel}
            title="Show all suggestions"
          >
            +{suggestions.length - prioritySuggestions.length} more
          </button>
        )}
      </div>

      <button
        className="expand-panel-button"
        onClick={onOpenPanel}
        title="Open suggestions panel"
      >
        ⚡ View All
      </button>
    </div>
  );
};

export default QuickActionsBar;
