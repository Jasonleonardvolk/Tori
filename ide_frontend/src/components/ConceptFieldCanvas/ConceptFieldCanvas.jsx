import React, { useState, useRef, useEffect } from 'react';
import './ConceptFieldCanvas.css';
import ConceptNode from './ConceptNode';
import EdgeConnection from './EdgeConnection';
import CanvasControls from './CanvasControls';
import PhaseOverlay from './PhaseOverlay';
import KoopmanOverlay from './KoopmanOverlay';

// Commenting out unused service imports
// import conceptGraphService from '../../services/conceptGraphService';
// import dynamicalSystemsService from '../../services/dynamicalSystemsService';

/**
 * ConceptFieldCanvas
 * 
 * Main visualization component that displays the concept graph embedded in κ-space.
 * Shows resonance structure, phase dynamics, and spatial proximity.
 */
const ConceptFieldCanvas = ({ 
  onNodeSelect, 
  onNodeHover, 
  selectedNodes = [], 
  initialGeometry = 'euclidean' 
}) => {
  // Main state
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [geometry, setGeometry] = useState(initialGeometry); // 'euclidean', 'spherical', 'hyperbolic'
  const [alpha, setAlpha] = useState(1.5);
  const [morph, setMorph] = useState({
    active: false,
    mode: 'Koopman #2',
    epsilon: 0.3
  });
  
  // Overlays and visual controls
  const [overlays, setOverlays] = useState({
    phase: true,
    coupling: true,
    resonance: true,
    koopman: false
  });
  
  // Metrics
  const [metrics] = useState({
    syncPercentage: 92,
    entropy: 0.34,
    attractor: 'auth-ring'
  });
  
  // Selection and interaction
  const canvasRef = useRef(null);
  const [selection, setSelection] = useState({ active: false, start: null, current: null });
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });
  
  // Load data on mount
  useEffect(() => {
    const loadGraphData = async () => {
      try {
        // These would be actual service calls in a real implementation
        // const conceptData = await conceptGraphService.getConceptGraph();
        // const dynamicalData = await dynamicalSystemsService.getStateSnapshot();
        
        // For now, mock the data
        const mockNodes = [
          { id: 'node1', label: 'map()', phase: 0.2, resonance: 0.7, x: 100, y: 150 },
          { id: 'node2', label: 'filter()', phase: 0.4, resonance: 0.6, x: 250, y: 120 },
          { id: 'node3', label: 'reduce()', phase: 0.9, resonance: 0.8, x: 350, y: 180 },
          { id: 'node4', label: 'validate()', phase: 0.5, resonance: 0.9, x: 150, y: 300 },
          { id: 'node5', label: 'auth_core()', phase: 0.2, resonance: 0.7, x: 250, y: 300 },
          { id: 'node6', label: 'session_mgr()', phase: 0.9, resonance: 0.5, x: 350, y: 300 },
        ];
        
        const mockEdges = [
          { id: 'edge1', source: 'node4', target: 'node5', weight: 0.8 },
          { id: 'edge2', source: 'node5', target: 'node6', weight: 0.6 },
        ];
        
        setNodes(mockNodes);
        setEdges(mockEdges);
      } catch (error) {
        console.error('Error loading graph data:', error);
      }
    };
    
    loadGraphData();
  }, []);
  
  // Handle parameter adjustments - Unused functions kept as comments for future reference
  /* 
  const increaseAlpha = () => setAlpha(prev => Math.min(prev + 0.1, 3).toFixed(1) * 1);
  const decreaseAlpha = () => setAlpha(prev => Math.max(prev - 0.1, 0.1).toFixed(1) * 1);
  const increaseEpsilon = () => setMorph(prev => ({ 
    ...prev, 
    epsilon: Math.min(prev.epsilon + 0.1, 1.0).toFixed(1) * 1 
  }));
  const decreaseEpsilon = () => setMorph(prev => ({ 
    ...prev, 
    epsilon: Math.max(prev.epsilon - 0.1, 0.1).toFixed(1) * 1 
  }));
  */
  
  // Handle morph execution
  const executeMorph = () => {
    console.log(`Executing morph: ${morph.mode} with ε=${morph.epsilon}`);
    // In real implementation, this would call the morph function from the service
    // const result = await dynamicalSystemsService.morphField(morph.mode, morph.epsilon, selectedNodes);
    // Then update the nodes and edges with the result
  };
  
  // Handle overlay toggles
  const toggleOverlay = (overlayName) => {
    setOverlays(prev => ({
      ...prev,
      [overlayName]: !prev[overlayName]
    }));
  };
  
  // Selection and hover handling
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only handle left mouse button
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSelection({
      active: true,
      start: { x, y },
      current: { x, y }
    });
  };
  
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update selection rectangle if selection is active
    if (selection.active) {
      setSelection(prev => ({
        ...prev,
        current: { x, y }
      }));
    }
    
    // Check for node hover
    const hoveredNode = nodes.find(node => {
      const distance = Math.sqrt(
        Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2)
      );
      return distance < 20; // Simple radius check
    });
    
    if (hoveredNode) {
      setTooltip({
        visible: true,
        x: x + 10, // Offset to not cover the node
        y: y + 10,
        content: {
          label: hoveredNode.label,
          phase: hoveredNode.phase,
          resonance: hoveredNode.resonance
        }
      });
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };
  
  const handleMouseUp = () => {
    if (!selection.active) return;
    
    // Calculate which nodes are in the selection
    const selectedNodeIds = nodes
      .filter(node => {
        const minX = Math.min(selection.start.x, selection.current.x);
        const maxX = Math.max(selection.start.x, selection.current.x);
        const minY = Math.min(selection.start.y, selection.current.y);
        const maxY = Math.max(selection.start.y, selection.current.y);
        
        return (
          node.x >= minX && 
          node.x <= maxX && 
          node.y >= minY && 
          node.y <= maxY
        );
      })
      .map(node => node.id);
    
    if (selectedNodeIds.length > 0 && onNodeSelect) {
      onNodeSelect(selectedNodeIds);
    }
    
    setSelection({ active: false, start: null, current: null });
  };
  
  const handleNodeClick = (nodeId) => {
    if (onNodeSelect) {
      onNodeSelect([nodeId]);
    }
  };
  
  // Render selection rectangle
  const renderSelectionRect = () => {
    if (!selection.active || !selection.start || !selection.current) return null;
    
    const minX = Math.min(selection.start.x, selection.current.x);
    const maxX = Math.max(selection.start.x, selection.current.x);
    const minY = Math.min(selection.start.y, selection.current.y);
    const maxY = Math.max(selection.start.y, selection.current.y);
    const width = maxX - minX;
    const height = maxY - minY;
    
    return (
      <div 
        className="group-selection"
        style={{
          left: `${minX}px`,
          top: `${minY}px`,
          width: `${width}px`,
          height: `${height}px`
        }}
      />
    );
  };
  
  return (
    <div className="concept-field-canvas-container">
      {/* Toolbar Header */}
      <CanvasControls 
        geometry={geometry}
        setGeometry={setGeometry}
        alpha={alpha}
        setAlpha={setAlpha}
        morph={morph}
        setMorph={setMorph}
        metrics={metrics}
        onExecuteMorph={executeMorph}
      />
      
      {/* Canvas View */}
      <div 
        ref={canvasRef}
        className="canvas-view"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Nodes */}
        {nodes.map(node => (
          <ConceptNode 
            key={node.id}
            node={node}
            selected={selectedNodes.includes(node.id)}
            onClick={() => handleNodeClick(node.id)}
          />
        ))}
        
        {/* Edges */}
        {edges.map(edge => (
          <EdgeConnection 
            key={edge.id}
            edge={edge}
            nodes={nodes}
            showWeight={overlays.coupling}
          />
        ))}
        
        {/* Overlays */}
        {overlays.phase && <PhaseOverlay nodes={nodes} />}
        {overlays.koopman && <KoopmanOverlay nodes={nodes} edges={edges} />}
        
        {/* Selection Rectangle */}
        {renderSelectionRect()}
        
        {/* Tooltip */}
        {tooltip.visible && (
          <div 
            className="canvas-tooltip" 
            style={{ 
              left: `${tooltip.x}px`, 
              top: `${tooltip.y}px` 
            }}
          >
            <div><strong>{tooltip.content.label}</strong></div>
            <div>Phase: {(tooltip.content.phase * 360).toFixed(0)}°</div>
            <div>Resonance: {(tooltip.content.resonance * 100).toFixed(0)}%</div>
          </div>
        )}
      </div>
      
      {/* Overlay Toggle Section */}
      <div className="overlay-toggle-section">
        <label className="overlay-toggle">
          <input 
            type="checkbox" 
            className="overlay-toggle-checkbox"
            checked={overlays.phase} 
            onChange={() => toggleOverlay('phase')} 
          />
          <span>Phase Dynamics</span>
        </label>
        
        <label className="overlay-toggle">
          <input 
            type="checkbox" 
            className="overlay-toggle-checkbox"
            checked={overlays.coupling} 
            onChange={() => toggleOverlay('coupling')} 
          />
          <span>Coupling Strength</span>
        </label>
        
        <label className="overlay-toggle">
          <input 
            type="checkbox" 
            className="overlay-toggle-checkbox"
            checked={overlays.resonance} 
            onChange={() => toggleOverlay('resonance')} 
          />
          <span>Resonance</span>
        </label>
        
        <label className="overlay-toggle">
          <input 
            type="checkbox" 
            className="overlay-toggle-checkbox"
            checked={overlays.koopman} 
            onChange={() => toggleOverlay('koopman')} 
          />
          <span>Koopman Vectors</span>
        </label>
      </div>
    </div>
  );
};

export default ConceptFieldCanvas;
