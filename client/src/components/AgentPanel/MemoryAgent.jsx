import React, { useState, useEffect } from 'react';
import './AgentPanel.css';

/**
 * MemoryAgent Component
 * 
 * Shows historical morphs, attractor patterns, and analogies from project memory.
 * Offers reuse suggestions based on previous code patterns.
 */
const MemoryAgent = ({ mode }) => {
  // State for memory items
  const [memoryItems, setMemoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load memory items on mount and when mode changes
  useEffect(() => {
    const loadMemoryItems = async () => {
      setLoading(true);
      
      // In a real implementation, this would fetch from an actual service
      // const data = await scholarSphereService.getProjectMemory(mode);
      
      // For demo, use mock data
      setTimeout(() => {
        const mockMemoryItems = [
          {
            id: 'memory-1',
            title: 'Field Recall: Similar morph in `graphql_router`',
            type: 'morph-memory',
            description: 'A similar pattern was modified last month in the GraphQL router module, which might provide a useful reference.',
            relevance: 0.87,
            metrics: {
              date: '2025-04-06',
              entropy: -0.21,
              attractorBasin: 'query-filtering'
            },
            preview: `
// Previous morph in GraphQL router (April 6, 2025)
function sanitizeGraphQLFilters(filters, schema) {
  // Similar sanitization logic to what you're working on
  return filters.map(filter => ({
    ...filter,
    value: sanitizeFilterValue(filter.value, schema[filter.field])
  }));
}

// The entropy was reduced by 0.21 after applying this pattern.
            `,
            actions: [
              { id: 'replay', label: 'Replay morph', primary: true },
              { id: 'view', label: 'View details', primary: false },
              { id: 'dismiss', label: 'Dismiss', primary: false }
            ]
          },
          {
            id: 'memory-2',
            title: 'Attractor Pattern: "auth-validation" basin',
            type: 'attractor-memory',
            description: 'Your current code modifications are approaching the "auth-validation" attractor basin, which has a stable pattern in the codebase.',
            relevance: 0.92,
            metrics: {
              stability: 'high',
              firstSeen: '2025-02-12',
              instances: 8
            },
            preview: `
// The "auth-validation" attractor basin contains 8 functions
// with a characteristic pattern of validation followed by transformation.
// Example:
function validateAccessToken(token, options) {
  // 1. Null check (pattern)
  if (!token) return { valid: false, reason: 'missing-token' };
  
  // 2. Structure validation (pattern)
  if (!isValidTokenFormat(token)) return { valid: false, reason: 'malformed' };
  
  // 3. Cryptographic verification (pattern)
  const verified = verifyTokenSignature(token, options.publicKey);
  if (!verified) return { valid: false, reason: 'invalid-signature' };
  
  // 4. Return in standardized format (pattern)
  return { valid: true, payload: decodeToken(token) };
}
            `,
            actions: [
              { id: 'apply', label: 'Apply pattern', primary: true },
              { id: 'view', label: 'View basin', primary: false },
              { id: 'dismiss', label: 'Dismiss', primary: false }
            ]
          }
        ];
        
        setMemoryItems(mockMemoryItems);
        setLoading(false);
      }, 1000);
    };
    
    loadMemoryItems();
  }, [mode]);
  
  // Handle memory action
  const handleAction = (itemId, actionId) => {
    console.log(`Executing action ${actionId} on memory item ${itemId}`);
    
    // In a real implementation, this would call the memory service
    // await scholarSphereService.executeMemoryAction(itemId, actionId);
    
    // For demo, just remove the item if dismissed
    if (actionId === 'dismiss') {
      setMemoryItems(prev => prev.filter(item => item.id !== itemId));
    }
  };
  
  // Get CSS class and icon based on memory type
  const getMemoryTypeInfo = (type) => {
    switch (type) {
      case 'morph-memory':
        return { icon: '🔄', label: 'Past Morph' };
      case 'attractor-memory':
        return { icon: '🧲', label: 'Attractor' };
      case 'analogy-memory':
        return { icon: '🔗', label: 'Analogy' };
      default:
        return { icon: '🧠', label: 'Memory' };
    }
  };
  
  if (loading) {
    return <div className="agent-loading">Searching project memory...</div>;
  }
  
  if (memoryItems.length === 0) {
    return (
      <div className="agent-empty-state">
        <div className="agent-empty-icon">🧬</div>
        <h3>No Relevant Memory Items</h3>
        <p>
          {mode === 'passive' 
            ? 'Select code to find similar patterns in project memory.'
            : 'Continuously monitoring for relevant patterns from project history.'}
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <h3>Field Memory Recall</h3>
      
      {memoryItems.map(item => {
        const typeInfo = getMemoryTypeInfo(item.type);
        
        return (
          <div key={item.id} className="agent-suggestion memory-item">
            <div className="agent-suggestion-header">
              <div>
                <h4 className="agent-suggestion-title">
                  <span style={{ marginRight: '8px' }}>{typeInfo.icon}</span>
                  {item.title}
                </h4>
                <div className="agent-suggestion-subtitle">
                  <span className="agent-suggestion-tag">{typeInfo.label}</span>
                  <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                    Relevance: {(item.relevance * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="agent-suggestion-description">
              {item.description}
            </div>
            
            <pre className="agent-suggestion-code">
              {item.preview}
            </pre>
            
            <div className="agent-suggestion-metrics">
              {item.metrics.date && (
                <div className="agent-suggestion-metric">
                  <span>Date:</span>
                  <span>{item.metrics.date}</span>
                </div>
              )}
              
              {item.metrics.entropy !== undefined && (
                <div className="agent-suggestion-metric">
                  <span>Entropy change:</span>
                  <span>{item.metrics.entropy > 0 ? '+' : ''}{item.metrics.entropy.toFixed(2)}</span>
                </div>
              )}
              
              {item.metrics.attractorBasin && (
                <div className="agent-suggestion-metric">
                  <span>Attractor basin:</span>
                  <span>{item.metrics.attractorBasin}</span>
                </div>
              )}
              
              {item.metrics.stability && (
                <div className="agent-suggestion-metric">
                  <span>Stability:</span>
                  <span>{item.metrics.stability}</span>
                </div>
              )}
              
              {item.metrics.firstSeen && (
                <div className="agent-suggestion-metric">
                  <span>First seen:</span>
                  <span>{item.metrics.firstSeen}</span>
                </div>
              )}
              
              {item.metrics.instances && (
                <div className="agent-suggestion-metric">
                  <span>Instances:</span>
                  <span>{item.metrics.instances}</span>
                </div>
              )}
            </div>
            
            <div className="agent-suggestion-actions">
              {item.actions.map(action => (
                <button
                  key={action.id}
                  className={`agent-action-button ${
                    action.primary ? 'agent-action-primary' : 'agent-action-secondary'
                  }`}
                  onClick={() => handleAction(item.id, action.id)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      
      {mode === 'active' && (
        <div className="agent-info-message">
          <p>
            <strong>Active Mode:</strong> Memory Agent is continuously scanning your work
            and comparing it to historical patterns in the project memory.
          </p>
        </div>
      )}
    </div>
  );
};

export default MemoryAgent;
