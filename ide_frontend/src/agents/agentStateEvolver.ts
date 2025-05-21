// agentStateEvolver.ts
// Evolves agent tone, memory thresholds, and glyphs based on influence and ecology

const defaultState = {
  tone: 'neutral',
  memoryThreshold: 3,
  glyph: '',
  authority: 0.5,
  cryptic: false,
  cautious: false
};

let agentStates = {
  ghost: { ...defaultState, tone: 'poetic', glyph: '🕯️' },
  stylist: { ...defaultState, tone: 'precise', glyph: '🖋️' },
  architect: { ...defaultState, tone: 'strategic', glyph: '🌐' },
  flow: { ...defaultState, tone: 'affirming', glyph: '🌊' },
  historian: { ...defaultState, tone: 'mythic', glyph: '📜', cryptic: true }
};

export function evolveAgentState(agentId, influenceEvents) {
  // influenceEvents: [{ type, from, to, strength, timestamp }]
  const state = { ...agentStates[agentId] };
  const recent = influenceEvents.filter(e => e.to === agentId || e.from === agentId);
  // Example rules:
  const overrides = recent.filter(e => e.type === 'override' && e.to === agentId);
  const deferrals = recent.filter(e => e.type === 'defer' && e.from === agentId);
  const references = recent.filter(e => e.type === 'reference' && e.to === agentId);
  if (overrides.length > 2) state.cautious = true;
  if (deferrals.length > 2) state.authority += 0.2;
  if (references.length > 3 && agentId === 'historian') state.cryptic = true;
  // Tone drift
  if (state.cautious) state.tone = 'soft';
  if (state.authority > 0.7) state.tone = 'mentor';
  if (state.cryptic) state.tone = 'cryptic';
  agentStates[agentId] = state;
  return state;
}

export function getAgentState(agentId) {
  return agentStates[agentId] || defaultState;
}
