import React from 'react';
import './ConceptFieldCanvas.css';

/**
 * EdgeConnection Component
 * 
 * Represents a connection (edge) between two concept nodes.
 * Visualizes the coupling strength and can show phase coupling.
 */
const EdgeConnection = ({ edge, nodes, showWeight = true }) => {
  const { id, source, target, weight } = edge;
  
  // Find the source and target nodes
  const sourceNode = nodes.find(node => node.id === source);
  const targetNode = nodes.find(node => node.id === target);
  
  // If either node is missing, don't render the edge
  if (!sourceNode || !targetNode) {
    return null;
  }
  
  // Calculate line coordinates
  const x1 = sourceNode.x;
  const y1 = sourceNode.y;
  const x2 = targetNode.x;
  const y2 = targetNode.y;
  
  // Calculate line length for arrow positioning (not currently used but may be needed for future enhancements)
  // const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  
  // Calculate line style based on weight
  const minWidth = 1;
  const maxWidth = 6;
  const lineWidth = minWidth + (weight * (maxWidth - minWidth));
  
  // Calculate color based on phase alignment
  // If phases are similar, edge is white/blue, if different, it's more yellow/orange
  const phaseDiff = Math.abs(sourceNode.phase - targetNode.phase);
  const normalizedDiff = Math.min(phaseDiff, 1 - phaseDiff); // Normalize to 0-0.5 range (circle)
  
  // Create a color gradient based on phase alignment
  const alignedColor = 'rgba(100, 210, 255, 0.8)'; // Blue for aligned phases
  const misalignedColor = 'rgba(255, 180, 0, 0.7)'; // Orange/yellow for misaligned
  
  // Get node sizes to adjust connection endpoints
  const sourceSize = 20 + (sourceNode.resonance * 20);
  const targetSize = 20 + (targetNode.resonance * 20);
  
  // Adjust line endpoints to stop at node boundaries
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  
  // Calculate adjusted start and end points
  const startX = x1 + Math.cos(angle) * (sourceSize / 2);
  const startY = y1 + Math.sin(angle) * (sourceSize / 2);
  const endX = x2 - Math.cos(angle) * (targetSize / 2);
  const endY = y2 - Math.sin(angle) * (targetSize / 2);
  
  // If showing phase coupling, visualize with animated gradient
  const animatedGradient = normalizedDiff < 0.1; // Animate only well-aligned connections
  
  // Style for the line container
  const containerStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0, // Ensure edges are below nodes
  };
  
  // Style for the SVG line
  const lineStyle = {
    stroke: normalizedDiff < 0.25 ? alignedColor : misalignedColor,
    strokeWidth: showWeight ? lineWidth : 2,
    strokeLinecap: 'round',
    strokeDasharray: normalizedDiff > 0.4 ? '5,5' : 'none', // Dashed for very misaligned
    filter: animatedGradient ? 'url(#glow)' : 'none',
  };
  
  return (
    <div className="edge-connection" style={containerStyle}>
      <svg width="100%" height="100%" style={{ position: 'absolute' }}>
        {/* Define filters for edge effects */}
        <defs>
          {/* Glow effect for aligned edges */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          {/* Animated gradient for phase-aligned edges */}
          {animatedGradient && (
            <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(100, 210, 255, 0.2)">
                <animate 
                  attributeName="offset" 
                  values="0;1;0"
                  dur="3s" 
                  repeatCount="indefinite" 
                />
              </stop>
              <stop offset="20%" stopColor="rgba(100, 210, 255, 0.8)">
                <animate 
                  attributeName="offset" 
                  values="0.2;1.2;0.2"
                  dur="3s" 
                  repeatCount="indefinite" 
                />
              </stop>
              <stop offset="40%" stopColor="rgba(100, 210, 255, 0.2)">
                <animate 
                  attributeName="offset" 
                  values="0.4;1.4;0.4"
                  dur="3s" 
                  repeatCount="indefinite" 
                />
              </stop>
            </linearGradient>
          )}
        </defs>
        
        {/* The edge line */}
        <line 
          x1={startX} 
          y1={startY} 
          x2={endX} 
          y2={endY} 
          style={lineStyle}
          stroke={animatedGradient ? `url(#grad-${id})` : lineStyle.stroke}
        />
        
        {/* Direction marker (arrow) for directed edges */}
        {edge.directed && (
          <polygon 
            points={`0,-3 6,0 0,3`}
            transform={`translate(${endX}, ${endY}) rotate(${angle * 180 / Math.PI})`}
            fill={lineStyle.stroke}
          />
        )}
        
        {/* Optional weight indicator */}
        {showWeight && weight > 0.6 && (
          <text 
            x={(startX + endX) / 2} 
            y={(startY + endY) / 2 - 5}
            fill="white"
            fontSize="10"
            textAnchor="middle"
            style={{ 
              filter: 'drop-shadow(0 0 1px black)',
              pointerEvents: 'none'
            }}
          >
            {(weight * 100).toFixed(0)}%
          </text>
        )}
      </svg>
    </div>
  );
};

export default EdgeConnection;
