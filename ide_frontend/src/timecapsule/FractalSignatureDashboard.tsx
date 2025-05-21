// FractalSignatureDashboard.tsx
// Visualizes real-time Hurst tracking, drift arcs, overlay triggers, and the mathematical pulse of presence
import React, { useEffect, useState } from 'react';
import { getRecentFractalSignatures } from './fractalSignatureEngine';
import { namingDrift } from './fractalMathLibrary';

export default function FractalSignatureDashboard({ driftHistory, overlayEvents }) {
  const [signatures, setSignatures] = useState([]);
  useEffect(() => {
    setSignatures(getRecentFractalSignatures(8));
  }, []);

  return (
    <div style={{ background: '#191929', color: '#ffe44e', padding: 24, borderRadius: 16, minWidth: 420, fontFamily: 'serif', boxShadow: '0 2px 24px #000a', margin: 18 }}>
      <h2 style={{ color: '#b2f7ef', marginBottom: 8 }}>Fractal Signature Dashboard</h2>
      <div style={{ marginBottom: 18 }}>
        <strong>Recent Session Hurst Exponents:</strong>
        <ul>
          {signatures.map(sig => (
            <li key={sig.sessionId} style={{ color: sig.signature === 'persistent' ? '#9cff8f' : sig.signature === 'anti-persistent' ? '#ffb2b2' : '#ffe44e' }}>
              Session {sig.sessionId}: H = {sig.H.toFixed(3)} ({sig.signature})
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginBottom: 18 }}>
        <strong>Concept Drift Arcs:</strong>
        <ul>
          {driftHistory.map((drift, i) => (
            <li key={i} style={{ color: drift.value > 0.8 ? '#ffb2b2' : '#b2f7ef' }}>
              {drift.concept}: Drift = {drift.value.toFixed(3)}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Overlay Trigger Log:</strong>
        <ul>
          {overlayEvents.map((evt, i) => (
            <li key={i} style={{ color: evt.kappa > 0.7 ? '#9cff8f' : '#ffe44e' }}>
              [{new Date(evt.timestamp).toLocaleTimeString()}] κ={evt.kappa.toFixed(3)} | H={evt.H.toFixed(3)} | T={evt.T.toFixed(3)} | Drift={evt.drift.toFixed(3)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
