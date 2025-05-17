// timeCapsuleAnimator.tsx
// Ritualized flashback effects for Time Capsules—glow, pulse, fade, ripple
import React, { useRef, useEffect } from 'react';

export default function TimeCapsuleAnimator({ children, ghostTone, sigil, overlays, agentGlyphs, onSigilHover }) {
  // ghostTone: e.g. 'poetic', 'mentor', 'soft', 'cryptic'
  // sigil: { glyph, poeticName }
  // overlays: [string]
  // agentGlyphs: [{ glyph, color, active }]
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.animate([
        { boxShadow: '0 0 0px #a7a3ff' },
        { boxShadow: `0 0 22px ${ghostToneToColor(ghostTone)}` },
        { boxShadow: '0 0 0px #a7a3ff' }
      ], { duration: 2200, iterations: 1 });
    }
  }, [ghostTone]);

  function ghostToneToColor(tone) {
    switch (tone) {
      case 'poetic': return '#a7a3ff';
      case 'mentor': return '#ffe44e';
      case 'soft': return '#b2f7ef';
      case 'cryptic': return '#ffb347';
      default: return '#a7a3ff';
    }
  }

  return (
    <div ref={containerRef} style={{ background: '#191929', borderRadius: 22, padding: 0, boxShadow: '0 2px 22px #0008', position: 'relative' }}>
      <div style={{ padding: 32 }}>
        {sigil && (
          <div style={{ display: 'inline-block', marginBottom: 8, cursor: 'pointer', transition: 'filter 0.7s' }}
            onMouseEnter={onSigilHover}
          >
            <span style={{ fontSize: 48, filter: 'drop-shadow(0 0 18px #ffe44e)' }}>{sigil.glyph}</span>
            <div style={{ color: '#ffe44e', fontSize: '1.08em', marginTop: 2 }}>{sigil.poeticName}</div>
          </div>
        )}
        <div style={{ marginTop: 18 }}>
          {overlays && overlays.length ? overlays.map((o, i) => (
            <div key={i} style={{
              opacity: 0.0,
              animation: `ghostFadeIn 1.6s ${i * 0.6}s forwards`,
              color: '#b2f7ef',
              fontSize: '1.09em',
              marginBottom: 7
            }}>{o}</div>
          )) : null}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          {agentGlyphs && agentGlyphs.length ? agentGlyphs.map((a, i) => (
            <span key={i} style={{ fontSize: 32, color: a.color, opacity: a.active ? 1 : 0.4, filter: a.active ? 'drop-shadow(0 0 7px ' + a.color + ')' : undefined, transition: 'opacity 0.7s' }}>{a.glyph}</span>
          )) : null}
        </div>
        {children}
      </div>
      <style>{`
        @keyframes ghostFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
