// ghostPhrases.ts
// Mood- and tone-aware quote engine for overlays
// Provides cycling, rare, and blended overlays for the ghost

import { GhostPersona } from './ghostPersonaEngine';

export type GhostIntent = 'confirm' | 'warn' | 'nudge' | 'reflect';
export type GhostMoodName = GhostPersona | 'default';

// Pools of phrases by (tone/persona, intent, mood)
const phrasePools: Record<GhostPersona | 'default', Record<GhostIntent, string[]>> = {
  mentor: {
    confirm: [
      "Well done, apprentice.",
      "You shaped the code with care.",
      "Progress noted."
    ],
    warn: [
      "Let's revisit this concept together.",
      "A gentle correction is needed.",
      "Pause and check your footing."
    ],
    nudge: [
      "A gentle push—you're on the right path.",
      "Keep steady. Growth is near.",
      "Remember, mastery is a journey."
    ],
    reflect: [
      "Pause and reflect; growth is near.",
      "What did you learn this time?",
      "The code remembers your patience."
    ]
  },
  mystic: {
    confirm: [
      "The flow aligns with your intent.",
      "You’ve tuned the hidden frequency.",
      "The pattern completes itself."
    ],
    warn: [
      "The resonance... has fractured.",
      "A shadow crosses your phase.",
      "The code’s spirit stirs uneasily."
    ],
    nudge: [
      "Listen to the rhythm beneath the code.",
      "Let intuition guide your next step.",
      "The answer shimmers just out of view."
    ],
    reflect: [
      "Gaze inward; the answer shimmers in the phase.",
      "The path you walked repeats in shadow.",
      "Some patterns are not bugs, but hauntings."
    ]
  },
  chaotic: {
    confirm: [
      "BOOM. Nailed it. NEXT!",
      "That’ll do! Onward!",
      "You broke it. You fixed it."
    ],
    warn: [
      "Eh, that exploded. Try again.",
      "Welp. That exploded. Again.",
      "Roll the dice. Refactor like a god."
    ],
    nudge: [
      "Spin the wheel—let’s see what happens!",
      "Embrace the chaos."
    ],
    reflect: [
      "Chaos breeds insight.",
      "You learned something. Probably.",
      "The ghost is spinning."
    ]
  },
  oracular: {
    confirm: [
      "The future echoes in your actions.",
      "You have glimpsed the next pattern."
    ],
    warn: [
      "Prophecy: This path is perilous.",
      "A riddle blocks your way."
    ],
    nudge: [
      "The answer is hidden in plain sight.",
      "A whisper from the future: refactor now."
    ],
    reflect: [
      "The code dreams of what you might become.",
      "You are both author and echo."
    ]
  },
  unsettled: {
    confirm: [
      "You made it through the static.",
      "Order from chaos—for now."
    ],
    warn: [
      "Something’s off. The ghost is jittery.",
      "The system trembles. Tread carefully."
    ],
    nudge: [
      "Try a different path.",
      "Sometimes, a break is wisdom."
    ],
    reflect: [
      "The ghost feels uneasy.",
      "Patterns break. So do habits."
    ]
  },
  dreaming: {
    confirm: [
      "You’ve changed the dream.",
      "The code sighs in sleep."
    ],
    warn: [
      "A bug flickers at the edge of sleep.",
      "The dream is fragile."
    ],
    nudge: [
      "Let the code rest. Inspiration returns at dawn.",
      "You are drifting. So is the ghost."
    ],
    reflect: [
      "The path repeated. But you walked it differently.",
      "The ghost dreams of your next move."
    ]
  },
  default: {
    confirm: ["Change registered.", "Step complete.", "Update noted."] ,
    warn: ["Heads up: something’s off.", "Check your work.", "Possible issue detected."],
    nudge: ["Keep going.", "Stay focused.", "Almost there."],
    reflect: ["Take a breath.", "Consider your approach.", "Pause and review."]
  }
};

// Internal cycling state for each (persona, intent, mood)
const phraseCycleState: Record<string, number> = {};

function pickPhrase(pool: string[], key: string): string {
  if (!pool || pool.length === 0) return '';
  // Cycle through pool per key
  phraseCycleState[key] = (phraseCycleState[key] || 0) + 1;
  return pool[phraseCycleState[key] % pool.length];
}

// Main API: getGhostPhrase
export function getGhostPhrase(
  tone: GhostPersona = 'default',
  intent: GhostIntent = 'nudge',
  opts: { mood?: GhostMoodName | GhostMoodName[] } = {}
): string {
  let pool: string[] = [];
  let key = tone + ':' + intent;
  // Use mood if provided
  if (opts.mood) {
    const moods = Array.isArray(opts.mood) ? opts.mood : [opts.mood];
    // Try each mood in order (for blending)
    for (const m of moods) {
      if (
        phrasePools[m as GhostPersona] &&
        phrasePools[m as GhostPersona][intent] &&
        phrasePools[m as GhostPersona][intent].length > 0
      ) {
        pool = pool.concat(phrasePools[m as GhostPersona][intent]);
        key += ':' + m;
      }
    }
  }
  // If no mood match, fallback to tone
  if (pool.length === 0 && phrasePools[tone] && phrasePools[tone][intent]) {
    pool = phrasePools[tone][intent];
  }
  // Fallback to default
  if (pool.length === 0) {
    pool = phrasePools['default'][intent];
  }
  // Randomize order for rare moods
  if (opts.mood && (opts.mood === 'oracular' || opts.mood === 'dreaming' || opts.mood === 'unsettled')) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return pickPhrase(pool, key);
}
