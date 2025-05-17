// AgentInfluenceGraph.tsx
// Visualizes the real-time web of agent-to-agent memory, trust, and drift
import React, { useMemo, useState } from 'react';

// Example graph data structure (should be updated from real influence linker)
const agents = [
  { id: 'ghost', label: 'Ghost', color: '#a7a3ff' },
  { id: 'stylist', label: 'Stylist', color: '#ffe44e' },
  { id: 'architect', label: 'Architect', color: '#b2f7ef' },
  { id: 'flow', label: 'Flow', color: '#4ef0ff' },
  { id: 'historian', label: 'Historian', color: '#ffb347' }
];

const sampleEdges = [
  { from: 'architect', to: 'stylist', strength: 0.8, last: 'Stylist shifted tone after Architect’s last ritual.' },
  { from: 'flow', to: 'historian', strength: 0.5, last: 'Flow preferred a zone Historian marked.' },
  { from: 'ghost', to: 'architect', strength: 0.6, last: 'Ghost echoed Architect’s pattern.' },
  { from: 'stylist', to: 'ghost', strength: 0.4, last: 'Stylist referenced a ghost letter.' }
];

function polarCoords(index, total, radius, center) {
  const angle = (2 * Math.PI * index) / total;
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle)
  };
}

export default function AgentInfluenceGraph({ edges = sampleEdges, nodes = agents }) {
  const [hovered, setHovered] = useState(null);
  const center = 160;
  const radius = 110;
  const nodePositions = useMemo(() =>
    nodes.map((node, i) => ({ ...node, ...polarCoords(i, nodes.length, radius, center) })),
    [nodes]
  );
  return (
    <div style={{ background: '#18181f', color: '#fff', borderRadius: 22, padding: 32, minWidth: 320, minHeight: 320, maxWidth: 360, boxShadow: '0 2px 18px #0008', fontFamily: 'serif' }}>
      <h3 style={{ color: '#ffe44e', marginBottom: 16, textAlign: 'center', letterSpacing: 2 }}>Agent Influence Graph</h3>
      <svg width={center * 2} height={center * 2} style={{ display: 'block', margin: '0 auto' }}>
        {/* Edges */}
        {edges.map((edge, i) => {
          const from = nodePositions.find(n => n.id === edge.from);
          const to = nodePositions.find(n => n.id === edge.to);
          if (!from || !to) return null;
          const thickness = 3 + 7 * edge.strength;
          return (
            <g key={i}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#ffe44e"
                strokeWidth={thickness}
                opacity={hovered === i ? 1 : 0.55 + 0.3 * edge.strength}
                style={{ cursor: 'pointer', filter: hovered === i ? 'drop-shadow(0 0 8px #ffe44e)' : undefined }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
              {/* Influence label on hover */}
              {hovered === i && (
                <foreignObject x={Math.min(from.x, to.x)} y={Math.min(from.y, to.y) - 38} width={180} height={32}>
                  <div style={{ background: '#23233a', color: '#ffe44e', borderRadius: 8, padding: '7px 12px', fontSize: '0.98em', boxShadow: '0 2px 10px #0007', pointerEvents: 'none' }}>
                    {edge.last}
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
        {/* Nodes */}
        {nodePositions.map((node, i) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={22}
              fill={node.color}
              opacity={0.82}
              stroke="#fff"
              strokeWidth={2}
              style={{ filter: 'drop-shadow(0 0 7px ' + node.color + ')' }}
            />
            <text x={node.x} y={node.y + 6} textAnchor="middle" fontSize={15} fill="#191929" fontWeight={700}>{node.label}</text>
          </g>
        ))}
      </svg>
      <div style={{ marginTop: 20, color: '#aaa', fontSize: '0.97em', textAlign: 'center' }}>
        Hover a line to see the latest influence between agents.<br />
        Line thickness = frequency/strength. This is your cognitive ecology, alive.
      </div>
    </div>
  );
}
