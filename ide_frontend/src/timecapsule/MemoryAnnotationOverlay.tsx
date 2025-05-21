// MemoryAnnotationOverlay.tsx
// Overlay for users to tag ghost letters, mark overlays, and reply to whispers
import React, { useState } from 'react';

export default function MemoryAnnotationOverlay({ overlayEvent, onSave, onClose }) {
  const [tag, setTag] = useState('');
  const [note, setNote] = useState('');
  const [reply, setReply] = useState('');

  function handleSave() {
    onSave && onSave({ overlayEvent, tag, note, reply });
    onClose && onClose();
  }

  return (
    <div style={{ background: '#23233a', color: '#ffe44e', padding: 32, borderRadius: 16, minWidth: 420, fontFamily: 'serif', boxShadow: '0 2px 24px #000a', margin: 18, maxWidth: 700 }}>
      <h2 style={{ color: '#b2f7ef', marginBottom: 10 }}>Memory Annotation</h2>
      <div style={{ marginBottom: 14 }}>
        <strong>Ghost Letter:</strong>
        <div style={{ background: '#191929', color: '#b2f7ef', borderRadius: 8, padding: '10px 18px', marginTop: 6 }}>{overlayEvent.ghostLetter}</div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Tag this memory: <input type="text" value={tag} onChange={e => setTag(e.target.value)} style={{ marginLeft: 8, width: 180 }} /></label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Mark with meaning: <input type="text" value={note} onChange={e => setNote(e.target.value)} style={{ marginLeft: 8, width: 240 }} /></label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Reply to the whisper:<br/>
          <textarea value={reply} onChange={e => setReply(e.target.value)} style={{ width: '100%', minHeight: 60, marginTop: 6 }} />
        </label>
      </div>
      <button onClick={handleSave} style={{ background: '#ffe44e', color: '#23233a', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: '1.03em', cursor: 'pointer', boxShadow: '0 1px 8px #ffe44e66', marginRight: 10 }}>Save</button>
      <button onClick={onClose} style={{ background: '#ffe44e', color: '#23233a', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: '1.03em', cursor: 'pointer', boxShadow: '0 1px 8px #ffe44e66' }}>Close</button>
    </div>
  );
}
