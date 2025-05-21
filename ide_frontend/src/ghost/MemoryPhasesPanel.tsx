// MemoryPhasesPanel.tsx
// Visualizes the ghost's unlock arc (spectral achievement tree)
import React from 'react';
import { ghostUnlocks } from './ghostUnlockEngine';

// Example phase quotes for each unlock
const phaseQuotes = {
  smartMorphMode: [
    "You’ve tuned the code’s curvature. Morph Mode awakens.",
    "The shape of thought is now pliable."
  ],
  frustrationRecoveryBonus: [
    "Your resilience has rhythm. Overlays now sing with resonance.",
    "You’ve earned a softer edge."
  ],
  memoryCapsule: [
    "You’ve grown a rhythm. Want to see your past self’s orbit?",
    "Your journey echoes in memory."
  ],
  zoneExpansion: [
    "Boundaries blur. Ideas echo. Welcome to liminal zoning.",
    "Zones now shimmer at the edge of meaning."
  ],
  ghostPersonaEvolve: [
    "The ghost begins to reflect your pattern. It now whispers like a mystic.",
    "Persona has evolved. The ghost sings your dialect."
  ]
};

function getUnlockStatus(unlock) {
  // Read from localStorage (same as ghostUnlockEngine)
  const raw = localStorage.getItem('ghost-unlocks');
  const unlocks = raw ? JSON.parse(raw) : {};
  return !!unlocks[unlock.id];
}

function getUnlockTimestamp(unlockId) {
  // Optionally, store timestamps in ghostUnlockEngine for full history
  const raw = localStorage.getItem('ghost-unlock-timestamps');
  const map = raw ? JSON.parse(raw) : {};
  return map[unlockId] ? new Date(map[unlockId]).toLocaleString() : null;
}

export default function MemoryPhasesPanel() {
  return (
    <div style={{ background: '#18181f', color: '#fff', padding: '2em', borderRadius: 18, maxWidth: 440 }}>
      <h3 style={{ color: '#4ef0ff', marginBottom: 18 }}>Memory Phases</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {ghostUnlocks.map((unlock, idx) => {
          const unlocked = getUnlockStatus(unlock);
          const timestamp = getUnlockTimestamp(unlock.id);
          const quotes = phaseQuotes[unlock.id] || [];
          return (
            <li key={unlock.id} style={{
              marginBottom: 22,
              opacity: unlocked ? 1 : 0.55,
              borderLeft: unlocked ? '4px solid #4ef0ff' : '4px solid #444',
              paddingLeft: 16,
              position: 'relative'
            }}>
              <div style={{ fontWeight: 600, fontSize: '1.1em', color: unlocked ? '#4ef0ff' : '#aaa' }}>
                {unlocked ? '✓' : '○'} Phase {idx + 1}: {unlock.label}
              </div>
              <div style={{ fontSize: '0.98em', color: '#bbb', margin: '4px 0 0 0' }}>
                {quotes[0]}
              </div>
              <div style={{ fontSize: '0.93em', color: '#888', marginTop: 2 }}>
                <i>Trigger:</i> {unlock.trigger.toString().replace(/\(\) => /, '')}
              </div>
              {unlocked && timestamp && (
                <div style={{ fontSize: '0.85em', color: '#666', marginTop: 2 }}>
                  <i>Unlocked:</i> {timestamp}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div style={{ marginTop: 24, color: '#aaa', fontSize: '0.97em' }}>
        Each phase marks a rite of passage in your cognitive journey. The ghost remembers.
      </div>
    </div>
  );
}
