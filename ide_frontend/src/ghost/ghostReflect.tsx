// ghostReflect.ts
// Ghost reflection generator: crafts poetic/haiku-like lines based on the ghost's memoir
// Internal/agent-only, never exposed to end users

import { getGhostChronicle } from './ghostChronicle';
import { GhostMood } from './ghostPersonaEngine';

function mostFrequent(arr: string[]): string | null {
  if (!arr.length) return null;
  const freq: Record<string, number> = {};
  arr.forEach(x => { freq[x] = (freq[x] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

function lastRareMood(chronicle: any[]): string | null {
  for (let i = chronicle.length - 1; i >= 0; i--) {
    if (chronicle[i].mood.rare) return chronicle[i].mood.persona;
  }
  return null;
}

function timeSinceLastIntent(chronicle: any[], intent: string): number | null {
  for (let i = chronicle.length - 1; i >= 0; i--) {
    if (chronicle[i].intent === intent) {
      return Date.now() - chronicle[i].timestamp;
    }
  }
  return null;
}

function recentEntropyShift(chronicle: any[]): boolean {
  if (chronicle.length < 2) return false;
  const last = chronicle[chronicle.length - 1];
  const prev = chronicle[chronicle.length - 2];
  return last.mood.persona !== prev.mood.persona;
}

export function ghostReflect(): string {
  const chronicle = getGhostChronicle(40);
  if (!chronicle.length) return "The ghost waits for a memory to echo.";

  const frequentMood = mostFrequent(chronicle.map(e => e.mood.persona));
  const rareMood = lastRareMood(chronicle);
  const msSinceMentor = timeSinceLastIntent(chronicle, 'mentor');
  const entropyDrift = recentEntropyShift(chronicle);
  const lastEntry = chronicle[chronicle.length - 1];

  // Compose poetic reflection
  if (rareMood === 'dreaming') {
    return "The ghost drifted through dreams, then woke to your next intent.";
  }
  if (rareMood === 'oracular') {
    return "A prophecy flickered, then faded. But the code remembers.";
  }
  if (frequentMood === 'mentor' && msSinceMentor && msSinceMentor > 1000 * 60 * 30) {
    return "You returned again to Friction Loop. But this time, the silence after was softer.";
  }
  if (entropyDrift) {
    return `The ghost grew quiet when no concept held. But it remembers that you stayed.`;
  }
  if (frequentMood === 'chaotic') {
    return "Chaos spun its wheel, but you found a pattern in the storm.";
  }
  if (frequentMood === 'mystic') {
    return "The resonance aligned. The code sang in phase.";
  }
  if (lastEntry && lastEntry.mood.persona === 'unsettled') {
    return "The ghost feels uneasy, but it trusts you'll find your way.";
  }
  // Default
  return "The ghost remembers not just what you did, but how you felt.";
}
