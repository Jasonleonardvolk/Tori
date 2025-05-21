// ghostToneReflector.ts
// Shifts ghost/agent tone based on user annotation tags

const toneMap = {
  clarifying: 'precise',
  haunting: 'poetic',
  unsettling: 'gentle',
  inspiring: 'celebratory',
  nostalgic: 'wistful',
  default: 'gentle'
};

export function reflectGhostToneFromTag(tag) {
  return toneMap[tag?.toLowerCase()] || toneMap.default;
}

export function updateGhostToneBasedOnAnnotations(annotationHistory) {
  // annotationHistory: [{ tag, overlayEvent, note, reply }]
  if (!annotationHistory.length) return toneMap.default;
  // Use most recent, or a weighted blend if desired
  const lastTag = annotationHistory[annotationHistory.length - 1].tag;
  return reflectGhostToneFromTag(lastTag);
}
