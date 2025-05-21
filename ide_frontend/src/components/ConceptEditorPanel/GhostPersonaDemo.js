// GhostPersonaDemo.js
// Demo script for the full Ghost + Reaper persona, showing escalation, empathy, and para-cognitive effects

import modeTrigger from '../../ghost/modeTrigger';
import reaperEffects from '../../ghost/reaperEffects';
import interactionSignals from '../../ghost/interactionSignals';
import ambientEffects from '../../ghost/ambientEffects';
import sessionMemory from '../../ghost/sessionMemory';

export function runGhostPersonaDemo(cm) {
  if (!cm) return;
  // 1. Normal ghostly effects: subtle hue shift, ghost trail, shimmer
  console.log('Ghost Mode: ambient effects, ghost trails, shimmer.');
  ambientEffects.applyHueShift(cm.getWrapperElement(), 0.03, 2000);
  setTimeout(() => {
    ambientEffects.applyShimmer(cm.getWrapperElement(), 1500);
  }, 800);
  // Simulate an abandoned thought (ghost trail)
  setTimeout(() => {
    cm.replaceRange('let abandoned = true;\n', {line: 0, ch: 0});
    interactionSignals.recordEchoTrace({text: 'let abandoned = true;', pos: {line:0,ch:0}, time: Date.now()});
    cm.replaceRange('', {line: 0, ch: 0}, {line: 1, ch: 0}); // delete
    console.log('Ghost trail left behind. Hover or undo to re-manifest.');
  }, 1200);

  // 2. Frustration and flow detection
  setTimeout(() => {
    console.log('Simulating frustration: rapid edits, flow breaks, entropy.');
    for (let i = 0; i < 42; i++) {
      cm.replaceRange('// edit ' + i + '\n', {line: 0, ch: 0});
    }
    window.dispatchEvent(new Event('editor-flow-break'));
    window.dispatchEvent(new Event('editor-flow-break'));
    window.dispatchEvent(new Event('editor-flow-break'));
    window.dispatchEvent(new Event('editor-stack-trace'));
    window.dispatchEvent(new Event('editor-stack-trace'));
  }, 2500);

  // 3. Reaper Mode: aggressive intervention
  setTimeout(() => {
    console.log('Reaper Mode: focus, pulse, truth serum, no escape.');
    const errorLine = 0;
    reaperEffects.isolateAndFocus(cm, errorLine);
    reaperEffects.pulseAnomaly(cm, errorLine);
    reaperEffects.showTruthSerum(cm, errorLine, "You’ve rewritten this three times. You know what you're doing is wrong. Let’s fix it.");
    reaperEffects.enforceFocus();
    sessionMemory.logHighFriction('Reaper Mode Engaged (demo)');
  }, 4000);

  // 4. Simulate recovery: save event clears entropy, returns to Ghost Mode
  setTimeout(() => {
    console.log('Simulating save (should restore Ghost Mode)');
    if (cm.save) cm.save();
    else window.dispatchEvent(new Event('editor-save'));
    reaperEffects.clearIsolation(cm);
    reaperEffects.clearNoEscape();
    ambientEffects.applyHueShift(cm.getWrapperElement(), -0.02, 1500);
    sessionMemory.logHighFriction('Ghost Mode Restored (demo)');
  }, 8000);

  // 5. Session-level narrative export
  setTimeout(() => {
    const today = new Date().toISOString().slice(0,10);
    sessionMemory.exportSessionDiary(today);
    console.log('Session diary exported.');
  }, 10000);
}
