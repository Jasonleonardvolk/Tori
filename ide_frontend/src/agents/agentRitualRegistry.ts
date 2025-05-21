// agentRitualRegistry.ts
// Registers and manages once-only ceremonial agent rituals

import { showGhostMemoryOverlay } from '../ghost/ghostMemoryOverlay';

const AGENT_RITUAL_CACHE_KEY = 'agent_rituals_triggered';
function loadAgentRitualCache() {
  const raw = localStorage.getItem(AGENT_RITUAL_CACHE_KEY);
  return raw ? JSON.parse(raw) : {};
}
function saveAgentRitualCache(cache) {
  localStorage.setItem(AGENT_RITUAL_CACHE_KEY, JSON.stringify(cache));
}
let ritualCache = loadAgentRitualCache();

export type AgentRitual = {
  id: string;
  agent: string;
  trigger: () => boolean;
  effect: () => void;
  once?: boolean;
};

const agentRituals: AgentRitual[] = [
  {
    id: 'architect_first_echoed_pattern',
    agent: 'architect',
    trigger: () => window.architectFirstEchoedPattern,
    effect: () => showGhostMemoryOverlay({ message: 'This abstraction rhymes with a refactor you performed 47 sessions ago.', fx: 'patternFade' }),
    once: true
  },
  {
    id: 'historian_the_return',
    agent: 'historian',
    trigger: () => window.historianZoneReturn,
    effect: () => showGhostMemoryOverlay({ message: 'You haven’t been to SignalMap.ts in 3 moons. Last time you left, a bug echoed.', fx: 'starlightPulse' }),
    once: true
  },
  {
    id: 'flow_deep_drift',
    agent: 'flow',
    trigger: () => window.flowMythicSession,
    effect: () => showGhostMemoryOverlay({ message: 'You are inside the current. Everything echoes right now.', fx: 'heartbeatFade' }),
    once: true
  }
  // Add more agent rituals as needed
];

export function checkAgentRituals() {
  for (const ritual of agentRituals) {
    if (ritual.trigger() && !ritualCache[ritual.id]) {
      ritual.effect();
      if (ritual.once) {
        ritualCache[ritual.id] = true;
        saveAgentRitualCache(ritualCache);
      }
    }
  }
}
