// talkAboutEgg.js
// Shows a floating dialog or toast where the IDE "talks about" the triggered egg

let activeEggDialog = null;

export function talkAboutEgg(egg, message) {
  if (activeEggDialog) {
    activeEggDialog.remove();
    activeEggDialog = null;
  }
  const dialog = document.createElement('div');
  dialog.className = 'ghost-egg-dialog';
  dialog.innerHTML = `<span class="ghost-egg-icon">👻</span> <b>${eggName(egg)}</b><div class="ghost-egg-message">${message}</div>`;
  document.body.appendChild(dialog);
  activeEggDialog = dialog;
  setTimeout(() => {
    dialog.classList.add('ghost-egg-dialog-fadeout');
    setTimeout(() => {
      dialog.remove();
      if (activeEggDialog === dialog) activeEggDialog = null;
    }, 800);
  }, 4200);
}

function eggName(egg) {
  const names = {
    doppelgangerCommit: 'Doppelgänger Commit',
    spectralLinter: 'Spectral Linter',
    poltergeistConsole: 'Poltergeist Console',
    phantomTypist: 'Phantom Typist',
    entropicOracle: 'Entropic Oracle',
    realityFracture: 'Reality Fracture',
    wispInSidebar: 'Wisp in the Sidebar',
    nullProphet: 'Null Prophet',
    carolinaWhisper: 'Carolina Whisper',
    resurrectionHotkey: 'Resurrection Hotkey',
    silentObserver: 'Silent Observer'
  };
  return names[egg] || egg;
}

export default talkAboutEgg;
