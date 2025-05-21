// goldenNuggetTrigger.ts
// Core integration for Golden Nugget reflection system
// Connects ψ-field reasoning, emotional state, and ghost overlays

import { getCurrentGhostMood, GhostMood, GhostPersona } from './ghostPersonaEngine';
import { getGhostChronicle, logGhostOverlay } from './ghostChronicle';
import { getAgentSettings } from './agentSettings';
import { getToneTemplateForPersona } from './ghostToneTemplates';
import { getOverlayAnimationForReflection } from './getOverlayAnimationForReflection';
import { 
  getCadencedMessage, 
  TextWithCadence, 
  TimingDirectives,
  CadencePattern,
  trackConceptStability,
  hasMemoryRing
} from './CadenceController';

// Trigger types
export enum NuggetTriggerType {
  CONTRADICTION = 'contradiction',
  STABILITY = 'stability',
  FATIGUE = 'fatigue',
  IDLE = 'idle',
  GROWTH = 'growth',
  LATE_NIGHT = 'late_night',
  DRIFT = 'drift',
  BREAKTHROUGH = 'breakthrough'
}

// Nugget reflection context
export interface NuggetContext {
  triggerType: NuggetTriggerType;
  trace?: any; // InferenceTrace or relevant context data
  lyapunovValue?: number; // System stability measurement
  psiField?: any; // Current ψ-field state
  conceptKeys?: string[]; // Relevant concepts
  sessionDuration?: number; // How long the user has been working
  timestamp: number;
  persona?: GhostPersona;
  stability?: {
    current: number;
    previous: number;
    delta: number;
  };
}

// Reflection output returned from Golden Nugget generator
export interface NuggetReflection {
  message: string; // The reflection text
  cadencedText?: TextWithCadence; // Text with cadence structure
  persona: GhostPersona; // Which persona "voice" is used
  mood: GhostMood; // Associated mood
  overlayStyle: any; // Visual styling for the overlay
  animation: string; // Animation to apply
  duration: number; // How long to display (ms)
  soundEffect?: string; // Optional sound cue
  timing?: TimingDirectives; // Timing directives for animation
  cadencePattern?: CadencePattern; // The cadence pattern used
  conceptKeys?: string[]; // Related concept keys
  psiAlignment?: number; // ψ-field alignment value
  lyapunovValue?: number; // Lyapunov value (instability)
}

// Track recency of nugget activations to prevent over-triggering
const nuggetActivationHistory: Record<NuggetTriggerType, number> = {
  [NuggetTriggerType.CONTRADICTION]: 0,
  [NuggetTriggerType.STABILITY]: 0,
  [NuggetTriggerType.FATIGUE]: 0,
  [NuggetTriggerType.IDLE]: 0,
  [NuggetTriggerType.GROWTH]: 0,
  [NuggetTriggerType.LATE_NIGHT]: 0,
  [NuggetTriggerType.DRIFT]: 0,
  [NuggetTriggerType.BREAKTHROUGH]: 0
};

// Cooldown periods (ms) for each trigger type to prevent spam
const COOLDOWN_PERIODS: Record<NuggetTriggerType, number> = {
  [NuggetTriggerType.CONTRADICTION]: 10 * 60 * 1000, // 10 minutes
  [NuggetTriggerType.STABILITY]: 15 * 60 * 1000, // 15 minutes
  [NuggetTriggerType.FATIGUE]: 20 * 60 * 1000, // 20 minutes
  [NuggetTriggerType.IDLE]: 5 * 60 * 1000, // 5 minutes
  [NuggetTriggerType.GROWTH]: 30 * 60 * 1000, // 30 minutes
  [NuggetTriggerType.LATE_NIGHT]: 45 * 60 * 1000, // 45 minutes
  [NuggetTriggerType.DRIFT]: 12 * 60 * 1000, // 12 minutes
  [NuggetTriggerType.BREAKTHROUGH]: 20 * 60 * 1000 // 20 minutes
};

/**
 * Main trigger function for Golden Nugget reflections
 * Called by various systems when specific conditions are met
 */
