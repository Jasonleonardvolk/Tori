import React, { useState, useEffect } from 'react';
import ConceptFieldCanvas from '../ConceptFieldCanvas';
import './LyapunovPredictabilityPanel.css';

/**
 * LyapunovPredictabilityPanel Component
 * 
 * This component displays a visualization of concept predictability based on
 * Lyapunov exponent analysis. It shows which concepts are more chaotic/creative
 * versus predictable/formulaic within a document or codebase.
 */
const LyapunovPredictabilityPanel = () => {
  const [conceptData, setConceptData] = useState({
    nodes: [],
    edges: []
  });
  const [activeDocument, setActiveDocument] = useState('elfin.pdf');
  const [chaosProfile, setChaosProfile] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch concept data with predictability scores
  useEffect(() => {
    const fetchConceptData = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, this would fetch from an API
        // For demo purposes, we're creating sample data with predictability scores
        const demoData = generateDemoData();
        setConceptData(demoData);
        
        // Generate a sample chaos profile
        const profile = Array.from({ length: 30 }, () => Math.random());
        setChaosProfile(profile);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch concept data:', error);
        setIsLoading(false);
      }
    };
    
    fetchConceptData();
  }, [activeDocument]);
  
  // Generate demo data with predictability scores
  const generateDemoData = () => {
    const nodes = [
      { id: 'concept_1', label: 'Koopman Operator', phase: 0.2, predictability_score: 0.8, usage: 1.2 },
      { id: 'concept_2', label: 'Oscillator Network', phase: 0.4, predictability_score: 0.3, usage: 0.8 },
      { id: 'concept_3', label: 'Spectral Analysis', phase: 0.6, predictability_score: 0.7, usage: 1.0 },
      { id: 'concept_4', label: 'Concept Graph', phase: 0.8, predictability_score: 0.5, usage: 0.9 },
      { id: 'concept_5', label: 'Phase Synchrony', phase: 0.1, predictability_score: 0.2, usage: 1.1 },
      { id: 'concept_6', label: 'Resonance Score', phase: 0.5, predictability_score: 0.6, usage: 0.7 },
      { id: 'concept_7', label: 'Lyapunov Stability', phase: 0.7, predictability_score: 0.9, usage: 1.3 },
    ];
    
    const edges = [
      { id: 'edge_1', source: 'concept_1', target: 'concept_3', weight: 0.7 },
      { id: 'edge_2', source: 'concept_1', target: 'concept_7', weight: 0.9 },
      { id: 'edge_3', source: 'concept_2', target: 'concept_5', weight: 0.8 },
      { id: 'edge_4', source: 'concept_3', target: 'concept_4', weight: 0.5 },
      { id: 'edge_5', source: 'concept_5', target: 'concept_6', weight: 0.6 },
      { id: 'edge_6', source: 'concept_7', target: 'concept_2', weight: 0.7 },
      { id: 'edge_7', source: 'concept_4', target: 'concept_6', weight: 0.4 },
    ];
    
    return { nodes, edges };
  };
  
  // Change active document
  const handleDocumentChange = (documentName) => {
    setActiveDocument(documentName);
  };
  
  // Render chaos profile chart
  const renderChaosProfile = () => {
    const maxHeight = 100;
    const barWidth = 10;
    const gap = 2;
    const width = chaosProfile.length * (barWidth + gap);
    
    return (
      <svg width={width} height={maxHeight} className="chaos-profile-chart">
        {chaosProfile.map((value, index) => (
          <rect
            key={index}
            x={index * (barWidth + gap)}
            y={maxHeight - (value * maxHeight)}
            width={barWidth}
            height={value * maxHeight}
            fill={value > 0.7 ? '#FF5500' : value < 0.3 ? '#00AAFF' : '#00FFCC'}
            className="chaos-bar"
          />
        ))}
      </svg>
    );
  };
  
  return (
    <div className="lyapunov-predictability-panel">
      <div className="panel-header">
        <h2>Concept Predictability Analysis</h2>
        <p className="panel-description">
          Visualize which concepts follow predictable patterns (blue) versus 
          which are used in chaotic/creative ways (orange) based on Lyapunov exponent analysis.
        </p>
        
        <div className="document-selector">
          <label>Analyzing document: </label>
          <select 
            value={activeDocument}
            onChange={(e) => handleDocumentChange(e.target.value)}
          >
            <option value="elfin.pdf">elfin.pdf - ALAN 2.x Architecture</option>
            <option value="koopman.pdf">koopman.pdf - Koopman Operators</option>
            <option value="lyapunov.pdf">lyapunov.pdf - Dynamical Systems</option>
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="loading-indicator">Loading concept data...</div>
      ) : (
        <div className="visualization-container">
          <div className="concept-field-container">
            <h3>Concept Field with Predictability</h3>
            <ConceptFieldCanvas 
              width={700} 
              height={500} 
              // Override the API endpoint with local data
              apiEndpoint={{
                fetch: () => new Promise(resolve => resolve(conceptData))
              }}
            />
          </div>
          
          <div className="chaos-profile-container">
            <h3>Document Chaos Profile</h3>
            <p>Shows how predictability varies throughout the document:</p>
            {renderChaosProfile()}
            <div className="profile-legend">
              <div className="legend-item">
                <span className="legend-color chaotic"></span>
                <span>Chaotic/Creative Sections</span>
              </div>
              <div className="legend-item">
                <span className="legend-color neutral"></span>
                <span>Neutral Sections</span>
              </div>
              <div className="legend-item">
                <span className="legend-color predictable"></span>
                <span>Predictable/Formulaic Sections</span>
              </div>
            </div>
          </div>
          
          <div className="analysis-summary">
            <h3>Lyapunov Analysis Summary</h3>
            <p>
              The document "<strong>{activeDocument}</strong>" shows a mix of predictable and chaotic concept usage.
              The most predictable concept is "<strong>Lyapunov Stability</strong>" (90% predictable),
              while "<strong>Phase Synchrony</strong>" exhibits the most creative/chaotic usage (20% predictable).
            </p>
            <p>
              This analysis helps identify which parts of the document introduce novel ideas versus
              which parts follow established patterns.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LyapunovPredictabilityPanel;
