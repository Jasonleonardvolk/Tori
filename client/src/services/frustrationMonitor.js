// frustrationMonitor.js
// Detects frustration signals and triggers empathy-aware interventions
import behavioralSignalEmitter from './behavioralSignalEmitter';

// Weights for different frustration metrics
const FRUSTRATION_WEIGHTS = {
  undoLoops: 1.2,
  repeatErrors: 1.5,
  timeSinceLastSuccess: 2.0,
  rapidFileToggles: 1.1,
  runSpam: 1.3,
  docBounce: 1.2,
  hoverError: 1.0,
  thrashEdits: 1.6
};

// Calculate frustration metrics from event buffer
export function getFrustrationMetrics() {
  const buffer = behavioralSignalEmitter.getRecentEventBuffer();
  let undoLoops = 0, redoLoops = 0, repeatErrors = 0, rapidFileToggles = 0, runSpam = 0, docBounce = 0, hoverError = 0, thrashEdits = 0, lastSuccess = null;
  let lastFile = null, lastRun = null, lastError = null, lastDoc = null, lastEdit = null;
  let fileSwitchTimes = [];
  let runEvents = [];
  let errorEvents = [];
  let hoverEvents = [];
  let editEvents = [];
  buffer.forEach((ev, i) => {
    if (ev.type === 'undo_stack' || ev.type === 'redo_stack') {
      // Look for undo/redo/undo patterns
      if (i > 1 && buffer[i-1].type !== ev.type && buffer[i-2].type === ev.type) undoLoops++;
    }
    if (ev.type === 'error') {
      errorEvents.push(ev);
      if (lastError && ev.message === lastError) repeatErrors++;
      lastError = ev.message;
    }
    if (ev.type === 'run' || ev.type === 'build' || ev.type === 'test') {
      runEvents.push(ev);
      if (lastRun && ev.timestamp - lastRun < 5000) runSpam++;
      lastRun = ev.timestamp;
    }
    if (ev.type === 'file_switch') {
      if (lastFile && ev.file !== lastFile && ev.timestamp - fileSwitchTimes[fileSwitchTimes.length-1] < 3000) rapidFileToggles++;
      lastFile = ev.file;
      fileSwitchTimes.push(ev.timestamp);
    }
    if (ev.type === 'external_doc') {
      if (lastDoc && ev.timestamp - lastDoc < 10000) docBounce++;
      lastDoc = ev.timestamp;
    }
    if (ev.type === 'hover' && ev.target === 'error') {
      hoverError++;
      hoverEvents.push(ev);
    }
    if (ev.type === 'edit') {
      if (lastEdit && ev.timestamp - lastEdit > 10000 && ev.content && ev.content.match(/^[asdfjkl;]+$/i)) thrashEdits++;
      lastEdit = ev.timestamp;
      editEvents.push(ev);
    }
    if (ev.type === 'run' && ev.result === 'success') lastSuccess = ev.timestamp;
  });
  const timeSinceLastSuccess = lastSuccess ? (Date.now() - lastSuccess) / 1000 : 9999;
  return {
    undoLoops,
    repeatErrors,
    rapidFileToggles,
    runSpam,
    docBounce,
    hoverError,
    thrashEdits,
    timeSinceLastSuccess
  };
}

export function estimateFrustrationLevel(metrics) {
  // Weighted sum
  let score = 0;
  Object.entries(FRUSTRATION_WEIGHTS).forEach(([k, w]) => {
    score += (metrics[k] || 0) * w;
  });
  // Time since last success is scaled
  score += Math.min(metrics.timeSinceLastSuccess / 60, 3) * FRUSTRATION_WEIGHTS.timeSinceLastSuccess;
  return Math.max(0, Math.min(10, score)); // Clamp 0-10
}

export function isFlowState(metrics) {
  // Low frustration, steady edits, low error, low undo
  return estimateFrustrationLevel(metrics) < 1.5 && metrics.errorCount < 2 && metrics.undoLoops < 2;
}
