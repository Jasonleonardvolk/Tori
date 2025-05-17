// src/components/QuickActionsBar.jsx
export default function QuickActionsBar({ onAction }) {
  const chips = [
    { id:'opt', label:'Optimize loop', icon:'⚡', hint:'One-tap refactor' },
    { id:'exp', label:'Explain block', icon:'💡', hint:'Deep dive'      },
  ];
  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto">
      {chips.map(c => (
        <button
          key={c.id}
          title={c.hint}
          onClick={()=>onAction(c.id)}
          className="rounded-full bg-surface-dark/60 hover:bg-[--color-hover] px-3 py-1 text-xs transition whitespace-nowrap"
        >
          {c.icon} {c.label}
        </button>
      ))}
    </div>
  );
}
