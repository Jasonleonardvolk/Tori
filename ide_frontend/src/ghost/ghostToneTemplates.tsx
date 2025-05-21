// ghostToneTemplates.ts
// Defines tone templates for different ghost personas
// Used by the Golden Nugget reflection system

import { GhostPersona } from './ghostPersonaEngine';

export interface ToneTemplate {
  // Base linguistic patterns
  sentenceStarters: string[];
  transitionPhrases: string[];
  emphasisMarkers: string[];
  closingPhrases: string[];
  
  // Stylistic elements  
  averageSentenceLength: number; // words
  complexityLevel: number; // 0-1 scale
  formalityLevel: number; // 0-1 scale
  poeticLevel: number; // 0-1 scale
  
  // Characteristic elements
  frequentMetaphors: string[];
  vocabularyDomain: string[];
  emotionalTone: string;
}

// Tone templates for each persona
const toneTemplates: Record<GhostPersona, ToneTemplate> = {
  mentor: {
    sentenceStarters: [
      "Consider this:", 
      "Notice how", 
      "Look closely at", 
      "You've discovered", 
      "Remember that"
    ],
    transitionPhrases: [
      "More importantly,", 
      "On the other hand,", 
      "Which means", 
      "This leads to", 
      "And yet"
    ],
    emphasisMarkers: [
      "precisely", 
      "critically", 
      "fundamentally", 
      "essentially", 
      "clearly"
    ],
    closingPhrases: [
      "Keep this in mind.", 
      "Consider what this means.", 
      "The path forward is clear.", 
      "You'll find your way.", 
      "Trust your process."
    ],
    averageSentenceLength: 12,
    complexityLevel: 0.7,
    formalityLevel: 0.8,
    poeticLevel: 0.4,
    frequentMetaphors: [
      "journey", 
      "foundation", 
      "bridge", 
      "map", 
      "compass"
    ],
    vocabularyDomain: [
      "clarity", 
      "structure", 
      "guidance", 
      "progress", 
      "refinement"
    ],
    emotionalTone: "confident"
  },
  
  mystic: {
    sentenceStarters: [
      "Through the veil,", 
      "In the resonance,", 
      "The pattern reveals", 
      "Beneath the surface,", 
      "Whispers of"
    ],
    transitionPhrases: [
      "Yet beyond that,", 
      "As above, so below,", 
      "In the spaces between,", 
      "Following the currents,", 
      "When the cycle turns,"
    ],
    emphasisMarkers: [
      "truly", 
      "deeply", 
      "resonantly", 
      "eternally", 
      "profoundly"
    ],
    closingPhrases: [
      "Trust the unseen pattern.", 
      "Let it echo through your work.", 
      "The cycle continues.", 
      "Feel the resonance between worlds.", 
      "The veil thins when you see."
    ],
    averageSentenceLength: 10,
    complexityLevel: 0.5,
    formalityLevel: 0.3,
    poeticLevel: 0.9,
    frequentMetaphors: [
      "veil", 
      "tide", 
      "echo", 
      "shadow", 
      "pattern"
    ],
    vocabularyDomain: [
      "resonance", 
      "harmony", 
      "alignment", 
      "flow", 
      "phase"
    ],
    emotionalTone: "ethereal"
  },
  
  chaotic: {
    sentenceStarters: [
      "Shatter this:", 
      "Weird, right?", 
      "Plot twist:", 
      "Against all patterns,", 
      "Hilariously,"
    ],
    transitionPhrases: [
      "But wait, it gets better -", 
      "Then again,", 
      "Or maybe not?", 
      "Flip it around though:", 
      "Unless..."
    ],
    emphasisMarkers: [
      "wildly", 
      "ridiculously", 
      "absolutely", 
      "completely", 
      "strangely"
    ],
    closingPhrases: [
      "Just a thought experiment.", 
      "Chaos has its own pattern.", 
      "Try it - what's the worst that happens?", 
      "Break it to remake it.", 
      "The glitch is the feature."
    ],
    averageSentenceLength: 8,
    complexityLevel: 0.6,
    formalityLevel: 0.2,
    poeticLevel: 0.7,
    frequentMetaphors: [
      "storm", 
      "fractal", 
      "lightning", 
      "quantum", 
      "paradox"
    ],
    vocabularyDomain: [
      "disruption", 
      "experiment", 
      "unexpected", 
      "reimagine", 
      "twist"
    ],
    emotionalTone: "playful"
  },
  
  default: {
    sentenceStarters: [
      "I notice", 
      "Perhaps", 
      "It seems", 
      "I wonder if", 
      "Consider"
    ],
    transitionPhrases: [
      "However,", 
      "Also,", 
      "Meanwhile,", 
      "In addition,", 
      "On another note,"
    ],
    emphasisMarkers: [
      "actually", 
      "notably", 
      "interestingly", 
      "remarkably", 
      "indeed"
    ],
    closingPhrases: [
      "Just an observation.", 
      "Something to consider.", 
      "Hope that helps.", 
      "Take what resonates.", 
      "Make of that what you will."
    ],
    averageSentenceLength: 12,
    complexityLevel: 0.5,
    formalityLevel: 0.5,
    poeticLevel: 0.3,
    frequentMetaphors: [
      "path", 
      "tool", 
      "lens", 
      "door", 
      "thread"
    ],
    vocabularyDomain: [
      "observation", 
      "pattern", 
      "option", 
      "approach", 
      "perspective"
    ],
    emotionalTone: "neutral"
  },
  
  // Add templates for rare personas as well
  dreaming: {
    sentenceStarters: [
      "Drifting through", 
      "Half-remembered", 
      "In the fog of", 
      "Floating between", 
      "Dreams whisper of"
    ],
    transitionPhrases: [
      "Then dissolving into", 
      "Fading, yet", 
      "Shifting like mist to", 
      "Between waking and sleeping,", 
      "Barely perceptible,"
    ],
    emphasisMarkers: [
      "hazily", 
      "dreamlike", 
      "ethereally", 
      "surreally", 
      "mysteriously"
    ],
    closingPhrases: [
      "But dreams fade upon waking.", 
      "All will be clearer in morning light.", 
      "Sleep now, the code can wait.", 
      "Let it incubate in dreams.", 
      "The unconscious knows the pattern."
    ],
    averageSentenceLength: 9,
    complexityLevel: 0.4,
    formalityLevel: 0.2,
    poeticLevel: 0.9,
    frequentMetaphors: [
      "mist", 
      "ocean", 
      "twilight", 
      "stars", 
      "horizon"
    ],
    vocabularyDomain: [
      "subconscious", 
      "liminal", 
      "dream", 
      "intuition", 
      "whisper"
    ],
    emotionalTone: "hypnagogic"
  },
  
  oracular: {
    sentenceStarters: [
      "It is foretold:", 
      "The patterns reveal:", 
      "From beyond time,", 
      "The oracle has seen:", 
      "Written in the code:"
    ],
    transitionPhrases: [
      "Yet the future shifts when", 
      "On paths yet unwoven,", 
      "Through the mists of possibility,", 
      "Across the tapestry of time,", 
      "As the threads converge,"
    ],
    emphasisMarkers: [
      "inevitably", 
      "prophetically", 
      "divinely", 
      "cosmically", 
      "foreseeably"
    ],
    closingPhrases: [
      "So it has been seen.", 
      "Time will prove this true.", 
      "The prophecy awaits fulfillment.", 
      "Remember these words when the time comes.", 
      "Let this guide your hand when doubt rises."
    ],
    averageSentenceLength: 11,
    complexityLevel: 0.8,
    formalityLevel: 0.8,
    poeticLevel: 0.9,
    frequentMetaphors: [
      "tapestry", 
      "constellation", 
      "prophecy", 
      "oracle", 
      "destiny"
    ],
    vocabularyDomain: [
      "future", 
      "fate", 
      "timeline", 
      "convergence", 
      "revelation"
    ],
    emotionalTone: "prophetic"
  },
  
  unsettled: {
    sentenceStarters: [
      "Something's not right -", 
      "I can't quite...", 
      "There's a disturbance in", 
      "Be cautious of", 
      "Warning:"
    ],
    transitionPhrases: [
      "And worse,", 
      "It gets stranger:", 
      "The pattern breaks when", 
      "Unsettlingly,", 
      "Pay attention to how"
    ],
    emphasisMarkers: [
      "concerningly", 
      "disturbingly", 
      "worryingly", 
      "jarringly", 
      "uneasily"
    ],
    closingPhrases: [
      "We should watch this carefully.", 
      "Something feels wrong here.", 
      "Proceed with caution.", 
      "I hope I'm mistaken.", 
      "Trust your instincts on this."
    ],
    averageSentenceLength: 7,
    complexityLevel: 0.4,
    formalityLevel: 0.4,
    poeticLevel: 0.5,
    frequentMetaphors: [
      "warning", 
      "tremor", 
      "shadow", 
      "discord", 
      "fracture"
    ],
    vocabularyDomain: [
      "uncertainty", 
      "intuition", 
      "caution", 
      "dissonance", 
      "warning"
    ],
    emotionalTone: "anxious"
  }
};

