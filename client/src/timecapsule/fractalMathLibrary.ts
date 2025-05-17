// fractalMathLibrary.ts
// Formal mathematical core for Phase 7: DFA/Hurst, ghost delays, semantic drift, recursion, overlay kernel
// References: Grela et al. 2025 (FSCA), Zheng et al. 2024 (ghost state), DFA literature

/**
 * Computes the Hurst exponent (H) of a time series using DFA (Detrended Fluctuation Analysis).
 * @param timeSeries Array of numbers (e.g., inter-keystroke intervals)
 * @param minWindow Minimum window size for DFA
 * @param maxWindow Maximum window size for DFA
 * @param degree Polynomial order for detrending (default 1: linear)
 * @returns Hurst exponent H ∈ [0,1]
 * @see Grela et al. 2025, DFA reviews
 */
export function computeHurstExponent(timeSeries: number[], minWindow = 4, maxWindow = 16, degree = 1): number {
  if (timeSeries.length < maxWindow * 2) return 0.5;
  const mean = timeSeries.reduce((a, b) => a + b, 0) / timeSeries.length;
  // Cumulative profile
  const Y = timeSeries.map((x, j) => timeSeries.slice(0, j + 1).reduce((a, b) => a + (b - mean), 0));
  const scales = [];
  const fluctuations = [];
  for (let s = minWindow; s <= maxWindow; s++) {
    const nSegments = Math.floor(Y.length / s);
    let F2sum = 0;
    for (let v = 0; v < nSegments; v++) {
      const segment = Y.slice(v * s, (v + 1) * s);
      // Least-squares polynomial fit (degree m)
      const x = Array.from({ length: s }, (_, i) => i);
      // Simple linear detrend for degree=1
      let p0 = 0, p1 = 0;
      if (degree === 1) {
        const xmean = (s - 1) / 2;
        const ymean = segment.reduce((a, b) => a + b, 0) / s;
        let num = 0, den = 0;
        for (let i = 0; i < s; i++) {
          num += (x[i] - xmean) * (segment[i] - ymean);
          den += (x[i] - xmean) ** 2;
        }
        p1 = den === 0 ? 0 : num / den;
        p0 = ymean - p1 * xmean;
      }
      // Detrended segment
      const detrended = segment.map((y, i) => y - (p0 + p1 * i));
      const F2 = detrended.reduce((a, b) => a + b ** 2, 0) / s;
      F2sum += F2;
    }
    scales.push(s);
    fluctuations.push(Math.sqrt(F2sum / nSegments));
  }
  // Log-log slope estimation
  const logS = scales.map(Math.log);
  const logF = fluctuations.map(Math.log);
  let num = 0, den = 0, n = logS.length, xmean = logS.reduce((a, b) => a + b, 0) / n, ymean = logF.reduce((a, b) => a + b, 0) / n;
  for (let i = 0; i < n; i++) {
    num += (logS[i] - xmean) * (logF[i] - ymean);
    den += (logS[i] - xmean) ** 2;
  }
  const H = den === 0 ? 0.5 : num / den;
  return Math.max(0, Math.min(1, H));
}

/**
 * Computes ghost delay for overlays based on bifurcation memory theory.
 * @param sinceLastEdit Number of sessions since last edit (d_i)
 * @param criticalDecay Critical threshold (d_c)
 * @param alpha Scaling parameter (default 1)
 * @returns Delay time (ms)
 * @see Zheng et al. 2024
 */
export function ghostDelay(sinceLastEdit: number, criticalDecay: number, alpha = 1): number {
  if (sinceLastEdit <= criticalDecay) return 0;
  return alpha * Math.pow(sinceLastEdit - criticalDecay, -0.5);
}

/**
 * Computes semantic drift for a sequence of names using their embeddings.
 * @param names Array of names (unused, for logging)
 * @param embeddings Array of embedding vectors (length = names.length)
 * @returns Cumulative drift (vector norm)
 * @see Naming drift metric in Phase 7
 */
export function namingDrift(names: string[], embeddings: number[][]): number {
  let total = Array(embeddings[0].length).fill(0);
  for (let i = 0; i < embeddings.length - 1; i++) {
    const delta = embeddings[i + 1].map((v, j) => v - embeddings[i][j]);
    total = total.map((v, j) => v + delta[j]);
  }
  // Euclidean norm
  const norm = Math.sqrt(total.reduce((a, b) => a + b ** 2, 0));
  return norm;
}

/**
 * Maps revisit count to recursive insight depth.
 * @param entryCount Number of revisitations
 * @returns Insight depth (integer)
 */
export function getInsightDepth(entryCount: number): number {
  return Math.max(1, Math.floor(Math.log2(entryCount + 1)));
}

/**
 * Overlay activation kernel (sigmoid of weighted sum)
 * @param H Hurst exponent
 * @param R Tempo rhythm
 * @param T Ghost delay
 * @param weights Array of weights [w1, w2, w3]
 * @param threshold Overlay trigger threshold
 * @returns κ ∈ [0, 1]
 */
export function overlayActivationKernel(H: number, R: number, T: number, weights = [1, 1, 1], threshold = 0.7): number {
  const z = weights[0] * H + weights[1] * R + weights[2] * T - threshold;
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
  return sigmoid(z);
}

/**
 * Diagnostic: logs kernel input and overlay trigger state
 * @param context Kernel input context
 * @param kappa Output value
 */
export function logOverlayKernel(context: { H: number, R: number, T: number, weights?: number[], threshold?: number }, kappa: number) {
  // Could be extended to persistent logs or overlay diagnostics
  console.log(`[OverlayKernel] H=${context.H.toFixed(3)}, R=${context.R.toFixed(3)}, T=${context.T.toFixed(3)}, κ=${kappa.toFixed(3)}`);
}
