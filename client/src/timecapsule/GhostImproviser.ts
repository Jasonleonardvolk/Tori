// GhostImproviser.ts
// Ghost/agent overlays evolve in musical time, with generative phrasing and tone arcs
// Now: cadence/tone informed by ReflectionJournal
import { getRecentEmotionalState } from './ReflectionJournal';

const phraseVariants = [
  'The ghost lingers, softly.',
  'A new cadence emerges.',
  'Your rhythm echoes through the archive.',
  'Ghost sings: “You are learning to pause.”',
  'A harmonic divergence unfolds.',
  'The overlay shimmers with memory.'
];

export function useGhostImproviser({ basePhrase, sessionEntropy, toneArc, cadence, onPhrase }) {
  const { emotion, archetype, tag } = getRecentEmotionalState();
  let phrase = basePhrase;
  // Modulate phrase by recent emotion/archetype/tag
  if (emotion === 'reflective') phrase = 'Ghost reflects: “Growth is not always action.”';
  if (emotion === 'celebratory') phrase = 'Ghost celebrates: “You crossed a threshold.”';
  if (archetype === 'mentor') phrase = 'Mentor whispers: “Patience is its own kind of progress.”';
  if (tag === 'haunting') phrase = 'Ghost lingers with a poetic hush.';
  // Continue with entropy/cadence logic
  if (cadence === 'slow') phrase = 'Ghost waits, letting the silence speak.';
  if (sessionEntropy > 0.7) phrase = 'A syncopated echo pulses through your flow.';
  onPhrase && onPhrase(phrase);
  return phrase;
}
