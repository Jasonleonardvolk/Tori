// getOverlayAnimationForReflection.ts
// Provides animation mappings for different types of Golden Nugget reflections
// Used to create visually distinctive experiences for each trigger type

import { NuggetTriggerType } from './goldenNuggetTrigger';

// Animation effect names correspond to CSS animations defined in the project's styles
type AnimationName = 
  | 'fadeIn' 
  | 'fadeInOut' 
  | 'fadeInSlideUp' 
  | 'fadeInSlideLeft' 
  | 'fadeInSlideRight' 
  | 'pulseGlow' 
  | 'gentleBreathe' 
  | 'starryNight' 
  | 'phaseShift' 
  | 'shimmerIn' 
  | 'typewriter' 
  | 'ripple' 
  | 'glitchIn' 
  | 'flickerReveal'
  | 'veilLift'
  | 'sparkleIn'
  | 'waveFlow';

// Mapping of trigger types to appropriate animations
const animationMapping: Record<NuggetTriggerType, AnimationName> = {
  [NuggetTriggerType.CONTRADICTION]: 'glitchIn',
  [NuggetTriggerType.STABILITY]: 'phaseShift',
  [NuggetTriggerType.FATIGUE]: 'gentleBreathe',
  [NuggetTriggerType.IDLE]: 'fadeInOut',
  [NuggetTriggerType.GROWTH]: 'sparkleIn',
  [NuggetTriggerType.LATE_NIGHT]: 'starryNight',
  [NuggetTriggerType.DRIFT]: 'waveFlow',
  [NuggetTriggerType.BREAKTHROUGH]: 'veilLift'
};

// Get the appropriate animation for a given trigger type
export function getOverlayAnimationForReflection(triggerType: NuggetTriggerType): string {
  return animationMapping[triggerType] || 'fadeIn'; // Default to fadeIn if no mapping
}

// Animation parameters for customization
export interface AnimationOptions {
  duration?: number; // ms
  easing?: string;
  iterationCount?: number | 'infinite';
  delay?: number; // ms
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

// Generate CSS animation string with custom parameters
export function getAnimationStyle(animationName: string, options: AnimationOptions = {}): string {
  const {
    duration = 1000,
    easing = 'ease-in-out',
    iterationCount = 1,
    delay = 0,
    direction = 'normal'
  } = options;
  
  return `${animationName} ${duration}ms ${easing} ${delay}ms ${iterationCount} ${direction}`;
}

/**
 * Generate CSS keyframes for custom animations
 * Can be used to dynamically create animations based on context
 */
export function generateCustomKeyframes(
  animationName: string, 
  keyframes: Record<string, Record<string, string>>
): string {
  let keyframeCSS = `@keyframes ${animationName} {`;
  
  for (const [position, properties] of Object.entries(keyframes)) {
    keyframeCSS += `${position} {`;
    
    for (const [property, value] of Object.entries(properties)) {
      keyframeCSS += `${property}: ${value};`;
    }
    
    keyframeCSS += '}';
  }
  
  keyframeCSS += '}';
  
  return keyframeCSS;
}

// Animation timing curves for different emotional qualities
export const animationCurves = {
  gentle: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  bouncy: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  dramatic: 'cubic-bezier(0.645, 0.045, 0.355, 1.000)',
  tension: 'cubic-bezier(0.77, 0, 0.175, 1)',
  swift: 'cubic-bezier(0.19, 1, 0.22, 1)',
  mystical: 'cubic-bezier(0.445, 0.05, 0.55, 0.95)'
};

// Map personas to animation timing curves for consistency
export const personaAnimationCurves = {
  mentor: animationCurves.gentle,
  mystic: animationCurves.mystical,
  chaotic: animationCurves.bouncy,
  dreaming: animationCurves.swift,
  oracular: animationCurves.dramatic,
  unsettled: animationCurves.tension,
  default: animationCurves.gentle
};
