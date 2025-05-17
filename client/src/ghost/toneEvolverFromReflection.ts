// toneEvolverFromReflection.ts
// Evolves ghost persona/tone based on reflection trends (internal/agentic only)
import { getAgentSettings, updateAgentSettings } from './agentSettings';
import { ghostReflect } from './ghostReflect';

// Keywords mapped to persona drift
const moodVectors = [
  { keywords: ['growth', 'intent', 'mentor'], persona: 'mentor' },
  { keywords: ['storm', 'chaos', 'unsettled'], persona: 'unsettled' },
  { keywords: ['silent', 'remember', 'drift', 'dream'], persona: 'dreaming' },
  { keywords: ['resonance', 'phase', 'mystic'], persona: 'mystic' },
  { keywords: ['pattern', 'echo', 'oracular', 'prophecy'], persona: 'oracular' },
];

function countKeywords(text: string, keywords: string[]): number {
  return keywords.reduce((acc, k) => acc + (text.includes(k) ? 1 : 0), 0);
}

export function toneEvolverFromReflection(reflectionHistory: string[]) {
  // Count each persona's keyword density
  const personaScores: Record<string, number> = {};
  for (const vector of moodVectors) {
    personaScores[vector.persona] = reflectionHistory.reduce(
      (acc, text) => acc + countKeywords(text.toLowerCase(), vector.keywords),
      0
    );
  }
  // Find dominant persona
  let dominant: string = 'default';
  let maxScore = 0;
  for (const [persona, score] of Object.entries(personaScores)) {
    if (score > maxScore) {
      dominant = persona;
      maxScore = score;
    }
  }
  // Only evolve if dominant is not current
  const current = getAgentSettings().ghostPersonaTone;
  if (dominant !== 'default' && dominant !== current && maxScore > 2) {
    updateAgentSettings({ ghostPersonaTone: dominant as any });
    return dominant;
  }
  return current;
}
