// GhostReliquaryPanel.tsx
// Renders the ghost's archive capsule as a sacred, symbolic reliquary
import React, { useState } from 'react';

function loadArchive() {
  // Try to load .ghost.json from localStorage or prompt for file
  const local = localStorage.getItem('ghost_capsule');
  if (local) return JSON.parse(local);
  return null;
}

const stateColors = {
  'ascendant': '#a7a3ff',
  'luminous': '#ffe44e',
  'dormant': '#aaa',
  'fragmented': '#ff5a5a',
  'watchful': '#b2f7ef',
  'awake': '#4ef0ff',
  'mentor': '#b2f7ef',
  'oracular': '#7e5fff',
  'chaotic': '#ff5a5a',
  'mystic': '#a080ff',
  'dreaming': '#a7a3ff',
  'unsettled': '#ffb347',
  'default': '#888'
};

function stateBand(states) {
  return (
    <div style={{ display: 'flex', gap: 6, margin: '0 0 18px 0' }}>
      {states.map((s, i) => (
        <div key={s + '-' + i} style={{ width: 28, height: 18, borderRadius: 7, background: stateColors[s] || '#888', opacity: 0.84, boxShadow: '0 1px 6px #0004' }} title={s} />
      ))}
    </div>
  );
}

function ritualGlyph(overlayId) {
  if (!overlayId) return '●';
  if (overlayId.includes('ascendant')) return '✧';
  if (overlayId.includes('archive')) return '⧫';
  if (overlayId.includes('echo')) return '∞';
  if (overlayId.includes('first_echo')) return '⟁';
  if (overlayId.includes('ghost_types_back')) return '☍';
  if (overlayId.includes('session_stretch')) return '⟁';
  if (overlayId.includes('forgotten_zone')) return '⟁';
  return '●';
}

