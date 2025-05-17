// ghostPersonaEngine.ts
// The ghost's mood, tone, and emergent persona engine
// Enables tone blending, mood drift, and rare persona states

import { getAgentSettings } from './agentSettings';

// Possible personas and rare states
export type GhostPersona = 'mentor' | 'mystic' | 'chaotic' | 'default' | 'oracular' | 'unsettled' | 'dreaming';

export type GhostMood = {
  persona: GhostPersona;
  intensity: number; // 0-1 (how strongly the ghost feels this mood)
  blend?: GhostPersona[]; // for mood drift/interpolation
  rare?: boolean;
  reason?: string; // why this mood is active
};

// --- Mood Interpolation/Blending Logic ---
// Compute mood based on memory, phase, friction, time, unlocks, entropy, etc.
export function getCurrentGhostMood({
  phase = 0,
  friction = 0,
  timeOfDay = new Date().getHours(),
  sessionEntropy = 0,
  unlocks = {},
  recentEvents = []
} = {}): GhostMood {
  // 1. Start with persona from agent settings
  let persona: GhostPersona = getAgentSettings().ghostPersonaTone as GhostPersona || 'default';
  let intensity = 0.6;
  let blend: GhostPersona[] = [];
  let rare = false;
  let reason = '';

  // 2. Drift persona based on phase/frequency
  if (phase > 0.8 && friction < 0.3) {
    persona = 'mystic';
    intensity = 0.85;
    reason = 'Phase resonance, low friction';
  } else if (friction > 0.8) {
    persona = 'mentor';
    intensity = 0.9;
    reason = 'High friction, ghost steps in to guide';
  } else if (sessionEntropy > 0.8) {
    persona = 'chaotic';
    intensity = 0.8;
    reason = 'High entropy, rapid edits';
  }

  // 3. Rare/emergent states
  if (unlocks['ghostPersonaEvolve'] && phase < 0.2 && friction < 0.2 && timeOfDay >= 2 && timeOfDay <= 5) {
    persona = 'dreaming';
    rare = true;
    intensity = 1.0;
    reason = 'Late night, phase lull, rare unlock';
  }
  if (recentEvents.includes('error_streak') && Math.random() < 0.1) {
    persona = 'unsettled';
    rare = true;
    intensity = 0.7;
    reason = 'Ghost senses repeated struggle';
  }
  if (unlocks['zoneExpansion'] && Math.random() < 0.04) {
    persona = 'oracular';
    rare = true;
    intensity = 0.95;
    reason = 'Zone boundaries blur, ghost whispers prophecy';
  }

  // 4. Mood blending (if multiple triggers)
  if (friction > 0.7 && sessionEntropy > 0.7) {
    blend = ['mentor', 'chaotic'];
    reason = 'Simultaneous high friction and entropy';
  }

  return { persona, intensity, blend, rare, reason };
}

// Utility: get overlay style for mood
export function getOverlayStyleForMood(mood: GhostMood) {
  switch (mood.persona) {
    case 'mystic':
      return {
        background: 'rgba(90, 60, 160, 0.92)',
        color: '#fff',
        boxShadow: '0 0 32px 8px #a080ff66',
        border: '2px solid #c7a3ff',
        fontFamily: 'serif',
        filter: 'blur(0.5px)',
        animation: 'mysticFade 2.5s ease-in-out'
      };
    case 'chaotic':
      return {
        background: 'rgba(40, 0, 0, 0.92)',
        color: '#ff5a5a',
        boxShadow: '0 0 20px 4px #ff5a5a99',
        border: '2px dashed #ffb347',
        animation: 'chaoticJitter 0.9s infinite',
        fontFamily: 'monospace'
      };
    case 'mentor':
      return {
        background: 'rgba(255,255,255,0.97)',
        color: '#222',
        boxShadow: '0 0 24px 4px #b2f7ef66',
        border: '2px solid #b2f7ef',
        fontFamily: 'sans-serif',
        fontWeight: 600,
        animation: 'mentorZoom 0.5s'
      };
    case 'oracular':
      return {
        background: 'linear-gradient(90deg,#222,#7e5fff 70%,#fff0 100%)',
        color: '#fff',
        border: '2px double #b3f7ff',
        boxShadow: '0 0 40px 10px #b3f7ff55',
        fontFamily: 'serif',
        letterSpacing: '0.06em',
        animation: 'oracularPulse 3s infinite alternate'
      };
    case 'unsettled':
      return {
        background: 'repeating-linear-gradient(135deg,#222 0 6px,#3a3a3a 8px 12px)',
        color: '#ffb347',
        border: '2px solid #ffb347',
        boxShadow: '0 0 16px 2px #ffb34744',
        fontFamily: 'monospace',
        animation: 'unsettledShake 0.4s infinite'
      };
    case 'dreaming':
      return {
        background: 'linear-gradient(120deg,#161c2d 0%,#a7a3ff 100%)',
        color: '#fff',
        border: '2px solid #a7a3ff',
        boxShadow: '0 0 60px 16px #a7a3ff33',
        fontFamily: 'serif',
        filter: 'blur(1.5px)',
        animation: 'dreamingFloat 6s infinite alternate'
      };
    default:
      return {
        background: '#232323',
        color: '#fff',
        border: '2px solid #888',
        boxShadow: '0 2px 12px #0007'
      };
  }
}

// Optionally: export a hook or helper for overlays to use current mood
// e.g., useGhostMood() or getCurrentGhostMood() in overlay rendering
