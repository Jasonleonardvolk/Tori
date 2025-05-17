// userTempoTracker.ts
// Tracks flow bursts, idle gaps, hesitation loops

const tempoMemory = {
  sessions: [], // { sessionId, flowBursts, idleGaps, hesitationLoops, timestamps }
};

export function recordTempoEvent({ sessionId, type, timestamp }) {
  let session = tempoMemory.sessions.find(s => s.sessionId === sessionId);
  if (!session) {
    session = { sessionId, flowBursts: 0, idleGaps: 0, hesitationLoops: 0, timestamps: [] };
    tempoMemory.sessions.push(session);
  }
  if (type === 'flow') session.flowBursts++;
  if (type === 'idle') session.idleGaps++;
  if (type === 'hesitation') session.hesitationLoops++;
  session.timestamps.push({ type, timestamp });
}

export function getSessionTempo(sessionId) {
  return tempoMemory.sessions.find(s => s.sessionId === sessionId) || null;
}

export function getRecentTempoPatterns(n = 5) {
  return tempoMemory.sessions.slice(-n);
}
