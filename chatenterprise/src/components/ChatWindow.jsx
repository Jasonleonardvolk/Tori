import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import PersonaBar from './PersonaBar';
import QuickActions from './QuickActionsBar';

export default function ChatWindow() {
  const listRef = useRef(null);

  /* ───────── state ───────── */
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: 'Howdy 👋 How can I help?', persona: 'sch' },
  ]);
  const [input, setInput] = useState('');
  const [persona, setPersona] = useState('sch');        // active persona
  const [unseen, setUnseen] = useState({ ref:0, bug:0, sch:0 });
  const [nudge, setNudge] = useState(false);        // Send-button pulse

  /* ───────── auto-scroll ───────── */
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  /* ───────── idle nudge ───────── */
  useEffect(() => {
    const t = setTimeout(()=>setNudge(true), 5000); // 5-s hesitation
    return () => clearTimeout(t);
  }, [input]);

  /* ───────── helpers ───────── */
  const personaColor = {
    ref:'var(--color-primary)',
    bug:'var(--color-warning)',
    sch:'var(--color-success)',
  }[persona];

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages(prev => [...prev, { id: Date.now(), role:'user', text:trimmed }]);
    setInput(''); setNudge(false);

    /* TODO: stream reply from backend here */
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: Date.now()+1, role:'assistant', text:`Echo: ${trimmed}`, persona },
      ]);
      setUnseen(u => ({ ...u, [persona]:0 }));
    }, 600);
  };

  const handleAction = (id) => {
    if (id==='opt') sendPatch('/optimize');
    if (id==='exp') sendPatch('/explain');
  };

  const sendPatch = (path) => {
    /* stub for quick-action handlers */
    console.log(`Sending patch for ${path}`);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto h-[90vh]">
      {/* Header */}
      <header className="glass rounded-t-xl2 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-dark">TORI Chat</h1>
        <span className="text-sm text-text-subtle">Phase-Sync Mode</span>
      </header>

      {/* Persona toggle */}
      <PersonaBar active={persona} setActive={setPersona} unseen={unseen} />

      {/* Messages */}
      <main
        ref={listRef}
        className="flex-1 overflow-y-auto bg-surface-dark px-6 py-4 space-y-4 overscroll-contain"
      >
        {messages.map(m => (
          <ChatMessage
            key={m.id} role={m.role} text={m.text}
            personaColor={personaColor}
          />
        ))}
      </main>

      {/* Quick actions */}
      <QuickActions onAction={handleAction} />

      {/* Input */}
      <footer className="glass rounded-b-xl2 p-4">
        <form onSubmit={e=>{e.preventDefault();send();}} className="flex items-end gap-3">
          <textarea
            rows={1} value={input}
            onChange={e=>{setInput(e.target.value); setNudge(false);}}
            placeholder="Type a message…"
            className="flex-1 resize-none bg-transparent text-text-dark placeholder-text-subtle focus:outline-none focus:ring-0"
            style={{ scrollbarWidth:'none' }}
          />
          <button
            type="submit"
            className={`rounded-full px-4 py-2 bg-primary hover:bg-primary-dark active:scale-95 transition transform-gpu font-medium text-surface-dark ${nudge?'nudge':''}`}
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
