// ALAN IDE – κ-Geometry Layout React Hook
// Author: Cascade (2025-05-07)
// This hook computes node positions for a concept graph using D3-force with custom clustering and phase-based radial layout.

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3-force";

/**
 * useKappaGeometryLayout
 * @param {Array} nodes - [{ id, phase, group, ... }]
 * @param {Array} edges - [{ source, target, weight/coupling }]
 * @param {Object} options - { width, height, clusterStrength, phaseStrength }
 * @returns {Object} positions - { [nodeId]: { x, y } }
 */
export default function useKappaGeometryLayout(
  nodes,
  edges,
  {
    width = 800,
    height = 600,
    clusterStrength = 0.3,
    phaseStrength = 0.25,
    linkDistance = 120,
    chargeStrength = -80
  } = {}
) {
  const [positions, setPositions] = useState({});
  const simRef = useRef(null);

  useEffect(() => {
    if (!nodes.length) return;
    // Deep copy to avoid mutating React state
    const simNodes = nodes.map(n => ({ ...n }));
    const simEdges = edges.map(e => ({ ...e }));

    // --- Custom Forces ---
    // Cluster force: pull nodes in same group together
    function clusterForce(alpha) {
      const groupCenters = {};
      // Find centroid for each group
      simNodes.forEach(n => {
        if (!groupCenters[n.group]) groupCenters[n.group] = { x: 0, y: 0, count: 0 };
        groupCenters[n.group].x += n.x || width / 2;
        groupCenters[n.group].y += n.y || height / 2;
        groupCenters[n.group].count += 1;
      });
      Object.values(groupCenters).forEach(c => {
        c.x /= c.count;
        c.y /= c.count;
      });
      // Pull nodes toward their group centroid
      simNodes.forEach(n => {
        const c = groupCenters[n.group];
        n.vx = (n.vx || 0) + (c.x - n.x) * clusterStrength * alpha;
        n.vy = (n.vy || 0) + (c.y - n.y) * clusterStrength * alpha;
      });
    }
    // Phase radial force: arrange nodes by phase angle
    function phaseRadialForce(alpha) {
      const cx = width / 2, cy = height / 2, r = Math.min(width, height) * 0.35;
      simNodes.forEach(n => {
        if (typeof n.phase === "number") {
          const theta = n.phase * 2 * Math.PI;
          const px = cx + r * Math.cos(theta);
          const py = cy + r * Math.sin(theta);
          n.vx = (n.vx || 0) + (px - n.x) * phaseStrength * alpha;
          n.vy = (n.vy || 0) + (py - n.y) * phaseStrength * alpha;
        }
      });
    }

    // --- D3 Simulation ---
    const sim = d3.forceSimulation(simNodes)
      .force("charge", d3.forceManyBody().strength(chargeStrength))
      .force("link", d3.forceLink(simEdges).id(d => d.id).distance(linkDistance).strength(e => e.weight || 0.5))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", () => {
        setPositions(
          Object.fromEntries(simNodes.map(n => [n.id, { x: n.x, y: n.y }]))
        );
      });

    // Custom force integration
    sim.force("cluster", clusterForce);
    sim.force("phase", phaseRadialForce);

    simRef.current = sim;
    return () => sim.stop();
  }, [JSON.stringify(nodes), JSON.stringify(edges), width, height, clusterStrength, phaseStrength, linkDistance, chargeStrength]);

  return positions;
}

/*
Usage Example:

import useKappaGeometryLayout from './useKappaGeometryLayout';

function ConceptFieldCanvas({ nodes, edges, width, height }) {
  const positions = useKappaGeometryLayout(nodes, edges, { width, height });
  return (
    <svg width={width} height={height}>
      {edges.map(e => (
        <line
          key={e.id}
          x1={positions[e.source]?.x}
          y1={positions[e.source]?.y}
          x2={positions[e.target]?.x}
          y2={positions[e.target]?.y}
          stroke="#A9B1BD"
          strokeWidth={e.weight * 4}
          opacity={0.6}
        />
      ))}
      {nodes.map(n => (
        <circle
          key={n.id}
          cx={positions[n.id]?.x}
          cy={positions[n.id]?.y}
          r={18 + n.usage * 10}
          fill={phaseToColor(n.phase)}
          stroke="#00FFCC"
          strokeWidth={2}
        >
          <title>{n.label}</title>
        </circle>
      ))}
    </svg>
  );
}
function phaseToColor(phase) {
  const hue = phase * 360;
  return `hsl(${hue}, 100%, 60%)`;
}
*/