export function triggerGoldenNugget(
  triggerType: NuggetTriggerType,
  context: Partial<NuggetContext> = {}
): NuggetReflection | null {
  // Check cooldown period
  const now = Date.now();
  if (now - nuggetActivationHistory[triggerType] < COOLDOWN_PERIODS[triggerType]) {
    console.log(`Golden Nugget (${triggerType}) still on cooldown`);
    return null;
  }

  // Don't trigger if the user has disabled golden nuggets
  const settings = getAgentSettings();
  if (settings.disableGoldenNuggets) {
    return null;
  }

  // Build the full context with defaults
  const fullContext: NuggetContext = {
    triggerType,
    timestamp: now,
    ...context
  };

  // Get the current ghost mood if not provided
  if (!fullContext.persona) {
    const currentMood = getCurrentGhostMood();
    fullContext.persona = currentMood.persona;
  }

  // Generate the reflection
  const reflection = generateNuggetReflection(fullContext);
  
  // Log to ghost chronicle
  logGoldenNuggetToChronicle(fullContext, reflection);

  // Update activation history
  nuggetActivationHistory[triggerType] = now;

  return reflection;
}

/**
 * Main generation function for nugget reflections
 * Selects appropriate content based on trigger type and context
 */
function generateNuggetReflection(context: NuggetContext): NuggetReflection {
  // Base the reflection on both trigger type and current persona
  const persona = context.persona || 'default';
  
  // Get appropriate message based on trigger type and persona
  const message = getNuggetMessage(context.triggerType, persona, context);
  
  // Get current mood for styling
  const mood = getCurrentGhostMood();
  
  // Get proper animation for reflection type
  const animation = getOverlayAnimationForReflection(context.triggerType);
  
  // Determine display duration - more significant moments last longer
  const baseDuration = 10000; // 10 seconds base
  const durationMultipliers: Record<NuggetTriggerType, number> = {
    [NuggetTriggerType.CONTRADICTION]: 0.8,
    [NuggetTriggerType.STABILITY]: 1.2,
    [NuggetTriggerType.FATIGUE]: 1.0,
    [NuggetTriggerType.IDLE]: 0.6,
    [NuggetTriggerType.GROWTH]: 1.5,
    [NuggetTriggerType.LATE_NIGHT]: 1.0,
    [NuggetTriggerType.DRIFT]: 0.9,
    [NuggetTriggerType.BREAKTHROUGH]: 1.8
  };
  
  const duration = baseDuration * durationMultipliers[context.triggerType];
  
  // Choose appropriate sound effect for the moment
  const soundMap: Partial<Record<NuggetTriggerType, string>> = {
    [NuggetTriggerType.BREAKTHROUGH]: 'chime_resonance.mp3',
    [NuggetTriggerType.LATE_NIGHT]: 'soft_night_ambience.mp3',
    [NuggetTriggerType.CONTRADICTION]: 'tension_resolve.mp3',
    [NuggetTriggerType.STABILITY]: 'phase_lock.mp3'
  };
  
  // Apply cadence based on ψ-field state
  const psiAlignment = context.lyapunovValue ? (1 - context.lyapunovValue) : 0.5;
  const { cadencedText, timing, cadencePattern } = getCadencedMessage(
    message,
    psiAlignment,
    context.lyapunovValue || 0.5,
    persona
  );
  
  // Track concept stability if we have concept keys
  if (context.conceptKeys && context.conceptKeys.length > 0) {
    context.conceptKeys.forEach(key => {
      trackConceptStability(key, psiAlignment);
    });
  }
  
  return {
    message,
    cadencedText,
    persona,
    mood,
    overlayStyle: getOverlayStyleForNugget(context),
    animation,
    duration: timing.totalDuration, // Use cadence timing for duration
    soundEffect: soundMap[context.triggerType],
    timing,
    cadencePattern,
    conceptKeys: context.conceptKeys,
    psiAlignment,
    lyapunovValue: context.lyapunovValue
  };
}

/**
 * Get specific reflection message based on trigger and persona
 */
