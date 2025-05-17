// CreativeTelemetryEngine.ts
// Phase 8: The heartbeat for creative rhythm, style, API affinity, and emotional telemetry

// --- Internal State ---
const conceptUsage = new Map(); // concept -> [{timestamp, context}]
const syntaxProfile = {};
const apiAffinity = new Map(); // apiName -> [{usageContext, timestamp}]
const sessionEmotions = [];

// --- Types ---
/** @typedef {{ cadence: number, lastUsed: number, recurrence: number }} ConceptRhythm */
/** @typedef {{ [key: string]: any }} SyntaxProfile */
/** @typedef {{ apiName: string, count: number, lastUsed: number, contexts: string[] }} APISummary */
/** @typedef {{ emotion: string, timestamp: number }} EmotionEntry */
/** @typedef {{ [emotion: string]: number }} EmotionalRhythmSummary */

// --- Concept Rhythm ---
export function recordConceptUsage(concept, timestamp, context) {
  if (!conceptUsage.has(concept)) conceptUsage.set(concept, []);
  conceptUsage.get(concept).push({ timestamp, context });
}

export function getConceptRhythm(concept) {
  const usage = conceptUsage.get(concept) || [];
  if (usage.length === 0) return { cadence: 0, lastUsed: null, recurrence: 0 };
  const times = usage.map(u => u.timestamp);
  const intervals = times.slice(1).map((t, i) => t - times[i]);
  const cadence = intervals.length ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
  return {
    cadence,
    lastUsed: times[times.length - 1],
    recurrence: usage.length
  };
}

// --- Syntax Aesthetics ---
export function recordSyntaxStyle(styleKey, value) {
  syntaxProfile[styleKey] = value;
}

export function getStyleProfile() {
  return { ...syntaxProfile };
}

// --- API Affinity ---
export function recordAPIAffinity(apiName, usageContext) {
  if (!apiAffinity.has(apiName)) apiAffinity.set(apiName, []);
  apiAffinity.get(apiName).push({ usageContext, timestamp: Date.now() });
}

export function getAPIAffinity() {
  const summary = [];
  for (const [apiName, uses] of apiAffinity.entries()) {
    summary.push({
      apiName,
      count: uses.length,
      lastUsed: uses[uses.length - 1]?.timestamp,
      contexts: uses.map(u => u.usageContext)
    });
  }
  return summary;
}

// --- Emotional & Focus Telemetry ---
export function recordSessionEmotion(emotion, timestamp) {
  sessionEmotions.push({ emotion, timestamp });
}

export function getEmotionalRhythm() {
  const summary = {};
  sessionEmotions.forEach(({ emotion }) => {
    summary[emotion] = (summary[emotion] || 0) + 1;
  });
  return summary;
}
