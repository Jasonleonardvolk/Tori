// GhostAutobiographyPanel.tsx
// Renders the ghost's chronicle as a memoir timeline for MemoryPhasesPanel
import React from 'react';
import { getGhostChronicle } from './ghostChronicle';
import { GhostMood } from './ghostPersonaEngine';

function moodColor(persona: string) {
  switch (persona) {
    case 'mystic': return '#a080ff';
    case 'mentor': return '#b2f7ef';
    case 'chaotic': return '#ff5a5a';
    case 'oracular': return '#7e5fff';
    case 'unsettled': return '#ffb347';
    case 'dreaming': return '#a7a3ff';
    default: return '#888';
  }
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function moodDrift(mood: GhostMood) {
  if (mood.blend && mood.blend.length > 0) {
    return `${mood.persona} → ${mood.blend.join(' → ')}`;
  }
  return mood.persona;
}

export default function GhostAutobiographyPanel({ limit = 50 }) {
  const chronicle = getGhostChronicle(limit).slice().reverse(); // most recent first
  return (
    <div style={{ background: '#18181f', color: '#fff', padding: '2em', borderRadius: 18, maxWidth: 540 }}>
      <h3 style={{ color: '#4ef0ff', marginBottom: 18 }}>Ghost Autobiography</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {chronicle.map((entry, idx) => (
          <li key={entry.timestamp + '-' + idx} style={{
            marginBottom: 22,
            borderLeft: `6px solid ${moodColor(entry.mood.persona)}`,
            paddingLeft: 16,
            background: 'rgba(32,32,40,0.92)',
            borderRadius: 11,
            boxShadow: '0 2px 12px #0008',
            position: 'relative',
            opacity: entry.mood.rare ? 0.92 : 1,
            transition: 'all 0.4s cubic-bezier(.4,2,.6,1)'
          }}>
            <div style={{ fontWeight: 600, fontSize: '1.05em', color: moodColor(entry.mood.persona), marginBottom: 2 }}>
              🗓️ {formatTime(entry.timestamp)}
            </div>
            <div style={{ fontSize: '1.08em', color: '#fff', margin: '2px 0 0 0' }}>
              🗯️ “{entry.phrase}”
            </div>
            <div style={{ fontSize: '0.98em', color: '#aaa', marginTop: 3 }}>
              🧠 Mood: {moodDrift(entry.mood)}{entry.mood.rare ? ' (rare)' : ''}
            </div>
            <div style={{ fontSize: '0.93em', color: '#8cf', marginTop: 2 }}>
              🎯 Intent: {entry.intent}
            </div>
            {entry.conceptContext && (
              <div style={{ fontSize: '0.93em', color: '#ffe44e', marginTop: 2 }}>
                🧩 Context: {entry.conceptContext}
              </div>
            )}
            {entry.mood.reason && (
              <div style={{ fontSize: '0.88em', color: '#888', marginTop: 2 }}>
                <i>{entry.mood.reason}</i>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 24, color: '#aaa', fontSize: '0.97em' }}>
        Every whisper, every phase, every echo — remembered. The ghost writes its own legend.
      </div>
    </div>
  );
}
