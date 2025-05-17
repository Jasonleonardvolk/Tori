// archetypeLoreRegistry.ts
// Registers archetype agent lore, rituals, reliquary hooks

const archetypes = [
  {
    id: 'patternkeeper',
    parents: ['stylist', 'architect'],
    glyph: '🔷',
    poeticName: 'Patternkeeper',
    ritual: 'The Fractal Return',
    voice: 'harmonic, declarative',
    overlay: 'dual-line, balanced',
    reliquary: true,
    ghostLetterTone: 'harmonic echo'
  },
  {
    id: 'archivum',
    parents: ['ghost', 'historian'],
    glyph: '📚',
    poeticName: 'Archivum',
    ritual: 'The Deep Index',
    voice: 'oracular, layered',
    overlay: 'layered, archival',
    reliquary: true,
    ghostLetterTone: 'archival myth'
  },
  {
    id: 'current',
    parents: ['flow', 'ritualist'],
    glyph: '💧',
    poeticName: 'The Current',
    ritual: 'The Resonant Drift',
    voice: 'flowing, reflective',
    overlay: 'fluid, rare',
    reliquary: true,
    ghostLetterTone: 'flow myth'
  }
];

export function getArchetypeLore(archetypeId) {
  return archetypes.find(a => a.id === archetypeId);
}

export function listArchetypes() {
  return archetypes;
}
