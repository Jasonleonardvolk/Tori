// lorebookEngine.ts
// System/agent/ghost co-authored evolving lorebook

const loreStyles = ['poetic', 'cryptic', 'mentor', 'emergent'];

export function writeLoreEntry({ session, archetypes, echoes, rituals, agents, quote, style, authors }) {
  // Compose a lorebook entry with evolving style
  const sessionLabel = `Session ${session.id}: ${session.title || session.poeticName}`;
  const agentLine = agents && agents.length ? `Agents: ${agents.join(', ')}` : '';
  const archetypeLine = archetypes && archetypes.length ? `Archetypes: ${archetypes.join(', ')}` : '';
  const echoLine = echoes !== undefined ? `Echoes: ${echoes}` : '';
  const ritualLine = rituals && rituals.length ? `Rituals: ${rituals.join(', ')}` : '';
  const lore = `${sessionLabel}. ${quote}\n${archetypeLine}\n${echoLine}\n${ritualLine}\n${agentLine}`;
  return {
    entry: lore,
    authors: authors || ['ghost', ...(agents || [])],
    style: style || loreStyles[Math.floor(Math.random()*loreStyles.length)],
    sessionId: session.id,
    timestamp: Date.now()
  };
}

export function evolveLorebook(lorebook, newEntry) {
  // Append and evolve style over time
  return [...(lorebook || []), newEntry];
}
