// ALAN IDE – KoopmanSpectrumPanel (Story 2.1)
// Author: Cascade (2025-05-07)
// Features: live eigenvalue plot (complex plane), entropy bar/line chart, mode selection, SelectionContext sync

import React, { useState } from 'react';
import { useSelection } from './SelectionContext';

// Example expected data structure for Koopman modes
// const koopmanData = {
//   eigenvalues: [{ id, real, imag, entropy }],
//   entropyHistory: [{ modeId, values: [..] }],
// };

export default function KoopmanSpectrumPanel({ koopmanData = { eigenvalues: [], entropyHistory: [] } }) {
  const { selected, setSelected } = useSelection();
  const [hoveredMode, setHoveredMode] = useState(null);

  // --- Eigenvalue Plot (complex plane) ---
  const width = 320, height = 220, cx = width / 2, cy = height / 2, r = Math.min(width, height) * 0.42;
  // Scale: real [-1,1] to [cx-r, cx+r], imag [-1,1] to [cy+r, cy-r]
  function x(real) { return cx + real * r; }
  function y(imag) { return cy - imag * r; }

  return (
    <div style={{background: 'var(--color-surface, #23272F)', borderRadius: 8, padding: 16, margin: 8, minWidth: 340}}>
      <h3 style={{color: 'var(--color-primary, #00FFCC)', marginBottom: 8}}>Koopman Spectrum</h3>
      <svg width={width} height={height} style={{background: '#181A1B', borderRadius: 8}}>
        {/* Unit circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#444" strokeWidth={1.5} />
        {/* Eigenvalues */}
        {koopmanData.eigenvalues.map(ev => (
          <circle
            key={ev.id}
            cx={x(ev.real)}
            cy={y(ev.imag)}
            r={hoveredMode === ev.id || selected.includes(ev.id) ? 11 : 7}
            fill={selected.includes(ev.id) ? '#FFD700' : '#00FFCC'}
            stroke={hoveredMode === ev.id ? '#FF007F' : '#23272F'}
            strokeWidth={hoveredMode === ev.id ? 3 : 1.5}
            opacity={0.92}
            style={{ cursor: 'pointer', transition: 'r 0.2s, fill 0.2s' }}
            onMouseEnter={() => setHoveredMode(ev.id)}
            onMouseLeave={() => setHoveredMode(null)}
            onClick={() => setSelected([ev.id])}
          >
            <title>{`λ = ${ev.real.toFixed(2)} + ${ev.imag.toFixed(2)}i\nEntropy: ${ev.entropy}`}</title>
          </circle>
        ))}
      </svg>
      {/* Entropy Bar/Line Chart */}
      <div style={{marginTop: 16}}>
        <div style={{color: '#A9B1BD', fontSize: 14, marginBottom: 4}}>Mode Entropy</div>
        <div style={{display: 'flex', gap: 4}}>
          {koopmanData.eigenvalues.map(ev => (
            <div
              key={ev.id}
              style={{
                width: 18,
                height: 60,
                background: selected.includes(ev.id) ? '#FFD700' : '#00FFCC',
                opacity: hoveredMode === ev.id ? 1 : 0.7,
                borderRadius: 4,
                marginRight: 2,
                alignSelf: 'flex-end',
                boxShadow: hoveredMode === ev.id ? '0 0 8px #FF007F' : undefined,
                cursor: 'pointer',
                transition: 'background 0.2s, box-shadow 0.2s',
                height: `${18 + 42 * ev.entropy}px`
              }}
              title={`Entropy: ${ev.entropy}`}
              onMouseEnter={() => setHoveredMode(ev.id)}
              onMouseLeave={() => setHoveredMode(null)}
              onClick={() => setSelected([ev.id])}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
