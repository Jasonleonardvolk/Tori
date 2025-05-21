import React, { useState, useEffect, useRef } from 'react';
import './SemanticSearchPanel.css';
import dynamicalSystemsService from '../../services/dynamicalSystemsService';

/**
 * SemanticSearchPanel Component
 * 
 * This component implements the UI for Story 5.1: Semantic Search by Resonance,
 * Koopman Mode, and Geometry. It provides a visualization of the resonance-based
 * search process along with controls for searching and viewing results.
 * 
 * Features:
 * - Energy landscape visualization showing how queries "roll" into concept basins
 * - Radar-like visualization showing resonance strength between query and results
 * - Query input with options for different search methods
 * - Result display with confidence indicators and explanations
 */
const SemanticSearchPanel = () => {
  // State for search query and results
  const [query, setQuery] = useState('');
  const [queryState, setQueryState] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMethod, setSearchMethod] = useState('resonance'); // 'resonance' or 'spectral'
  const [visualizationType, setVisualizationType] = useState('landscape'); // 'landscape' or 'radar'
  // Refs for visualizations
  const landscapeCanvasRef = useRef(null);
  const radarCanvasRef = useRef(null);
  // Animation state
  const [animationProgress, setAnimationProgress] = useState(0);
  const animationRef = useRef(null);
  const [animationRunning, setAnimationRunning] = useState(false);
  // Initialize dynamical systems service with random attractors
  useEffect(() => {
    // Initialize with 20 random attractors (concepts) for demo
    dynamicalSystemsService.initRandomAttractors(20);
  }, []);
  // ... (rest of unchanged code)
  // PATCH: Add dependency array to animation effect
  useEffect(() => {
    if (!animationRunning) return;
    let startTime;
    const duration = 2000;
    // ... (rest of animation logic)
  }, [animationRunning]);
  return (
    <div className="semantic-search-panel">
      <div className="search-controls">
        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter semantic search query..."
            disabled={isSearching}
          />
          <button 
            className="search-button"
            onClick={() => {
              if (query.trim()) {
                setIsSearching(true);
                setAnimationRunning(true);
                // Simulated search delay
                setTimeout(() => {
                  setIsSearching(false);
                }, 2000);
              }
            }}
            disabled={isSearching || !query.trim()}
          >
            Search
          </button>
        </div>
        
        <div className="search-options">
          <div className="search-method-selector">
            <label>Search Method:</label>
            <div className="toggle-options">
              <button 
                className={`toggle-option ${searchMethod === 'resonance' ? 'active' : ''}`}
                onClick={() => setSearchMethod('resonance')}
              >
                Resonance
              </button>
              <button 
                className={`toggle-option ${searchMethod === 'spectral' ? 'active' : ''}`}
                onClick={() => setSearchMethod('spectral')}
              >
                Spectral
              </button>
            </div>
          </div>
          
          <div className="visualization-selector">
            <label>Visualization:</label>
            <div className="toggle-options">
              <button 
                className={`toggle-option ${visualizationType === 'landscape' ? 'active' : ''}`}
                onClick={() => setVisualizationType('landscape')}
              >
                Landscape
              </button>
              <button 
                className={`toggle-option ${visualizationType === 'radar' ? 'active' : ''}`}
                onClick={() => setVisualizationType('radar')}
              >
                Radar
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="visualization-container">
        {visualizationType === 'landscape' ? (
          <div className="landscape-visualization">
            <canvas 
              ref={landscapeCanvasRef}
              className="landscape-canvas"
              width={600}
              height={400}
            />
            <div className="landscape-overlay">
              {isSearching && (
                <div className="search-progress">
                  <div className="progress-indicator">
                    <div className="progress-animation" style={{width: `${animationProgress * 100}%`}}></div>
                  </div>
                  <div className="progress-label">
                    Analyzing semantic resonance... {Math.round(animationProgress * 100)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="radar-visualization">
            <canvas 
              ref={radarCanvasRef}
              className="radar-canvas"
              width={500}
              height={500}
            />
          </div>
        )}
      </div>
      
      <div className="search-results-container">
        <h3>Search Results</h3>
        
        {isSearching ? (
          <div className="loading-results">Searching...</div>
        ) : searchResults.length === 0 ? (
          query ? (
            <div className="no-results">No results found for your query</div>
          ) : (
            <div className="no-query">Enter a query to search the knowledge space</div>
          )
        ) : (
          <div className="results-list">
            {searchResults.map((result, index) => (
              <div key={index} className="result-item">
                <div className="result-header">
                  <span className="result-title">{result.title}</span>
                  <span className="result-confidence">
                    {result.confidence}% match
                  </span>
                </div>
                <div className="result-content">{result.content}</div>
                <div className="result-explanation">{result.explanation}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SemanticSearchPanel;
