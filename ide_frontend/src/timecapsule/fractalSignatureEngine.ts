// fractalSignatureEngine.ts
// Computes fractal (Hurst exponent) signature for session tempo patterns

import { getSessionTempo, getRecentTempoPatterns } from './userTempoTracker';

// Simple Hurst exponent estimator for a time series
function estimateHurst(series) {
  if (series.length < 20) return 0.5; // Not enough data
  const mean = series.reduce((a, b) => a + b, 0) / series.length;
  let R = 0, S = 0, min = 0, max = 0, sum = 0;
  for (let i = 0; i < series.length; i++) {
    sum += series[i] - mean;
    if (sum > max) max = sum;
    if (sum < min) min = sum;
  }
  R = max - min;
  S = Math.sqrt(series.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / series.length);
  return S === 0 ? 0.5 : Math.min(1, Math.max(0, 0.5 * Math.log(R / S) / Math.log(series.length)));
}

export function getSessionFractalSignature(sessionId) {
  const tempo = getSessionTempo(sessionId);
  if (!tempo) return { H: 0.5, signature: 'neutral' };
  // Use hesitationLoops as a simple time series for now
  const series = tempo.timestamps.map(e => e.type === 'hesitation' ? 1 : 0);
  const H = estimateHurst(series);
  let signature = 'neutral';
  if (H > 0.6) signature = 'persistent';
  else if (H < 0.4) signature = 'anti-persistent';
  return { H, signature };
}

export function getRecentFractalSignatures(n = 5) {
  return getRecentTempoPatterns(n).map(s => ({ sessionId: s.sessionId, ...getSessionFractalSignature(s.sessionId) }));
}
