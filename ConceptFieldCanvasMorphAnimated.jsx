// ALAN IDE – ConceptFieldCanvas with Morph Ripples & Phase-Locking Animation (Story 1.4)
// Author: Cascade (2025-05-07)
// Features: morph ripple animation, phase-locking UI, all previous visual encodings and interactivity

import React, { useEffect, useRef, useState } from "react";
import useKappaGeometryLayout from "./useKappaGeometryLayout";
import * as d3 from "d3";

export default function ConceptFieldCanvasMorphAnimated({
  width = 1000,
  height = 700,
  apiEndpoint = "/api/concept-graph",
  onSelectionChange = () => {},
  morphEvent = null, // { nodeIds: [], timestamp: Date.now() } or null
  phaseLockNodes = [] // array of node ids currently phase-locked
}) {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [selected, setSelected] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [dragRect, setDragRect] = useState(null);
  const [ripples, setRipples] = useState([]); // [{id, x, y, t0}]
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

  // --- Morph Ripple Animation ---
  useEffect(() => {
    if (morphEvent && morphEvent.nodeIds && morphEvent.nodeIds.length > 0) {
      // Add ripples for each morphed node
      const t0 = Date.now();
      const newRipples = morphEvent.nodeIds.map(id => ({ id, x: positions[id]?.x, y: positions[id]?.y, t0 }));
      setRipples(ripples => [...ripples, ...newRipples]);
    }
  }, [morphEvent]);
  // Animate ripples (fade out after 1s)
  useEffect(() => {
    if (!ripples.length) return;
    const interval = setInterval(() => {
      setRipples(ripples => ripples.filter(r => Date.now() - r.t0 < 1000));
    }, 60);
    return () => clearInterval(interval);
  }, [ripples]);

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
      onSelectionChange(inRect);
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
    onSelectionChange([nodeId]);
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
        {/* Edges: visual encoding for coupling (weight) */}
        {graph.edges.map(e => (
          <line
            key={e.id}
            x1={positions[e.source]?.x}
            y1={positions[e.source]?.y}
            x2={positions[e.target]?.x}
            y2={positions[e.target]?.y}
            stroke={edgeColor(e.coupling || e.weight)}
            strokeWidth={2 + 8 * (e.coupling || e.weight || 0.5)}
            opacity={0.6 + 0.3 * (e.coupling || e.weight || 0.5)}
          />
        ))}
        {/* Morph ripple animation */}
        {ripples.map(r => {
          const elapsed = Math.min(1, (Date.now() - r.t0) / 1000);
          const radius = 30 + 60 * elapsed;
          const opacity = 0.5 * (1 - elapsed);
          return (
            <circle
              key={`${r.id}_${r.t0}`}
              cx={r.x}
              cy={r.y}
              r={radius}
              fill="none"
              stroke="#FFD700"
              strokeWidth={4}
              opacity={opacity}
              style={{ pointerEvents: "none" }}
            />
          );
        })}
        {/* Nodes: phase (color), usage (size), entropy (overlay), phase-locking */}
        {graph.nodes.map(n => (
          <g key={n.id}>
            {/* Entropy overlay: glow or icon */}
            {n.entropy > 0.5 && (
              <circle
                cx={positions[n.id]?.x}
                cy={positions[n.id]?.y}
                r={28 + (n.usage || 0) * 14}
                fill={entropyOverlay(n.entropy)}
                opacity={0.18 + 0.4 * n.entropy}
                style={{ filter: `blur(${2 + 8 * n.entropy}px)` }}
              />
            )}
            <circle
              cx={positions[n.id]?.x}
              cy={positions[n.id]?.y}
              r={18 + (n.usage || 0) * 10}
              fill={phaseToColor(n.phase)}
              stroke={selected.includes(n.id) ? "#FFD700" : phaseLockNodes.includes(n.id) ? "#00FFCC" : "#00FFCC"}
              strokeWidth={selected.includes(n.id) ? 4 : phaseLockNodes.includes(n.id) ? 6 : 2}
              style={{
                cursor: "pointer",
                filter: phaseLockNodes.includes(n.id)
                  ? "drop-shadow(0 0 12px #00FFCC)"
                  : undefined,
                transition: "r 0.2s, fill 0.2s"
              }}
              onPointerDown={e => handleNodePointerDown(e, n.id)}
              onClick={e => handleNodeClick(e, n.id)}
            >
              <title>{n.label}</title>
            </circle>
          </g>
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
function edgeColor(coupling) {
  if (typeof coupling !== "number") return "#A9B1BD";
  const teal = [0, 255, 200];
  const gray = [169, 177, 189];
  const mix = (a, b, t) => Math.round(a * t + b * (1 - t));
  const r = mix(teal[0], gray[0], 1 - coupling);
  const g = mix(teal[1], gray[1], 1 - coupling);
  const b = mix(teal[2], gray[2], 1 - coupling);
  return `rgb(${r},${g},${b})`;
}
function entropyOverlay(entropy) {
  if (typeof entropy !== "number") return "none";
  if (entropy < 0.25) return "none";
  const pink = [255, 0, 127];
  const alpha = 0.3 + 0.5 * entropy;
  return `rgba(${pink[0]},${pink[1]},${pink[2]},${alpha})`;
}
