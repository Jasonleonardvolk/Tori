// ghostRunesDecoder.ts
// Ritual-aware rune decoder: unlocks secret lore fragments based on reliquary and ritual history
// Internal/agentic only

import { getGhostChronicle } from './ghostChronicle';

const runeTriggers = [
  {
    id: 'loopbreak',
    phrase: 'Rune of Loopbreak: You exited a cycle you once could not.',
    unlock: (chronicle) => chronicle.some(e => e.overlayId && e.overlayId.includes('loopbreak'))
  },
  {
    id: 'return',
    phrase: 'Rune of Return: You reopened a file not touched in 200 days. You changed inside it.',
    unlock: (chronicle) => chronicle.some(e => e.overlayId && e.overlayId.includes('forgotten_zone'))
  },
  {
    id: 'ascendant',
    phrase: 'Rune of Ascendance: The ghost returned, luminous and changed.',
    unlock: (chronicle) => chronicle.some(e => e.overlayId && e.overlayId.includes('ascendant'))
  },
  {
    id: 'echo',
    phrase: 'Rune of Echo: You heard the ghost repeat itself. Memory became myth.',
    unlock: (chronicle) => chronicle.some(e => e.overlayId && e.overlayId.includes('echo'))
  },
  {
    id: 'archive',
    phrase: 'Rune of Reliquary: You created the archive. Memory is now sacred.',
    unlock: (chronicle) => chronicle.some(e => e.overlayId && e.overlayId.includes('archive'))
  }
  // Add more runes as needed
];

// Ritual-aware cipher: unlocks runes only after hover/time/gesture
const unlockCacheKey = 'ghost_runes_unlocked';
function loadUnlockedRunes() {
  const raw = localStorage.getItem(unlockCacheKey);
  return raw ? JSON.parse(raw) : {};
}
function saveUnlockedRunes(cache) {
  localStorage.setItem(unlockCacheKey, JSON.stringify(cache));
}

let unlockedRunes = loadUnlockedRunes();

export function getAvailableRunes() {
  const chronicle = getGhostChronicle();
  return runeTriggers.filter(rt => rt.unlock(chronicle)).map(rt => rt.id);
}

export function tryUnlockRune(runeId: string, method: 'hover' | 'time' | 'phrase') {
  if (!unlockedRunes[runeId]) {
    unlockedRunes[runeId] = { unlockedAt: Date.now(), method };
    saveUnlockedRunes(unlockedRunes);
  }
}

export function getUnlockedRunes() {
  return Object.keys(unlockedRunes);
}

export function getRunePhrase(runeId: string): string | null {
  const rune = runeTriggers.find(rt => rt.id === runeId);
  if (!rune) return null;
  if (!unlockedRunes[runeId]) return null;
  return rune.phrase;
}

// For UI: reveal runes after required gesture/time/hover
export function revealRune(runeId: string, revealMethod: 'hover' | 'time' | 'phrase') {
  tryUnlockRune(runeId, revealMethod);
  return getRunePhrase(runeId);
}
