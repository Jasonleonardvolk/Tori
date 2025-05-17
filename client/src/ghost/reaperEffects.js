// ghost.reaperEffects.js
// Aggressive, high-intensity interventions for Carolina Reaper Mode

import CodeMirror from 'codemirror';

// 1. Intent Amplification: Focus & Isolation
export function isolateAndFocus(cm, line) {
  if (!cm) return;
  // Dim all lines except the target
  cm.getAllMarks().forEach(m => m.clear());
  for (let i = 0; i < cm.lineCount(); i++) {
    if (i !== line) {
      cm.addLineClass(i, 'wrap', 'reaper-dimmed');
    } else {
      cm.addLineClass(i, 'wrap', 'reaper-focused');
    }
  }
  // Scroll to and select the line
  cm.scrollIntoView({line, ch: 0}, 200);
  cm.setCursor({line, ch: 0});
}

export function clearIsolation(cm) {
  if (!cm) return;
  for (let i = 0; i < cm.lineCount(); i++) {
    cm.removeLineClass(i, 'wrap', 'reaper-dimmed');
    cm.removeLineClass(i, 'wrap', 'reaper-focused');
  }
}

// 2. Aggressive Refactoring
export function autoExtractFunction(cm, from, to, name) {
  if (!cm) return;
  const code = cm.getRange(from, to);
  const fnName = name || 'extractedFn';
  const fn = `function ${fnName}() {\n${code}\n}`;
  cm.replaceRange(fn, from, to);
}

export function lockEdits(cm, from, to, duration = 5000) {
  if (!cm) return;
  // Mark region as locked
  const marker = cm.markText(from, to, {className: 'reaper-locked', inclusiveLeft: true, inclusiveRight: true, atomic: true, readOnly: true});
  setTimeout(() => marker.clear(), duration);
}

// 3. Truth Serum Suggestions
export function showTruthSerum(cm, line, message) {
  if (!cm) return;
  // Show a brutal, direct message overlay
  const info = document.createElement('div');
  info.className = 'reaper-truth-serum';
  info.textContent = message;
  cm.addLineWidget(line, info, {above: true});
  setTimeout(() => info.remove(), 4000);
}

// 4. Code Pulse Anomalies
export function pulseAnomaly(cm, line) {
  if (!cm) return;
  cm.addLineClass(line, 'wrap', 'reaper-pulse');
  setTimeout(() => cm.removeLineClass(line, 'wrap', 'reaper-pulse'), 1200);
}

export function pulseBackground(cm) {
  if (!cm) return;
  cm.getWrapperElement().classList.add('reaper-bg-pulse');
  setTimeout(() => cm.getWrapperElement().classList.remove('reaper-bg-pulse'), 2000);
}

// 5. No Escape Mode
export function enforceFocus() {
  document.body.classList.add('reaper-no-escape');
  window.addEventListener('blur', () => {
    document.body.classList.add('reaper-no-escape');
    setTimeout(() => window.focus(), 100);
  });
}

export function clearNoEscape() {
  document.body.classList.remove('reaper-no-escape');
}

export default {
  isolateAndFocus,
  clearIsolation,
  autoExtractFunction,
  lockEdits,
  showTruthSerum,
  pulseAnomaly,
  pulseBackground,
  enforceFocus,
  clearNoEscape
};
