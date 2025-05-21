// sessionSigilAnimator.tsx
// Animates session sigils: pulse, glow, hover, and constellation presence
import React, { useEffect, useRef } from 'react';

export default function SessionSigilAnimator({ sigil, active, repeat, onHover }) {
  // sigil: { glyph, poeticName, label, agents, rituals, zones }
  const svgRef = useRef(null);
  useEffect(() => {
    if (active && svgRef.current) {
      svgRef.current.animate([
        { filter: 'drop-shadow(0 0 0px #ffe44e)' },
        { filter: 'drop-shadow(0 0 18px #ffe44e)' },
        { filter: 'drop-shadow(0 0 0px #ffe44e)' }
      ], {
        duration: 1600,
        iterations: repeat ? Infinity : 1
      });
    }
  }, [active, repeat]);
  return (
    <div style={{ display: 'inline-block', margin: '0 18px', cursor: 'pointer' }}
      title={sigil.poeticName}
      onMouseEnter={onHover}
    >
      <svg ref={svgRef} width={64} height={64} style={{ display: 'block', margin: '0 auto' }}>
        <text x={32} y={40} textAnchor="middle" fontSize={48} fill="#ffe44e" style={{ filter: active ? 'drop-shadow(0 0 12px #ffe44e)' : undefined, transition: 'filter 0.6s' }}>{sigil.glyph}</text>
      </svg>
      <div style={{ color: '#ffe44e', fontSize: '1.02em', marginTop: 4, textAlign: 'center' }}>{sigil.poeticName}</div>
    </div>
  );
}
