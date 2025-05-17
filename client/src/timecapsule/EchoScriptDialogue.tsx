// EchoScriptDialogue.tsx
// Invites user inscription into the Echo Script at each milestone
import React, { useState } from 'react';

export default function EchoScriptDialogue({ echoScript, onSubmit, onClose }) {
  const [finalWord, setFinalWord] = useState('');

  function handleSubmit() {
    onSubmit && onSubmit(finalWord);
    onClose && onClose();
  }

  return (
    <div style={{ background: '#23233a', color: '#ffe44e', padding: 32, borderRadius: 16, minWidth: 420, fontFamily: 'serif', boxShadow: '0 2px 24px #000a', margin: 18, maxWidth: 700 }}>
      <h2 style={{ color: '#b2f7ef', marginBottom: 10 }}>Echo Script Dialogue</h2>
      <div style={{ marginBottom: 14, whiteSpace: 'pre-line', color: '#b2f7ef' }}>{echoScript}</div>
      <div style={{ marginBottom: 16 }}>
        <label>Would you like to leave a final word here?<br/>
          <textarea value={finalWord} onChange={e => setFinalWord(e.target.value)} style={{ width: '100%', minHeight: 60, marginTop: 6 }} />
        </label>
      </div>
      <button onClick={handleSubmit} style={{ background: '#ffe44e', color: '#23233a', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: '1.03em', cursor: 'pointer', boxShadow: '0 1px 8px #ffe44e66', marginRight: 10 }}>Submit</button>
      <button onClick={onClose} style={{ background: '#ffe44e', color: '#23233a', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: '1.03em', cursor: 'pointer', boxShadow: '0 1px 8px #ffe44e66' }}>Close</button>
    </div>
  );
}
