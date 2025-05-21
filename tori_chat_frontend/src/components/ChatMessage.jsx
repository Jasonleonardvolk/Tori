export default function ChatMessage({ role, text, personaColor }) {
  const isUser = role === 'user';
  const base =
    'max-w-prose px-5 py-3 rounded-xl2 shadow-md whitespace-pre-wrap';
  const userStyle = 'ml-auto bg-primary text-surface-dark';
  const assistantStyle = `mr-auto bg-surface-light text-text-light italic`;
  return (
    <div
      className={`${base} ${isUser ? userStyle : assistantStyle}`}
      style={!isUser ? { borderLeft: `4px solid ${personaColor}` } : {}}
    >
      {text}
    </div>
  );
}
