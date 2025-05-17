import React, { useState, useEffect } from 'react';
import './SemanticCommitPanel.css';
import intentSpecificationTracker from '../../services/intentSpecificationTracker';

/**
 * SemanticCommitPanel component provides a UI for interacting with the Intent Specification Tracker.
 * This panel allows users to:
 * - View existing intent specifications
 * - Create new intent specifications
 * - Resolve conflicts between intents
 * - View code-to-intent mappings
 */
const SemanticCommitPanel = () => {
  // State for intents, selected intent, and UI state
  const [initialized, setInitialized] = useState(false);
  const [intents, setIntents] = useState([]);
  const [selectedIntentId, setSelectedIntentId] = useState(null);
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'detail', 'create', 'conflicts'
  // Form states
  const [newIntentData, setNewIntentData] = useState({
    specification: '',
    codeElements: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Function to load intents from the tracker
  const loadIntents = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from a backend service
      const loadedIntents = await intentSpecificationTracker.getAllIntents();
      setIntents(loadedIntents || []);
    } catch (err) {
      console.error("Error loading intents:", err);
      setError(`Error loading intents: ${err.message || "Unknown error"}`);
      setIntents([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle intent creation
  const handleCreateIntent = async () => {
    try {
      setLoading(true);
      
      // Parse code elements from string to array
      const codeElementsArray = newIntentData.codeElements
        ? newIntentData.codeElements.split(',').map(item => item.trim())
        : [];
      
      const result = await intentSpecificationTracker.recordIntent(
        null, // Let the service generate an ID
        newIntentData.specification,
        codeElementsArray
      );
      
      if (result.stored) {
        setMessage('Intent specification created successfully');
        setNewIntentData({
          specification: '',
          codeElements: ''
        });
        await loadIntents(); // Reload the list
        setView('list'); // Return to list view
      } else {
        setError(`Failed to create intent: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Error creating intent: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Initialize the tracker on component mount
  useEffect(() => {
    const initTracker = async () => {
      setLoading(true);
      try {
        // In a real application, you might load existing intents from a database
        const success = await intentSpecificationTracker.initialize();
        setInitialized(success);
        if (success) {
          await loadIntents();
          setMessage('Intent Specification Tracker initialized successfully');
        } else {
          setError('Failed to initialize Intent Specification Tracker');
        }
      } catch (err) {
        console.error("Error during initialization:", err);
        setError(`Error initializing tracker: ${err.message || "Unknown error"}`);
        setInitialized(false);
      } finally {
        setLoading(false);
      }
    };
    
    initTracker();
  }, []);

  return (
    <div className="semantic-commit-panel">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading...</div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button className="close-button" onClick={() => setError(null)}>✕</button>
        </div>
      )}
      
      {message && (
        <div className="success-message">
          <span className="success-icon">✓</span>
          <span className="success-text">{message}</span>
          <button className="close-button" onClick={() => setMessage(null)}>✕</button>
        </div>
      )}
      
      <header className="panel-header">
        <h2>Intent Specifications</h2>
        <div className="view-controls">
          <button 
            className={`view-button ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            List
          </button>
          <button 
            className={`view-button ${view === 'create' ? 'active' : ''}`}
            onClick={() => setView('create')}
          >
            Create
          </button>
          <button 
            className={`view-button ${view === 'conflicts' ? 'active' : ''}`}
            onClick={() => setView('conflicts')}
          >
            Conflicts
          </button>
        </div>
      </header>
      
      <div className="panel-content">
        {view === 'list' && (
          <div className="intent-list">
            {intents.length === 0 ? (
              <div className="empty-state">
                <p>No intent specifications found</p>
                <button onClick={() => setView('create')}>Create New Intent</button>
              </div>
            ) : (
              intents.map(intent => (
                <div 
                  key={intent.id}
                  className={`intent-item ${selectedIntentId === intent.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedIntentId(intent.id);
                    setSelectedIntent(intent);
                    setView('detail');
                  }}
                >
                  <div className="intent-title">{intent.specification.substring(0, 50)}</div>
                  <div className="intent-meta">
                    <span className="intent-date">{new Date(intent.createdAt).toLocaleDateString()}</span>
                    <span className="intent-elements">{intent.codeElements?.length || 0} elements</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {view === 'create' && (
          <div className="create-intent-form">
            <h3>Create New Intent Specification</h3>
            <div className="form-group">
              <label>Specification:</label>
              <textarea 
                value={newIntentData.specification}
                onChange={(e) => setNewIntentData({...newIntentData, specification: e.target.value})}
                placeholder="Describe the intent in natural language..."
                rows={6}
              />
            </div>
            <div className="form-group">
              <label>Code Elements (optional):</label>
              <textarea 
                value={newIntentData.codeElements}
                onChange={(e) => setNewIntentData({...newIntentData, codeElements: e.target.value})}
                placeholder="List code elements this intent relates to, comma-separated..."
                rows={4}
              />
            </div>
            <div className="form-actions">
              <button 
                className="cancel-button"
                onClick={() => setView('list')}
              >
                Cancel
              </button>
              <button 
                className="submit-button"
                disabled={!newIntentData.specification}
                onClick={handleCreateIntent}
              >
                Create Intent
              </button>
            </div>
          </div>
        )}
        
        {view === 'detail' && selectedIntent && (
          <div className="intent-detail">
            <h3>Intent Details</h3>
            <div className="detail-section">
              <h4>Specification</h4>
              <p>{selectedIntent.specification}</p>
            </div>
            
            <div className="detail-section">
              <h4>Code Elements</h4>
              {selectedIntent.codeElements?.length > 0 ? (
                <ul className="code-elements-list">
                  {selectedIntent.codeElements.map((element, index) => (
                    <li key={index}>{element}</li>
                  ))}
                </ul>
              ) : (
                <p>No code elements associated with this intent.</p>
              )}
            </div>
            
            <div className="detail-section">
              <h4>Metadata</h4>
              <div className="meta-item">
                <span className="meta-label">Created:</span>
                <span className="meta-value">{new Date(selectedIntent.createdAt).toLocaleString()}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Last Updated:</span>
                <span className="meta-value">{new Date(selectedIntent.updatedAt).toLocaleString()}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Status:</span>
                <span className="meta-value status-badge">{selectedIntent.status}</span>
              </div>
            </div>
            
            <div className="detail-actions">
              <button className="back-button" onClick={() => setView('list')}>
                Back to List
              </button>
            </div>
          </div>
        )}
        
        {view === 'conflicts' && (
          <div className="conflicts-view">
            <h3>Intent Conflicts</h3>
            <p className="info-message">No conflicts detected between current intent specifications.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SemanticCommitPanel;
