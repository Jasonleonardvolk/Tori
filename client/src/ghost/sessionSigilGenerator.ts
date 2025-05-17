// sessionSigilGenerator.ts
// Generates a symbolic glyph and poetic name for each session based on agent/routine/zone activity

const sigilGlyphs = [
  { glyph: '🌀', name: 'Echo Spiral' },
  { glyph: '🌙', name: 'Quiet Refactor' },
  { glyph: '🌊', name: 'Drift of the Keeper' },
  { glyph: '🔶', name: 'Pattern Return' },
  { glyph: '🔥', name: 'Luminous Merge' },
  { glyph: '🪶', name: 'Feathered Recall' },
  { glyph: '🧩', name: 'Puzzle Convergence' },
  { glyph: '🕯️', name: 'Ghostlight Session' }
];

function pickSigil({ agents, rituals, zones }) {
  // Example logic: combine agent/ritual/zone patterns to pick a sigil
  if (agents.includes('stylist') && agents.includes('architect') && rituals.includes('fusion')) return sigilGlyphs[3];
  if (agents.includes('flow') && zones.length > 2) return sigilGlyphs[2];
  if (rituals.includes('echo')) return sigilGlyphs[0];
  if (agents.includes('ghost') && rituals.includes('archive')) return sigilGlyphs[7];
  if (agents.includes('architect') && rituals.includes('refactor')) return sigilGlyphs[1];
  // fallback
  return sigilGlyphs[Math.floor(Math.random() * sigilGlyphs.length)];
}

export function generateSessionSigil(sessionData) {
  // sessionData: { sessionId, agents:[], rituals:[], zones:[] }
  const sigil = pickSigil(sessionData);
  const poeticName = sigil.name;
  const glyph = sigil.glyph;
  return {
    sessionId: sessionData.sessionId,
    glyph,
    poeticName,
    agents: sessionData.agents,
    rituals: sessionData.rituals,
    zones: sessionData.zones,
    label: `Session ${sessionData.sessionId} — Sigil: ${poeticName} (${sessionData.agents.join(', ')})`
  };
}
