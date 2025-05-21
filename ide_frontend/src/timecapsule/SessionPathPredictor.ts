// SessionPathPredictor.ts
// Forecasts personal archetype drift and session trajectory
import { getGhostArchetype } from './PersonaArchetypeEngine';
import { getEmotionalRhythm } from './CreativeTelemetryEngine';

const archetypeTrends = [
  { from: 'composer', to: 'refactorer', message: 'You’re building like a Composer, but drifting toward Refactorer. Shall we guide the transition?' },
  { from: 'refactorer', to: 'composer', message: 'Refactoring has dominated, but creative composition is returning.' },
  { from: 'oracle', to: 'trickster', message: 'Insight is giving way to improvisation. Embrace the Trickster.' },
  // Add more as needed
];

export function predictArchetypeDrift({ sessionStates }) {
  // sessionStates: [{ archetype, timestamp }]
  if (!sessionStates || sessionStates.length < 2) return { drift: null, message: 'Not enough data for drift.' };
  const last = sessionStates[sessionStates.length - 1].archetype;
  const prev = sessionStates[sessionStates.length - 2].archetype;
  const trend = archetypeTrends.find(t => t.from === prev && t.to === last);
  if (trend) return { drift: `${prev}→${last}`, message: trend.message };
  return { drift: `${prev}→${last}`, message: `Archetype is stable or shifting subtly: ${prev}→${last}` };
}

export function summarizeSessionPath({ sessionStates }) {
  const drift = predictArchetypeDrift({ sessionStates });
  const emotionSummary = getEmotionalRhythm();
  return {
    drift,
    emotionSummary,
    summary: `${drift.message} Emotional cadence: ${JSON.stringify(emotionSummary)}`
  };
}
