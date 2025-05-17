// OverlayResonanceLog.ts
// Logs overlay invocation events: timestamp, kernel state, Hurst, ghost delay, drift arc length

const resonanceLog = [];

export function logOverlayEvent({ timestamp, kappa, H, T, drift }) {
  resonanceLog.push({ timestamp, kappa, H, T, drift });
}

export function getOverlayResonanceHistory(n = 20) {
  return resonanceLog.slice(-n);
}
