// EmotionalOverlayReplay.tsx
// Plays overlays back with full metadata, ghost mood, context, drift arc, and response prompt
import React, { useState } from 'react';

export default function EmotionalOverlayReplay({ overlayEvent, onRespond, onClose }) {
  const [response, setResponse] = useState('');

  return (
    <div style={{ background: '#23233a', color: '#ffe44e', padding: 32, borderRadius: 16, minWidth: 420, fontFamily: 'serif', boxShadow: '0 2px 24px #000a', margin: 18, maxWidth: 700 }}>
      <h2 style={{ color: '#b2f7ef', marginBottom: 10 }}>Emotional Overlay Replay</h2>
      <div style={{ marginBottom: 10 }}><strong>Context:</strong> {overlayEvent.context}</div>
      <div style={{ marginBottom: 10 }}><strong>Ghost Mood:</strong> {overlayEvent.ghostMood}</div>
      <div style={{ marginBottom: 10 }}><strong>Whisper Tone:</strong> {overlayEvent.tone}</div>
      <div style={{ marginBottom: 10 }}><strong>Drift Arc:</strong> {overlayEvent.driftArc}</div>
      <div style={{ marginBottom: 16, background: '#191929', color: '#b2f7ef', borderRadius: 8, padding: '10px 18px' }}>{overlayEvent.ghostLetter}</div>
      <div style={{ marginBottom: 16 }}>
        <label>Response prompt:<br/>
          <textarea value={response} onChange={e => setResponse(e.target.value)} style={{ width: '100%', minHeight: 60, marginTop: 6 }} />
        </label>
      </div>
      <button onClick={() => onRespond(response)} style={{ background: '#ffe44e', color: '#23233a', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: '1.03em', cursor: 'pointer', boxShadow: '0 1px 8px #ffe44e66', marginRight: 10 }}>Send Response</button>
      <button onClick={onClose} style={{ background: '#ffe44e', color: '#23233a', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: '1.03em', cursor: 'pointer', boxShadow: '0 1px 8px #ffe44e66' }}>Close</button>
    </div>
  );
}
