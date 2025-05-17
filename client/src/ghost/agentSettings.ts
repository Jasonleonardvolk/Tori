// ghost/agentSettings.ts
const SETTINGS_KEY = 'ghost_agent_settings';

export type AgentSettings = {
  smartMorphEnabled: boolean;
  overlayStyle: 'default' | 'resonant';
  ghostPersonaTone: 'default' | 'mentor' | 'mystic' | 'chaotic neutral';
  timeCapsuleEnabled: boolean;
  zoneGhostingEnabled: boolean;
  disableGoldenNuggets: boolean; // Added for Golden Nugget reflection control
};

export function getAgentSettings(): AgentSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw ? JSON.parse(raw) : {
    smartMorphEnabled: false,
    overlayStyle: 'default',
    ghostPersonaTone: 'default',
    timeCapsuleEnabled: false,
    zoneGhostingEnabled: false,
    disableGoldenNuggets: false, // Default: enable Golden Nugget reflections
  };
}

export function updateAgentSettings(partial: Partial<AgentSettings>) {
  const current = getAgentSettings();
  const updated = { ...current, ...partial };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}
