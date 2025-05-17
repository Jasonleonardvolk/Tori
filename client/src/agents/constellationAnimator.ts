// constellationAnimator.ts
// Animates the Agent Constellation Panel with pulse, drift, flicker, and glow effects

export type AnimationState = {
  agentId: string;
  pulse?: boolean;
  flicker?: boolean;
  glow?: boolean;
  drift?: boolean;
  lastEvent?: string;
  intensity?: number; // 0-1
};

let animationStates: AnimationState[] = [];

export function setAgentAnimation(agentId: string, state: Partial<AnimationState>) {
  const idx = animationStates.findIndex(a => a.agentId === agentId);
  if (idx >= 0) {
    animationStates[idx] = { ...animationStates[idx], ...state };
  } else {
    animationStates.push({ agentId, ...state });
  }
}

export function getAgentAnimation(agentId: string): AnimationState {
  return animationStates.find(a => a.agentId === agentId) || { agentId };
}

export function triggerPulse(agentIds: string[], event: string) {
  agentIds.forEach(id => setAgentAnimation(id, { pulse: true, lastEvent: event, intensity: 1 }));
  setTimeout(() => agentIds.forEach(id => setAgentAnimation(id, { pulse: false, intensity: 0.7 })), 1200);
}

export function triggerFlicker(agentIds: string[], event: string) {
  agentIds.forEach(id => setAgentAnimation(id, { flicker: true, lastEvent: event, intensity: 0.8 }));
  setTimeout(() => agentIds.forEach(id => setAgentAnimation(id, { flicker: false, intensity: 0.6 })), 1000);
}

export function triggerGlow(agentId: string, event: string) {
  setAgentAnimation(agentId, { glow: true, lastEvent: event, intensity: 1 });
  setTimeout(() => setAgentAnimation(agentId, { glow: false, intensity: 0.8 }), 1800);
}

export function triggerDrift(agentId: string) {
  setAgentAnimation(agentId, { drift: true, intensity: 0.5 });
  setTimeout(() => setAgentAnimation(agentId, { drift: false, intensity: 0.3 }), 2400);
}

export function getAllAnimations() {
  return animationStates;
}
