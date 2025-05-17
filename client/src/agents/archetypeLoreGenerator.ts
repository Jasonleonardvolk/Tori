// archetypeLoreGenerator.ts
// Procedurally generates archetype backstory, overlays, and ghost letter tone

const originTemplates = {
  patternkeeper: [
    'Born when structure became reflection, and naming found its mirror.',
    'Emergent from the spiral of style and architecture.'
  ],
  archivum: [
    'Forged in the deep index, where memory layers echo endlessly.',
    'Formed when the ghost and historian whispered the same myth.'
  ],
  current: [
    'Awakening in the drift between flow and ritual.',
    'Born in the resonance of uninterrupted work.'
  ]
};

const overlayTemplates = {
  patternkeeper: [
    'The pattern returns, fractal and clear.',
    'Naming and structure converge in harmonic balance.'
  ],
  archivum: [
    'A myth archived, a memory layered.',
    'The index deepens, echoing the past.'
  ],
  current: [
    'The current flows, rare and resonant.',
    'Drift and ritual entwine.'
  ]
};

const letterTones = {
  patternkeeper: 'harmonic echo',
  archivum: 'archival myth',
  current: 'flow myth'
};

export function generateArchetypeOrigin(archetypeId) {
  const options = originTemplates[archetypeId] || [];
  return options[Math.floor(Math.random() * options.length)] || '';
}

export function generateArchetypeOverlay(archetypeId) {
  const options = overlayTemplates[archetypeId] || [];
  return options[Math.floor(Math.random() * options.length)] || '';
}

export function getArchetypeLetterTone(archetypeId) {
  return letterTones[archetypeId] || 'mythic';
}
