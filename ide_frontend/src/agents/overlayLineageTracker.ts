// overlayLineageTracker.ts
// Tracks recursive overlay invocations and lineage for adaptive overlays

let lineageMap = {};

export function registerOverlayInvocation(overlayId, sessionId, parentId) {
  if (!lineageMap[overlayId]) lineageMap[overlayId] = [];
  lineageMap[overlayId].push({ sessionId, parentId, timestamp: Date.now() });
}

export function getOverlayLineage(overlayId) {
  return lineageMap[overlayId] || [];
}

export function getOverlayLineageTag(overlayId) {
  const lineage = getOverlayLineage(overlayId);
  if (!lineage.length) return null;
  const root = lineage[0];
  const count = lineage.length;
  let tag = '';
  if (count === 1) tag = 'literal';
  else if (count === 2) tag = 'poetic';
  else tag = 'whisper';
  return `Echo of ${root.parentId || 'Origin'}, Session ${root.sessionId} (${tag})`;
}
