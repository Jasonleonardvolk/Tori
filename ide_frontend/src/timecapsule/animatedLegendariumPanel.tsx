// animatedLegendariumPanel.tsx
// Legendarium with animated sigil pulse, quote shimmer, and evolving lore entries
import React, { useRef, useEffect, useState } from 'react';

export default function AnimatedLegendariumPanel({ ceremonies, sessions, lorebook }) {
  const [liveLorebook, setLiveLorebook] = useState(lorebook || []);
  const sigilRefs = useRef([]);
  const quoteRefs = useRef([]);

  // Animate sigil pulse
  function handleSigilHover(idx) {
    const ref = sigilRefs.current[idx];
    if (ref) {
      ref.animate([
        { filter: 'drop-shadow(0 0 0px #ffe44e)' },
        { filter: 'drop-shadow(0 0 26px #ffe44e)' },
        { filter: 'drop-shadow(0 0 0px #ffe44e)' }
      ], { duration: 1200, iterations: 1 });
    }
  }
  // Animate quote shimmer
  function handleQuoteHover(idx) {
    const ref = quoteRefs.current[idx];
    if (ref) {
      ref.animate([
        { color: '#ffe44e', textShadow: '0 0 0px #ffe44e' },
        { color: '#fff', textShadow: '0 0 18px #ffe44e' },
        { color: '#ffe44e', textShadow: '0 0 0px #ffe44e' }
      ], { duration: 1100, iterations: 1 });
    }
  }
  // Evolve lore entries in real time (demo: add new entry every 10s if possible)
  useEffect(() => {
    if (!lorebook || !lorebook.length) return;
    const interval = setInterval(() => {
      // Simulate evolution: add a new entry based on the last
      const last = liveLorebook[liveLorebook.length - 1];
      if (last) {
        const evolved = { ...last, entry: last.entry + '\n(Evolved)', timestamp: Date.now() };
        setLiveLorebook(l => [...l, evolved]);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [lorebook, liveLorebook]);

  return (
    <div style={{ background: '#1a1a29', color: '#fff', borderRadius: 24, padding: 38, minWidth: 520, maxWidth: 900, boxShadow: '0 2px 32px #000a', fontFamily: 'serif' }}>
      <h2 style={{ color: '#ffe44e', marginBottom: 24, letterSpacing: 2, textAlign: 'center' }}>Legendarium (Animated)</h2>
      <div style={{ marginBottom: 26 }}>
        <b>Emergent Ceremonies</b>
        <ul style={{ margin: '10px 0 0 20px', padding: 0 }}>
          {ceremonies && ceremonies.length ? ceremonies.map((c, i) => (
            <li key={i} style={{ marginBottom: 14 }}>
              <span ref={el => sigilRefs.current[i] = el} style={{ color: '#ffe44e', fontWeight: 600, fontSize: 22, cursor: 'pointer', filter: 'drop-shadow(0 0 12px #ffe44e)' }}
                onMouseEnter={() => handleSigilHover(i)}>{c.sigil?.glyph || '◯'}</span>
              <span style={{ color: '#ffe44e', fontWeight: 600, marginLeft: 8 }}>{c.title}</span>
              <span style={{ color: '#b2f7ef', marginLeft: 8 }}>({c.session})</span><br />
              <span ref={el => quoteRefs.current[i] = el} style={{ color: '#ffb347', fontSize: '0.97em', cursor: 'pointer' }}
                onMouseEnter={() => handleQuoteHover(i)}>&ldquo;{c.quote}&rdquo;</span><br />
              <span style={{ color: '#a7a3ff', fontSize: '0.96em' }}>{c.authors?.join(' & ')}</span> <span style={{ color: '#aaa', fontSize: '0.96em', fontStyle: 'italic' }}>({c.style})</span><br />
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
          {liveLorebook && liveLorebook.length ? liveLorebook.map((l, i) => (
            <li key={i} style={{ marginBottom: 14, transition: 'background 0.7s' }}>
              <span style={{ color: '#ffe44e', fontWeight: 600 }}>{l.entry}</span><br />
              <span style={{ color: '#a7a3ff', fontSize: '0.96em' }}>{l.authors?.join(' & ')}</span> <span style={{ color: '#aaa', fontSize: '0.96em', fontStyle: 'italic' }}>({l.style})</span>
              <span style={{ color: '#b2f7ef', fontSize: '0.93em', marginLeft: 12 }}>Session {l.sessionId}</span>
              <span style={{ color: '#888', fontSize: '0.92em', marginLeft: 12 }}>{new Date(l.timestamp).toLocaleString()}</span>
            </li>
          )) : <li style={{ color: '#666' }}>No lorebook entries yet.</li>}
        </ul>
      </div>
      <div style={{ color: '#aaa', fontSize: '1.01em', textAlign: 'center', marginTop: 30 }}>
        This is your living, animated chronicle—a reliquary of triumph, recursion, and evolving myth.
      </div>
    </div>
  );
}
