// src/components/PersonaBar.jsx
const personas = [
  { id: 'ref', name: 'Refactorer', icon: '🔧', color: 'var(--color-primary)' },
  { id: 'bug', name: 'Debugger',   icon: '🐛', color: 'var(--color-warning)' },
  { id: 'sch', name: 'Scholar',    icon: '📖', color: 'var(--color-success)' },
];

export default function PersonaBar({ active, setActive, unseen }) {
  return (
    <div className="glass flex gap-2 px-4 py-2 rounded-b-xl2 backdrop-blur-xs">
      {personas.map(p => (
        <button
          key={p.id}
          onClick={() => setActive(p.id)}
          className={`relative flex items-center gap-1 text-sm transition ${active===p.id?'scale-105':''}`}
          style={{ color: p.color }}
        >
          <span>{p.icon}</span>{p.name}
          {unseen[p.id] > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-warning text-[10px] flex items-center justify-center">
              {unseen[p.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
