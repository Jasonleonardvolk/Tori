// ALAN IDE – AttractorMapPanel (Story 2.3)
// Author: Cascade (2025-05-07)
// Features: attractor list, mini-map visualization, morph controls, SelectionContext sync

import React, { useState } from 'react';
import { useSelection } from './SelectionContext';

// Example expected data structure for attractors
// const attractorData = [
//   { id, label, resonance, phase, nodes: [nodeId], preview: { phases: [], resonance: [] } },
// ];

export default function AttractorMapPanel({ attractorData = [], onMorph = () => {} }) {
  const { selected, setSelected } = useSelection();
  const [hovered, setHovered] = useState(null);
  const [morphTarget, setMorphTarget] = useState(null);

  return (
    <div style={{background: 'var(--color-surface, #23272F)', borderRadius: 8, padding: 16, margin: 8, minWidth: 260}}>
      <h3 style={{color: 'var(--color-primary, #00FFCC)', marginBottom: 8}}>Attractor Map</h3>
      <div style={{maxHeight: 220, overflowY: 'auto'}}>
        {attractorData.map(attr => (
          <div
            key={attr.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 8,
              background: selected.includes(attr.id) ? 'rgba(0,255,200,0.13)' : hovered === attr.id ? 'rgba(255,127,127,0.09)' : undefined,
              borderRadius: 6, cursor: 'pointer', marginBottom: 4
            }}
            onMouseEnter={() => setHovered(attr.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setSelected([attr.id])}
          >
            <span style={{fontSize: 18}} role="img" aria-label="attractor">🧲</span>
            <div style={{flex: 1}}>
              <div style={{fontWeight: 600, color: '#FFD700'}}>{attr.label}</div>
              <div style={{fontSize: 13, color: '#A9B1BD'}}>
                Resonance: <b style={{color:'#00FFCC'}}>{attr.resonance}</b> | Phase: <b style={{color:'#FF007F'}}>{attr.phase}</b>
              </div>
            </div>
            {/* Mini-map preview */}
            <AttractorMiniMap preview={attr.preview} />
          </div>
        ))}
      </div>
      {/* Morph Controls */}
      <div style={{marginTop: 10, display: 'flex', alignItems: 'center', gap: 8}}>
        <select
          value={morphTarget || ''}
          onChange={e => setMorphTarget(e.target.value)}
          style={{padding: 4, borderRadius: 4, background: '#23272F', color: '#00FFCC'}}>
          <option value='' disabled>Choose morph target…</option>
          {attractorData.map(attr => (
            <option key={attr.id} value={attr.id}>{attr.label}</option>
          ))}
        </select>
        <button
          disabled={!morphTarget}
          style={{
            background: morphTarget ? '#00FFCC' : '#A9B1BD', color: '#23272F', border: 'none', borderRadius: 4, padding: '6px 12px', fontWeight: 600, cursor: morphTarget ? 'pointer' : 'not-allowed'
          }}
          onClick={() => morphTarget && onMorph(morphTarget)}
        >Morph</button>
      </div>
    </div>
  );
}

// Minimal attractor mini-map preview (phase dots)
function AttractorMiniMap({ preview = { phases: [] } }) {
  const w = 36, h = 36, cx = w/2, cy = h/2, r = 13;
  if (!preview.phases || !preview.phases.length) return <svg width={w} height={h}></svg>;
  return (
    <svg width={w} height={h}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#444" strokeWidth={1} />
      {preview.phases.map((p, i) => {
        const theta = p * 2 * Math.PI;
        const px = cx + r * Math.cos(theta);
        const py = cy + r * Math.sin(theta);
        return <circle key={i} cx={px} cy={py} r={2.5} fill="#00FFCC" />;
      })}
    </svg>
  );
}
