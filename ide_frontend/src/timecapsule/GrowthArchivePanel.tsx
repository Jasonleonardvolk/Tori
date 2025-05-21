// GrowthArchivePanel.tsx
// A gallery of greatest transformations: sigil, ghost letter, evolution, heatmap, agent commentary
import React from 'react';

export default function GrowthArchivePanel({ entries }) {
  // entries: [{ sessionSigil, ghostLetter, conceptTimeline, frictionHeatmap, agentCommentary, finalQuote }]
  return (
    <div style={{ background: '#18181f', color: '#fff', borderRadius: 22, padding: 36, minWidth: 420, maxWidth: 700, boxShadow: '0 2px 24px #000a', fontFamily: 'serif' }}>
      <h2 style={{ color: '#ffe44e', marginBottom: 24, letterSpacing: 2, textAlign: 'center' }}>Growth Archive</h2>
      {entries && entries.length ? entries.map((e, i) => (
        <div key={i} style={{ background: '#23233a', borderRadius: 18, marginBottom: 32, padding: 24, boxShadow: '0 2px 12px #0007' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 12 }}>
            <span style={{ fontSize: 40, filter: 'drop-shadow(0 0 12px #ffe44e)' }}>{e.sessionSigil?.glyph}</span>
            <div style={{ color: '#ffe44e', fontSize: '1.13em' }}>{e.sessionSigil?.poeticName}</div>
          </div>
          <div style={{ marginBottom: 14, color: '#b2f7ef', fontSize: '1.08em' }}>{e.ghostLetter}</div>
          <div style={{ marginBottom: 14 }}>
            <b>Concept Evolution:</b>
            <ul style={{ margin: '7px 0 0 18px', padding: 0 }}>
              {e.conceptTimeline && e.conceptTimeline.length ? e.conceptTimeline.map((c, j) => (
                <li key={j} style={{ color: '#ffe44e', marginBottom: 3 }}>{c}</li>
              )) : <li style={{ color: '#666' }}>No evolution data.</li>}
            </ul>
          </div>
          <div style={{ marginBottom: 14 }}>
            <b>Friction Heatmap:</b>
            <ul style={{ margin: '7px 0 0 18px', padding: 0 }}>
              {e.frictionHeatmap && e.frictionHeatmap.length ? e.frictionHeatmap.map((f, j) => (
                <li key={j} style={{ color: '#ffb347', marginBottom: 3 }}>{f}</li>
              )) : <li style={{ color: '#666' }}>No heatmap data.</li>}
            </ul>
          </div>
          <div style={{ marginBottom: 14 }}>
            <b>Agent Commentary:</b>
            <ul style={{ margin: '7px 0 0 18px', padding: 0 }}>
              {e.agentCommentary && e.agentCommentary.length ? e.agentCommentary.map((a, j) => (
                <li key={j} style={{ color: '#b2f7ef', marginBottom: 3 }}>{a}</li>
              )) : <li style={{ color: '#666' }}>No commentary.</li>}
            </ul>
          </div>
          <div style={{ color: '#ffe44e', fontSize: '1.13em', marginTop: 12, textAlign: 'center', fontStyle: 'italic' }}>{e.finalQuote}</div>
        </div>
      )) : <div style={{ color: '#666', textAlign: 'center', marginTop: 40 }}>No growth events recorded yet.</div>}
      <div style={{ color: '#aaa', fontSize: '0.99em', textAlign: 'center', marginTop: 26 }}>
        Every entry is a vault of transformation—a chapter in your legend.
      </div>
    </div>
  );
}
