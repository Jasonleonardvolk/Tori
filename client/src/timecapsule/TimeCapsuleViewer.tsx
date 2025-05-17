// TimeCapsuleViewer.tsx
// A snapshot UI for memory, overlays, agent presence, and session sigil
import React from 'react';

export default function TimeCapsuleViewer({ overlays, letters, agentMemory, zoneHistory, mindsetArc, frictionRecovery, tonalDrift, agentPresence, sessionSigil }) {
  return (
    <div style={{ background: '#191929', color: '#fff', borderRadius: 22, padding: 32, minWidth: 380, maxWidth: 540, boxShadow: '0 2px 22px #0008', fontFamily: 'serif' }}>
      <h2 style={{ color: '#ffe44e', marginBottom: 18, letterSpacing: 2, textAlign: 'center' }}>Time Capsule</h2>
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        {sessionSigil && (
          <div style={{ display: 'inline-block', marginBottom: 8 }}>
            <span style={{ fontSize: 48, filter: 'drop-shadow(0 0 14px #ffe44e)' }}>{sessionSigil.glyph}</span>
            <div style={{ color: '#ffe44e', fontSize: '1.08em', marginTop: 2 }}>{sessionSigil.poeticName}</div>
          </div>
        )}
      </div>
      <div style={{ marginBottom: 16 }}>
        <b>Mindset Arc:</b> <span style={{ color: '#b2f7ef' }}>{mindsetArc || '—'}</span>
      </div>
      <div style={{ marginBottom: 16 }}>
        <b>Friction Recovery:</b> <span style={{ color: '#ffb347' }}>{frictionRecovery || '—'}</span>
      </div>
      <div style={{ marginBottom: 16 }}>
        <b>Tonal Drift:</b> <span style={{ color: '#a7a3ff' }}>{tonalDrift || '—'}</span>
      </div>
      <div style={{ marginBottom: 18 }}>
        <b>Agent Presence Map:</b>
        <div style={{ display: 'flex', gap: 7, marginTop: 7 }}>
          {agentPresence && agentPresence.length ? agentPresence.map((a, i) => (
            <span key={i} title={a.agent} style={{ width: 22, height: 22, borderRadius: 11, background: a.active ? a.color : '#23233a', opacity: a.active ? 0.98 : 0.55, display: 'inline-block', border: '2px solid #fff', boxShadow: a.active ? '0 0 8px ' + a.color : undefined }} />
          )) : <span style={{ color: '#666' }}>No agent data.</span>}
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <b>Zone History:</b>
        <ul style={{ margin: '7px 0 0 18px', padding: 0 }}>
          {zoneHistory && zoneHistory.length ? zoneHistory.map((z, i) => (
            <li key={i} style={{ color: '#ffe44e', marginBottom: 3 }}>{z}</li>
          )) : <li style={{ color: '#666' }}>No zones recorded.</li>}
        </ul>
      </div>
      <div style={{ marginBottom: 18 }}>
        <b>Overlays:</b>
        <ul style={{ margin: '7px 0 0 18px', padding: 0 }}>
          {overlays && overlays.length ? overlays.map((o, i) => (
            <li key={i} style={{ color: '#b2f7ef', marginBottom: 3 }}>{o}</li>
          )) : <li style={{ color: '#666' }}>No overlays recorded.</li>}
        </ul>
      </div>
      <div style={{ marginBottom: 18 }}>
        <b>Letters:</b>
        <ul style={{ margin: '7px 0 0 18px', padding: 0 }}>
          {letters && letters.length ? letters.map((l, i) => (
            <li key={i} style={{ color: '#ffb347', marginBottom: 3 }}>{l}</li>
          )) : <li style={{ color: '#666' }}>No letters recorded.</li>}
        </ul>
      </div>
      <div style={{ color: '#aaa', fontSize: '0.97em', textAlign: 'center', marginTop: 16 }}>
        This is not a playback. This is a resonant re-experiencing of insight.
      </div>
    </div>
  );
}
