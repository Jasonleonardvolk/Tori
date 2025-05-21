import React, { useEffect, useRef, useState, useCallback } from 'react';
import './ConceptGraphVisualizer.css';

/**
 * ConceptGraphVisualizer - Visualizes the concept graph and the impact of changes
 * 
 * This component provides a visual representation of the concept graph and how
 * new information ripples through the existing concepts, highlighting affected nodes
 * and showing potential conflicts.
 * 
 * Props:
 * - graphData: Object containing nodes and edges data
 * - newInfo: String containing the new information being added
 * - conflicts: Array of detected conflicts
 * - onNodeSelect: Function to call when a node is selected
 * - highlightNodes: Array of node IDs to highlight
 * - width: Canvas width (default: 800)
 * - height: Canvas height (default: 600)
 */
const ConceptGraphVisualizer = ({
  graphData,
  newInfo,
  conflicts = [],
  onNodeSelect,
  highlightNodes = [],
  width = 800,
  height = 600
}) => {
  const canvasRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [simulationState, setSimulationState] = useState({
    nodes: [],
    edges: [],
    isRunning: false
  });
  
  // Animation state
  const [animationProgress, setAnimationProgress] = useState(0);
  const animationRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Get color for a node based on its type and impact
  const getNodeColor = useCallback((node) => {
    // Base color by type
    let baseColor;
    switch (node.type) {
      case 'concept':
        baseColor = '#3b82f6'; // blue
        break;
      case 'function':
        baseColor = '#10b981'; // green
        break;
      case 'property':
        baseColor = '#f59e0b'; // amber
        break;
      default:
        baseColor = '#6366f1'; // indigo
    }
    
    // Highlight impacted nodes
    if (node.isImpacted) {
      return '#ef4444'; // red for impacted nodes
    }
    
    // Highlight selected nodes
    if (highlightNodes.includes(node.id)) {
      return '#8b5cf6'; // purple for highlighted nodes
    }
    
    return baseColor;
  }, [highlightNodes]);
  
  // Convert graph data to simulation-friendly format
  useEffect(() => {
    if (!graphData || !graphData.nodes) return;
    
    // Map nodes to simulation format with positions
    const simNodes = graphData.nodes.map(node => ({
      ...node,
      x: Math.random() * width,
      y: Math.random() * height,
      radius: node.isImpacted ? 12 : 8,
      color: getNodeColor(node),
      isHighlighted: highlightNodes.includes(node.id)
    }));
    
    // Map edges to simulation format
    const simEdges = (graphData.edges || []).map(edge => ({
      ...edge,
      sourceNode: simNodes.find(n => n.id === edge.source),
      targetNode: simNodes.find(n => n.id === edge.target),
      color: edge.isImpacted ? '#ff6b6b' : '#555',
      width: edge.isImpacted ? 2 : 1
    }));
    
    setSimulationState({
      nodes: simNodes,
      edges: simEdges,
      isRunning: true
    });
    
    // Start animation
    setAnimationProgress(0);
    setIsAnimating(true);
  }, [graphData, width, height, highlightNodes, getNodeColor]);
  
  // Handle animation
  useEffect(() => {
    if (!isAnimating) return;
    
    let startTime;
    const duration = 2000; // 2 seconds for full animation
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimationProgress(progress);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);
  
  // Run simulation and draw the graph
  useEffect(() => {
    if (!canvasRef.current || !simulationState.isRunning) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw edges
    simulationState.edges.forEach(edge => {
      if (!edge.sourceNode || !edge.targetNode) return;
      
      ctx.beginPath();
      ctx.moveTo(edge.sourceNode.x, edge.sourceNode.y);
      ctx.lineTo(edge.targetNode.x, edge.targetNode.y);
      
      // Animate edge for impacted edges
      if (edge.isImpacted && animationProgress < 1) {
        // Draw only part of the edge based on animation progress
        const dx = edge.targetNode.x - edge.sourceNode.x;
        const dy = edge.targetNode.y - edge.sourceNode.y;
        const x = edge.sourceNode.x + dx * animationProgress;
        const y = edge.sourceNode.y + dy * animationProgress;
        
        ctx.moveTo(edge.sourceNode.x, edge.sourceNode.y);
        ctx.lineTo(x, y);
        
        // Draw pulse effect
        const pulseRadius = 5;
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.strokeStyle = edge.color;
      ctx.lineWidth = edge.width;
      ctx.stroke();
    });
    
    // Draw nodes
    simulationState.nodes.forEach(node => {
      // Skip drawing nodes that haven't been "reached" yet in animation
      if (node.isImpacted && animationProgress < 1) {
        // Check if this node should be visible yet
        const shouldShow = simulationState.edges.some(edge => {
          if (edge.targetNode?.id === node.id && edge.isImpacted) {
            // Estimate when this edge's animation reaches the node
            // This is a simplification - in a real app you might want to calculate
            // actual path distances from the source node
            const edgeIndex = simulationState.edges.indexOf(edge);
            const nodeDelay = (edgeIndex / simulationState.edges.length) * 0.8; // Stagger node appearances
            return animationProgress > nodeDelay;
          }
          return false;
        });
        
        if (!shouldShow) return;
      }
      
      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();
      
      // Draw highlight for hovered/selected node
      if (node === hoveredNode || node === selectedNode) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Draw node label
      if (node.name) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name, node.x, node.y);
      }
      
      // Draw pulse animation for impacted nodes
      if (node.isImpacted && isAnimating) {
        const pulseSize = 20 * (1 - Math.abs(Math.sin(animationProgress * Math.PI)));
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + pulseSize, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 - 0.7 * animationProgress})`;
        ctx.lineWidth = 2 * (1 - animationProgress);
        ctx.stroke();
      }
    });
  }, [simulationState, animationProgress, hoveredNode, selectedNode, isAnimating, width, height]);
  
  // Handle mouse interactions
  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if mouse is over any node
    let hovered = null;
    for (const node of simulationState.nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= node.radius) {
        hovered = node;
        break;
      }
    }
    
    setHoveredNode(hovered);
    
    // Change cursor to pointer if over a node
    if (canvas) {
      canvas.style.cursor = hovered ? 'pointer' : 'default';
    }
  };
  
  const handleCanvasClick = (e) => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
      if (onNodeSelect) {
        onNodeSelect(hoveredNode);
      }
    } else {
      setSelectedNode(null);
    }
  };
  
  // Start a new animation
  const restartAnimation = () => {
    setAnimationProgress(0);
    setIsAnimating(true);
  };
  
  return (
    <div className="concept-graph-visualizer">
      <div className="graph-title">
        <h3>Concept Graph Visualization</h3>
        {isAnimating ? (
          <span className="animation-status">
            Analyzing impact... {Math.round(animationProgress * 100)}%
          </span>
        ) : (
          <button 
            className="replay-button"
            onClick={restartAnimation}
          >
            Replay Animation
          </button>
        )}
      </div>
      
      <div className="graph-canvas-container">
        <canvas
          ref={canvasRef}
          className="graph-canvas"
          onMouseMove={handleCanvasMouseMove}
          onClick={handleCanvasClick}
        />
        
        {hoveredNode && (
          <div 
            className="node-tooltip"
            style={{
              position: 'absolute',
              left: hoveredNode.x + 20,
              top: hoveredNode.y + 20
            }}
          >
            <div className="tooltip-title">{hoveredNode.name}</div>
            <div className="tooltip-type">{hoveredNode.type}</div>
            {hoveredNode.documentCount > 0 && (
              <div className="tooltip-docs">
                Appears in {hoveredNode.documentCount} statements
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="graph-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
          <div className="legend-label">Concept</div>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
          <div className="legend-label">Function</div>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
          <div className="legend-label">Property</div>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
          <div className="legend-label">Impacted</div>
        </div>
      </div>
      
      {conflicts.length > 0 && (
        <div className="conflict-summary">
          <h4>Detected Conflicts</h4>
          <div className="conflict-list">
            {conflicts.map((conflict, index) => (
              <div key={index} className={`conflict-item ${conflict.type === 'direct' ? 'direct' : 'ambiguous'}`}>
                <div className="conflict-type">
                  {conflict.type === 'direct' ? 'Direct Conflict' : 'Ambiguous Conflict'}
                </div>
                <div className="conflict-reason">{conflict.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConceptGraphVisualizer;
