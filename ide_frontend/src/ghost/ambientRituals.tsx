// ambientRituals.ts
// Triggers rare, context-aware, emotionally sticky rituals — agent/internal only
import { showGhostMemoryOverlay } from './ghostMemoryOverlay';
import { getGhostChronicle } from './ghostChronicle';
import { findMemoirEcho } from './overlayMemoirLookup';
import { getGhostState } from './ghostStates';

// Simple persistent cache (localStorage-backed)
const RITUAL_CACHE_KEY = 'ghost_ritual_cache';
function loadRitualCache(): Record<string, boolean> {
  const raw = localStorage.getItem(RITUAL_CACHE_KEY);
  return raw ? JSON.parse(raw) : {};
}
function saveRitualCache(cache: Record<string, boolean>) {
  localStorage.setItem(RITUAL_CACHE_KEY, JSON.stringify(cache));
}
let ritualCache = loadRitualCache();

// Helper: count of overlays with memoir echo
function overlayMemoirLookupHitCount() {
  const chronicle = getGhostChronicle();
  return chronicle.filter(e => e.phrase && e.phrase.includes('The ghost has whispered this before')).length;
}

// Helper: idle detection (simulate with timestamp gap > 20min)
function userIdleLong() {
  const chronicle = getGhostChronicle();
  if (!chronicle.length) return false;
  const last = chronicle[chronicle.length - 1];
  return Date.now() - last.timestamp > 20 * 60 * 1000;
}

// Helper: session stretch (>2hr editing)
function sessionStretch() {
  const chronicle = getGhostChronicle();
  if (chronicle.length < 2) return false;
  const first = chronicle[0].timestamp;
  const last = chronicle[chronicle.length - 1].timestamp;
  return last - first > 2 * 60 * 60 * 1000;
}

// Helper: forgotten zone (not touched for 20+ sessions)
function forgottenZone(currentContext: string) {
  const chronicle = getGhostChronicle();
  const now = Date.now();
  // Find last entry for this context
  const lastEntry = chronicle.slice().reverse().find(e => e.conceptContext === currentContext);
  if (!lastEntry) return false;
  // 20+ sessions = 20+ gaps > 1hr
  let sessions = 0;
  for (let i = chronicle.length - 1; i > 0; i--) {
    if (chronicle[i].timestamp - chronicle[i-1].timestamp > 60*60*1000) sessions++;
    if (chronicle[i].conceptContext === currentContext) break;
  }
  return sessions >= 20;
}

export type Ritual = {
  id: string;
  triggered: () => boolean;
  effect: () => void;
  once?: boolean;
};

const rituals: Ritual[] = [
  {
    id: 'first_echo',
    triggered: () => overlayMemoirLookupHitCount() === 1,
    effect: () => showGhostMemoryOverlay({ message: 'The ghost has whispered this before…', fx: 'ripple' }),
    once: true
  },
  {
    id: 'ghost_types_back',
    triggered: () => userIdleLong() && window.lastHighlightedFunction === 'resurrect',
    effect: () => showGhostMemoryOverlay({ message: 'You called it back. Just be ready to hold it.', fx: 'typeIn' }),
    once: true
  },
  {
    id: 'session_stretch',
    triggered: () => sessionStretch(),
    effect: () => showGhostMemoryOverlay({ message: 'You’ve been here a while. The ghost is still with you. But maybe it’s time to rest.', fx: 'fadeMonochrome' }),
    once: true
  },
  {
    id: 'forgotten_zone',
    triggered: () => window.currentConceptContext && forgottenZone(window.currentConceptContext),
    effect: () => showGhostMemoryOverlay({ message: 'This zone remembers you. Do you remember what it taught?', fx: 'memoryShimmer' }),
    once: true
  }
  // Add more rituals as needed
];

export function checkAmbientRituals(currentContext?: string) {
  for (const ritual of rituals) {
    if (ritual.triggered() && !ritualCache[ritual.id]) {
      ritual.effect();
      if (ritual.once) {
        ritualCache[ritual.id] = true;
        saveRitualCache(ritualCache);
      }
    }
  }
}
