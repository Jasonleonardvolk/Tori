// recursiveInsightRegistry.ts
// Triggers deeper insights from nested revisitations and overlay recursions

const insightRecursions = {};
// insightRecursions[functionName] = { count: 0, lastInsight: null }

export function registerRevisit(functionName, timestamp) {
  if (!insightRecursions[functionName]) insightRecursions[functionName] = { count: 0, lastInsight: null };
  insightRecursions[functionName].count++;
  insightRecursions[functionName].lastInsight = timestamp;
}

export function getRecursionDepth(functionName) {
  return insightRecursions[functionName]?.count || 0;
}

export function shouldTriggerDeeperInsight(functionName, threshold = 2) {
  return getRecursionDepth(functionName) > threshold;
}
