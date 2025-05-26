import React, { useState } from 'react';
import './QuickActionsPanel.css';

/**
 * QuickActionsPanel Component
 * 
 * Full-featured panel showing all agent suggestions with detailed information,
 * filtering options, and batch operations.
 */
const QuickActionsPanel = ({ isOpen, onClose, suggestions, onApply, onDismiss }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');

  if (!isOpen) return null;

  // Filter suggestions
  const filteredSuggestions = suggestions.filter(suggestion => {
    if (filter === 'all') return true;
    if (filter === 'priority') return suggestion.priority === 'high';
    return suggestion.category === filter;
  });

  // Sort suggestions
  const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'confidence':
        return b.confidence - a.confidence;
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

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

  const getCategoryColor = (category) => {
    switch (category) {
      case 'concept_extraction': return '#8b5cf6';
      case 'refactoring': return '#06b6d4';
      case 'optimization': return '#f59e0b';
      case 'memory': return '#10b981';
      case 'bug_fix': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const applyAllHigh = () => {
    const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');
    highPrioritySuggestions.forEach(suggestion => onApply(suggestion));
  };

  const dismissAll = () => {
    suggestions.forEach(suggestion => onDismiss(suggestion));
  };

  return (
    <div className="quick-actions-panel-overlay">
      <div className="quick-actions-panel">
        {/* Header */}
        <div className="panel-header">
          <div className="header-title">
            <h2>🤖 Agent Suggestions</h2>
            <span className="suggestion-count-badge">
              {filteredSuggestions.length} of {suggestions.length}
            </span>
          </div>
          
          <div className="header-actions">
            <button className="batch-action apply-all" onClick={applyAllHigh}>
              ✓ Apply High Priority
            </button>
            <button className="batch-action dismiss-all" onClick={dismissAll}>
              ✕ Dismiss All
            </button>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="panel-controls">
          <div className="filters">
            <label>Filter:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Suggestions</option>
              <option value="priority">High Priority</option>
              <option value="concept_extraction">Concept Extraction</option>
              <option value="refactoring">Refactoring</option>
              <option value="optimization">Optimization</option>
              <option value="memory">Memory</option>
              <option value="bug_fix">Bug Fix</option>
            </select>
          </div>

          <div className="sorting">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="priority">Priority</option>
              <option value="confidence">Confidence</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        {/* Suggestions List */}
        <div className="suggestions-list">
          {sortedSuggestions.length === 0 ? (
            <div className="no-suggestions">
              <span>🎉</span>
              <h3>No suggestions match your filter</h3>
              <p>Try adjusting your filter settings or check back later for new suggestions.</p>
            </div>
          ) : (
            sortedSuggestions.map((suggestion) => (
              <div 
                key={suggestion.id} 
                className={`suggestion-card priority-${suggestion.priority}`}
                style={{ borderLeftColor: getCategoryColor(suggestion.category) }}
              >
                <div className="card-header">
                  <div className="suggestion-meta">
                    <span className="priority-indicator">
                      {getPriorityIcon(suggestion.priority)}
                    </span>
                    <span className="category-badge" style={{ backgroundColor: getCategoryColor(suggestion.category) }}>
                      {getCategoryIcon(suggestion.category)} {suggestion.category.replace('_', ' ')}
                    </span>
                    <span className="confidence-score">
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </span>
                  </div>

                  <div className="card-actions">
                    <button
                      className="action-button apply"
                      onClick={() => onApply(suggestion)}
                      title="Apply this suggestion"
                    >
                      ✓ Apply
                    </button>
                    <button
                      className="action-button dismiss"
                      onClick={() => onDismiss(suggestion)}
                      title="Dismiss this suggestion"
                    >
                      ✕ Dismiss
                    </button>
                  </div>
                </div>

                <div className="card-content">
                  <h3 className="suggestion-title">{suggestion.title}</h3>
                  <p className="suggestion-description">{suggestion.description}</p>

                  {suggestion.diff && (
                    <div className="code-preview">
                      <div className="diff-section">
                        <div className="diff-before">
                          <h4>Before:</h4>
                          <pre><code>{suggestion.diff.old}</code></pre>
                        </div>
                        <div className="diff-after">
                          <h4>After:</h4>
                          <pre><code>{suggestion.diff.new}</code></pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickActionsPanel;
