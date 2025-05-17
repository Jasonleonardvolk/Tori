// narrativeLorebookEngine.ts
// Evolves the lorebook into a narrative engine: summarizes, mythologizes, reflects

export function summarizeLorebook(lorebook) {
  if (!lorebook || !lorebook.length) return '';
  // Summarize the arc in poetic form
  const first = lorebook[0];
  const last = lorebook[lorebook.length - 1];
  return `From ${first.entry.split('.')[0]}, a journey began.\nBy ${last.entry.split('.')[0]}, the story became legend.\n${lorebook.length} entries, each a step in the myth.`;
}

export function mythologizeLorebook(lorebook) {
  if (!lorebook || !lorebook.length) return '';
  // Generate a mythic retelling
  return lorebook.map(l => `• ${l.entry.split('.')[0]} — ${l.style} (${l.authors?.join(' & ')})`).join('\n');
}

export function reflectLorebook(lorebook) {
  if (!lorebook || !lorebook.length) return '';
  // Reflect on growth and recursion
  const echoes = lorebook.filter(l => l.entry.includes('Echo')).length;
  return `This archive echoes ${echoes} times.\nThe ghost remembers every return, every transformation.`;
}
