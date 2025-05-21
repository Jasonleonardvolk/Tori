// UserNuggetComposer.tsx
// Lets user inscribe their own Golden Nugget after receiving one or an EchoScript
import React, { useState } from 'react';

export default function UserNuggetComposer({ onSave, onClose }) {
  const [phrase, setPhrase] = useState('');
  const [glyph, setGlyph] = useState('');
  const [tone, setTone] = useState('gentle');

  function handleSave() {
    onSave && onSave({ phrase, glyph, tone });
    onClose && onClose();
  }

  return (
    <div style={{ background: '#23233a', color: '#ffe44e', padding: 32, borderRadius: 16, minWidth: 420, fontFamily: 'serif', boxShadow: '0 2px 24px #000a', margin: 18, maxWidth: 700 }}>
      <h2 style={{ color: '#b2f7ef', marginBottom: 10 }}>Write Your Nugget</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Phrase:<br/>
          <textarea value={phrase} onChange={e => setPhrase(e.target.value)} style={{ width: '100%', minHeight: 60, marginTop: 6 }} />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Glyph (optional): <input type="text" value={glyph} onChange={e => setGlyph(e.target.value)} style={{ marginLeft: 8, width: 60 }} placeholder="🪙" /></label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Tone:
          <select value={tone} onChange={e => setTone(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="gentle">Gentle</option>
            <option value="clarifying">Clarifying</option>
            <option value="playful">Playful</option>
            <option value="awe">Awe</option>
            <option value="reverent">Reverent</option>
            <option value="nostalgic">Nostalgic</option>
          </select>
        </label>
      </div>
      <button onClick={handleSave} style={{ background: '#ffe44e', color: '#23233a', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: '1.03em', cursor: 'pointer', boxShadow: '0 1px 8px #ffe44e66', marginRight: 10 }}>Save</button>
      <button onClick={onClose} style={{ background: '#ffe44e', color: '#23233a', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: '1.03em', cursor: 'pointer', boxShadow: '0 1px 8px #ffe44e66' }}>Close</button>
    </div>
  );
}
