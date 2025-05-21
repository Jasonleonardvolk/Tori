// ConceptEvolutionTracker.tsx
// Tracks function/zone evolution: lines, renames, overlays, tone
import React from 'react';

export default function ConceptEvolutionTracker({ conceptName, history }) {
  // history: [{ name, lines, overlays, tone, date }]
  return (
    <div style={{ background: '#18181f', color: '#fff', borderRadius: 18, padding: 28, minWidth: 340, maxWidth: 540, boxShadow: '0 2px 18px #0008', fontFamily: 'serif' }}>
      <h3 style={{ color: '#a7a3ff', marginBottom: 14, letterSpacing: 1, textAlign: 'center' }}>Concept Evolution</h3>
      <div style={{ marginBottom: 14, color: '#ffe44e', fontSize: '1.13em', textAlign: 'center' }}>{conceptName}</div>
      <div style={{ marginBottom: 16 }}>
        <b>Evolution Timeline:</b>
        <ul style={{ margin: '7px 0 0 18px', padding: 0 }}>
          {history && history.length ? history.map((h, i) => (
            <li key={i} style={{ marginBottom: 9 }}>
              <span style={{ color: '#b2f7ef', fontWeight: 600 }}>{h.date}:</span> <span style={{ color: '#ffe44e' }}>{h.name}</span><br />
              <span style={{ color: '#aaa', fontSize: '0.97em' }}>Lines: {h.lines}</span><br />
              <span style={{ color: '#a7a3ff', fontSize: '0.97em' }}>Tone: {h.tone}</span><br />
              {h.overlays && h.overlays.length ? (
                <span style={{ color: '#ffb347', fontSize: '0.97em' }}>Overlays: {h.overlays.join(', ')}</span>
              ) : null}
            </li>
          )) : <li style={{ color: '#666' }}>No evolution data.</li>}
        </ul>
      </div>
      {history && history.length > 1 && (
        <div style={{ color: '#ffe44e', fontSize: '1.08em', marginTop: 16, textAlign: 'center', fontStyle: 'italic' }}>
          “It stopped being a fix. It became a form.”
        </div>
      )}
    </div>
  );
}
