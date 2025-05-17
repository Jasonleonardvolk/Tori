// eggsConfig.js
// Loads and manages Ghost Mode Easter Egg configuration

const DEFAULT_EGGS = {
  doppelgangerCommit: { enabled: true, maxLifetimeActivations: 2 },
  spectralLinter: { enabled: true, maxLifetimeActivations: 2 },
  poltergeistConsole: { enabled: true, maxLifetimeActivations: 2 },
  phantomTypist: { enabled: true, maxLifetimeActivations: 2 },
  entropicOracle: { enabled: true, maxLifetimeActivations: 2 },
  realityFracture: { enabled: true, maxLifetimeActivations: 2 },
  wispInSidebar: { enabled: true, maxLifetimeActivations: 2 },
  nullProphet: { enabled: true, maxLifetimeActivations: 2 },
  carolinaWhisper: { enabled: true, maxLifetimeActivations: 2 },
  resurrectionHotkey: { enabled: true, maxLifetimeActivations: 2 },
  silentObserver: { enabled: true, maxLifetimeActivations: 2 },
};

let userConfig = null;
let eggActivations = {};

export async function loadEggsConfig() {
  try {
    const resp = await fetch('/ghost.eggs.json');
    if (resp.ok) {
      userConfig = await resp.json();
    }
  } catch (e) {
    userConfig = null;
  }
}

export function getEggConfig(egg) {
  const base = DEFAULT_EGGS[egg] || { enabled: false };
  const user = userConfig && userConfig[egg] ? userConfig[egg] : {};
  return { ...base, ...user };
}

export function canActivateEgg(egg) {
  const cfg = getEggConfig(egg);
  const count = eggActivations[egg] || 0;
  return cfg.enabled && (cfg.maxLifetimeActivations == null || count < cfg.maxLifetimeActivations);
}

export function recordEggActivation(egg) {
  eggActivations[egg] = (eggActivations[egg] || 0) + 1;
  // Optionally persist activations to localStorage or backend for lifetime limit
}

export default {
  loadEggsConfig,
  getEggConfig,
  canActivateEgg,
  recordEggActivation
};
