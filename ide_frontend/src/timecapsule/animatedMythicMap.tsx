// animatedMythicMap.tsx
// Fully animated mythic map: edges ripple, nodes pulse, overlays/ghost lines animate, dynamic expansion
import React, { useRef, useEffect } from 'react';

export default function AnimatedMythicMap({ nodes, edges, onNodeClick }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current) {
      // Animate edges: ripple effect
      const svg = svgRef.current;
      const lines = svg.querySelectorAll('line');
      lines.forEach((line, idx) => {
        line.animate([
          { strokeDasharray: '0, 100' },
          { strokeDasharray: '24, 100' },
          { strokeDasharray: '0, 100' }
        ], { duration: 2200 + idx * 120, iterations: Infinity });
      });
    }
  }, [edges]);

  // Dynamic expansion: add new nodes/edges based on prop changes
  // (Assume external logic updates nodes/edges arrays)

  return (
    <div style={{ background: '#18181f', color: '#fff', borderRadius: 22, padding: 24, minWidth: 480, maxWidth: 900, boxShadow: '0 2px 24px #000a', fontFamily: 'serif', position: 'relative' }}>
      <h2 style={{ color: '#a7a3ff', marginBottom: 18, letterSpacing: 2, textAlign: 'center' }}>Animated Mythic Map</h2>
      <svg ref={svgRef} width="100%" height={420} style={{ background: 'none', display: 'block', margin: '0 auto' }}>
        {edges && edges.map((e, i) => (
          <line key={i} x1={nodes[e.from].x} y1={nodes[e.from].y} x2={nodes[e.to].x} y2={nodes[e.to].y} stroke="#b2f7ef" strokeWidth={e.type === 'echo' ? 2.2 : 1.2} opacity={e.type === 'echo' ? 0.83 : 0.48} />
        ))}
        {nodes && nodes.map((n, i) => (
          <g key={i} onClick={() => onNodeClick && onNodeClick(n)} style={{ cursor: 'pointer' }}>
            <circle cx={n.x} cy={n.y} r={22} fill={n.type === 'zone' ? '#ffe44e' : n.type === 'function' ? '#a7a3ff' : '#b2f7ef'} opacity={0.96} style={{ filter: 'drop-shadow(0 0 14px #ffe44e)' }}>
              <animate attributeName="r" values="22;28;22" dur="2.2s" repeatCount="indefinite" />
            </circle>
            <text x={n.x} y={n.y + 6} textAnchor="middle" fontSize={18} fill="#191929">{n.sigil || n.label[0]}</text>
            {n.ghostLine && (
              <text x={n.x} y={n.y + 32} textAnchor="middle" fontSize={13} fill="#b2f7ef" opacity={0.93} style={{ fontStyle: 'italic', animation: 'ghostLineFade 2.7s infinite alternate' }}>{n.ghostLine}</text>
            )}
          </g>
        ))}
      </svg>
      <div style={{ marginTop: 18, textAlign: 'center', color: '#aaa', fontSize: '1.02em' }}>
        Click a node to jump to overlay, ghost line, or session sigil.
      </div>
      <style>{`
        @keyframes ghostLineFade {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
