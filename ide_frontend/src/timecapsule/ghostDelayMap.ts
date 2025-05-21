// ghostDelayMap.ts
// Models saddle-node memory echoes and recursive delays for overlays

const ghostDelays = {};
// ghostDelays[functionName] = { hovers: 0, delayMs: 0, lastOverlay: null }

export function registerHover(functionName) {
  if (!ghostDelays[functionName]) ghostDelays[functionName] = { hovers: 0, delayMs: 0, lastOverlay: null };
  ghostDelays[functionName].hovers++;
  // Increase delay for repeated hovers without edit
  ghostDelays[functionName].delayMs = 800 + 400 * (ghostDelays[functionName].hovers - 1);
}

export function getGhostDelay(functionName) {
  return ghostDelays[functionName]?.delayMs || 0;
}

export function markOverlayShown(functionName, timestamp) {
  if (!ghostDelays[functionName]) ghostDelays[functionName] = { hovers: 0, delayMs: 0, lastOverlay: null };
  ghostDelays[functionName].lastOverlay = timestamp;
}
