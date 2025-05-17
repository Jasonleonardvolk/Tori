// GhostReaperIntegration.js
// Hooks up Ghost and Reaper mode logic to CodeMirror in ConceptEditorPanel
import modeTrigger from '../../ghost/modeTrigger';
import reaperEffects from '../../ghost/reaperEffects';

export function integrateGhostReaper(cm) {
  let lastMode = modeTrigger.getCurrentMode();
  let reaperActiveLine = null;

  function applyModeEffects() {
    const mode = modeTrigger.getCurrentMode();
    if (mode === 'reaper') {
      const errorLine = findFirstErrorLine(cm);
      if (errorLine !== null) {
        reaperEffects.isolateAndFocus(cm, errorLine);
        reaperActiveLine = errorLine;
      }
      reaperEffects.enforceFocus();
    } else {
      reaperEffects.clearIsolation(cm);
      reaperEffects.clearNoEscape();
      reaperActiveLine = null;
    }
    lastMode = mode;
  }

  function findFirstErrorLine(cm) {
    for (let i = 0; i < cm.lineCount(); i++) {
      const text = cm.getLine(i);
      if (/error|fail|broken|XXX|TODO/.test(text)) return i;
    }
    return null;
  }

  cm.on('change', () => {
    modeTrigger.updateMode({ edit: true });
    const mode = modeTrigger.getCurrentMode();
    if (mode !== lastMode) applyModeEffects();
  });
  cm.on('save', () => {
    modeTrigger.updateMode({ save: true });
    const mode = modeTrigger.getCurrentMode();
    if (mode !== lastMode) applyModeEffects();
  });
  window.addEventListener('editor-stack-trace', () => {
    modeTrigger.updateMode({ stackTrace: true });
    const mode = modeTrigger.getCurrentMode();
    if (mode !== lastMode) applyModeEffects();
  });
  window.addEventListener('editor-flow-break', () => {
    modeTrigger.updateMode({ flowBroken: true });
    const mode = modeTrigger.getCurrentMode();
    if (mode !== lastMode) applyModeEffects();
  });

  // Initial mode effects
  applyModeEffects();
}
