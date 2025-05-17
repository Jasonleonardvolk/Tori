// ghost.sessionMemory.js
// Persists session-level narrative, high-friction segments, and conceptual cache for Ghost Mode

const sessionDiary = {
  highFrictionSegments: [],
  learningPatterns: [],
  mostStableConcept: null,
  conceptualCache: {}
};

export function logHighFriction(segment) {
  sessionDiary.highFrictionSegments.push(segment);
}

export function logLearningPattern(pattern) {
  sessionDiary.learningPatterns.push(pattern);
}

export function setMostStableConcept(concept) {
  sessionDiary.mostStableConcept = concept;
}

export function cacheConceptUsage(concept, usage) {
  sessionDiary.conceptualCache[concept] = usage;
}

export function getSessionDiary() {
  return sessionDiary;
}

export function exportSessionDiary(dateStr) {
  const blob = new Blob([
    JSON.stringify(sessionDiary, null, 2)
  ], { type: 'application/json' });
  const filename = `ghost.session.${dateStr}.json`;
  // For browser download
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export default {
  logHighFriction,
  logLearningPattern,
  setMostStableConcept,
  cacheConceptUsage,
  getSessionDiary,
  exportSessionDiary
};
