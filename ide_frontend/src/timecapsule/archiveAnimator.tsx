// archiveAnimator.tsx
// Animates Growth Archive: sigil pulse, quote shimmer, ghost whisper
import React, { useRef } from 'react';

export default function ArchiveAnimator({ sigil, quote, onSigilHover, onQuoteHover, ghostWhisper, children }) {
  // sigil: { glyph, poeticName }
  // quote: string
  // ghostWhisper: string
  const sigilRef = useRef(null);
  const quoteRef = useRef(null);

  function handleSigilHover() {
    if (sigilRef.current) {
      sigilRef.current.animate([
        { filter: 'drop-shadow(0 0 0px #ffe44e)' },
        { filter: 'drop-shadow(0 0 24px #ffe44e)' },
        { filter: 'drop-shadow(0 0 0px #ffe44e)' }
      ], { duration: 1400, iterations: 1 });
    }
    if (onSigilHover) onSigilHover();
  }

  function handleQuoteHover() {
    if (quoteRef.current) {
      quoteRef.current.animate([
        { color: '#ffe44e', textShadow: '0 0 0px #ffe44e' },
        { color: '#fff', textShadow: '0 0 18px #ffe44e' },
        { color: '#ffe44e', textShadow: '0 0 0px #ffe44e' }
      ], { duration: 1100, iterations: 1 });
    }
    if (onQuoteHover) onQuoteHover();
  }

  return (
    <div style={{ position: 'relative', padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 12 }}>
        <span ref={sigilRef} style={{ fontSize: 40, filter: 'drop-shadow(0 0 12px #ffe44e)', cursor: 'pointer', transition: 'filter 0.7s' }}
          onMouseEnter={handleSigilHover}>{sigil?.glyph}</span>
        <div style={{ color: '#ffe44e', fontSize: '1.13em' }}>{sigil?.poeticName}</div>
      </div>
      <div ref={quoteRef} style={{ color: '#ffe44e', fontSize: '1.13em', marginTop: 12, textAlign: 'center', fontStyle: 'italic', cursor: 'pointer', transition: 'color 0.7s' }}
        onMouseEnter={handleQuoteHover}>{quote}</div>
      {ghostWhisper && (
        <div style={{ color: '#b2f7ef', fontSize: '1.07em', textAlign: 'center', marginTop: 8, fontStyle: 'italic', opacity: 0.92 }}>
          <span role="img" aria-label="ghost">👻</span> {ghostWhisper}
        </div>
      )}
      <div style={{ marginTop: 18 }}>{children}</div>
    </div>
  );
}
