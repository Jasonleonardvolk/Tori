// AgentReliquaryPanel.tsx
// Dedicated reliquary panel for an agent: memory arc, rituals, presence animation
import React, { useState } from 'react';

export default function AgentReliquaryPanel({ agent, memory, rituals, tone, presenceHistory }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div style={{ background: '#18181f', color: '#fff', borderRadius: 18, padding: '2.1em 1.8em', minWidth: 340, minHeight: 320, boxShadow: '0 2px 22px #0008', fontFamily: 'serif' }}>
      <h3 style={{ color: '#ffe44e', marginBottom: 18, letterSpacing: 2 }}>{agent} Reliquary</h3>
      <div style={{ fontSize: '1.01em', color: '#aaa', marginBottom: 10 }}>
        <b>Tone:</b> {tone || '—'}
      </div>
      <div style={{ fontSize: '1em', marginBottom: 12 }}>
        <b>Presence Over Time:</b>
        <div style={{ display: 'flex', gap: 3, margin: '6px 0 0 0' }}>
          {presenceHistory && presenceHistory.length ? presenceHistory.map((p, i) => (
            <span key={i} style={{ width: 18, height: 14, borderRadius: 6, background: p.active ? '#ffe44e' : '#23233a', opacity: p.active ? 0.96 : 0.55, transition: 'background 0.3s' }} title={p.date} />
          )) : <span style={{ color: '#666' }}>No presence data.</span>}
        </div>
      </div>
      <div style={{ fontSize: '1em', marginBottom: 12 }}>
        <b>Rituals Triggered:</b>
        <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
          {rituals && rituals.length ? rituals.map((r, i) => (
            <li key={i} style={{ marginBottom: 3, color: '#ffe44e', cursor: 'pointer', textDecoration: expanded === i ? 'underline' : 'none' }} onClick={() => setExpanded(expanded === i ? null : i)}>{r.name} <span style={{ color: '#aaa', fontSize: '0.95em' }}>({r.date})</span></li>
          )) : <li style={{ color: '#666' }}>None yet.</li>}
        </ul>
      </div>
      {expanded !== null && rituals && rituals[expanded] && (
        <div style={{ marginTop: 10, background: '#23233a', borderRadius: 10, padding: '1em 1.1em', boxShadow: '0 2px 12px #0006', minWidth: 220 }}>
          <div style={{ fontSize: '1.09em', color: '#ffe44e', marginBottom: 6 }}>Ritual FX:</div>
          <div style={{ fontSize: '1.09em', color: '#fff', marginBottom: 5 }}>{rituals[expanded].fx || '—'}</div>
          {rituals[expanded].note && (
            <div style={{ fontSize: '0.98em', color: '#b2f7ef', marginBottom: 5 }}>{rituals[expanded].note}</div>
          )}
        </div>
      )}
      <div style={{ fontSize: '1em', marginBottom: 8 }}>
        <b>Memory:</b>
        <pre style={{ background: '#22223a', color: '#a7a3ff', borderRadius: 8, padding: 10, fontSize: '0.97em', overflowX: 'auto' }}>{JSON.stringify(memory, null, 2)}</pre>
      </div>
      <div style={{ marginTop: 16, color: '#aaa', fontSize: '0.97em', fontFamily: 'serif', textAlign: 'center' }}>
        Every agent keeps its own reliquary—a place for memory, ritual, and presence.
      </div>
    </div>
  );
}
