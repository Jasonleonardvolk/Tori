import React, { useState, useEffect } from 'react';
import SemanticCommitPanel from '../SemanticCommitPanel/SemanticCommitPanel';
import './SemanticCommitDemo.css';

/**
 * Demo component to showcase the Semantic Commit functionality
 * in the context of AI agent suggestions
 */
const SemanticCommitDemo = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [newInfo, setNewInfo] = useState('');
  const [specifications, setSpecifications] = useState([]);
  
  // Sample intent specification for a JavaScript project
  const sampleCodeRules = [
    "Use async/await instead of promises with .then() chains for better readability.",
    "All components should be functional components using React hooks, not class components.",
    "Error handling should use try/catch blocks with specific error types when possible.",
    "For state management, use React Context for global state and useState for component-local state.",
    "Prefer arrow functions for component definitions and event handlers.",
    "Always destructure props in function parameters for cleaner code.",
    "Use the SCSS module pattern for component styling, with one SCSS file per component.",
    "Variable and function names should use camelCase, component names should use PascalCase.",
    "Always include PropTypes for all component props.",
    "Use the Container/Presenter pattern for complex components with business logic.",
    "Write unit tests for all utility functions using Jest.",
    "Use React Testing Library for component tests, focusing on user interactions.",
    "UI components should be fully responsive, using CSS Grid and Flexbox.",
    "Prefer functional programming approaches like map, filter, and reduce over imperative loops.",
    "Code should be formatted according to the project's Prettier configuration.",
    "Import statements should be organized by: npm packages, then project files, then styles.",
    "Always handle loading and error states in components that fetch data.",
    "Use the useCallback hook for functions passed as props to prevent unnecessary renders.",
    "Keep components small and focused on a single responsibility.",
    "Comments should explain why, not what. Code should be self-documenting."
  ];
  
  // Potential conflicts to demonstrate in the UI
  const potentialConflicts = [
    "Use class components for complex state management, as they're easier to debug.",
    "For styling, use a global CSS file to maintain consistent design across the application.",
    "Promises with .then() chains provide better error tracking for complex async operations.",
    "Use Redux for all state management to ensure predictable state updates."
  ];

  useEffect(() => {
    // Initialize the specification with sample rules
    setSpecifications(sampleCodeRules);
  }, []);

  const handleOpenPanel = (conflictInfo) => {
    setNewInfo(conflictInfo);
    setShowPanel(true);
  };

  const handleClosePanel = () => {
    setShowPanel(false);
    setNewInfo('');
  };

  const handleResolveConflicts = (updatedSpecifications) => {
    setSpecifications(updatedSpecifications);
    setShowPanel(false);
    setNewInfo('');
  };

  const handleAddNewRule = () => {
    handleOpenPanel('');
  };

  return (
    <div className="semantic-commit-demo">
      <div className="demo-header">
        <h2>Semantic Commit Demo</h2>
        <p>
          Showing how intent specification updates can be managed with semantic conflict detection
          based on the research paper.
        </p>
      </div>
      
      <div className="demo-main">
        <div className="demo-sidebar">
          <div className="rules-header">
            <h3>Project Rules</h3>
            <button className="add-rule-button" onClick={handleAddNewRule}>
              <span className="icon">+</span>
              Add Rule
            </button>
          </div>
          
          <div className="rules-list">
            {specifications.map((rule, index) => (
              <div key={index} className="rule-item">
                {rule}
              </div>
            ))}
          </div>
        </div>
        
        <div className="demo-content">
          <div className="conflict-examples">
            <h3>Try These Conflict Examples</h3>
            <p>Click on any of the statements below to see how the system detects and handles conflicts:</p>
            
            <div className="conflict-examples-list">
              {potentialConflicts.map((conflict, index) => (
                <div 
                  key={index} 
                  className="conflict-example" 
                  onClick={() => handleOpenPanel(conflict)}
                >
                  <div className="conflict-badge">Potential Conflict</div>
                  <div className="conflict-text">{conflict}</div>
                  <div className="conflict-action">Try It</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="feature-explainer">
            <h3>How It Works</h3>
            <div className="feature-sections">
              <div className="feature-section">
                <div className="feature-icon">🔍</div>
                <div className="feature-info">
                  <h4>Impact Analysis</h4>
                  <p>See how new information might affect existing rules before making changes.</p>
                </div>
              </div>
              
              <div className="feature-section">
                <div className="feature-icon">🌐</div>
                <div className="feature-info">
                  <h4>Concept Graph</h4>
                  <p>Visualize how concepts are connected and how changes ripple through the system.</p>
                </div>
              </div>
              
              <div className="feature-section">
                <div className="feature-icon">🧠</div>
                <div className="feature-info">
                  <h4>Conflict Detection</h4>
                  <p>Automatically identify direct conflicts and ambiguous issues with detailed explanations.</p>
                </div>
              </div>
              
              <div className="feature-section">
                <div className="feature-icon">✅</div>
                <div className="feature-info">
                  <h4>Smart Resolution</h4>
                  <p>Choose from multiple resolution strategies with previews of the changes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showPanel && (
        <div className="panel-overlay">
          <div className="panel-container">
            <SemanticCommitPanel 
              specId="codeRules"
              initialStatements={specifications}
              newInformation={newInfo}
              onResolve={handleResolveConflicts}
              onCancel={handleClosePanel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SemanticCommitDemo;
