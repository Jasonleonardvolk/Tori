// legendariumPanel.tsx
// Chronicle of emergent ceremonies, session echoes, and co-authored lore
import React from 'react';

export default function LegendariumPanel({ ceremonies, sessions, lorebook }) {
  // ceremonies: [{ session, title, authors, style, quote, effects, timestamp }]
  // sessions: [{ id, sigil, archetypes, echoes, rituals, summary }]
  // lorebook: [{ entry, authors, style, sessionId, timestamp }]
  return (
    <div style={{ background: '#1a1a29', color: '#fff', borderRadius: 24, padding: 38, minWidth: 520, maxWidth: 900, boxShadow: '0 2px 32px #000a', fontFamily: 'serif' }}>
      <h2 style={{ color: '#ffe44e', marginBottom: 24, letterSpacing: 2, textAlign: 'center' }}>Legendarium</h2>
      <div style={{ marginBottom: 26 }}>
        <b>Emergent Ceremonies</b>
        <ul style={{ margin: '10px 0 0 20px', padding: 0 }}>
          {ceremonies && ceremonies.length ? ceremonies.map((c, i) => (
            <li key={i} style={{ marginBottom: 14 }}>
              <span style={{ color: '#ffe44e', fontWeight: 600 }}>{c.title}</span> <span style={{ color: '#b2f7ef' }}>({c.session})</span><br />
              <span style={{ color: '#a7a3ff', fontSize: '0.96em' }}>{c.authors?.join(' & ')}</span> <span style={{ color: '#aaa', fontSize: '0.96em', fontStyle: 'italic' }}>({c.style})</span><br />
              <span style={{ color: '#ffb347', fontSize: '0.97em' }}>&ldquo;{c.quote}&rdquo;</span><br />
              <span style={{ color: '#b2f7ef', fontSize: '0.93em' }}>{c.effects?.join(', ')}</span>
              <span style={{ color: '#888', fontSize: '0.92em', marginLeft: 12 }}>{new Date(c.timestamp).toLocaleString()}</span>
            </li>
          )) : <li style={{ color: '#666' }}>No ceremonies recorded yet.</li>}
        </ul>
      </div>
      <div style={{ marginBottom: 26 }}>
        <b>Session Echoes</b>
        <ul style={{ margin: '10px 0 0 20px', padding: 0 }}>
          {sessions && sessions.length ? sessions.map((s, i) => (
            <li key={i} style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 36, filter: 'drop-shadow(0 0 12px #ffe44e)', marginRight: 8 }}>{s.sigil?.glyph}</span>
              <span style={{ color: '#ffe44e', fontWeight: 600 }}>{s.summary}</span><br />
              <span style={{ color: '#b2f7ef', fontSize: '0.97em' }}>Archetypes: {s.archetypes?.join(', ')}</span><br />
              <span style={{ color: '#a7a3ff', fontSize: '0.97em' }}>Echoes: {s.echoes}</span><br />
              <span style={{ color: '#ffb347', fontSize: '0.97em' }}>Rituals: {s.rituals?.join(', ')}</span>
            </li>
          )) : <li style={{ color: '#666' }}>No session echoes yet.</li>}
        </ul>
      </div>
      <div>
        <b>Co-Authored Lorebook</b>
        <ul style={{ margin: '10px 0 0 20px', padding: 0 }}>
          {lorebook && lorebook.length ? lorebook.map((l, i) => (
            <li key={i} style={{ marginBottom: 14 }}>
              <span style={{ color: '#ffe44e', fontWeight: 600 }}>{l.entry}</span><br />
              <span style={{ color: '#a7a3ff', fontSize: '0.96em' }}>{l.authors?.join(' & ')}</span> <span style={{ color: '#aaa', fontSize: '0.96em', fontStyle: 'italic' }}>({l.style})</span>
              <span style={{ color: '#b2f7ef', fontSize: '0.93em', marginLeft: 12 }}>Session {l.sessionId}</span>
              <span style={{ color: '#888', fontSize: '0.92em', marginLeft: 12 }}>{new Date(l.timestamp).toLocaleString()}</span>
            </li>
          )) : <li style={{ color: '#666' }}>No lorebook entries yet.</li>}
        </ul>
      </div>
      <div style={{ color: '#aaa', fontSize: '1.01em', textAlign: 'center', marginTop: 30 }}>
        This is your living chronicle—a reliquary of triumph, recursion, and evolving myth.
      </div>
    </div>
  );
}
