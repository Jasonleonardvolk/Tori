// ghostUnlockEngine.ts
// Progressive Unlock Engine with real behavioral mutations
import { updateAgentSettings } from './agentSettings';
import { showGhostMemoryOverlay } from './ghostMemoryOverlay';

export type GhostUnlock = {
  id: string,
  label: string,
  trigger: () => boolean,
  effect: () => void,
  unlocked: boolean,
  feedback: () => void
};

const STORAGE_KEY = 'ghost-unlocks';
let unlocks: Record<string, boolean> = {};
function loadUnlocks() {
  if (Object.keys(unlocks).length) return unlocks;
  const raw = localStorage.getItem(STORAGE_KEY);
  unlocks = raw ? JSON.parse(raw) : {};
  return unlocks;
}
function saveUnlocks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocks));
}

function getRefactorCount() {
  const raw = localStorage.getItem('refactor-count');
  return raw ? parseInt(raw, 10) : 0;
}
function getFrustrationRecoveries() {
  const raw = localStorage.getItem('frustration-recoveries');
  return raw ? parseInt(raw, 10) : 0;
}
function getSessionWeeks() {
  const first = localStorage.getItem('first-session-date');
  if (!first) return 0;
  const days = (Date.now() - new Date(first).getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(days / 7);
}
function getZoneEntropyCount() {
  const raw = localStorage.getItem('zone-entropy-count');
  return raw ? parseInt(raw, 10) : 0;
}
function getSessionCount() {
  const raw = localStorage.getItem('ghost-session-count');
  return raw ? parseInt(raw, 10) : 0;
}

export const ghostUnlocks: GhostUnlock[] = [
  {
    id: 'smartMorphMode',
    label: 'Smart Morph Mode',
    trigger: () => getRefactorCount() >= 5,
    effect: () => updateAgentSettings({ smartMorphEnabled: true }),
    unlocked: false,
    feedback: () => showGhostMemoryOverlay({
      message: "You've tuned the code’s curvature. Morph Mode awakens.",
      overlayId: 'unlock_smartMorphMode'
    })
  },
  {
    id: 'frustrationRecoveryBonus',
    label: 'Frustration Recovery Bonus',
    trigger: () => getFrustrationRecoveries() >= 10,
    effect: () => updateAgentSettings({ overlayStyle: 'resonant' }),
    unlocked: false,
    feedback: () => showGhostMemoryOverlay({
      message: "Your resilience has rhythm. Overlays now sing with resonance.",
      overlayId: 'unlock_frustrationRecoveryBonus'
    })
  },
  {
    id: 'memoryCapsule',
    label: 'Memory Capsule',
    trigger: () => getSessionWeeks() >= 3,
    effect: () => updateAgentSettings({ timeCapsuleEnabled: true }),
    unlocked: false,
    feedback: () => showGhostMemoryOverlay({
      message: "You’ve grown a rhythm. Want to see your past self’s orbit?",
      overlayId: 'unlock_memoryCapsule'
    })
  },
  {
    id: 'zoneExpansion',
    label: 'Zone Expansion',
    trigger: () => getZoneEntropyCount() >= 3,
    effect: () => updateAgentSettings({ zoneGhostingEnabled: true }),
    unlocked: false,
    feedback: () => showGhostMemoryOverlay({
      message: "Boundaries blur. Ideas echo. Welcome to liminal zoning.",
      overlayId: 'unlock_zoneExpansion'
    })
  },
  {
    id: 'ghostPersonaEvolve',
    label: 'Ghost Persona Evolve',
    trigger: () => getSessionCount() >= 30,
    effect: () => updateAgentSettings({ ghostPersonaTone: 'mystic' }),
    unlocked: false,
    feedback: () => showGhostMemoryOverlay({
      message: "The ghost begins to reflect your pattern. It now whispers like a mystic.",
      overlayId: 'unlock_ghostPersonaEvolve'
    })
  }
];

export function evaluateGhostUnlocks() {
  loadUnlocks();
  for (const unlock of ghostUnlocks) {
    if (!unlocks[unlock.id] && unlock.trigger()) {
      unlocks[unlock.id] = true;
      saveUnlocks();
      unlock.effect();
      unlock.feedback();
    }
  }
}
