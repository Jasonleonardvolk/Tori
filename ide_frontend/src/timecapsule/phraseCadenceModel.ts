// phraseCadenceModel.ts
// Models rhythm-aware ghost/agent whisper phrasing based on session state

export function getPhraseCadence({ sessionFlow, entropy, overlayCount }) {
  // sessionFlow: 'calm'|'chaotic'|'steady'|'reflective'
  // entropy: number (0-1), overlayCount: int
  if (sessionFlow === 'calm') return 'iambic';
  if (sessionFlow === 'chaotic') return 'syncopated';
  if (sessionFlow === 'reflective') return 'free';
  // Drift cadence with overlay density and entropy
  if (entropy > 0.7) return 'syncopated';
  if (overlayCount > 10) return 'alternating';
  return 'steady';
}

export function modulatePhraseByCadence(phrase, cadence) {
  if (cadence === 'iambic') return phrase.replace(/\b(\w+)\b/g, (w, m, i) => i % 2 === 0 ? m : m + ',');
  if (cadence === 'syncopated') return phrase.split(' ').map((w, i) => i % 3 === 0 ? w.toUpperCase() : w).join(' ');
  if (cadence === 'alternating') return phrase.split(' ').map((w, i) => i % 2 === 0 ? w : w + '...').join(' ');
  return phrase;
}
