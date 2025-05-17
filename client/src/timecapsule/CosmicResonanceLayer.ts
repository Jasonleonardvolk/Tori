// CosmicResonanceLayer.ts
// Syncs resonance and archetype states across multiple users or agents over time

// Define a type for log entries
export type CosmicResonanceEntry = {
  userId: string;
  timestamp: number;
  archetype: string;
  resonance: number;
  glyph: string;
};

const cosmicResonanceLog: CosmicResonanceEntry[] = [];

export function recordCosmicResonance(entry: CosmicResonanceEntry) {
  cosmicResonanceLog.push(entry);
}

export function getCosmicResonanceHistory(userId: string): CosmicResonanceEntry[] {
  return cosmicResonanceLog.filter(e => e.userId === userId);
}

export function getSynchronizedResonance({ userIds, atTime }: { userIds: string[]; atTime: number }): CosmicResonanceEntry[] {
  // Find resonance states for multiple users/agents at a given time
  return userIds.map(uid => {
    const entry = cosmicResonanceLog.filter(e => e.userId === uid && e.timestamp <= atTime).sort((a, b) => b.timestamp - a.timestamp)[0];
    return entry || { userId: uid, timestamp: atTime, archetype: null, resonance: null, glyph: null };
  });
}

export function getCosmicAlignment(atTime: number): { archetype: string | null; count: number } | null {
  // Check if multiple users/agents share resonance/archetype at a moment
  const entries = cosmicResonanceLog.filter(e => e.timestamp <= atTime);
  const archetypeMap: Record<string, number> = {};
  entries.forEach(e => {
    if (e.archetype) archetypeMap[e.archetype] = (archetypeMap[e.archetype] || 0) + 1;
  });
  const max = Object.entries(archetypeMap).sort((a, b) => b[1] - a[1])[0];
  return max ? { archetype: max[0], count: max[1] } : null;
}
