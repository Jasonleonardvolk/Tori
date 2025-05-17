import React, { useState } from 'react';
import './NavigationDemoApp.css';
import SemanticSearchPanel from './components/SemanticSearchPanel/SemanticSearchPanel';
import ConceptGraphVisualizer from './components/ConceptGraphVisualizer/ConceptGraphVisualizer';
import LyapunovPredictabilityPanel from './components/LyapunovPredictabilityPanel/LyapunovPredictabilityPanel';
import dynamicalSystemsService from './services/dynamicalSystemsService';

/**
 * NavigationDemoApp Component
 * 
 * A demo application showcasing the navigation and search features
 * of the ALAN IDE, including:
 * - Semantic search by resonance
 * - Spectral similarity search
 * - Geometric proximity navigation
 * - Field replay and morph history scrubbing
 */
const NavigationDemoApp = () => {
  // State to track which feature is currently active
  const [activeFeature, setActiveFeature] = useState('semantic-search');
  
  // State for concept graph visualization demo
  const [graphData, setGraphData] = useState({
    nodes: [],
    edges: []
  });
  
  // Initialize demo data when needed
  const initializeConceptGraph = () => {
    // Sample data for concept graph visualization
    const demoGraphData = {
      nodes: [
        { id: 'concept_1', name: 'Authentication', type: 'concept', isImpacted: false },
        { id: 'concept_2', name: 'User Management', type: 'concept', isImpacted: true },
        { id: 'concept_3', name: 'Database', type: 'concept', isImpacted: false },
        { id: 'concept_4', name: 'API Endpoints', type: 'concept', isImpacted: true },
        { id: 'func_1', name: 'validateUser()', type: 'function', isImpacted: false },
        { id: 'func_2', name: 'createSession()', type: 'function', isImpacted: true },
        { id: 'func_3', name: 'queryDatabase()', type: 'function', isImpacted: false },
        { id: 'prop_1', name: 'user.permissions', type: 'property', isImpacted: false },
        { id: 'prop_2', name: 'session.timeout', type: 'property', isImpacted: true }
      ],
      edges: [
        { source: 'concept_1', target: 'func_1', isImpacted: false },
        { source: 'concept_1', target: 'func_2', isImpacted: true },
        { source: 'concept_2', target: 'prop_1', isImpacted: false },
        { source: 'concept_2', target: 'func_1', isImpacted: false },
        { source: 'concept_3', target: 'func_3', isImpacted: false },
        { source: 'func_2', target: 'prop_2', isImpacted: true },
        { source: 'concept_4', target: 'concept_1', isImpacted: true },
        { source: 'concept_4', target: 'concept_3', isImpacted: false }
      ]
    };
    
    setGraphData(demoGraphData);
  };
  
  // Initialize dynamical systems demo
  const initializeDynamicalSystems = () => {
    dynamicalSystemsService.initRandomAttractors(20);
  };
  
  // Handle feature change
  const handleFeatureChange = (feature) => {
    setActiveFeature(feature);
    
    // Initialize data for the selected feature if needed
    if (feature === 'concept-graph' && graphData.nodes.length === 0) {
      initializeConceptGraph();
    }
    
    if (feature === 'semantic-search') {
      initializeDynamicalSystems();
    }
  };
  
  // Render the currently active feature
  const renderActiveFeature = () => {
    switch (activeFeature) {
      case 'semantic-search':
        return <SemanticSearchPanel />;
        
      case 'concept-graph':
        return (
          <div className="demo-section">
            <h2>Geometric Proximity Navigation</h2>
            <p>
              Visualize and navigate the concept space of your codebase.
              Related concepts are positioned closer in the spatial layout.
            </p>
            <ConceptGraphVisualizer 
              graphData={graphData}
              newInfo="New query impact visualization"
              conflicts={[
                {
                  type: 'ambiguous',
                  reason: 'Session management concepts overlap with multiple modules'
                }
              ]}
              onNodeSelect={(node) => console.log('Selected node:', node)}
            />
          </div>
        );
        
      case 'spectral-analysis':
        return (
          <div className="demo-section">
            <h2>Spectral Similarity and Pattern Search</h2>
            <p>
              This feature is under development. It will allow you to search for code
              patterns based on their spectral signatures and dynamical behavior.
            </p>
            <div className="placeholder-content">
              <img 
                src="https://via.placeholder.com/800x400?text=Spectral+Analysis+Visualization" 
                alt="Spectral Analysis Placeholder" 
              />
            </div>
          </div>
        );
        
      case 'field-replay':
        return (
          <div className="demo-section">
            <h2>Field Replay and Morph History Scrubber</h2>
            <p>
              This feature is under development. It will allow you to replay the evolution
              of concept states and track the morphing of concepts over time.
            </p>
            <div className="placeholder-content">
              <img 
                src="https://via.placeholder.com/800x400?text=Field+Replay+Timeline" 
                alt="Field Replay Placeholder" 
              />
            </div>
          </div>
        );
        
      case 'lyapunov-predictability':
        return <LyapunovPredictabilityPanel />;
        
      default:
        return <SemanticSearchPanel />;
    }
  };
  
  return (
    <div className="navigation-demo-app">
      <header className="demo-header">
        <h1>ALAN IDE Navigation & Search Features</h1>
        <p>Explore the non-tokenic semantic engine capabilities</p>
      </header>
      
      <nav className="feature-navigation">
        <button 
          className={`feature-nav-button ${activeFeature === 'semantic-search' ? 'active' : ''}`}
          onClick={() => handleFeatureChange('semantic-search')}
        >
          <span className="feature-icon">🔍</span>
          <span className="feature-label">Semantic Search</span>
        </button>
        
        <button 
          className={`feature-nav-button ${activeFeature === 'concept-graph' ? 'active' : ''}`}
          onClick={() => handleFeatureChange('concept-graph')}
        >
          <span className="feature-icon">🌐</span>
          <span className="feature-label">Concept Graph</span>
        </button>
        
        <button 
          className={`feature-nav-button ${activeFeature === 'spectral-analysis' ? 'active' : ''}`}
          onClick={() => handleFeatureChange('spectral-analysis')}
        >
          <span className="feature-icon">📊</span>
          <span className="feature-label">Spectral Analysis</span>
        </button>
        
        <button 
          className={`feature-nav-button ${activeFeature === 'field-replay' ? 'active' : ''}`}
          onClick={() => handleFeatureChange('field-replay')}
        >
          <span className="feature-icon">⏱️</span>
          <span className="feature-label">Field Replay</span>
        </button>
        
        <button 
          className={`feature-nav-button ${activeFeature === 'lyapunov-predictability' ? 'active' : ''}`}
          onClick={() => handleFeatureChange('lyapunov-predictability')}
        >
          <span className="feature-icon">🔮</span>
          <span className="feature-label">Lyapunov Predictability</span>
        </button>
      </nav>
      
      <main className="feature-content">
        {renderActiveFeature()}
      </main>
      
      <footer className="demo-footer">
        <p>ALAN IDE - Non-Tokenic Semantic Engine Features</p>
        <p>Concepts based on dynamic field resonance, Koopman modes, and geometric navigation</p>
      </footer>
    </div>
  );
};

export default NavigationDemoApp;
