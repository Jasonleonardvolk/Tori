// ghost.modeTrigger.js
// Manages dynamic state transitions between Ghost Mode and Carolina Reaper Mode

import { updateFrustrationState } from './frustrationModel';
import sessionMemory from './sessionMemory';

const MODE = {
  GHOST: 'ghost',
  REAPER: 'reaper'
};

let currentMode = MODE.GHOST;
let flowBreaks = [];
let unresolvedStackTraces = 0;
let editHistory = [];

// Called on every major user event
export function updateMode({ stackTrace, flowBroken, edit, save }) {
  const { frustration, flow } = updateFrustrationState();
  const now = Date.now();

  // Track unresolved stack traces
  if (stackTrace) unresolvedStackTraces++;

  // Track flow breaks
  if (flowBroken) flowBreaks.push(now);
  flowBreaks = flowBreaks.filter(t => now - t < 10 * 60 * 1000); // last 10 min

  // Track edit entropy
  if (edit) editHistory.push(now);
  if (save) editHistory = [];
  editHistory = editHistory.filter(t => now - t < 5 * 60 * 1000); // last 5 min

  // Calculate entropy
  const editEntropy = editHistory.length;

  // Reaper triggers
  const reaperConditions = [
    frustration >= 0.9,
    flowBreaks.length >= 3,
    unresolvedStackTraces >= 2,
    editEntropy >= 40
  ];

  // Transition logic
  if (currentMode === MODE.GHOST && reaperConditions.some(Boolean)) {
    currentMode = MODE.REAPER;
    // Optionally log transition
    sessionMemory.logHighFriction('Reaper Mode Engaged');
    // Could trigger UI/IDE-wide effect here
  } else if (currentMode === MODE.REAPER && reaperConditions.every(c => !c)) {
    currentMode = MODE.GHOST;
    // Optionally log transition
    sessionMemory.logHighFriction('Ghost Mode Restored');
  }

  return currentMode;
}

export function getCurrentMode() {
  return currentMode;
}

export default {
  updateMode,
  getCurrentMode,
  MODE
};
