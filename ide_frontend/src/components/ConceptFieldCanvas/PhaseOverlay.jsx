import React from 'react';
import './ConceptFieldCanvas.css';

/**
 * PhaseOverlay Component
 * 
 * Visualizes phase dynamics across the concept field.
 * Creates a color gradient effect showing phase distribution.
 */
const PhaseOverlay = ({ nodes }) => {
  // Create a heat map visualization of phase distribution
  // This uses a canvas element for better performance with many nodes
  const canvasRef = React.useRef(null);
  
  React.useEffect(() => {
    // Skip if no nodes
    if (!nodes || nodes.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up gradient visualization
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.15; // Subtle overlay
    
    // For each node, create a radial gradient representing its phase
    nodes.forEach(node => {
      const { x, y, phase, resonance } = node;
      
      // Skip nodes with very low resonance
      if (resonance < 0.2) return;
      
      // Convert phase (0-1) to HSL color
      const hue = (phase * 360) % 360;
      
      // Create gradient size based on resonance and node influence
      const gradientSize = 100 + (resonance * 150);
      
      // Create radial gradient
      const gradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, gradientSize
      );
      
      // Add color stops with phase-derived color
      gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, ${resonance * 0.6})`);
      gradient.addColorStop(0.5, `hsla(${hue}, 80%, 50%, ${resonance * 0.3})`);
      gradient.addColorStop(1, `hsla(${hue}, 80%, 50%, 0)`);
      
      // Draw gradient
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, gradientSize, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Optional: Add phase contour lines
    if (nodes.length > 5) {
      // This would create contour lines where phases are similar
      // Simplified version:
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      // Group nodes by similar phase
      const phaseGroups = {};
      const stepSize = 0.1; // Group phases in 0.1 increments
      
      nodes.forEach(node => {
        const phaseBin = Math.floor(node.phase / stepSize) * stepSize;
        if (!phaseGroups[phaseBin]) {
          phaseGroups[phaseBin] = [];
        }
        phaseGroups[phaseBin].push(node);
      });
      
      // Draw connections between nodes with similar phase
      Object.values(phaseGroups).forEach(group => {
        if (group.length < 2) return;
        
        ctx.beginPath();
        for (let i = 0; i < group.length; i++) {
          const node = group[i];
          if (i === 0) {
            ctx.moveTo(node.x, node.y);
          } else {
            ctx.lineTo(node.x, node.y);
          }
        }
        ctx.stroke();
      });
    }
    
  }, [nodes]);
  
  return (
    <canvas
      ref={canvasRef}
      className="phase-overlay"
      width={2000} // Large canvas size for high resolution
      height={2000}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default PhaseOverlay;
