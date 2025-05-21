// synchronizedOverlayAnimator.tsx
// Animates overlays in sync with the animated legendarium and mythic map
import React, { useEffect } from 'react';

export default function SynchronizedOverlayAnimator({ content, onClose, onSync, legendariumPulse, mapPulse }) {
  useEffect(() => {
    // Trigger legendarium and map pulse when overlay appears
    if (legendariumPulse) legendariumPulse();
    if (mapPulse) mapPulse();
    if (onSync) onSync();
  }, [legendariumPulse, mapPulse, onSync]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(25, 25, 41, 0.86)',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.7s',
    }}>
      <div style={{
        background: '#23233a',
        color: '#fff',
        borderRadius: 22,
        padding: 38,
        minWidth: 420,
        maxWidth: 700,
        boxShadow: '0 2px 24px #000a',
        fontFamily: 'serif',
        fontSize: '1.09em',
        lineHeight: 1.6,
        position: 'relative',
        textAlign: 'center',
        animation: 'overlayPop 0.8s',
      }}>
        <div style={{ color: '#ffe44e', fontWeight: 600, fontSize: '1.18em', marginBottom: 14 }}>
          Living Archive Chronicle
        </div>
        <div style={{ whiteSpace: 'pre-line', color: '#b2f7ef', marginBottom: 18 }}>{content}</div>
        <button onClick={onClose} style={{
          marginTop: 12,
          background: '#ffe44e',
          color: '#23233a',
          border: 'none',
          borderRadius: 8,
          padding: '8px 18px',
          fontWeight: 700,
          fontSize: '1.03em',
          cursor: 'pointer',
          boxShadow: '0 1px 8px #ffe44e66',
        }}>Close</button>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes overlayPop {
          from { transform: scale(0.92); opacity: 0.7; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
