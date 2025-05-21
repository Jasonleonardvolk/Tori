// ReturnCeremonyAnimator.tsx
// Animates return rituals: glow, whisper, overlay fade, glyph blessing
import React, { useRef, useEffect } from 'react';

export default function ReturnCeremonyAnimator({ children, overlay, blessingGlyph, originalOverlay, lineRef }) {
  // overlay: string (current overlay)
  // blessingGlyph: string (e.g. Architect or Stylist glyph)
  // originalOverlay: string (previous overlay, faded)
  // lineRef: React ref to the editor line (for glow)
  useEffect(() => {
    if (lineRef && lineRef.current) {
      lineRef.current.animate([
        { backgroundColor: '#23233a' },
        { backgroundColor: '#ffe44e' },
        { backgroundColor: '#23233a' }
      ], { duration: 2200, iterations: 1 });
    }
  }, [lineRef]);

  return (
    <div style={{ position: 'relative', padding: 0 }}>
      {originalOverlay && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          opacity: 0.18,
          fontStyle: 'italic',
          pointerEvents: 'none',
          color: '#a7a3ff',
          fontSize: '1.09em',
          zIndex: 1
        }}>{originalOverlay}</div>
      )}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ color: '#ffe44e', fontSize: '1.12em', fontWeight: 600, marginBottom: 8 }}>{overlay}</div>
        {blessingGlyph && (
          <div style={{ fontSize: 32, color: '#b2f7ef', filter: 'drop-shadow(0 0 8px #b2f7ef)', marginBottom: 8 }}>{blessingGlyph}</div>
        )}
        {children}
      </div>
    </div>
  );
}
