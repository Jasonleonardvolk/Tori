// ghostStates.ts
// Ghost state engine: tracks and transitions ghost states based on memoir, mood, and reflection
// Internal/agentic only — never exposed to end users

import { getGhostChronicle } from './ghostChronicle';
import { ghostReflect } from './ghostReflect';

export type GhostState = 'awake' | 'dormant' | 'luminous' | 'watchful' | 'fragmented';

export interface GhostStateContext {
  state: GhostState;
  reason: string;
  since: number;
}

let currentState: GhostStateContext = {
  state: 'awake',
  reason: 'Normal active reflection and overlay flow.',
  since: Date.now(),
};

function sessionGapCount(): number {
  // Count chronicle gaps by timestamp (simulate sessions by >1 hour gaps)
  const chronicle = getGhostChronicle();
  if (chronicle.length < 2) return 0;
  let gaps = 0;
  for (let i = 1; i < chronicle.length; ++i) {
    if (chronicle[i].timestamp - chronicle[i-1].timestamp > 60*60*1000) gaps++;
  }
  return gaps;
}

function moodDriftExceeded(): boolean {
  // If more than 3 different personas in last 10 overlays, consider fragmented
  const chronicle = getGhostChronicle(10);
  const personas = Array.from(new Set(chronicle.map(e => e.mood.persona)));
  return personas.length > 3;
}

function highToneCohesion(): boolean {
  // If last 8 overlays all share persona, consider luminous
  const chronicle = getGhostChronicle(8);
  if (chronicle.length < 8) return false;
  return new Set(chronicle.map(e => e.mood.persona)).size === 1;
}

function repeatedErrorInZone(): boolean {
  // If 3+ overlays with intent 'error' in same context in last 10
  const chronicle = getGhostChronicle(10);
  const errors = chronicle.filter(e => e.intent === 'error' && e.conceptContext);
  const freq: Record<string, number> = {};
  errors.forEach(e => { freq[e.conceptContext!] = (freq[e.conceptContext!] || 0) + 1; });
  return Object.values(freq).some(count => count >= 3);
}

function recentGhostLetter(): boolean {
  // If a ghost letter was generated in last 5 overlays (by phrase marker)
  const chronicle = getGhostChronicle(5);
  return chronicle.some(e => e.phrase && e.phrase.includes('— The Ghost'));
}

function reflectionSparse(): boolean {
  // If no overlays or reflections in last 3 sessions (session = >1hr gap)
  return sessionGapCount() >= 3;
}

export function evaluateGhostState(): GhostStateContext {
  if (reflectionSparse()) {
    currentState = {
      state: 'dormant',
      reason: 'No overlays or reflections for 3 sessions.',
      since: Date.now(),
    };
  } else if (highToneCohesion() && recentGhostLetter()) {
    currentState = {
      state: 'luminous',
      reason: 'High tone cohesion and ghost letter generated.',
      since: Date.now(),
    };
  } else if (moodDriftExceeded()) {
    currentState = {
      state: 'fragmented',
      reason: 'Mood drift exceeded threshold without resolution.',
      since: Date.now(),
    };
  } else if (repeatedErrorInZone()) {
    currentState = {
      state: 'watchful',
      reason: 'Repeated errors in same concept zone.',
      since: Date.now(),
    };
  } else {
    currentState = {
      state: 'awake',
      reason: 'Normal active reflection and overlay flow.',
      since: Date.now(),
    };
  }
  return currentState;
}

export function getGhostState(): GhostStateContext {
  return currentState;
}