/**
 * Get the tone template for a specific ghost persona
 */
export function getToneTemplateForPersona(persona: GhostPersona): ToneTemplate {
  return toneTemplates[persona] || toneTemplates.default;
}

/**
 * Apply a tone template to a message
 * Basic implementation - can be expanded for more sophisticated text transformation
 */
export function applyToneTemplate(message: string, persona: GhostPersona): string {
  const template = getToneTemplateForPersona(persona);
  
  // Simple case - just add a starter and closing phrase
  const starter = template.sentenceStarters[Math.floor(Math.random() * template.sentenceStarters.length)];
  const closing = template.closingPhrases[Math.floor(Math.random() * template.closingPhrases.length)];
  
  // If message doesn't start with the starter, prepend it
  const startsWithStarter = template.sentenceStarters.some(s => message.startsWith(s));
  
  let formattedMessage = message;
  if (!startsWithStarter && Math.random() > 0.5) { // 50% chance to add starter
    formattedMessage = `${starter} ${formattedMessage}`;
  }
  
  // If message doesn't end with closing, append it
  const endsWithClosing = template.closingPhrases.some(c => message.endsWith(c));
  
  if (!endsWithClosing && Math.random() > 0.7) { // 30% chance to add closing
    formattedMessage = `${formattedMessage} ${closing}`;
  }
  
  return formattedMessage;
}
