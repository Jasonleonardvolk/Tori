// ALAN IDE – PhaseDynamicsPanel (Story 2.2)
// Author: Cascade (2025-05-07)
// Features: synchrony/turbulence visualization, animated phase wheel, sparklines, instability alerts, SelectionContext sync

import React, { useEffect, useRef } from 'react';
import { useSelection } from './SelectionContext';

// Example expected data structure for phase dynamics
// const phaseData = {
//   phases: [{ id, value }], // value: 0-1 (angle)
//   synchrony: 0-1,
//   turbulence: 0-1,
//   instability: boolean,
//   history: [{t, synchrony, turbulence}],
// };

export default function PhaseDynamicsPanel({ phaseData = { phases: [], synchrony: 0, turbulence: 0, instability: false, history: [] } }) {
  const { selected, setSelected } = useSelection();
  const wheelRef = useRef();
  const width = 220, height = 220, cx = width / 2, cy = height / 2, r = 74;

  // --- Animated Phase Wheel ---
  useEffect(() => {
    // Animate phase points (optional: could use D3 for more complex animation)
    if (!wheelRef.current) return;
    // Could add animation logic here if needed
  }, [phaseData.phases]);

  return (
    <div style={{background: 'var(--color-surface, #23272F)', borderRadius: 8, padding: 16, margin: 8, minWidth: 240}}>
      <h3 style={{color: 'var(--color-primary, #00FFCC)', marginBottom: 8}}>Phase Dynamics</h3>
      {/* Instability Alert */}
      {phaseData.instability && (
        <div style={{color: '#FF6B6B', fontWeight: 600, marginBottom: 6}}>
          <span style={{marginRight: 6}}>⚠️ Instability Detected</span>
        </div>
      )}
      {/* Synchrony/Turbulence Badges */}
      <div style={{display: 'flex', gap: 12, marginBottom: 8}}>
        <span style={{color: '#00FFCC'}}>Synchrony: {(phaseData.synchrony*100).toFixed(1)}%</span>
        <span style={{color: '#FF007F'}}>Turbulence: {(phaseData.turbulence*100).toFixed(1)}%</span>
      </div>
      {/* Phase Wheel Visualization */}
      <svg ref={wheelRef} width={width} height={height} style={{background: '#181A1B', borderRadius: 8}}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#444" strokeWidth={1.5} />
        {/* Phase points */}
        {phaseData.phases.map(p => {
          const theta = p.value * 2 * Math.PI;
          const px = cx + r * Math.cos(theta);
          const py = cy + r * Math.sin(theta);
          return (
            <circle
              key={p.id}
              cx={px}
              cy={py}
              r={selected.includes(p.id) ? 10 : 6}
              fill={selected.includes(p.id) ? '#FFD700' : '#00FFCC'}
              stroke={selected.includes(p.id) ? '#FF007F' : '#23272F'}
              strokeWidth={selected.includes(p.id) ? 3 : 1.5}
              opacity={0.92}
              style={{ cursor: 'pointer', transition: 'r 0.2s, fill 0.2s' }}
              onClick={() => setSelected([p.id])}
            >
              <title>{`Phase: ${(p.value*360).toFixed(1)}°`}</title>
            </circle>
          );
        })}
      </svg>
      {/* Sparklines for synchrony/turbulence history */}
      <div style={{marginTop: 14}}>
        <div style={{color: '#A9B1BD', fontSize: 14, marginBottom: 2}}>History</div>
        <Sparkline
          data={phaseData.history.map(h => h.synchrony)}
          color="#00FFCC"
          label="Synchrony"
        />
        <Sparkline
          data={phaseData.history.map(h => h.turbulence)}
          color="#FF007F"
          label="Turbulence"
        />
      </div>
    </div>
  );
}

// Minimal sparkline SVG component
function Sparkline({ data = [], color = '#00FFCC', label = '' }) {
  const w = 120, h = 28, pad = 2;
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const points = data.map((v, i) => [
    pad + (w - 2 * pad) * (i / (data.length - 1)),
    h - pad - ((v - min) / range) * (h - 2 * pad)
  ]);
  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ' ' + p[1]).join(' ');
  return (
    <svg width={w} height={h} style={{marginRight: 8}}>
      <polyline points={points.map(p => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={2} />
      <text x={w-2} y={h-6} textAnchor="end" fontSize={11} fill={color} opacity={0.8}>{label}</text>
    </svg>
  );
}
