// ResonanceReplayViewer.tsx
// Timeline viewer for resonance (κ, H, delay), overlays, and creative inflection points
import React, { useMemo } from 'react';
import { getOverlayResonanceHistory } from './OverlayResonanceLog';

export default function ResonanceReplayViewer({ onClose }) {
  const resonanceHistory = useMemo(() => getOverlayResonanceHistory(50), []);
  return (
    <div style={{ background: '#191929', color: '#ffe44e', padding: 32, borderRadius: 18, minWidth: 520, fontFamily: 'serif', boxShadow: '0 2px 32px #000a', margin: 28, maxWidth: 800 }}>
      <h2 style={{ color: '#b2f7ef', marginBottom: 12 }}>Resonance Replay Viewer</h2>
      <div style={{ marginBottom: 18, fontSize: '1.1em' }}>
        Relive your creative rhythm: overlays, whispers, and inflection points, mapped in time.
      </div>
      <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 18 }}>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {resonanceHistory.map((evt, i) => (
            <li key={i} style={{ marginBottom: 10, background: evt.kappa > 0.7 ? '#23233a' : '#191929', borderRadius: 8, padding: '10px 18px', boxShadow: evt.kappa > 0.7 ? '0 1px 8px #ffe44e33' : 'none' }}>
              <div><strong>{new Date(evt.timestamp).toLocaleString()}</strong></div>
              <div>κ = {evt.kappa.toFixed(3)} | H = {evt.H.toFixed(3)} | Delay = {evt.T.toFixed(3)} | Drift = {evt.drift.toFixed(3)}</div>
              {evt.kappa > 0.7 && <div style={{ color: '#b2f7ef', marginTop: 4 }}>Overlay Triggered</div>}
            </li>
          ))}
        </ul>
      </div>
      <button onClick={onClose} style={{ background: '#ffe44e', color: '#23233a', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: '1.09em', cursor: 'pointer', boxShadow: '0 1px 8px #ffe44e66' }}>Close</button>
    </div>
  );
}
