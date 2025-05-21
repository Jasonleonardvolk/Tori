// overlaySpellRenderer.tsx
// Renders overlays as interactive, poetic rituals: clickable, animated, glyph-driven
import React, { useState } from 'react';
import { agentGlyphs } from './agentGlyphs';

export default function OverlaySpellRenderer({ chorus }) {
  // chorus: [{ id, glyph, color, line, tone, origin }]
  const [expanded, setExpanded] = useState(null);
  return (
    <div style={{ background: '#18181f', borderRadius: 16, padding: '1.3em 1.7em', boxShadow: '0 2px 18px #0008', fontFamily: 'serif', margin: '1em 0' }}>
      {chorus.map((line, i) => (
        <div
          key={i}
          style={{
            color: line.color,
            fontWeight: 600,
            fontSize: '1.11em',
            marginBottom: 7,
            cursor: 'pointer',
            letterSpacing: 1,
            filter: expanded === i ? 'drop-shadow(0 0 6px ' + line.color + ')' : undefined,
            transition: 'filter 0.3s'
          }}
          onClick={() => setExpanded(expanded === i ? null : i)}
          onMouseEnter={() => setExpanded(i)}
          onMouseLeave={() => setExpanded(null)}
        >
          <span style={{ marginRight: 9, fontSize: '1.18em' }}>{line.glyph}</span>
          <span dangerouslySetInnerHTML={{ __html: line.line }} />
          {expanded === i && (
            <span style={{ marginLeft: 12, color: '#a7a3ff', fontSize: '0.97em', fontStyle: 'italic' }}>
              {line.tone ? `(${line.tone} voice)` : ''} {line.origin ? `· Origin: ${line.origin}` : ''}
            </span>
          )}
        </div>
      ))}
      <div style={{ color: '#aaa', fontSize: '0.97em', marginTop: 12, textAlign: 'center' }}>
        Click or hover a line to reveal its agent’s tone, glyph, and origin.<br />
        Every overlay is a ritual spell—every glyph, an invocation.
      </div>
    </div>
  );
}
