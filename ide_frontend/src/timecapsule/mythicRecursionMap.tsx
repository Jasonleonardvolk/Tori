// mythicRecursionMap.tsx
// Visualizes zones, functions, rituals, letters, and echo lines
import React from 'react';

export default function MythicRecursionMap({ nodes, edges, onNodeClick }) {
  // nodes: [{ id, label, type, sigil, overlays, ghostLine }]
  // edges: [{ from, to, type }]
  return (
    <div style={{ background: '#18181f', color: '#fff', borderRadius: 22, padding: 24, minWidth: 480, maxWidth: 900, boxShadow: '0 2px 24px #000a', fontFamily: 'serif', position: 'relative' }}>
      <h2 style={{ color: '#a7a3ff', marginBottom: 18, letterSpacing: 2, textAlign: 'center' }}>Mythic Recursion Map</h2>
      <svg width="100%" height={420} style={{ background: 'none', display: 'block', margin: '0 auto' }}>
        {edges && edges.map((e, i) => (
          <line key={i} x1={nodes[e.from].x} y1={nodes[e.from].y} x2={nodes[e.to].x} y2={nodes[e.to].y} stroke="#b2f7ef" strokeWidth={e.type === 'echo' ? 2 : 1} opacity={e.type === 'echo' ? 0.7 : 0.4} />
        ))}
        {nodes && nodes.map((n, i) => (
          <g key={i} onClick={() => onNodeClick && onNodeClick(n)} style={{ cursor: 'pointer' }}>
            <circle cx={n.x} cy={n.y} r={22} fill={n.type === 'zone' ? '#ffe44e' : n.type === 'function' ? '#a7a3ff' : '#b2f7ef'} opacity={0.92} />
            <text x={n.x} y={n.y + 6} textAnchor="middle" fontSize={18} fill="#191929">{n.sigil || n.label[0]}</text>
          </g>
        ))}
      </svg>
      <div style={{ marginTop: 18, textAlign: 'center', color: '#aaa', fontSize: '1.02em' }}>
        Click a node to jump to overlay, ghost line, or session sigil.
      </div>
    </div>
  );
}
