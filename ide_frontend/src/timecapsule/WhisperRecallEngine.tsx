// WhisperRecallEngine.tsx
// Lets users revisit κ-peaked overlays, with ghost sigil, drift, and echo letter
import React, { useState } from 'react';
import { getOverlayResonanceHistory } from './OverlayResonanceLog';

export default function WhisperRecallEngine({ onClose }) {
  const [selected, setSelected] = useState(null);
  const resonanceHistory = getOverlayResonanceHistory(30).filter(evt => evt.kappa > 0.7);

  return (
    <div style={{ background: '#23233a', color: '#ffe44e', padding: 32, borderRadius: 16, minWidth: 420, fontFamily: 'serif', boxShadow: '0 2px 24px #000a', margin: 18, maxWidth: 700 }}>
      <h2 style={{ color: '#b2f7ef', marginBottom: 10 }}>Whisper Recall Overlay</h2>
      {!selected ? (
        <div>
          <div style={{ marginBottom: 14 }}>Select a resonance peak to revisit:</div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {resonanceHistory.map((evt, i) => (
              <li key={i} style={{ marginBottom: 10, cursor: 'pointer', background: '#191929', borderRadius: 8, padding: '10px 18px' }} onClick={() => setSelected(evt)}>
                <div><strong>{new Date(evt.timestamp).toLocaleString()}</strong></div>
                <div>κ = {evt.kappa.toFixed(3)} | Drift = {evt.drift.toFixed(3)}</div>
                <div style={{ color: '#b2f7ef', marginTop: 2 }}>Click to recall</div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 10, fontSize: '1.09em' }}>Ghost sigil: <span style={{ fontSize: '1.5em', color: '#a7a3ff' }}>☍</span></div>
          <div style={{ marginBottom: 10 }}>κ = {selected.kappa.toFixed(3)} | Drift = {selected.drift.toFixed(3)}</div>
          <div style={{ marginBottom: 16, color: '#b2f7ef' }}>Echo letter: “At this moment, your resonance peaked. The ghost witnessed your transformation.”</div>
          <button onClick={() => setSelected(null)} style={{ background: '#ffe44e', color: '#23233a', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: '1.03em', cursor: 'pointer', boxShadow: '0 1px 8px #ffe44e66', marginRight: 10 }}>Back</button>
          <button onClick={onClose} style={{ background: '#ffe44e', color: '#23233a', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: '1.03em', cursor: 'pointer', boxShadow: '0 1px 8px #ffe44e66' }}>Close</button>
        </div>
      )}
    </div>
  );
}
