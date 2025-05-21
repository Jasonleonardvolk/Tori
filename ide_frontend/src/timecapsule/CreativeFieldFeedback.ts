// CreativeFieldFeedback.ts
// Models code as a fractal attractor, enabling feedback loops for creative flow

const attractorField = [];
// attractorField: [{ concept, timestamp, stateVector }]

export function recordFieldState({ concept, timestamp, stateVector }) {
  attractorField.push({ concept, timestamp, stateVector });
}

export function getAttractorTrajectory(concept) {
  const states = attractorField.filter(f => f.concept === concept);
  if (!states.length) return [];
  // Return trajectory of state vectors over time
  return states.map(s => s.stateVector);
}

export function getFieldFeedback({ concept, currentVector }) {
  // Compare currentVector to attractor trajectory, return feedback
  const trajectory = getAttractorTrajectory(concept);
  if (!trajectory.length) return { resonance: 0, feedback: 'No attractor yet.' };
  // Simple cosine similarity for resonance
  function cosineSim(a, b) {
    const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
    const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
    return dot / (normA * normB);
  }
  const last = trajectory[trajectory.length - 1];
  const resonance = cosineSim(currentVector, last);
  return { resonance, feedback: resonance > 0.8 ? 'You are in the attractor flow.' : 'Creative field is shifting—explore new directions.' };
}
