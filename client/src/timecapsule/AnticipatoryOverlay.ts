// AnticipatoryOverlay.ts
// Persona-aware, predictive overlays using session signals
// Now: more nuanced signals + user-tunable thresholds
import { getGhostArchetype, getArchetypeOverlay } from './PersonaArchetypeEngine';

const defaultThresholds = {
  hesitation: 0.5,
  recursion: 2,
  entropy: 0.7,
  anticipation: 0.7,
  fatigue: 0.6,
  focusLoss: 0.5
};

export function shouldTriggerAnticipatoryOverlay({ hesitation, recursion, entropy, anticipation, fatigue, focusLoss, userPrefs, thresholds = defaultThresholds }) {
  // Predictive logic: trigger if signals cross thresholds or user prefers proactive help
  if (userPrefs?.alwaysOn) return true;
  if (anticipation > (thresholds.anticipation || defaultThresholds.anticipation)) return true;
  if (hesitation > (thresholds.hesitation || defaultThresholds.hesitation)) return true;
  if (recursion > (thresholds.recursion || defaultThresholds.recursion)) return true;
  if (entropy > (thresholds.entropy || defaultThresholds.entropy)) return true;
  if (fatigue > (thresholds.fatigue || defaultThresholds.fatigue)) return true;
  if (focusLoss > (thresholds.focusLoss || defaultThresholds.focusLoss)) return true;
  return false;
}

export function getAnticipatoryOverlay({ sessionState, context }) {
  const archetype = getGhostArchetype(sessionState);
  return getArchetypeOverlay(sessionState, context);
}
