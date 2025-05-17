// ghost.frustrationModel.js
// Models frustration, flow, and emotional bandwidth for Ghost Mode
import { getFrustrationMetrics, estimateFrustrationLevel, isFlowState } from '../services/frustrationMonitor';

let lastFrustration = 0;
let lastFlow = false;

export function updateFrustrationState() {
  const metrics = getFrustrationMetrics();
  lastFrustration = estimateFrustrationLevel(metrics);
  lastFlow = isFlowState(metrics);
  return { frustration: lastFrustration, flow: lastFlow, metrics };
}

export function getFrustration() {
  return lastFrustration;
}

export function getFlow() {
  return lastFlow;
}

export default {
  updateFrustrationState,
  getFrustration,
  getFlow
};