export default function GhostReliquaryPanel() {
  const [archive, setArchive] = useState(loadArchive());
  const [expanded, setExpanded] = useState<number | null>(null);
  if (!archive) {
    return <div style={{ color: '#888', fontStyle: 'italic', padding: 32, textAlign: 'center' }}>No ghost archive found.<br />Export a .ghost.json capsule to view your reliquary.</div>;
  }
  const { states, overlays, letters, phases, finalLine } = archive;
  return (
    <div style={{ background: '#15151d', color: '#f6f6ff', padding: '2.2em 2em', borderRadius: 22, maxWidth: 600, minHeight: 420, boxShadow: '0 2px 32px #000a', fontFamily: 'serif' }}>
      <h2 style={{ color: '#ffe44e', marginBottom: 18, letterSpacing: 2, fontFamily: 'serif' }}>Ghost Reliquary</h2>
      <div style={{ marginBottom: 18 }}>{stateBand(states)}</div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#8cf', margin: '0 0 7px 0' }}>Rituals</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {overlays.filter(e => e.overlayId && ritualGlyph(e.overlayId) !== '●').map((e, i) => (
              <span key={e.timestamp + '-' + i} style={{ fontSize: 28, cursor: 'pointer', color: '#ffe44e', opacity: expanded === i ? 1 : 0.75, transition: 'opacity 0.2s' }} title={e.overlayId} onClick={() => setExpanded(expanded === i ? null : i)}>
                {ritualGlyph(e.overlayId)}
              </span>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#a7a3ff', margin: '0 0 7px 0' }}>Letters</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {letters.map((l, i) => (
              <span key={l.timestamp + '-' + i} style={{ fontSize: 22, cursor: 'pointer', color: '#a7a3ff', opacity: expanded === 1000 + i ? 1 : 0.7, transition: 'opacity 0.2s' }} title={l.overlayId} onClick={() => setExpanded(expanded === 1000 + i ? null : 1000 + i)}>
                📝
              </span>
            ))}
          </div>
        </div>
      </div>
      {expanded !== null && expanded < overlays.length && overlays[expanded] && (
        <div style={{ marginTop: 18, background: '#23233a', borderRadius: 12, padding: '1.1em 1.3em', boxShadow: '0 2px 12px #0006', minWidth: 320 }}>
          <div style={{ fontSize: '1.09em', color: '#ffe44e', marginBottom: 6 }}>Ritual:</div>
          <div style={{ fontSize: '1.09em', color: '#fff', marginBottom: 5 }}>{overlays[expanded].phrase}</div>
          <div style={{ fontSize: '0.98em', color: '#b2f7ef', marginBottom: 5 }}>Mood: {overlays[expanded].mood.persona}{overlays[expanded].mood.blend ? ' → ' + overlays[expanded].mood.blend.join(' → ') : ''}</div>
          {overlays[expanded].conceptContext && (
            <div style={{ fontSize: '0.93em', color: '#8cf', marginBottom: 5 }}>Context: {overlays[expanded].conceptContext}</div>
          )}
          {overlays[expanded].overlayId && (
            <div style={{ fontSize: '0.93em', color: '#aaa', marginBottom: 5 }}>Overlay: {overlays[expanded].overlayId}</div>
          )}
          {overlays[expanded].extra?.fx && (
            <div style={{ fontSize: '0.93em', color: '#a7a3ff', marginBottom: 5 }}>FX: {overlays[expanded].extra.fx}</div>
          )}
          {overlays[expanded].extra?.sound && (
            <div style={{ fontSize: '0.93em', color: '#4ef0ff', marginBottom: 5 }}>Sound: {overlays[expanded].extra.sound}</div>
          )}
          {overlays[expanded].mood?.reason && (
            <div style={{ fontSize: '0.91em', color: '#888', marginTop: 4 }}><i>{overlays[expanded].mood.reason}</i></div>
          )}
        </div>
      )}
      {expanded !== null && expanded >= 1000 && letters[expanded - 1000] && (
        <div style={{ marginTop: 18, background: '#23233a', borderRadius: 12, padding: '1.1em 1.3em', boxShadow: '0 2px 12px #0006', minWidth: 320 }}>
          <div style={{ fontSize: '1.09em', color: '#a7a3ff', marginBottom: 6 }}>Letter:</div>
          <div style={{ fontSize: '1.09em', color: '#fff', marginBottom: 5, whiteSpace: 'pre-line' }}>{letters[expanded - 1000].phrase}</div>
          <div style={{ fontSize: '0.98em', color: '#b2f7ef', marginBottom: 5 }}>Mood: {letters[expanded - 1000].mood.persona}{letters[expanded - 1000].mood.blend ? ' → ' + letters[expanded - 1000].mood.blend.join(' → ') : ''}</div>
          {letters[expanded - 1000].conceptContext && (
            <div style={{ fontSize: '0.93em', color: '#8cf', marginBottom: 5 }}>Context: {letters[expanded - 1000].conceptContext}</div>
          )}
          {letters[expanded - 1000].overlayId && (
            <div style={{ fontSize: '0.93em', color: '#aaa', marginBottom: 5 }}>Overlay: {letters[expanded - 1000].overlayId}</div>
          )}
          {letters[expanded - 1000].extra?.fx && (
            <div style={{ fontSize: '0.93em', color: '#a7a3ff', marginBottom: 5 }}>FX: {letters[expanded - 1000].extra.fx}</div>
          )}
          {letters[expanded - 1000].extra?.sound && (
            <div style={{ fontSize: '0.93em', color: '#4ef0ff', marginBottom: 5 }}>Sound: {letters[expanded - 1000].extra.sound}</div>
          )}
          {letters[expanded - 1000].mood?.reason && (
            <div style={{ fontSize: '0.91em', color: '#888', marginTop: 4 }}><i>{letters[expanded - 1000].mood.reason}</i></div>
          )}
        </div>
      )}
      <div style={{ marginTop: 32, color: '#ffe44e', fontSize: '1.07em', fontFamily: 'serif', textAlign: 'center', opacity: 0.8 }}>
        {finalLine}
      </div>
      <div style={{ marginTop: 18, color: '#aaa', fontSize: '0.97em', fontFamily: 'serif', textAlign: 'center' }}>
        The ghost remembers all. This is where it keeps it safe.
      </div>
    </div>
  );
}
