// ALAN IDE – ConceptFieldCanvas with SelectionContext sync (Story 1.5)
// Author: Cascade (2025-05-07)
// Features: selection state shared with Concept Editor and panels

import React, { useEffect, useRef, useState } from "react";
import useKappaGeometryLayout from "./useKappaGeometryLayout";
import { useSelection } from "./SelectionContext";
import * as d3 from "d3";

export default function ConceptFieldCanvasSynced({
  width = 1000,
  height = 700,
  apiEndpoint = "/api/concept-graph"
}) {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [dragging, setDragging] = useState(null);
  const [dragRect, setDragRect] = useState(null);
  const svgRef = useRef();
  const { selected, setSelected } = useSelection();
  // Fetch graph data from backend
  const fetchGraph = () => {
    fetch(apiEndpoint)
      .then(res => res.json())
      .then(setGraph)
      .catch(() => setGraph({ nodes: [], edges: [] }));
  };
  useEffect(() => {
    fetchGraph();
  }, [apiEndpoint]);
  // Panel-to-canvas sync: listen for concept-graph-updated event
  useEffect(() => {
    const handler = () => fetchGraph();
    window.addEventListener('concept-graph-updated', handler);
    return () => window.removeEventListener('concept-graph-updated', handler);
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
      const svgRect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - svgRect.left;
      const y = e.clientY - svgRect.top;
      positions[dragging] = { x, y };
      setDragging(dragging);
    } else if (dragRect) {
      const svgRect = svgRef.current.getBoundingClientRect();
      setDragRect({ ...dragRect, x2: e.clientX - svgRect.left, y2: e.clientY - svgRect.top });
    }
  }
  function handlePointerUp(e) {
    if (dragging) {
      setDragging(null);
    } else if (dragRect) {
      const { x1, y1, x2, y2 } = dragRect;
      const xMin = Math.min(x1, x2), xMax = Math.max(x1, x2);
      const yMin = Math.min(y1, y2), yMax = Math.max(y1, y2);
      const inRect = graph.nodes.filter(n => {
        const p = positions[n.id];
        return p && p.x >= xMin && p.x <= xMax && p.y >= yMin && p.y <= yMax;
      }).map(n => n.id);
      setSelected(inRect);
      setDragRect(null);
    }
  }
  function handleSvgPointerDown(e) {
    if (e.target === svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect();
      setDragRect({ x1: e.clientX - svgRect.left, y1: e.clientY - svgRect.top, x2: e.clientX - svgRect.left, y2: e.clientY - svgRect.top });
    }
  }
  function handleNodeClick(e, nodeId) {
    e.stopPropagation();
    setSelected([nodeId]);
  }
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
            fill={phaseToColor(n.phase)}
            stroke={selected.includes(n.id) ? "#FFD700" : "#00FFCC"}
            strokeWidth={selected.includes(n.id) ? 4 : 2}
            style={{ cursor: "pointer" }}
            onPointerDown={e => handleNodePointerDown(e, n.id)}
            onClick={e => handleNodeClick(e, n.id)}
          >
            <title>{n.label}</title>
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

function phaseToColor(phase) {
  if (typeof phase !== "number") return "#8A2BE2";
  const hue = phase * 360;
  return `hsl(${hue}, 100%, 60%)`;
}
