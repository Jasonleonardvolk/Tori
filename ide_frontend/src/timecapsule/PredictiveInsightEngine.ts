// PredictiveInsightEngine.ts
// Phase 8: Turns telemetry into foresight and mid-session overlays
import {
  getConceptRhythm,
  getEmotionalRhythm,
  getAPIAffinity
} from './CreativeTelemetryEngine';

// --- Types ---
/** @typedef {{ forecast: string, evidence: any, overlay?: string }} PredictiveInsight */

// --- Predictive Logic ---
export function forecastNextMove({ concept, sessionId, context }) {
  // Use concept rhythm to predict likely recurrence or refactor
  const rhythm = getConceptRhythm(concept);
  if (rhythm.recurrence > 2 && rhythm.cadence < 3 * 60 * 1000) {
    return {
      forecast: `You tend to revisit “${concept}” every ~${Math.round(rhythm.cadence / 60000)} min.`,
      evidence: rhythm,
      overlay: `You've hit this rhythm before. In a previous session, you pivoted right here.`
    };
  }
  return {
    forecast: `No strong pattern detected for “${concept}” yet.`,
    evidence: rhythm
  };
}

export function forecastNamingShift({ nameHistory }) {
  // Detect if user is likely to rename again
  if (!nameHistory || nameHistory.length < 2) return { forecast: 'Stable naming.', evidence: nameHistory };
  const last = nameHistory[nameHistory.length - 1];
  const prev = nameHistory[nameHistory.length - 2];
  if (last !== prev) {
    return {
      forecast: `You renamed this concept recently. Another shift may be coming.`,
      evidence: nameHistory,
      overlay: `Historically, you rename here.`
    };
  }
  return { forecast: 'Naming is stable.', evidence: nameHistory };
}

export function forecastAPIUsage() {
  const affinity = getAPIAffinity();
  if (!affinity.length) return { forecast: 'No API usage detected yet.', evidence: affinity };
  const mostUsed = affinity.reduce((a, b) => (a.count > b.count ? a : b));
  return {
    forecast: `You frequently use “${mostUsed.apiName}”. Expect more integrations soon.`,
    evidence: mostUsed
  };
}

export function forecastEmotionalRhythm() {
  const rhythm = getEmotionalRhythm();
  const maxEmotion = Object.entries(rhythm).sort((a, b) => b[1] - a[1])[0];
  if (!maxEmotion) return { forecast: 'Emotional state is neutral.', evidence: rhythm };
  return {
    forecast: `Your sessions are most often “${maxEmotion[0]}”.`,
    evidence: rhythm
  };
}
