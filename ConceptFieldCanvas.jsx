// ALAN IDE – ConceptFieldCanvas (κ-Geometry, minimal interactivity)
// Author: Cascade (2025-05-07)
// This component renders a live, backend-driven semantic map using the useKappaGeometryLayout hook.

import React, { useEffect, useState } from "react";
import useKappaGeometryLayout from "./useKappaGeometryLayout";

export default function ConceptFieldCanvas({
  width = 1000,
  height = 700,
  apiEndpoint = "/api/concept-graph"
}) {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  // Fetch graph data from backend
  useEffect(() => {
    fetch(apiEndpoint)
      .then(res => res.json())
      .then(setGraph)
      .catch(() => setGraph({ nodes: [], edges: [] }));
  }, [apiEndpoint]);

  // κ-geometry layout positions
  const positions = useKappaGeometryLayout(
    graph.nodes,
    graph.edges,
    { width, height }
  );

  return (
    <svg width={width} height={height} style={{ background: "var(--color-bg, #1E1E1E)" }}>
      {/* Legend */}
      <g transform="translate(10, 10)">
        <rect x="0" y="0" width="200" height="90" fill="rgba(0,0,0,0.7)" rx="5" ry="5" />
        <text x="10" y="20" fill="white" fontSize="12" fontWeight="bold">Concept Predictability</text>
        
        {/* Chaotic/creative */}
        <circle cx="20" cy="40" r="8" fill="hsl(60, 100%, 75%)" stroke="#FF5500" strokeWidth="2" />
        <text x="35" y="44" fill="white" fontSize="11">Chaotic/Creative</text>
        
        {/* Neutral */}
        <circle cx="20" cy="60" r="8" fill="hsl(180, 75%, 60%)" stroke="#00FFCC" strokeWidth="2" />
        <text x="35" y="64" fill="white" fontSize="11">Neutral</text>
        
        {/* Predictable/formulaic */}
        <circle cx="20" cy="80" r="8" fill="hsl(240, 50%, 60%)" stroke="#00AAFF" strokeWidth="2" />
        <text x="35" y="84" fill="white" fontSize="11">Predictable/Formulaic</text>
      </g>
      {/* Render edges */}
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
      {/* Render nodes */}
      {graph.nodes.map(n => (
        <circle
          key={n.id}
          cx={positions[n.id]?.x}
          cy={positions[n.id]?.y}
          r={18 + (n.usage || 0) * 10}
          fill={phaseToColor(n.phase, n.predictability_score)}
          stroke={getPredictabilityStroke(n.predictability_score)}
          strokeWidth={2}
        >
          <title>{n.label}{n.predictability_score ? ` (Predictability: ${(n.predictability_score * 100).toFixed(0)}%)` : ''}</title>
        </circle>
      ))}
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
