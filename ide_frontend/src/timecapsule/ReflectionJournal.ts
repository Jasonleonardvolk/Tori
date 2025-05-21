// ReflectionJournal.ts
// Persists and surfaces emotional arcs and annotation history
// Now: surfaces emotional arc for agent improvisation and overlay cadence

const journal = [];
// journal: [{ timestamp, type, overlayId, archetype, emotion, tag, note, reply }]

export function recordReflection({ timestamp, type, overlayId, archetype, emotion, tag, note, reply }) {
  journal.push({ timestamp, type, overlayId, archetype, emotion, tag, note, reply });
}

export function getReflectionHistory(n = 30) {
  return journal.slice(-n);
}

export function getEmotionalArc() {
  // Returns a summary of emotional states over time
  const arc = {};
  journal.forEach(j => {
    arc[j.emotion] = (arc[j.emotion] || 0) + 1;
  });
  return arc;
}

export function getAnnotationsByTag(tag) {
  return journal.filter(j => j.tag === tag);
}

export function getRecentEmotionalState() {
  // Returns the most recent emotion, archetype, and tag for improvisation/cadence
  if (!journal.length) return { emotion: 'neutral', archetype: 'witness', tag: '' };
  const { emotion, archetype, tag } = journal[journal.length - 1];
  return { emotion, archetype, tag };
}
