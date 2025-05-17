// eggsEngine.js
// Centralized handler for Ghost Mode Easter Egg triggers

import eggsConfig from './eggsConfig';

// 1. Doppelgänger Commit
export function tryDoppelgangerCommit({ codeHistory, cm }) {
  if (!eggsConfig.canActivateEgg('doppelgangerCommit')) return;
  // Detect: same line typed 5x and deleted each time
  const counts = {};
  codeHistory.forEach(h => {
    if (!h.deleted && h.line) counts[h.line] = (counts[h.line]||0)+1;
  });
  const candidate = Object.keys(counts).find(line => counts[line] >= 5);
  if (candidate) {
    // Offer to restore with a spooky whoosh
    // (For demo: auto-restore)
    if (cm) {
      cm.replaceRange(candidate + '\n', {line: 0, ch: 0});
      import('./eggsEffects').then(effects => {
        effects.ghostWhooshEffect(cm.getWrapperElement());
        effects.ghostVibrate();
        setTimeout(() => {
          talkAboutEgg('doppelgangerCommit', 'You keep writing and deleting the same thing. Sometimes, it’s easier to let go. Or let me handle it.');
        }, 1500);
      });
    }
    eggsConfig.recordEggActivation('doppelgangerCommit');
  }
}

// 2. Spectral Linter
export function trySpectralLinter({ cm }) {
  if (!eggsConfig.canActivateEgg('spectralLinter')) return;
  const value = cm.getValue();
  const todoCount = (value.match(/TODO|FIXME|\/\//g)||[]).length;
  if (todoCount >= 23) {
    // Overlay ghost hands animation
    const overlay = document.createElement('div');
    overlay.className = 'ghost-hands-overlay';
    overlay.innerText = ' '; // purely visual
    cm.getWrapperElement().appendChild(overlay);
    import('./eggsEffects').then(effects => {
      effects.ghostHandsEffect(cm.getWrapperElement());
      setTimeout(() => {
        talkAboutEgg('spectralLinter', 'It works... but should it? Sometimes the ghosts in your code are the ones you leave behind.');
      }, 3200);
    });
    setTimeout(() => overlay.remove(), 3000);
    eggsConfig.recordEggActivation('spectralLinter');
  }
}

// ... Add similar functions for other eggs ...

export default {
  tryDoppelgangerCommit,
  trySpectralLinter,
  // ...add others here...
};
