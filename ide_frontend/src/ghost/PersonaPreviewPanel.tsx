// PersonaPreviewPanel.tsx
// Live preview and selector for ghost persona overlays (for devs/testers)
import React, { useState } from 'react';
import { getGhostPhrase } from './ghostToneTemplates';

const tones = ['mentor', 'mystic', 'chaotic', 'default'];
const intents = ['confirm', 'warn', 'nudge', 'reflect'];

export default function PersonaPreviewPanel() {
  const [tone, setTone] = useState('mentor');
  const [intent, setIntent] = useState('confirm');
  const phrase = getGhostPhrase(tone, intent);
  let overlayStyle = {};
  if (tone === 'mystic') {
    overlayStyle = {
      background: 'rgba(90, 60, 160, 0.92)',
      color: '#fff',
      boxShadow: '0 0 32px 8px #a080ff66',
      border: '2px solid #c7a3ff',
      fontFamily: 'serif',
      filter: 'blur(0.5px)'
    };
  } else if (tone === 'chaotic') {
    overlayStyle = {
      background: 'rgba(40, 0, 0, 0.92)',
      color: '#ff5a5a',
      boxShadow: '0 0 20px 4px #ff5a5a99',
      border: '2px dashed #ffb347',
      animation: 'glitch 0.7s infinite',
      fontFamily: 'monospace'
    };
  } else if (tone === 'mentor') {
    overlayStyle = {
      background: 'rgba(255,255,255,0.97)',
      color: '#222',
      boxShadow: '0 0 24px 4px #b2f7ef66',
      border: '2px solid #b2f7ef',
      fontFamily: 'sans-serif',
      fontWeight: 600
    };
  } else {
    overlayStyle = {
      background: '#232323',
      color: '#fff',
      border: '2px solid #888',
      boxShadow: '0 2px 12px #0007'
    };
  }
  return (
    <div style={{ padding: '1.5em', background: '#181818', borderRadius: 14, maxWidth: 420 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <label>
          Tone:
          <select value={tone} onChange={e => setTone(e.target.value)} style={{ marginLeft: 8 }}>
            {tones.map(t => <option value={t} key={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Intent:
          <select value={intent} onChange={e => setIntent(e.target.value)} style={{ marginLeft: 8 }}>
            {intents.map(i => <option value={i} key={i}>{i}</option>)}
          </select>
        </label>
      </div>
      <div style={{ ...overlayStyle, borderRadius: 12, padding: '1.2em 2em', fontSize: '1.1em', minHeight: 60, transition: 'all 0.3s cubic-bezier(.4,2,.6,1)' }}>
        {phrase} <span style={{ color: '#aaa', fontSize: '0.9em', marginLeft: 8 }}>[{tone}]</span>
      </div>
    </div>
  );
}
