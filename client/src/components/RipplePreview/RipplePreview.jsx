import React, { useState, useEffect, useRef, useCallback } from 'react';
import './RipplePreview.css';

/**
 * RipplePreview Component
 * 
 * Visualizes the ripple effect of a code change across the codebase.
 * Shows a mini-graph of affected files and components with animated transitions
 * to indicate propagation of changes.
 * 
 * Props:
 * - suggestion: The current suggestion with impact data
 * - affectedNodes: Array of files/components affected by the change
 * - onViewDetails: Handler for when user wants to see detailed impact
 */
const RipplePreview = ({ suggestion, affectedNodes = [], onViewDetails }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const canvasRef = useRef(null);
  
  // Animation timing control (from e-commerce research)
  const animationDuration = 1200; // 1.2 seconds for optimal engagement
  
  // Determine persona-specific styles
  const getPersonaStyles = () => {
    const personas = {
      'Refactorer': {
        primaryColor: '#2563eb',
        secondaryColor: '#93c5fd',
        icon: '🔧',
        rippleSpeed: 0.8 // faster ripples
      },
      'Security': {
        primaryColor: '#dc2626',
        secondaryColor: '#fecaca',
        icon: '🔒',
        rippleSpeed: 1.0 // medium ripples
      },
      'Scholar': {
        primaryColor: '#10b981',
        secondaryColor: '#a7f3d0',
        icon: '📖',
        rippleSpeed: 1.2 // slower, more deliberate ripples
      },
      // Default style if persona not recognized
      'default': {
        primaryColor: '#6366f1',
        secondaryColor: '#c7d2fe',
        icon: '💡',
        rippleSpeed: 1.0
      }
    };
    
    return personas[suggestion?.persona] || personas.default;
  };
  
  const personaStyles = getPersonaStyles();
  // Draw the concept graph visualization
  const drawGraph = useCallback((ctx, width, height) => {
    // Center node (main file being changed)
    const centerX = width / 2;
    const centerY = height / 2;
    const mainNodeRadius = 20;
    
    // Draw center node
    ctx.beginPath();
    ctx.arc(centerX, centerY, mainNodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = personaStyles.primaryColor;
    ctx.fill();
    
    // Draw node label
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(personaStyles.icon, centerX, centerY);
    
    // Position affected nodes in a circle around the center
    const radius = Math.min(width, height) / 3;
    affectedNodes.forEach((node, index) => {
      const angle = (index / affectedNodes.length) * Math.PI * 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      // Draw connection line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = personaStyles.secondaryColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw node
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fillStyle = '#333';
      ctx.fill();
      ctx.strokeStyle = personaStyles.secondaryColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw node label
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Show filename (shortened if needed)
      const fileName = node.fileName.length > 10 
        ? node.fileName.substring(0, 8) + '...' 
        : node.fileName;
      ctx.fillText(fileName, x, y);
    });
  }, [affectedNodes, personaStyles]);
  
  // Animate the ripple effect
  const animateRipple = useCallback((ctx, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2.5;
    
    let currentRadius = 0;
    let startTime = null;
    
    // Animation frame function
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      // Calculate progress (0 to 1)
      const progress = Math.min(elapsed / (animationDuration * personaStyles.rippleSpeed), 1);
      currentRadius = progress * maxRadius;
      
      // Clear only the ripple area
      ctx.clearRect(0, 0, width, height);
      
      // Redraw the graph
      drawGraph(ctx, width, height);
      
      // Draw the ripple
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = personaStyles.primaryColor + '80'; // Add 50% transparency
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Continue animation if not complete
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    // Start the animation
    requestAnimationFrame(animate);
  }, [drawGraph, animationDuration, personaStyles]);
  // Initialize the canvas for drawing the graph and ripples
  useEffect(() => {
    if (!canvasRef.current || !isExpanded) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas.getBoundingClientRect();
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw the ripple graph
    drawGraph(ctx, width, height);
    
    // Start animation if we have nodes to ripple through
    if (affectedNodes.length > 0) {
      animateRipple(ctx, width, height);
    }
  }, [isExpanded, affectedNodes, drawGraph, animateRipple]);
  
  // Node details popover content
  const renderNodeDetails = (node) => {
    if (!node) return null;
    
    return (
      <div className="node-details-popover">
        <h4>{node.fileName}</h4>
        <p><strong>Type:</strong> {node.type}</p>
        <p><strong>Changes:</strong> {node.changeDescription}</p>
        {node.code && (
          <div className="code-preview">
            <pre>{node.code}</pre>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="ripple-preview">
      <div 
        className="ripple-preview-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="ripple-icon" style={{ color: personaStyles.primaryColor }}>
          <span className="ripple-dot"></span>
        </span>
        <h3>Impact Preview</h3>
        <span className="affected-count">
          {affectedNodes.length} file{affectedNodes.length !== 1 ? 's' : ''} affected
        </span>
        <button className="expand-button">
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="ripple-preview-content">
          <div className="graph-container">
            <canvas 
              ref={canvasRef} 
              className="ripple-graph"
              width="400"
              height="300"
            />
            
            {activeNode && renderNodeDetails(activeNode)}
          </div>
          
          <div className="affected-files-list">
            <h4>Affected Files</h4>
            <ul>
              {affectedNodes.map((node, index) => (
                <li 
                  key={index}
                  className={activeNode === node ? 'active' : ''}
                  onClick={() => setActiveNode(node)}
                >
                  <span className="file-icon">{node.icon || '📄'}</span>
                  <span className="file-name">{node.fileName}</span>
                  <span className="change-type" style={{ 
                    backgroundColor: node.changeType === 'major' 
                      ? '#ef4444' 
                      : node.changeType === 'moderate' 
                        ? '#f59e0b' 
                        : '#10b981'
                  }}>
                    {node.changeType}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="ripple-actions">
            <button 
              className="view-details-button"
              onClick={onViewDetails}
              style={{ backgroundColor: personaStyles.primaryColor }}
            >
              View Full Impact Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RipplePreview;
