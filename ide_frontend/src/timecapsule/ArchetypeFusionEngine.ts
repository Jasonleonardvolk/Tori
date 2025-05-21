// ArchetypeFusionEngine.ts
// Enables fusion of archetypes and collaborative agent glyph chains

const archetypeFusionMap = {
  'mentor+companion': { label: 'The Guide', glyph: '🦉', traits: ['wise', 'supportive'] },
  'oracle+trickster': { label: 'The Paradox', glyph: '♾️', traits: ['insightful', 'playful'] },
  'muse+herald': { label: 'The Inspirer', glyph: '🌠', traits: ['creative', 'initiating'] },
  // Extend as needed
};

export function fuseArchetypes(a1, a2) {
  const key = [a1, a2].sort().join('+');
  return archetypeFusionMap[key] || { label: `${a1}/${a2}`, glyph: '🔗', traits: [] };
}

export function collaborativeGlyphChain(archetypes) {
  // archetypes: array of archetype ids
  return archetypes.map(a => fuseArchetypes(a, a).glyph).join('—');
}
