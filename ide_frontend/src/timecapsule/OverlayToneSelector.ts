// OverlayToneSelector.ts
// Auto-adjusts overlays: rhythm→cadence, emotion→tone, archetype→glyph/symbol

const rhythmToCadence = {
  calm: 'iambic',
  chaotic: 'syncopated',
  steady: 'even',
  reflective: 'free',
  default: 'even'
};

const emotionToTone = {
  celebratory: 'uplifting',
  reflective: 'meditative',
  frustrated: 'gentle',
  focused: 'precise',
  default: 'gentle'
};

const archetypeToGlyph = {
  mentor: '🧙',
  mirror: '🪞',
  companion: '🤝',
  trickster: '🃏',
  oracle: '🔮',
  muse: '🎼',
  herald: '📯',
  witness: '👁️',
  composer: '🎶',
  refactorer: '🛠️',
  default: '👁️'
};

export function selectOverlayCadence(rhythm) {
  return rhythmToCadence[rhythm] || rhythmToCadence.default;
}

export function selectOverlayTone(emotion) {
  return emotionToTone[emotion] || emotionToTone.default;
}

export function selectOverlayGlyph(archetype) {
  return archetypeToGlyph[archetype] || archetypeToGlyph.default;
}
