import React, { useState, useEffect } from 'react';
import './AgentPanel.css';

/**
 * DebugAgent Component
 * 
 * Shows debugging alerts, warnings, and suggestions.
 * Detects phase turbulence, Koopman mode decay, and entropy spikes.
 */
const DebugAgent = ({ mode }) => {
  // State for debug alerts and warnings
  const [debugItems, setDebugItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load debug data on mount and when mode changes
  useEffect(() => {
    const loadDebugData = async () => {
      setLoading(true);
      
      // In a real implementation, this would fetch from an actual service
      // const data = await debugService.getAlerts(mode);
      
      // For demo, use mock data
      setTimeout(() => {
        const mockDebugItems = [
          {
            id: 'debug-1',
            title: 'Phase drift detected in `format_query`',
            severity: 'alert', // alert, warning, info
            description: 'Koopman Mode 4 divergence, entropy spike of +0.28 detected after recent changes.',
            details: 'The format_query function phase is drifting from its expected attractor basin, causing potential instability in related functions.',
            metrics: {
              koopmanMode: 4,
              entropyChange: 0.28,
              confidence: 0.92
            },
            suggestedFix: {
              description: 'Morph `sanitize_input()` with ε = 0.2 to realign phases.',
              actions: [
                { id: 'morph', label: 'Apply morph', primary: true },
                { id: 'view', label: 'View details', primary: false },
                { id: 'dismiss', label: 'Dismiss', primary: false }
              ]
            },
            location: {
              file: 'src/utils/query.js',
              line: 42
            }
          },
          {
            id: 'debug-2',
            title: 'Potential unchecked null reference',
            severity: 'warning',
            description: 'Phase analysis shows possible execution path where result could be null.',
            details: 'The function might return null in certain conditions, but callers do not check for this possibility, leading to potential runtime errors.',
            metrics: {
              koopmanMode: 2,
              phasePattern: 'divergent',
              confidence: 0.78
            },
            suggestedFix: {
              description: 'Add null check before accessing properties on result object.',
              code: `
// Current pattern:
const data = result.data;

// Suggested fix:
const data = result && result.data;
              `,
              actions: [
                { id: 'fix', label: 'Add null check', primary: true },
                { id: 'view', label: 'View details', primary: false },
                { id: 'dismiss', label: 'Dismiss', primary: false }
              ]
            },
            location: {
              file: 'src/components/DataView.jsx',
              line: 78
            }
          }
        ];
        
        setDebugItems(mockDebugItems);
        setLoading(false);
      }, 1000);
    };
    
    loadDebugData();
  }, [mode]);
  
  // Handle debug action
  const handleAction = (itemId, actionId) => {
    console.log(`Executing action ${actionId} on debug item ${itemId}`);
    
    // In a real implementation, this would call the debug service
    // await debugService.executeAction(itemId, actionId);
    
    // For demo, just remove the item if dismissed
    if (actionId === 'dismiss') {
      setDebugItems(prev => prev.filter(item => item.id !== itemId));
    }
  };
  
  // Get CSS class based on severity
  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'alert': return 'debug-alert';
      case 'warning': return 'debug-warning';
      case 'info': return 'debug-info';
      default: return '';
    }
  };
  
  // Get icon based on severity
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'alert': return '⚠️';
      case 'warning': return '⚙️';
      case 'info': return 'ℹ️';
      default: return '🔍';
    }
  };
  
  if (loading) {
    return <div className="agent-loading">Scanning for anomalies...</div>;
  }
  
  if (debugItems.length === 0) {
    return (
      <div className="agent-empty-state">
        <div className="agent-empty-icon">✅</div>
        <h3>No Issues Detected</h3>
        <p>
          {mode === 'passive' 
            ? 'Debug agent is in passive mode. Manually select code to analyze.'
            : 'Continuously monitoring for phase turbulence and spectral anomalies.'}
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <h3>Debug Alerts & Warnings</h3>
      
      {debugItems.map(item => (
        <div 
          key={item.id} 
          className={`agent-suggestion ${getSeverityClass(item.severity)}`}
        >
          <div className="agent-suggestion-header">
            <div>
              <h4 className="agent-suggestion-title">
                <span style={{ marginRight: '8px' }}>{getSeverityIcon(item.severity)}</span>
                {item.title}
              </h4>
              <div className="agent-suggestion-subtitle">
                <span className="agent-suggestion-tag">{item.severity}</span>
                <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                  {item.location.file}:{item.location.line}
                </span>
              </div>
            </div>
          </div>
          
          <div className="agent-suggestion-description">
            {item.description}
          </div>
          
          <div className="agent-suggestion-details" style={{ marginTop: '8px', fontSize: '0.9em' }}>
            {item.details}
          </div>
          
          {item.suggestedFix.code && (
            <pre className="agent-suggestion-code">{item.suggestedFix.code}</pre>
          )}
          
          <div className="agent-suggestion-metrics">
            {item.metrics.koopmanMode !== undefined && (
              <div className="agent-suggestion-metric">
                <span>Koopman Mode:</span>
                <span>{item.metrics.koopmanMode}</span>
              </div>
            )}
            
            {item.metrics.entropyChange !== undefined && (
              <div className="agent-suggestion-metric">
                <span>Entropy change:</span>
                <span>{item.metrics.entropyChange > 0 ? '+' : ''}{item.metrics.entropyChange.toFixed(2)}</span>
              </div>
            )}
            
            {item.metrics.phasePattern !== undefined && (
              <div className="agent-suggestion-metric">
                <span>Phase pattern:</span>
                <span>{item.metrics.phasePattern}</span>
              </div>
            )}
            
            <div className="agent-suggestion-metric">
              <span>Confidence:</span>
              <span>{(item.metrics.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
          
          <div className="agent-suggestion-fix" style={{ marginTop: '12px' }}>
            <div style={{ fontWeight: '500' }}>Suggested fix:</div>
            <div>{item.suggestedFix.description}</div>
          </div>
          
          <div className="agent-suggestion-actions">
            {item.suggestedFix.actions.map(action => (
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
      ))}
      
      {mode === 'active' && (
        <div className="agent-info-message">
          <p>
            <strong>Active Mode:</strong> Debug Agent is continuously monitoring for phase
            turbulence, mode decay, and entropy spikes across the codebase.
          </p>
        </div>
      )}
    </div>
  );
};

export default DebugAgent;