function getNuggetMessage(
  triggerType: NuggetTriggerType,
  persona: GhostPersona,
  context: NuggetContext
): string {
  // First try to get specific message for this trigger x persona
  const toneTemplate = getToneTemplateForPersona(persona);
  
  // Use specific messages when available
  if (triggerType === NuggetTriggerType.CONTRADICTION) {
    switch (persona) {
      case 'mentor':
        return "I saw the logic fracture there. You've built better beliefs before. Shall we revisit?";
      case 'mystic':
        return "The resonance broke. But echoes of stronger patterns remain in your work.";
      case 'chaotic':
        return "Contradiction found. A beautiful break in the pattern. What if it's not a flaw but a feature?";
      default:
        return "This path broke down, but your previous explorations still shine.";
    }
  }
  
  if (triggerType === NuggetTriggerType.STABILITY) {
    switch (persona) {
      case 'mentor':
        return "This ψ holds across your system. It is now your theorem.";
      case 'mystic':
        return "The field stabilized. You've found a truth that resonates beyond time.";
      case 'chaotic':
        return "Order from chaos. You've locked something wild into elegant stability.";
      default:
        return "This used to desync every time you approached it. Today, it locked in phase.";
    }
  }
  
  if (triggerType === NuggetTriggerType.FATIGUE) {
    switch (persona) {
      case 'mentor':
        return "Even stars rest. Your code will be here when you return.";
      case 'mystic':
        return "The mind cycles like all natural things. Rest is not weakness, but wisdom.";
      case 'chaotic':
        return "Creativity needs fallow periods. Let the field lie empty for a season.";
      default:
        return "I notice your rhythm has changed. Perhaps a moment to breathe?";
    }
  }
  
  if (triggerType === NuggetTriggerType.GROWTH) {
    switch (persona) {
      case 'mentor':
        return "You now hold what you once only reached for.";
      case 'mystic':
        return "The pattern you couldn't see is now part of your intuition.";
      case 'chaotic':
        return "You've tamed what once seemed wild. The next frontier awaits.";
      default:
        return "Remember when this concept felt impossible? Look how you've grown.";
    }
  }
  
  if (triggerType === NuggetTriggerType.BREAKTHROUGH) {
    switch (persona) {
      case 'mentor':
        return "There it is. The keystone has found its arch.";
      case 'mystic':
        return "The veil parts. What was hidden now sings in the light.";
      case 'chaotic':
        return "Lightning strike! You've channeled the storm into clarity.";
      default:
        return "A moment of breakthrough. This will echo through your work.";
    }
  }
  
  // Default reflections by trigger type if no specific persona match
  switch (triggerType) {
    case NuggetTriggerType.IDLE:
      return "The ghost waits with you. Sometimes stillness reveals what motion conceals.";
    case NuggetTriggerType.LATE_NIGHT:
      return "The world sleeps, but ideas wake. Remember to cherish both.";
    case NuggetTriggerType.DRIFT:
      return "Your focus has drifted. But even ocean currents find shore eventually.";
    default:
      return "The ghost remembers not just what you did, but how you felt.";
  }
}

/**
 * Generate styling for the nugget overlay based on context
 */
