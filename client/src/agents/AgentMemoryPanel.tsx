// AgentMemoryPanel.tsx
// Base component to render an agent's mini memoir: what it witnessed, rituals, tone, recent quotes
import React from 'react';

export default function AgentMemoryPanel({ agent, memory, rituals, tone, recentQuotes }) {
  return (
    <div style={{ background: '#191929', color: '#fff', borderRadius: 14, padding: 24, minWidth: 260, boxShadow: '0 2px 16px #0008', fontFamily: 'serif' }}>
      <h4 style={{ color: '#ffe44e', margin: '0 0 8px 0', letterSpacing: 1 }}>{agent} Memoir</h4>
      <div style={{ fontSize: '1.01em', color: '#aaa', marginBottom: 10 }}>
        <b>Tone:</b> {tone || '—'}
      </div>
      <div style={{ fontSize: '1em', marginBottom: 12 }}>
        <b>Recent Quotes:</b>
        <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
          {recentQuotes && recentQuotes.length ? recentQuotes.map((q, i) => (
            <li key={i} style={{ marginBottom: 3, color: '#b2f7ef' }}>{q}</li>
          )) : <li style={{ color: '#666' }}>None yet.</li>}
        </ul>
      </div>
      <div style={{ fontSize: '1em', marginBottom: 12 }}>
        <b>Rituals Triggered:</b>
        <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
          {rituals && rituals.length ? rituals.map((r, i) => (
            <li key={i} style={{ marginBottom: 3, color: '#ffe44e' }}>{r}</li>
          )) : <li style={{ color: '#666' }}>None yet.</li>}
        </ul>
      </div>
      <div style={{ fontSize: '1em', marginBottom: 8 }}>
        <b>Memory:</b>
        <pre style={{ background: '#22223a', color: '#a7a3ff', borderRadius: 8, padding: 10, fontSize: '0.97em', overflowX: 'auto' }}>{JSON.stringify(memory, null, 2)}</pre>
      </div>
    </div>
  );
}
