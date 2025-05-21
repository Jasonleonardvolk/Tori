// FrustrationHeatmap.tsx
// Visual replay of a "struggle arc"—loops, edits, overlays, and recovery
import React from 'react';

export default function FrustrationHeatmap({ loops, editCycles, overlays, recoveryMoment }) {
  return (
    <div style={{ background: '#23233a', color: '#fff', borderRadius: 20, padding: 28, minWidth: 340, maxWidth: 520, boxShadow: '0 2px 16px #0008', fontFamily: 'serif' }}>
      <h3 style={{ color: '#ffb347', marginBottom: 14, letterSpacing: 1, textAlign: 'center' }}>Frustration Heatmap</h3>
      <div style={{ marginBottom: 18 }}>
        <b>Loops:</b>
        <ul style={{ margin: '7px 0 0 18px', padding: 0 }}>
          {loops && loops.length ? loops.map((l, i) => (
            <li key={i} style={{ color: '#ffe44e', marginBottom: 3 }}>{l}</li>
          )) : <li style={{ color: '#666' }}>No loops recorded.</li>}
        </ul>
      </div>
      <div style={{ marginBottom: 18 }}>
        <b>Edit/Test Cycles:</b>
        <ul style={{ margin: '7px 0 0 18px', padding: 0 }}>
          {editCycles && editCycles.length ? editCycles.map((e, i) => (
            <li key={i} style={{ color: '#b2f7ef', marginBottom: 3 }}>{e}</li>
          )) : <li style={{ color: '#666' }}>No edit/test cycles.</li>}
        </ul>
      </div>
      <div style={{ marginBottom: 18 }}>
        <b>Overlays (timed):</b>
        <ul style={{ margin: '7px 0 0 18px', padding: 0 }}>
          {overlays && overlays.length ? overlays.map((o, i) => (
            <li key={i} style={{ color: '#a7a3ff', marginBottom: 3 }}>{o}</li>
          )) : <li style={{ color: '#666' }}>No overlays recorded.</li>}
        </ul>
      </div>
      <div style={{ margin: '18px 0 10px 0', color: '#b2f7ef', fontWeight: 600, textAlign: 'center', fontSize: '1.08em' }}>
        {recoveryMoment ? (
          <>But this was the moment you tried a new approach.<br /><span style={{ color: '#ffe44e' }}>The ghost remembers.</span></>
        ) : '—'}
      </div>
    </div>
  );
}
