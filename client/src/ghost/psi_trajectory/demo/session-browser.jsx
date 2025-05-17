import React, { useState, useEffect, useRef } from 'react';
import { PsiTrajectory } from '../index';

/**
 * Session Browser Component
 * 
 * This component displays a list of recorded ψ-Trajectory sessions and allows
 * the user to select, filter, and view detailed metadata for each session.
 */
export const SessionBrowser = ({ psi, onSessionSelect }) => {
  // Session state
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering and sorting state
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Metadata state
  const [metadata, setMetadata] = useState(null);
  
  // Refs
  const timelineCanvasRef = useRef(null);
  
  // Load sessions on component mount
  useEffect(() => {
    if (!psi) return;
    
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, this would call into the PsiTrajectory
        // API to get a list of available sessions.
        // For this demo, we'll mock it with some sample data
        
        const mockSessions = [
          {
            id: 'session-1652321456',
            name: 'Engine Test Run 1',
            date: new Date(2025, 4, 10, 14, 30, 0),
            frames: 12345,
            duration: 205.75, // seconds
            size: 25.4, // MB
            tags: ['engine', 'test', 'high-rpm'],
          },
          {
            id: 'session-1652400123',
            name: 'Vehicle Idle Sequence',
            date: new Date(2025, 4, 11, 9, 15, 0),
            frames: 8765,
            duration: 146.08, // seconds
            size: 18.2, // MB
            tags: ['engine', 'idle', 'baseline'],
          },
          {
            id: 'session-1652487654',
            name: 'Acceleration Pattern 1',
            date: new Date(2025, 4, 12, 11, 45, 0),
            frames: 15432,
            duration: 257.2, // seconds
            size: 32.7, // MB
            tags: ['acceleration', 'performance', 'test'],
          },
          {
            id: 'session-1652574321',
            name: 'Braking Test Sequence',
            date: new Date(2025, 4, 13, 16, 20, 0),
            frames: 9876,
            duration: 164.6, // seconds
            size: 21.5, // MB
            tags: ['braking', 'test', 'safety'],
          },
          {
            id: 'session-1652660000',
            name: 'Full Drive Cycle',
            date: new Date(2025, 4, 14, 10, 0, 0),
            frames: 28765,
            duration: 479.4, // seconds
            size: 64.3, // MB
            tags: ['drive-cycle', 'complete', 'certification'],
          },
        ];
        
        setSessions(mockSessions);
        setIsLoading(false);
        
        // Auto-select the most recent session
        if (mockSessions.length > 0) {
          selectSession(mockSessions[0]);
        }
      } catch (err) {
        console.error('Failed to load sessions:', err);
        setError(`Failed to load sessions: ${err.message}`);
        setIsLoading(false);
      }
    };
    
    loadSessions();
  }, [psi]);
  
  // Format duration as MM:SS.ms
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  // Format date as YYYY-MM-DD HH:MM
  const formatDate = (date) => {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };
  
  // Format file size as MB or KB
  const formatSize = (sizeMB) => {
    if (sizeMB >= 1) {
      return `${sizeMB.toFixed(1)} MB`;
    } else {
      return `${(sizeMB * 1024).toFixed(0)} KB`;
    }
  };
  
  // Select a session
  const selectSession = (session) => {
    setSelectedSession(session);
    
    // In a real implementation, this would fetch detailed metadata
    // about the session from the PsiTrajectory API.
    // For this demo, we'll mock it with some sample data
    
    const mockMetadata = {
      ...session,
      frameRate: 60,
      oscillatorCount: 32,
      emotionDimensions: 8,
      compressionRatio: 7.4,
      keyframes: 205,
      recordedBy: 'System Operator',
      description: 'Standard test sequence for system validation.',
      landmarks: [
        { name: 'Start', frame: 0, time: 0 },
        { name: 'Initial Oscillation', frame: 1243, time: 20.72 },
        { name: 'Peak Activity', frame: 6789, time: 113.15 },
        { name: 'Pattern Match', frame: 9876, time: 164.6 },
        { name: 'End', frame: session.frames - 1, time: session.duration },
      ],
      patterns: [
        { frame: 2345, name: 'engineRPM', confidence: 0.92, time: 39.08 },
        { frame: 5678, name: 'acceleration', confidence: 0.85, time: 94.63 },
        { frame: 9012, name: 'wheelDiameter', confidence: 0.91, time: 150.2 },
        { frame: 11345, name: 'voltage', confidence: 0.88, time: 189.08 },
      ],
    };
    
    setMetadata(mockMetadata);
    
    // Notify parent component
    if (onSessionSelect) {
      onSessionSelect(session);
    }
    
    // Draw timeline visualization
    setTimeout(() => {
      drawTimelineVisualization(mockMetadata);
    }, 0);
  };
  
  // Filter sessions based on search term
  const filteredSessions = sessions.filter(session => {
    if (!filter) return true;
    
    const searchTerm = filter.toLowerCase();
    return (
      session.name.toLowerCase().includes(searchTerm) ||
      session.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  });
  
  // Sort sessions based on sort criteria
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = a.date - b.date;
        break;
      case 'duration':
        comparison = a.duration - b.duration;
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  // Draw timeline visualization
  const drawTimelineVisualization = (metadata) => {
    const canvas = timelineCanvasRef.current;
    if (!canvas || !metadata) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    
    // Draw waveform-like visualization
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Generate a pseudo-waveform based on session id (for demo purposes)
    // In a real implementation, this would be actual oscillator data
    const seed = parseInt(metadata.id.slice(-8), 16);
    const generateY = (x, seed) => {
      return height / 2 + Math.sin(x * 0.01 + seed * 0.001) * (height * 0.3) + 
             Math.sin(x * 0.05 + seed * 0.002) * (height * 0.1);
    };
    
    // Draw the waveform path
    ctx.moveTo(0, generateY(0, seed));
    for (let x = 1; x < width; x++) {
      ctx.lineTo(x, generateY(x, seed));
    }
    ctx.stroke();
    
    // Draw keyframe markers
    const keyframeDensity = metadata.keyframes / metadata.frames;
    const approximateKeyframes = Math.min(100, metadata.keyframes); // Limit for performance
    
    ctx.fillStyle = 'rgba(255, 152, 0, 0.7)';
    for (let i = 0; i < approximateKeyframes; i++) {
      const x = (i / approximateKeyframes) * width;
      ctx.beginPath();
      ctx.arc(x, height - 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw pattern markers
    ctx.fillStyle = 'rgba(76, 175, 80, 0.7)';
    metadata.patterns.forEach(pattern => {
      const x = (pattern.frame / metadata.frames) * width;
      ctx.beginPath();
      ctx.arc(x, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw pattern label
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.fillText(pattern.name, x + 8, 14);
      ctx.fillStyle = 'rgba(76, 175, 80, 0.7)';
    });
    
    // Draw landmark markers
    ctx.fillStyle = 'rgba(233, 30, 99, 0.7)';
    metadata.landmarks.forEach(landmark => {
      const x = (landmark.frame / metadata.frames) * width;
      const y = height / 2;
      
      // Draw line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.strokeStyle = 'rgba(233, 30, 99, 0.3)';
      ctx.stroke();
      
      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  };
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  return (
    <div className="session-browser">
      <h2>Session Browser</h2>
      
      <div className="session-browser-container">
        <div className="session-list-panel">
          <div className="session-list-controls">
            <input 
              type="text" 
              placeholder="Search sessions..." 
              value={filter} 
              onChange={e => setFilter(e.target.value)}
              className="search-input"
            />
            
            <div className="sort-controls">
              <label>Sort by:</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="duration">Duration</option>
                <option value="size">Size</option>
              </select>
              
              <button 
                className={`sort-order-button ${sortOrder === 'desc' ? 'sort-desc' : 'sort-asc'}`}
                onClick={toggleSortOrder}
                title={sortOrder === 'desc' ? 'Descending order' : 'Ascending order'}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="loading-indicator">Loading sessions...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : sortedSessions.length === 0 ? (
            <div className="empty-message">
              {filter ? 'No sessions match your search' : 'No sessions available'}
            </div>
          ) : (
            <ul className="session-list">
              {sortedSessions.map(session => (
                <li 
                  key={session.id} 
                  className={`session-item ${selectedSession?.id === session.id ? 'selected' : ''}`}
                  onClick={() => selectSession(session)}
                >
                  <div className="session-item-header">
                    <span className="session-name">{session.name}</span>
                    <span className="session-date">{formatDate(session.date)}</span>
                  </div>
                  
                  <div className="session-item-meta">
                    <span className="session-duration">{formatDuration(session.duration)}</span>
                    <span className="session-size">{formatSize(session.size)}</span>
                  </div>
                  
                  <div className="session-item-tags">
                    {session.tags.map(tag => (
                      <span key={tag} className="session-tag">{tag}</span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="session-details-panel">
          {metadata ? (
            <>
              <div className="metadata-panel">
                <h3>{metadata.name}</h3>
                
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-label">Recorded:</span>
                    <span className="metadata-value">{formatDate(metadata.date)}</span>
                  </div>
                  
                  <div className="metadata-item">
                    <span className="metadata-label">Duration:</span>
                    <span className="metadata-value">{formatDuration(metadata.duration)}</span>
                  </div>
                  
                  <div className="metadata-item">
                    <span className="metadata-label">Frames:</span>
                    <span className="metadata-value">{metadata.frames.toLocaleString()}</span>
                  </div>
                  
                  <div className="metadata-item">
                    <span className="metadata-label">Frame Rate:</span>
                    <span className="metadata-value">{metadata.frameRate} fps</span>
                  </div>
                  
                  <div className="metadata-item">
                    <span className="metadata-label">Size:</span>
                    <span className="metadata-value">{formatSize(metadata.size)}</span>
                  </div>
                  
                  <div className="metadata-item">
                    <span className="metadata-label">Compression:</span>
                    <span className="metadata-value">{metadata.compressionRatio.toFixed(1)}:1</span>
                  </div>
                  
                  <div className="metadata-item">
                    <span className="metadata-label">Oscillators:</span>
                    <span className="metadata-value">{metadata.oscillatorCount}</span>
                  </div>
                  
                  <div className="metadata-item">
                    <span className="metadata-label">Emotion Dimensions:</span>
                    <span className="metadata-value">{metadata.emotionDimensions}</span>
                  </div>
                  
                  <div className="metadata-item">
                    <span className="metadata-label">Keyframes:</span>
                    <span className="metadata-value">{metadata.keyframes}</span>
                  </div>
                  
                  <div className="metadata-item">
                    <span className="metadata-label">Recorded By:</span>
                    <span className="metadata-value">{metadata.recordedBy}</span>
                  </div>
                </div>
                
                <div className="metadata-description">
                  <span className="metadata-label">Description:</span>
                  <p>{metadata.description}</p>
                </div>
                
                <div className="metadata-tags">
                  <span className="metadata-label">Tags:</span>
                  <div className="tag-container">
                    {metadata.tags.map(tag => (
                      <span key={tag} className="session-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="timeline-panel">
                <h4>Timeline</h4>
                <div className="timeline-canvas-container">
                  <canvas 
                    ref={timelineCanvasRef} 
                    width={600} 
                    height={120}
                    className="timeline-canvas"
                  />
                  
                  <div className="timeline-legend">
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: 'rgba(76, 175, 80, 0.7)' }}></span>
                      <span className="legend-label">Patterns</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: 'rgba(233, 30, 99, 0.7)' }}></span>
                      <span className="legend-label">Landmarks</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: 'rgba(255, 152, 0, 0.7)' }}></span>
                      <span className="legend-label">Keyframes</span>
                    </div>
                  </div>
                </div>
                
                <div className="timeline-markers">
                  <h4>Patterns</h4>
                  <ul className="marker-list">
                    {metadata.patterns.map(pattern => (
                      <li key={pattern.frame} className="marker-item pattern-marker">
                        <span className="marker-name">{pattern.name}</span>
                        <span className="marker-time">{formatDuration(pattern.time)}</span>
                        <span className="marker-confidence">
                          Confidence: {(pattern.confidence * 100).toFixed(0)}%
                          {pattern.confidence >= 0.9 && 
                            <span className="verified-badge" title="ELFIN Verified">✅</span>
                          }
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="timeline-markers">
                  <h4>Landmarks</h4>
                  <ul className="marker-list">
                    {metadata.landmarks.map(landmark => (
                      <li key={landmark.frame} className="marker-item landmark-marker">
                        <span className="marker-name">{landmark.name}</span>
                        <span className="marker-time">{formatDuration(landmark.time)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="session-actions">
                <button className="action-button play-button">
                  <span className="button-icon">▶</span> Play
                </button>
                <button className="action-button export-button">
                  <span className="button-icon">↗</span> Export
                </button>
                <button className="action-button analyze-button">
                  <span className="button-icon">📊</span> Analyze
                </button>
              </div>
            </>
          ) : (
            <div className="no-selection-message">
              {isLoading ? 'Loading sessions...' : 'Select a session to view details'}
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .session-browser {
          font-family: Arial, sans-serif;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        h2 {
          margin-top: 0;
          color: #333;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
        }
        
        .session-browser-container {
          display: flex;
          gap: 20px;
          margin-top: 20px;
        }
        
        .session-list-panel {
          flex: 1;
          max-width: 400px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 15px;
          display: flex;
          flex-direction: column;
        }
        
        .session-list-controls {
          margin-bottom: 15px;
        }
        
        .search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          margin-bottom: 10px;
        }
        
        .sort-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .sort-controls label {
          font-size: 14px;
          color: #666;
        }
        
        .sort-controls select {
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          background-color: white;
        }
        
        .sort-order-button {
          width: 30px;
          height: 30px;
          border: 1px solid #ddd;
          background-color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .sort-order-button:hover {
          background-color: #f0f0f0;
        }
        
        .session-list {
          list-style: none;
          padding: 0;
          margin: 0;
          overflow-y: auto;
          flex: 1;
        }
        
        .session-item {
          padding: 12px 15px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .session-item:last-child {
          border-bottom: none;
        }
        
        .session-item:hover {
          background-color: #f5f5f5;
        }
        
        .session-item.selected {
          background-color: #e3f2fd;
          border-left: 4px solid #2196F3;
        }
        
        .session-item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        
        .session-name {
          font-weight: bold;
          color: #333;
        }
        
        .session-date {
          font-size: 12px;
          color: #666;
        }
        
        .session-item-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
          color: #666;
        }
        
        .session-item-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        
        .session-tag {
          font-size: 11px;
          background-color: #e0e0e0;
          color: #333;
          padding: 2px 6px;
          border-radius: 10px;
        }
        
        .loading-indicator, .error-message, .empty-message, .no-selection-message {
          padding: 20px;
          text-align: center;
          color: #666;
          font-style: italic;
        }
        
        .error-message {
          color: #f44336;
        }
        
        .session-details-panel {
          flex: 2;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .metadata-panel h3 {
          margin-top: 0;
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        
        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .metadata-item {
          display: flex;
          flex-direction: column;
        }
        
        .metadata-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 3px;
        }
        
        .metadata-value {
          font-size: 14px;
          color: #333;
          font-weight: bold;
        }
        
        .metadata-description p {
          margin: 5px 0 0 0;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .metadata-tags {
          margin-top: 15px;
        }
        
        .tag-container {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 5px;
        }
        
        .timeline-panel {
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
        
        .timeline-panel h4 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #333;
        }
        
        .timeline-canvas-container {
          position: relative;
          margin-bottom: 20px;
        }
        
        .timeline-canvas {
          width: 100%;
          height: 120px;
          border: 1px solid #eee;
          border-radius: 4px;
        }
        
        .timeline-legend {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 5px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .timeline-markers {
          margin-top: 15px;
        }
        
        .marker-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .marker-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background-color: #f5f5f5;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .pattern-marker {
          border-left: 3px solid rgba(76, 175, 80, 0.7);
        }
        
        .landmark-marker {
          border-left: 3px solid rgba(233, 30, 99, 0.7);
        }
        
        .marker-name {
          font-weight: bold;
        }
        
        .marker-time {
          color: #666;
        }
        
        .marker-confidence {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .verified-badge {
          font-size: 16px;
          cursor: help;
        }
        
        .session-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        
        .action-button {
          padding: 8px 16px;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s;
        }
        
        .play-button {
          background-color: #4CAF50;
          color: white;
          border-color: #4CAF50;
        }
        
        .play-button:hover {
          background-color: #43A047;
        }
        
        .export-button {
          background-color: #2196F3;
          color: white;
          border-color: #2196F3;
        }
        
        .export-button:hover {
          background-color: #1E88E5;
        }
        
        .analyze-button:hover {
          background-color: #f5f5f5;
        }
        
        .button-icon {
          font-size: 16px;
        }
        
        @media (max-width: 768px) {
          .session-browser-container {
            flex-direction: column;
          }
          
          .session-list-panel {
            max-width: none;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default SessionBrowser;