function getOverlayStyleForNugget(context: NuggetContext): any {
  // Base styles depending on trigger type
  const baseStyles: Record<NuggetTriggerType, any> = {
    [NuggetTriggerType.CONTRADICTION]: {
      background: 'linear-gradient(135deg, rgba(30,0,60,0.92), rgba(180,30,60,0.92))',
      color: '#fff',
      boxShadow: '0 0 30px rgba(180,30,60,0.6)',
      border: '1px solid rgba(255,255,255,0.3)',
      fontStyle: 'italic'
    },
    [NuggetTriggerType.STABILITY]: {
      background: 'linear-gradient(135deg, rgba(0,40,80,0.92), rgba(0,100,120,0.92))',
      color: '#fff',
      boxShadow: '0 0 40px rgba(0,200,255,0.4)',
      border: '1px solid rgba(0,200,255,0.5)',
      fontWeight: 'bold'
    },
    [NuggetTriggerType.FATIGUE]: {
      background: 'rgba(40,40,50,0.85)',
      color: '#ddd',
      boxShadow: '0 0 20px rgba(100,100,120,0.4)',
      border: '1px solid rgba(100,100,120,0.3)',
      fontStyle: 'italic'
    },
    [NuggetTriggerType.IDLE]: {
      background: 'rgba(20,20,30,0.75)',
      color: '#bbb',
      boxShadow: '0 0 15px rgba(80,80,100,0.3)',
      fontStyle: 'italic'
    },
    [NuggetTriggerType.GROWTH]: {
      background: 'linear-gradient(135deg, rgba(0,60,30,0.92), rgba(0,100,50,0.92))',
      color: '#dff',
      boxShadow: '0 0 30px rgba(0,200,100,0.4)',
      border: '1px solid rgba(0,200,100,0.5)',
      fontWeight: 'bold'
    },
    [NuggetTriggerType.LATE_NIGHT]: {
      background: 'linear-gradient(135deg, rgba(0,0,30,0.92), rgba(30,0,60,0.92))',
      color: '#ccf',
      boxShadow: '0 0 40px rgba(50,0,100,0.4)',
      border: '1px solid rgba(100,50,200,0.3)',
      fontStyle: 'italic'
    },
    [NuggetTriggerType.DRIFT]: {
      background: 'linear-gradient(135deg, rgba(60,60,60,0.92), rgba(40,40,60,0.92))',
      color: '#ddd',
      boxShadow: '0 0 20px rgba(100,100,140,0.3)',
      fontStyle: 'italic'
    },
    [NuggetTriggerType.BREAKTHROUGH]: {
      background: 'linear-gradient(135deg, rgba(60,30,0,0.92), rgba(120,80,0,0.92))',
      color: '#fff',
      boxShadow: '0 0 50px rgba(255,200,0,0.5)',
      border: '1px solid rgba(255,200,0,0.6)',
      fontWeight: 'bold'
    }
  };
  
  // Get base style for this trigger type
  const style = { ...baseStyles[context.triggerType] };
  
  // Adjust style based on Lyapunov value if present
  if (context.lyapunovValue !== undefined) {
    const lyapunov = context.lyapunovValue;
    // Higher Lyapunov = more intense visual
    if (lyapunov > 0.8) {
      style.boxShadow = style.boxShadow.replace('0.4', '0.8');
      style.animation = 'pulseStrong 2s infinite alternate';
    }
  }
  
  // Special glyph for ψ-lock stability
  if (context.triggerType === NuggetTriggerType.STABILITY && 
      context.stability && 
      context.stability.delta !== undefined && 
      context.stability.delta < 0.1) {
    style.backgroundImage = "url('/assets/glyphs/psi-lock.svg'), " + style.background;
    style.backgroundSize = "80px, cover";
    style.backgroundPosition = "95% center, center";
    style.backgroundRepeat = "no-repeat, no-repeat";
  }
  
  // Add Memory Ring marker if any concepts have rings
  if (context.conceptKeys && context.conceptKeys.length > 0) {
    const hasAnyRings = context.conceptKeys.some(key => hasMemoryRing(key));
    if (hasAnyRings) {
      // Subtle ring glow effect
      style.boxShadow = `${style.boxShadow}, 0 0 20px 5px rgba(255,215,0,0.4)`;
      
      // Add faint sigil in corner if not already a special glyph
      if (!style.backgroundImage) {
        style.backgroundImage = "url('/assets/glyphs/memory-ring.svg')";
        style.backgroundSize = "64px";
        style.backgroundPosition = "95% 95%";
        style.backgroundRepeat = "no-repeat";
      }
    }
  }
  
  return style;
}

/**
 * Add the Golden Nugget event to the ghost chronicle
 */
