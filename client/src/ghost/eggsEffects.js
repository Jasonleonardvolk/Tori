// eggsEffects.js
// Visual, audio, and haptic effects for Ghost Mode Easter Eggs

// --- Animation helpers ---
export function ghostWhooshEffect(el) {
  if (!el) return;
  el.classList.add('ghost-whoosh');
  playWhooshSound();
  setTimeout(() => el.classList.remove('ghost-whoosh'), 1200);
}

export function ghostHandsEffect(el) {
  if (!el) return;
  const overlay = document.createElement('div');
  overlay.className = 'ghost-hands-overlay';
  overlay.innerText = ' ';
  el.appendChild(overlay);
  playWhisperSound();
  setTimeout(() => overlay.remove(), 3000);
}

// --- Sound helpers ---
let soundEnabled = true;
let whooshBuffer = null;
let whisperBuffer = null;

export function setEggsSoundEnabled(val) { soundEnabled = !!val; }
export function isEggsSoundEnabled() { return soundEnabled; }

function playWhooshSound() {
  if (!soundEnabled) return;
  playSound('whoosh');
}
function playWhisperSound() {
  if (!soundEnabled) return;
  playSound('whisper');
}
function playSound(type) {
  // Use AudioContext for smooth, non-jarring playback
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let url = '';
    if (type === 'whoosh') url = '/ghost_sounds/whoosh.ogg';
    if (type === 'whisper') url = '/ghost_sounds/whisper.ogg';
    fetch(url)
      .then(r => r.arrayBuffer())
      .then(buf => ctx.decodeAudioData(buf))
      .then(audioBuf => {
        const src = ctx.createBufferSource();
        src.buffer = audioBuf;
        src.connect(ctx.destination);
        src.start(0);
        src.onended = () => ctx.close();
      });
  } catch (e) {}
}

// --- Haptic helpers ---
export function ghostVibrate(pattern = [40, 30, 40]) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}
