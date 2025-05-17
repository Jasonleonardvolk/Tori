import React from 'react';
import './ConceptFieldCanvas.css';

/**
 * ConceptNode Component
 * 
 * Represents a concept node in the concept field canvas.
 * Shows phase as HSV color and resonance as node size or pulse animation.
 */
const ConceptNode = ({ node, selected, onClick }) => {
  const { id, label, phase, resonance, x, y } = node;
  
  // Calculate node size based on resonance
  const baseSize = 20;
  const size = baseSize + (resonance * 20); // Size between 20-40px based on resonance
  
  // Convert phase (0-1) to HSL color (using hue rotation)
  // We use HSL here rather than HSV because it's directly supported in CSS
  const hue = (phase * 360) % 360;
  const saturation = 80; // Percentage
  const lightness = 50; // Percentage
  
  // Create node style
  const nodeStyle = {
    position: 'absolute',
    left: `${x - size/2}px`,
    top: `${y - size/2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
    textShadow: '0 0 3px rgba(0, 0, 0, 0.8)',
    cursor: 'pointer',
    boxShadow: selected 
      ? '0 0 0 3px var(--color-selected), 0 4px 8px rgba(0,0,0,0.3)' 
      : '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    // Add pulsing animation based on resonance
    animation: resonance > 0.7 
      ? `pulse ${3 - resonance * 2}s infinite alternate` 
      : 'none'
  };
  
  return (
    <div 
      className={`concept-node ${selected ? 'selected' : ''}`}
      style={nodeStyle}
      onClick={onClick}
      data-node-id={id}
    >
      {label}
      
      {/* Add keyframes for pulse animation using a style tag */}
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
            }
            100% {
              transform: scale(1.05);
              box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default ConceptNode;
