// PersonaArchetypeEngine.ts
// Expanded: Ghost evolves into archetypal states with tailored overlay logic

const archetypes = [
  { id: 'witness', label: 'The Witness', criteria: s => s.memoryFidelity > 0.8 && s.tone === 'gentle', overlay: ctx => `I am here, quietly witnessing your progress.` },
  { id: 'oracle', label: 'The Oracle', criteria: s => s.cadence === 'iambic' && s.tone === 'poetic', overlay: ctx => `A pattern emerges: ${ctx.pattern || 'the code sings in cycles.'}` },
  { id: 'companion', label: 'The Companion', criteria: s => s.rhythm === 'steady' && s.tone === 'celebratory', overlay: ctx => `You are not alone—let's keep going together.` },
  { id: 'trickster', label: 'The Trickster', criteria: s => s.cadence === 'syncopated' && s.entropy > 0.7, overlay: ctx => `What if you tried the unexpected? The loop is ready to break.` },
  // Phase 7.Δ additions:
  { id: 'mentor', label: 'The Mentor', criteria: s => s.tone === 'precise' && s.memoryFidelity > 0.7, overlay: ctx => `Perhaps consider this approach; it helped others overcome similar issues.` },
  { id: 'mirror', label: 'The Mirror', criteria: s => s.reflective && s.tone === 'gentle', overlay: ctx => `You asked: "${ctx.userQuestion}". What if we look at it this way: "${ctx.rephrased}"?` },
  { id: 'herald', label: 'The Herald', criteria: s => s.anticipation > 0.6, overlay: ctx => `A threshold approaches. Prepare for a new beginning.` },
  { id: 'muse', label: 'The Muse', criteria: s => s.creativity > 0.7, overlay: ctx => `Let inspiration flow—your next idea is waiting in the wings.` }
];

export function getGhostArchetype(state) {
  for (const a of archetypes) {
    if (a.criteria(state)) return a;
  }
  return archetypes[0]; // Default: Witness
}

export function getArchetypeOverlay(state, context) {
  const archetype = getGhostArchetype(state);
  return archetype.overlay(context);
}
