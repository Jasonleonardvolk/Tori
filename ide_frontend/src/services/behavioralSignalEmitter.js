// Behavioral Signal Emitter Utility
// Listens for passive user actions and emits signals for covert intent detection

import intentDetectionService from './intentDetectionService';

const SIGNAL_TYPES = [
  'navigation', 'edit', 'hover', 'idle', 'selection', 'copy', 'paste',
  'save', 'run', 'undo', 'redo', 'focus', 'blur', 'voice',
  'build', 'test', 'debug', 'error', 'command', 'panel', 'file_switch', 'settings', 'search', 'compile', 'breakpoint', 'completion', 'hint', 'accept_suggestion', 'dismiss_suggestion', 'external_doc', 'rage_click', 'undo_stack', 'redo_stack', 'commit', 'pr', 'merge', 'conflict', 'session_start', 'session_end'
];

let lastIdleTimestamp = Date.now();

// --- Temporal Pattern Buffer ---
let eventBuffer = [];
const BUFFER_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function emitSignal(signal) {
  // Add to temporal buffer
  eventBuffer.push({ ...signal, timestamp: Date.now() });
  // Keep only last 5 minutes
  eventBuffer = eventBuffer.filter(ev => Date.now() - ev.timestamp < BUFFER_WINDOW_MS);
  // For now, send immediately for intent detection
  intentDetectionService.detectIntentOnCreation({
    content: signal.transcript || '',
    behavioralSignals: [signal]
  });
}

// Expose for ML logging and pattern analysis
export function getRecentEventBuffer() {
  return [...eventBuffer];
}

export function getTemporalFeatures() {
  // Example features for ML: action counts, idle time, diversity, error rate, rage clicks, etc.
  const now = Date.now();
  const buffer = eventBuffer.filter(ev => now - ev.timestamp < BUFFER_WINDOW_MS);
  const counts = {};
  buffer.forEach(ev => { counts[ev.type] = (counts[ev.type]||0)+1; });
  const idleEvents = buffer.filter(ev => ev.type === 'idle');
  const errorEvents = buffer.filter(ev => ev.type === 'error');
  const rageClicks = buffer.filter(ev => ev.type === 'rage_click');
  const fileSwitches = buffer.filter(ev => ev.type === 'file_switch');
  const uniqueFiles = new Set(fileSwitches.map(ev => ev.file)).size;
  return {
    totalEvents: buffer.length,
    idleCount: idleEvents.length,
    errorCount: errorEvents.length,
    rageClickCount: rageClicks.length,
    fileSwitchCount: fileSwitches.length,
    uniqueFiles,
    actionDiversity: Object.keys(counts).length,
    eventCounts: counts
  };
}


// Navigation
window.addEventListener('popstate', () => {
  emitSignal({ type: 'navigation', path: window.location.pathname });
});

// Edit events (example for text/code editors)
document.addEventListener('input', (e) => {
  emitSignal({ type: 'edit', target: e.target.tagName });
});

document.addEventListener('selectionchange', () => {
  emitSignal({ type: 'selection' });
});
document.addEventListener('copy', () => {
  emitSignal({ type: 'copy' });
});
document.addEventListener('paste', () => {
  emitSignal({ type: 'paste' });
});
document.addEventListener('focusin', (e) => {
  emitSignal({ type: 'focus', target: e.target.tagName });
});
document.addEventListener('focusout', (e) => {
  emitSignal({ type: 'blur', target: e.target.tagName });
});
// Build/Test/Debug/Error/Command/Panel/File Switch/Settings/Search/Compile/Breakpoint/Completion/Hint events (examples)
window.addEventListener('build', e => {
  emitSignal({ type: 'build', result: e.detail?.result });
});
window.addEventListener('test', e => {
  emitSignal({ type: 'test', result: e.detail?.result });
});
window.addEventListener('debug', e => {
  emitSignal({ type: 'debug', state: e.detail?.state });
});
window.addEventListener('error', e => {
  emitSignal({ type: 'error', message: e.detail?.message });
});
window.addEventListener('command', e => {
  emitSignal({ type: 'command', command: e.detail?.command });
});
window.addEventListener('panel', e => {
  emitSignal({ type: 'panel', panel: e.detail?.panel });
});
window.addEventListener('file_switch', e => {
  emitSignal({ type: 'file_switch', file: e.detail?.file });
});
window.addEventListener('settings', e => {
  emitSignal({ type: 'settings', section: e.detail?.section });
});
window.addEventListener('search', e => {
  emitSignal({ type: 'search', query: e.detail?.query });
});
window.addEventListener('compile', e => {
  emitSignal({ type: 'compile', result: e.detail?.result });
});
window.addEventListener('breakpoint', e => {
  emitSignal({ type: 'breakpoint', location: e.detail?.location });
});
window.addEventListener('completion', e => {
  emitSignal({ type: 'completion', accepted: e.detail?.accepted });
});
window.addEventListener('hint', e => {
  emitSignal({ type: 'hint', hint: e.detail?.hint });
});
window.addEventListener('accept_suggestion', e => {
  emitSignal({ type: 'accept_suggestion', suggestion: e.detail?.suggestion });
});
window.addEventListener('dismiss_suggestion', e => {
  emitSignal({ type: 'dismiss_suggestion', suggestion: e.detail?.suggestion });
});
window.addEventListener('external_doc', e => {
  emitSignal({ type: 'external_doc', url: e.detail?.url });
});
window.addEventListener('rage_click', e => {
  emitSignal({ type: 'rage_click', target: e.detail?.target });
});
window.addEventListener('undo_stack', e => {
  emitSignal({ type: 'undo_stack', depth: e.detail?.depth });
});
window.addEventListener('redo_stack', e => {
  emitSignal({ type: 'redo_stack', depth: e.detail?.depth });
});
window.addEventListener('commit', e => {
  emitSignal({ type: 'commit', commitId: e.detail?.commitId });
});
window.addEventListener('pr', e => {
  emitSignal({ type: 'pr', prId: e.detail?.prId });
});
window.addEventListener('merge', e => {
  emitSignal({ type: 'merge', mergeId: e.detail?.mergeId });
});
window.addEventListener('conflict', e => {
  emitSignal({ type: 'conflict', files: e.detail?.files });
});
window.addEventListener('session_start', e => {
  emitSignal({ type: 'session_start', sessionId: e.detail?.sessionId });
});
window.addEventListener('session_end', e => {
  emitSignal({ type: 'session_end', sessionId: e.detail?.sessionId });
});
// Idle detection
setInterval(() => {
  const now = Date.now();
  if (now - lastIdleTimestamp > 60000) { // 1 minute idle
    emitSignal({ type: 'idle' });
    lastIdleTimestamp = now;
  }
}, 30000);
document.addEventListener('mousemove', () => { lastIdleTimestamp = Date.now(); });
document.addEventListener('keydown', () => { lastIdleTimestamp = Date.now(); });
// Voice integration (to be called from your voice handler)
export function emitVoiceSignal(voiceSignal) {
  emitSignal({ ...voiceSignal });
}
// Export for manual/custom event emission
export default {
  emitSignal,
  emitVoiceSignal,
  getRecentEventBuffer,
  getTemporalFeatures
};
