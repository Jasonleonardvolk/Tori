// GhostReaperDemo.js
// Demo/test script for Ghost & Reaper Mode escalation in CodeMirror

export function runGhostReaperDemo(cm) {
  if (!cm) return;
  // 1. Start in Ghost Mode (default)
  console.log('Ghost Mode active. Making normal edits...');
  cm.replaceRange('// normal edit 1\n', {line: 0, ch: 0});

  // 2. Simulate frustration: rapid edits
  setTimeout(() => {
    console.log('Simulating rapid edits (entropy)');
    for (let i = 0; i < 45; i++) {
      cm.replaceRange('// edit ' + i + '\n', {line: 0, ch: 0});
    }
  }, 1000);

  // 3. Simulate flow breaks
  setTimeout(() => {
    console.log('Simulating flow breaks');
    for (let i = 0; i < 3; i++) {
      window.dispatchEvent(new Event('editor-flow-break'));
    }
  }, 2500);

  // 4. Simulate stack traces
  setTimeout(() => {
    console.log('Simulating unresolved stack traces');
    window.dispatchEvent(new Event('editor-stack-trace'));
    window.dispatchEvent(new Event('editor-stack-trace'));
  }, 3500);

  // 5. Watch for Reaper Mode effects (should escalate)
  setTimeout(() => {
    console.log('Reaper Mode should now be active. Watch for isolation, focus, pulse, and no escape.');
  }, 4000);

  // 6. Simulate recovery: save event clears entropy
  setTimeout(() => {
    console.log('Simulating save (should restore Ghost Mode)');
    if (cm.save) cm.save();
    else window.dispatchEvent(new Event('editor-save'));
  }, 7000);
}