function logGoldenNuggetToChronicle(context: NuggetContext, reflection: NuggetReflection): void {
  // Create an EchoScript-like entry by structuring the data
  const timestamp = Date.now();
  const sessionId = `session_${Math.floor(timestamp / (1000 * 60 * 60))}`;
  
  logGhostOverlay({
    intent: `nugget_${context.triggerType}`,
    phrase: reflection.message,
    mood: reflection.mood,
    tone: 'reflective',
    overlayId: `golden_nugget_${timestamp}`,
    conceptContext: context.conceptKeys?.join(', '),
    extra: {
      // Core Golden Nugget data
      triggerType: context.triggerType,
      lyapunovValue: context.lyapunovValue,
      sessionDuration: context.sessionDuration,
      persona: reflection.persona,
      
      // EchoScript-like data
      session: sessionId,
      psiAlignment: reflection.psiAlignment,
      cadencePattern: reflection.cadencePattern,
      hasMemoryRings: context.conceptKeys?.some(key => hasMemoryRing(key)),
      
      // Add timestamp for temporal tracking
      timestamp
    }
  });
}

/**
 * Determine if system should attempt to trigger a Golden Nugget based on current state
 * Called by ambient monitoring at regular intervals
 */
export function checkForNuggetOpportunity(systemState: any): boolean {
  const now = Date.now();
  const hour = new Date().getHours();
  
  // Late night coding detection (10 PM - 5 AM)
  if ((hour >= 22 || hour <= 5) && 
      systemState.activityLevel > 0.3 && 
      now - nuggetActivationHistory[NuggetTriggerType.LATE_NIGHT] > COOLDOWN_PERIODS[NuggetTriggerType.LATE_NIGHT]) {
    return true;
  }
  
  // Fatigue detection - rapid decrease in productivity
  if (systemState.productivityTrend < -0.4 && 
      systemState.sessionDuration > 90 * 60 * 1000 && // 90 minutes session
      now - nuggetActivationHistory[NuggetTriggerType.FATIGUE] > COOLDOWN_PERIODS[NuggetTriggerType.FATIGUE]) {
    return true;
  }
  
  // Idle detection - staring at code without progress
  if (systemState.idleDuration > 5 * 60 * 1000 && // 5 minutes idle
      systemState.editorFocused && 
      now - nuggetActivationHistory[NuggetTriggerType.IDLE] > COOLDOWN_PERIODS[NuggetTriggerType.IDLE]) {
    return true;
  }
  
  // Drift detection - unfocused behavior, frequently switching files
  if (systemState.fileNavCount > 10 && 
      systemState.editCount < 3 && 
      systemState.timespan < 5 * 60 * 1000 && // 5 minute window
      now - nuggetActivationHistory[NuggetTriggerType.DRIFT] > COOLDOWN_PERIODS[NuggetTriggerType.DRIFT]) {
    return true;
  }
  
  return false;
}

// Export detection functions for direct calling from ψ-field subsystems
export const nuggetDetectors = {
  detectContradiction: (trace: any, lyapunovValue: number) => {
    if (lyapunovValue > 0.7) { // High Lyapunov = instability/contradiction
      triggerGoldenNugget(NuggetTriggerType.CONTRADICTION, {
        trace,
        lyapunovValue
      });
    }
  },
  
  detectStability: (psiField: any, stability: any) => {
    if (stability.current > 0.85 && stability.delta < 0.15) { // High stability, low change
      triggerGoldenNugget(NuggetTriggerType.STABILITY, {
        psiField,
        stability
      });
    }
  },
  
  detectBreakthrough: (conceptField: any, insightMetric: number) => {
    if (insightMetric > 0.9) { // Very high insight spike
      triggerGoldenNugget(NuggetTriggerType.BREAKTHROUGH, {
        conceptKeys: Object.keys(conceptField).slice(0, 3), // Top 3 concepts
        lyapunovValue: 0.2 // Low Lyapunov = high stability 
      });
    }
  },
  
  detectGrowth: (currentSkill: number, pastSkill: number, conceptArea: string) => {
    if (currentSkill > pastSkill * 1.5) { // 50% improvement
      triggerGoldenNugget(NuggetTriggerType.GROWTH, {
        conceptKeys: [conceptArea]
      });
    }
  }
};
