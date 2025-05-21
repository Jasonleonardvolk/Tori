import React from 'react';
import './ConceptFieldCanvas.css';

/**
 * KoopmanOverlay Component
 * 
 * Visualizes Koopman mode vectors as arrows showing dynamical flow.
 * Helps identify dominant modes and resonance patterns.
 */
const KoopmanOverlay = ({ nodes, edges }) => {
  const canvasRef = React.useRef(null);
  
  React.useEffect(() => {
    // Skip if no data
    if (!nodes || nodes.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Mock Koopman vectors - in a real implementation, these would come from
    // dynamical systems analysis of the concept graph
    const mockVectorField = generateMockVectorField(nodes, edges);
    
    // Draw vector field
    drawVectorField(ctx, mockVectorField);
    
    // Optional: Draw mode influence regions
    drawModeInfluenceRegions(ctx, nodes);
    
  }, [nodes, edges]);
  
  // Generate mock Koopman vector field for demonstration
  const generateMockVectorField = (nodes, edges) => {
    // In a real implementation, this would use actual Koopman decomposition results
    // For now, we'll create a simplified swirl pattern around nodes
    
    const vectorField = [];
    const gridSize = 40; // Grid spacing for vector field
    
    // Create a grid of vectors
    for (let x = 0; x < 2000; x += gridSize) {
      for (let y = 0; y < 2000; y += gridSize) {
        // Initialize vector
        let dx = 0;
        let dy = 0;
        
        // Calculate influence from each node
        nodes.forEach(node => {
          // Vector from grid point to node
          const vx = node.x - x;
          const vy = node.y - y;
          
          // Distance to node
          const distance = Math.sqrt(vx * vx + vy * vy);
          if (distance < 1) return; // Skip if too close
          
          // Strength of influence (decreases with distance)
          const strength = Math.min(30 / (distance * distance), 0.5);
          
          // Create swirl effect based on node phase
          const angle = Math.atan2(vy, vx) + (node.phase * Math.PI * 2 - Math.PI);
          
          // Add to vector
          dx += Math.cos(angle) * strength * node.resonance;
          dy += Math.sin(angle) * strength * node.resonance;
        });
        
        // Add some influence from edges (coupling)
        edges.forEach(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) return;
          
          // Check if grid point is near the edge
          const edgeMidX = (sourceNode.x + targetNode.x) / 2;
          const edgeMidY = (sourceNode.y + targetNode.y) / 2;
          const distToEdge = Math.sqrt((x - edgeMidX) ** 2 + (y - edgeMidY) ** 2);
          
          if (distToEdge < 100) { // If close to edge
            // Direction of edge
            const edgeDx = targetNode.x - sourceNode.x;
            const edgeDy = targetNode.y - sourceNode.y;
            const edgeLength = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy);
            
            // Add flow along edge direction
            const influence = (edge.weight || 0.5) * 0.2 * (1 - distToEdge / 100);
            dx += (edgeDx / edgeLength) * influence;
            dy += (edgeDy / edgeLength) * influence;
          }
        });
        
        // Normalize vector
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        if (magnitude > 0.01) {
          // Scale vector and add to field
          const scaledMagnitude = Math.min(magnitude, 1) * gridSize * 0.4;
          vectorField.push({
            x,
            y,
            dx: (dx / magnitude) * scaledMagnitude,
            dy: (dy / magnitude) * scaledMagnitude,
            magnitude
          });
        }
      }
    }
    
    return vectorField;
  };
  
  // Draw vector field with arrows
  const drawVectorField = (ctx, vectorField) => {
    // Set arrow style
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.6)';
    ctx.lineWidth = 1;
    
    // Draw each vector as an arrow
    vectorField.forEach(vector => {
      const { x, y, dx, dy, magnitude } = vector;
      
      // Skip very small vectors
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;
      
      // Calculate direction angle (arrowLength is already known from vector's dx/dy)
      const angle = Math.atan2(dy, dx);
      
      // Draw line
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      
      // Draw arrowhead
      const arrowSize = 4 + (magnitude * 3);
      ctx.lineTo(
        x + dx - arrowSize * Math.cos(angle - Math.PI / 6),
        y + dy - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(x + dx, y + dy);
      ctx.lineTo(
        x + dx - arrowSize * Math.cos(angle + Math.PI / 6),
        y + dy - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      
      // Apply alpha based on magnitude
      ctx.globalAlpha = Math.min(0.8, 0.2 + magnitude * 0.8);
      
      // Stroke arrow
      ctx.stroke();
    });
    
    // Reset alpha
    ctx.globalAlpha = 1;
  };
  
  // Draw mode influence regions
  const drawModeInfluenceRegions = (ctx, nodes) => {
    // In a real implementation, this would show actual Koopman modes
    // For demonstration, we'll just create influence regions around nodes
    
    const dominantNodes = nodes
      .filter(node => node.resonance > 0.7)
      .sort((a, b) => b.resonance - a.resonance)
      .slice(0, 2); // Take top 2 dominant nodes
    
    // Draw influence regions for dominant nodes
    dominantNodes.forEach((node, index) => {
      const regionSize = 300 + (node.resonance * 200);
      
      // Create gradient for mode region
      const gradient = ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, regionSize
      );
      
      // Use different colors for different modes
      const modeColors = [
        'rgba(0, 255, 204, 0.03)', // Primary
        'rgba(255, 0, 127, 0.03)', // Secondary
      ];
      
      gradient.addColorStop(0, modeColors[index % modeColors.length].replace('0.03', '0.06'));
      gradient.addColorStop(0.6, modeColors[index % modeColors.length]);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      // Draw region
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, regionSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Add mode label
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Mode ${index + 1}`, node.x, node.y - 30);
    });
  };
  
  return (
    <canvas
      ref={canvasRef}
      className="koopman-overlay"
      width={2000}
      height={2000}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5, // Above nodes but below UI elements
      }}
    />
  );
};

export default KoopmanOverlay;
