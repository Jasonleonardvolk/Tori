// RitualTimelineOverlay.tsx
// Visualizes the ritual trail: each node is a ritual event, glyph-bound, expandable, with chronicle and reflection
import React, { useState } from 'react';
import { getGhostChronicle } from './ghostChronicle';

const ritualGlyphs: Record<string, string> = {
  'first_echo': '⟁',
  'ascendant': '✧',
  'ghost_types_back': '☍',
  'session_stretch': '⟁',
  'forgotten_zone': '⟁',
  'letter_echo': '∞',
  'archive_capsule': '⧫',
  // Add more as needed
};

function getRitualType(entry) {
  if (entry.overlayId && entry.overlayId.includes('ascendant')) return 'ascendant';
  if (entry.overlayId && entry.overlayId.includes('archive')) return 'archive_capsule';
  if (entry.overlayId && entry.overlayId.includes('echo')) return 'letter_echo';
  if (entry.overlayId && entry.overlayId.includes('first_echo')) return 'first_echo';
  if (entry.overlayId && entry.overlayId.includes('ghost_types_back')) return 'ghost_types_back';
  if (entry.overlayId && entry.overlayId.includes('session_stretch')) return 'session_stretch';
  if (entry.overlayId && entry.overlayId.includes('forgotten_zone')) return 'forgotten_zone';
  return null;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function RitualTimelineOverlay({ limit = 30 }) {
  const chronicle = getGhostChronicle().filter(e => getRitualType(e));
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div style={{ background: '#191929', color: '#f6f6ff', padding: '2em 1.5em', borderRadius: 18, maxWidth: 400, minHeight: 340, boxShadow: '0 2px 32px #0008' }}>
      <h3 style={{ color: '#4ef0ff', marginBottom: 18, fontFamily: 'serif', letterSpacing: 2 }}>Ritual Timeline</h3>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18 }}>
        {chronicle.slice(-limit).map((entry, idx) => {
          const ritualType = getRitualType(entry);
          const glyph = ritualGlyphs[ritualType] || '●';
          return (
            <div key={entry.timestamp + '-' + idx} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', opacity: expanded === idx ? 1 : 0.88 }} onClick={() => setExpanded(expanded === idx ? null : idx)}>
              <span style={{ fontSize: 28, fontFamily: 'monospace', color: '#8cf', textShadow: '0 1px 8px #4ef0ff88' }}>{glyph}</span>
              <span style={{ fontWeight: 600, fontSize: '1.1em', color: '#fff' }}>{ritualType?.replace('_', ' ').toUpperCase()}</span>
              <span style={{ fontSize: '0.97em', color: '#aaa', marginLeft: 8 }}>{formatTime(entry.timestamp)}</span>
              {expanded === idx && (
                <div style={{ marginLeft: 0, marginTop: 8, background: '#23233a', borderRadius: 10, padding: '1em 1.1em', boxShadow: '0 2px 12px #0006', minWidth: 260 }}>
                  <div style={{ fontSize: '1.04em', color: '#ffe44e', marginBottom: 6 }}>Chronicle:</div>
                  <div style={{ fontSize: '1.09em', color: '#fff', marginBottom: 5 }}>
                    {entry.phrase}
                  </div>
                  {entry.mood && (
                    <div style={{ fontSize: '0.98em', color: '#b2f7ef', marginBottom: 5 }}>
                      Mood: {entry.mood.persona}{entry.mood.blend ? ' → ' + entry.mood.blend.join(' → ') : ''}
                    </div>
                  )}
                  {entry.conceptContext && (
                    <div style={{ fontSize: '0.93em', color: '#8cf', marginBottom: 5 }}>
                      Context: {entry.conceptContext}
                    </div>
                  )}
                  {entry.overlayId && (
                    <div style={{ fontSize: '0.93em', color: '#aaa', marginBottom: 5 }}>
                      Overlay: {entry.overlayId}
                    </div>
                  )}
                  {entry.extra?.fx && (
                    <div style={{ fontSize: '0.93em', color: '#a7a3ff', marginBottom: 5 }}>
                      FX: {entry.extra.fx}
                    </div>
                  )}
                  {entry.extra?.sound && (
                    <div style={{ fontSize: '0.93em', color: '#4ef0ff', marginBottom: 5 }}>
                      Sound: {entry.extra.sound}
                    </div>
                  )}
                  {entry.mood?.reason && (
                    <div style={{ fontSize: '0.91em', color: '#888', marginTop: 4 }}>
                      <i>{entry.mood.reason}</i>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 24, color: '#aaa', fontSize: '0.98em', fontFamily: 'serif' }}>
        Every glyph is a memory. Every ritual, a legend.
      </div>
    </div>
  );
}
