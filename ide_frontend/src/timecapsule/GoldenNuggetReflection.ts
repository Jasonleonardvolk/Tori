// GoldenNuggetReflection.ts
// The cathartic, mythic reflection module for creative IDEs
// Offers restorative, awe-invoking, or nostalgic moments during creative fatigue, stillness, or late-night coding

import { getEmotionalRhythm } from './CreativeTelemetryEngine';

const goldenNuggets = [
  {
    type: 'nostalgia',
    message: "Remember your first 'hello world'? The joy of making something appear from nothing? That spark is still within you."
  },
  {
    type: 'awe',
    message: "Pause. Breathe. You are building something that did not exist before you touched it."
  },
  {
    type: 'play',
    message: "What if you coded this as a game? Let your inner child play for a moment—see what emerges."
  },
  {
    type: 'beginner',
    message: "Beginner’s mind: see this problem as if for the first time. What would you try if you weren’t afraid to break it?"
  },
  {
    type: 'gratitude',
    message: "Every bug you fix is a gift to your future self."
  }
];

// Configurable triggers (API hooks)
export function shouldShowGoldenNugget({ idleMs, frustrationLevel, isLateNight, creativeMomentum }) {
  // Calm design: only trigger if a real need is detected
  if (idleMs > 60000) return true; // 1+ min of stillness
  if (frustrationLevel > 0.7) return true;
  if (isLateNight && creativeMomentum < 0.3) return true;
  return false;
}

export function getGoldenNugget({ lastType }) {
  // Rotate or randomize, avoid repeating lastType
  const options = goldenNuggets.filter(n => n.type !== lastType);
  return options[Math.floor(Math.random() * options.length)];
}

// Optional: log when a nugget is shown for adaptive learning
const goldenNuggetLog = [];
export function recordGoldenNuggetShown({ timestamp, type, userReaction }) {
  goldenNuggetLog.push({ timestamp, type, userReaction });
}

// Optional: API for integrating with overlays/modals
export function triggerGoldenNuggetOverlay({ idleMs, frustrationLevel, isLateNight, creativeMomentum, lastType }) {
  if (!shouldShowGoldenNugget({ idleMs, frustrationLevel, isLateNight, creativeMomentum })) return null;
  const nugget = getGoldenNugget({ lastType });
  // Here, you’d call your overlay/modal system to display nugget.message
  recordGoldenNuggetShown({ timestamp: Date.now(), type: nugget.type, userReaction: null });
  return nugget;
}
