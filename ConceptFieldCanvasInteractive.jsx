// ALAN IDE – Interactive ConceptFieldCanvas (κ-Geometry, node interactivity)
// Author: Cascade (2025-05-07)
// Features: select, drag, drag-select, zoom/pan, group selection, highlight

import React, { useEffect, useRef, useState } from "react";
import useKappaGeometryLayout from "./useKappaGeometryLayout";
import * as d3 from "d3";

export default function ConceptFieldCanvasInteractive({
  width = 1000,
  height = 700,
  apiEndpoint = "/api/concept-graph",
  onSelectionChange = () => {}
}) {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [selected, setSelected] = useState([]); // array of node ids
  const [dragging, setDragging] = useState(null); // node id or null
  const [dragRect, setDragRect] = useState(null); // {x1, y1, x2, y2} or null
  const svgRef = useRef();
  // Fetch graph data from backend
  useEffect(() => {
    fetch(apiEndpoint)
      .then(res => res.json())
      .then(setGraph)
      .catch(() => setGraph({ nodes: [], edges: [] }));
  }, [apiEndpoint]);
  // κ-geometry layout positions
  const positions = useKappaGeometryLayout(graph.nodes, graph.edges, { width, height });

  // --- Zoom & Pan ---
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.call(
      d3.zoom()
        .scaleExtent([0.33, 2.5])
        .on("zoom", (event) => {
          svg.select("g#zoom-group").attr("transform", event.transform);
        })
    );
  }, []);

  // --- Node Drag Logic ---
  function handleNodePointerDown(e, nodeId) {
    e.stopPropagation();
    setDragging(nodeId);
  }
  function handlePointerMove(e) {
    if (dragging) {
      // Drag single node
      const svgRect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - svgRect.left;
      const y = e.clientY - svgRect.top;
      // Update node position directly (not persisted)
      positions[dragging] = { x, y };
      setDragging(dragging); // force re-render
    } else if (dragRect) {
      // Update drag-select rectangle
      const svgRect = svgRef.current.getBoundingClientRect();
      setDragRect({ ...dragRect, x2: e.clientX - svgRect.left, y2: e.clientY - svgRect.top });
    }
  }
  function handlePointerUp(e) {
    if (dragging) {
      setDragging(null);
    } else if (dragRect) {
      // Select nodes in rectangle
      const { x1, y1, x2, y2 } = dragRect;
      const xMin = Math.min(x1, x2), xMax = Math.max(x1, x2);
      const yMin = Math.min(y1, y2), yMax = Math.max(y1, y2);
      const inRect = graph.nodes.filter(n => {
        const p = positions[n.id];
        return p && p.x >= xMin && p.x <= xMax && p.y >= yMin && p.y <= yMax;
      }).map(n => n.id);
      setSelected(inRect);
      onSelectionChange(inRect);
      setDragRect(null);
    }
  }
  function handleSvgPointerDown(e) {
    // Start drag-select
    if (e.target === svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect();
      setDragRect({ x1: e.clientX - svgRect.left, y1: e.clientY - svgRect.top, x2: e.clientX - svgRect.left, y2: e.clientY - svgRect.top });
    }
  }

  // --- Node Click ---
  function handleNodeClick(e, nodeId) {
    e.stopPropagation();
    setSelected([nodeId]);
    onSelectionChange([nodeId]);
  }

  // --- SVG Event Handlers ---
  useEffect(() => {
    const svg = svgRef.current;
    svg.addEventListener("pointermove", handlePointerMove);
    svg.addEventListener("pointerup", handlePointerUp);
    return () => {
      svg.removeEventListener("pointermove", handlePointerMove);
      svg.removeEventListener("pointerup", handlePointerUp);
    };
  });

  // --- Render ---
  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: "var(--color-bg, #1E1E1E)", cursor: dragging ? "grabbing" : "default" }}
      onPointerDown={handleSvgPointerDown}
      tabIndex={0}
    >
      <g id="zoom-group">
        {/* Edges */}
        {graph.edges.map(e => (
          <line
            key={e.id}
            x1={positions[e.source]?.x}
            y1={positions[e.source]?.y}
            x2={positions[e.target]?.x}
            y2={positions[e.target]?.y}
            stroke="#A9B1BD"
            strokeWidth={(e.weight || 0.5) * 4}
            opacity={0.6}
          />
        ))}
        {/* Nodes */}
        {graph.nodes.map(n => (
          <circle
            key={n.id}
            cx={positions[n.id]?.x}
            cy={positions[n.id]?.y}
            r={18 + (n.usage || 0) * 10}
            fill={phaseToColor(n.phase, n.predictability_score)}
            stroke={selected.includes(n.id) ? "#FFD700" : getPredictabilityStroke(n.predictability_score)}
            strokeWidth={selected.includes(n.id) ? 4 : 2}
            style={{ cursor: "pointer" }}
            onPointerDown={e => handleNodePointerDown(e, n.id)}
            onClick={e => handleNodeClick(e, n.id)}
          >
            <title>{n.label}{n.predictability_score ? ` (Predictability: ${(n.predictability_score * 100).toFixed(0)}%)` : ''}</title>
          </circle>
        ))}
        {/* Drag-select rectangle */}
        {dragRect && (
          <rect
            x={Math.min(dragRect.x1, dragRect.x2)}
            y={Math.min(dragRect.y1, dragRect.y2)}
            width={Math.abs(dragRect.x2 - dragRect.x1)}
            height={Math.abs(dragRect.y2 - dragRect.y1)}
            fill="rgba(0,255,200,0.12)"
            stroke="#00FFCC"
            strokeDasharray="6 3"
          />
        )}
      </g>
    </svg>
  );
}

/**
 * Convert phase and predictability to color
 * @param {number} phase - Oscillator phase (0-1)
 * @param {number} predictability - Concept predictability from Lyapunov analysis (0-1)
 * @returns {string} HSL color string
 */
function phaseToColor(phase, predictability = 0.5) {
  if (typeof phase !== "number") return "#8A2BE2";
  
  // Use phase for hue as before
  const hue = phase * 360;
  
  // Use predictability for saturation (chaotic = more vibrant, predictable = more muted)
  // Map 0-1 predictability to saturation range 100-50%
  const saturation = 100 - (predictability * 50);
  
  // Adjust lightness slightly for better visibility
  // More chaotic concepts (lower predictability) get slightly brighter
  const lightness = 60 + ((1 - predictability) * 15);
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Return a stroke color based on predictability score
 * @param {number} predictability - Concept predictability from Lyapunov analysis (0-1)
 * @returns {string} Color for node stroke
 */
function getPredictabilityStroke(predictability = 0.5) {
  if (typeof predictability !== 'number') return "#00FFCC"; // Default teal
  
  if (predictability < 0.3) {
    // Chaotic/creative concepts - red/orange glow
    return "#FF5500";
  } else if (predictability > 0.7) {
    // Highly predictable concepts - green/blue glow
    return "#00AAFF";
  } else {
    // Neutral concepts - default teal
    return "#00FFCC";
  }
}
