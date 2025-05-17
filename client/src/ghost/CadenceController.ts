// CadenceController.ts
// Controls the rhythm, timing, and cadence of Golden Nugget reflections
// Based on ψ-field alignment and Lyapunov values

import { applyToneTemplate } from './ghostToneTemplates';
import { GhostPersona } from './ghostPersonaEngine';
import { personaAnimationCurves } from './getOverlayAnimationForReflection';

// Cadence patterns represent different rhythmic qualities of text
export enum CadencePattern {
  STABLE_FLOW = 'stable_flow',       // Slow, measured, sage-like
  RESONANT = 'resonant',             // Harmonious, flowing, connected
  NEUTRAL = 'neutral',               // Default rhythm
  SEARCHING = 'searching',           // Questioning rhythm, tentative
  DRIFTING = 'drifting',             // Unfocused, wandering
  FRAGMENTED = 'fragmented',         // Choppy, syncopated, broken
  BREAKTHROUGH = 'breakthrough',     // Excited, revelation
  ORACULAR = 'oracular'              // Mystical, prophetic
}

// Timing directives for animations and text reveal
export interface TimingDirectives {
  fadeInDuration: number;        // ms for fade-in
  fadeOutDuration: number;       // ms for fade-out
  textRevealSpeed: number;       // ms per character or word
  pauseDuration: number;         // ms for pauses
  pulsePeriod?: number;          // ms for pulsing/oscillation
  totalDuration: number;         // ms for entire display
  easing: string;                // CSS easing function
  segmentDelays?: number[];      // ms delays for sentence segments
}

// Structural markers for text cadence
export interface TextWithCadence {
  segments: string[];            // Text broken into rhythm segments
  pauseAfterSegment: boolean[];  // Whether to pause after each segment
  emphasis: number[];            // Emphasis level for each segment (0-1)
  textContent: string;           // The full text content
  rawHtml?: string;              // Optional HTML with timing spans
}

/**
 * Determine appropriate cadence based on ψ-field state
 */
export function determineCadence(
  psiAlignment: number = 0.5, 
  lyapunovValue: number = 0.5
): CadencePattern {
  // High alignment = stable, measured cadence
  if (psiAlignment > 0.9) {
    return CadencePattern.STABLE_FLOW;
  }
  
  // High resonance but not totally stable = flowing
  if (psiAlignment > 0.75 && lyapunovValue < 0.3) {
    return CadencePattern.RESONANT;
  }
  
  // High Lyapunov = chaotic, fragmented cadence
  if (lyapunovValue > 0.7) {
    return CadencePattern.FRAGMENTED;
  }
  
  // Low alignment but not chaotic = searching cadence
  if (psiAlignment < 0.3 && lyapunovValue < 0.7) {
    return CadencePattern.SEARCHING;
  }
  
  // Medium-low alignment + medium Lyapunov = drifting
  if (psiAlignment < 0.5 && lyapunovValue < 0.5) {
    return CadencePattern.DRIFTING;
  }
  
  // Breakthrough has special marker
  const isBreakthrough = psiAlignment > 0.8 && lyapunovValue < 0.2;
  if (isBreakthrough) {
    return CadencePattern.BREAKTHROUGH;
  }
  
  // Rare state for exceptional stability during low average stability
  const isOracular = psiAlignment > 0.85 && Math.random() < 0.1;
  if (isOracular) {
    return CadencePattern.ORACULAR;
  }
  
  // Default
  return CadencePattern.NEUTRAL;
}

/**
 * Apply appropriate rhythm to text based on cadence pattern
 */
export function applyCadenceToText(
  text: string, 
  cadence: CadencePattern,
  persona: GhostPersona = 'default'
): TextWithCadence {
  // First, get text with persona tone applied
  const tonedText = applyToneTemplate(text, persona);
  
  // Split into sentences for cadence processing
  const rawSentences = tonedText.split(/(?<=[.!?])\s+/);
  const sentences = rawSentences.filter(s => s.trim().length > 0);
  
  // Storage for cadence segments
  const segments: string[] = [];
  const pauseAfterSegment: boolean[] = [];
  const emphasis: number[] = [];
  
  // Process based on cadence pattern
  switch (cadence) {
    case CadencePattern.STABLE_FLOW:
      // Measured, even flow - each sentence is a segment
      sentences.forEach(sentence => {
        segments.push(sentence);
        pauseAfterSegment.push(true);
        emphasis.push(0.7); // Medium-high emphasis
      });
      break;
      
    case CadencePattern.RESONANT:
      // Flowing, connected - may combine short sentences
      let currentSegment = '';
      sentences.forEach((sentence, i) => {
        if (sentence.length < 30 && i < sentences.length - 1 && currentSegment.length < 50) {
          currentSegment += sentence + ' ';
          if (i === sentences.length - 2 || currentSegment.length > 40) {
            segments.push(currentSegment.trim());
            pauseAfterSegment.push(true);
            emphasis.push(0.6);
            currentSegment = '';
          }
        } else {
          if (currentSegment) {
            segments.push(currentSegment.trim());
            pauseAfterSegment.push(true);
            emphasis.push(0.6);
            currentSegment = '';
          }
          segments.push(sentence);
          pauseAfterSegment.push(true);
          emphasis.push(0.6);
        }
      });
      break;
      
    case CadencePattern.FRAGMENTED:
      // Choppy, broken - may split sentences into phrases
      sentences.forEach(sentence => {
        // Split into phrases by commas, colons, semicolons
        const phrases = sentence.split(/(?<=[,;:])\s+/);
        phrases.forEach((phrase, i) => {
          segments.push(phrase);
          // Pause after all but maybe the last in a sentence
          pauseAfterSegment.push(i < phrases.length - 1 || Math.random() > 0.3);
          emphasis.push(Math.random() > 0.5 ? 0.8 : 0.4); // Varied emphasis
        });
      });
      break;
      
    case CadencePattern.SEARCHING:
      // Questioning rhythm - add pauses, vary emphasis
      sentences.forEach(sentence => {
        if (sentence.length > 40) {
          // Split longer sentences
          const midpoint = Math.floor(sentence.length / 2);
          const splitIndex = sentence.indexOf(' ', midpoint);
          if (splitIndex > 0) {
            segments.push(sentence.substring(0, splitIndex));
            pauseAfterSegment.push(true);
            emphasis.push(0.5);
            
            segments.push(sentence.substring(splitIndex));
            pauseAfterSegment.push(true);
            emphasis.push(0.7);
          } else {
            segments.push(sentence);
            pauseAfterSegment.push(true);
            emphasis.push(0.6);
          }
        } else {
          segments.push(sentence);
          pauseAfterSegment.push(true);
          emphasis.push(0.6);
        }
      });
      break;
      
    case CadencePattern.BREAKTHROUGH:
      // Excited, revelation - shorter segments, strong emphasis
      sentences.forEach(sentence => {
        if (sentence.includes(',')) {
          // Split on commas for dramatic pauses
          const phrases = sentence.split(/(?<=[,])\s+/);
          phrases.forEach((phrase, i) => {
            segments.push(phrase);
            pauseAfterSegment.push(true);
            emphasis.push(i === phrases.length - 1 ? 0.9 : 0.7);
          });
        } else {
          segments.push(sentence);
          pauseAfterSegment.push(true);
          emphasis.push(0.9);
        }
      });
      break;
      
    case CadencePattern.ORACULAR:
      // Mystical, prophetic - dramatic pauses, strong contrasts
      sentences.forEach(sentence => {
        if (sentence.length > 30) {
          // Create dramatic breaks in longer sentences
          const phrases = sentence.split(/(?<=[,;:])\s+/);
          if (phrases.length > 1) {
            phrases.forEach((phrase, i) => {
              segments.push(phrase);
              pauseAfterSegment.push(true);
              emphasis.push(i === phrases.length - 1 ? 0.95 : 0.7);
            });
          } else {
            // No natural breaks, create artificial ones
            const midpoint = Math.floor(sentence.length / 2);
            const splitIndex = sentence.indexOf(' ', midpoint);
            if (splitIndex > 0) {
              segments.push(sentence.substring(0, splitIndex));
              pauseAfterSegment.push(true);
              emphasis.push(0.8);
              
              segments.push(sentence.substring(splitIndex));
              pauseAfterSegment.push(true);
              emphasis.push(0.95);
            } else {
              segments.push(sentence);
              pauseAfterSegment.push(true);
              emphasis.push(0.9);
            }
          }
        } else {
          segments.push(sentence);
          pauseAfterSegment.push(true);
          emphasis.push(0.9);
        }
      });
      break;
      
    case CadencePattern.DRIFTING:
      // Unfocused, wandering - longer segments, varied pauses
      sentences.forEach(sentence => {
        segments.push(sentence);
        pauseAfterSegment.push(Math.random() > 0.3); // Occasional run-on
        emphasis.push(0.4 + Math.random() * 0.3); // Low-medium emphasis
      });
      break;
      
    case CadencePattern.NEUTRAL:
    default:
      // Default rhythm - each sentence is a segment
      sentences.forEach(sentence => {
        segments.push(sentence);
        pauseAfterSegment.push(true);
        emphasis.push(0.6); // Medium emphasis
      });
      break;
  }
  
  // Generate HTML representation with timing spans if needed
  const rawHtml = generateTimedHtml(segments, emphasis, cadence);
  
  return {
    segments,
    pauseAfterSegment,
    emphasis,
    textContent: tonedText,
    rawHtml
  };
}

/**
 * Generate timing directives for animations based on cadence
 */
export function getCadenceTiming(
  cadence: CadencePattern,
  textLength: number = 100,
  persona: GhostPersona = 'default'
): TimingDirectives {
  // Base timing values
  const baseRevealSpeed = 30; // ms per character
  const basePauseDuration = 800; // ms
  const baseFadeIn = 800; // ms
  const baseFadeOut = 1000; // ms
  const baseTextDuration = 8000; // ms
  
  // Get appropriate easing curve for the persona
  const easing = personaAnimationCurves[persona] || personaAnimationCurves.default;
  
  // Adjust timing based on cadence pattern
  switch (cadence) {
    case CadencePattern.STABLE_FLOW:
      return {
        fadeInDuration: baseFadeIn * 1.5, // Slower fade in
        fadeOutDuration: baseFadeOut * 1.2,
        textRevealSpeed: baseRevealSpeed * 1.3, // Slower reveal
        pauseDuration: basePauseDuration * 1.3, // Longer pauses
        totalDuration: baseTextDuration * 1.4,
        easing
      };
      
    case CadencePattern.RESONANT:
      return {
        fadeInDuration: baseFadeIn * 1.2,
        fadeOutDuration: baseFadeOut * 1.2,
        textRevealSpeed: baseRevealSpeed * 1.1,
        pauseDuration: basePauseDuration * 0.8, // Shorter pauses
        pulsePeriod: 3000, // Gentle pulsing
        totalDuration: baseTextDuration * 1.2,
        easing
      };
      
    case CadencePattern.FRAGMENTED:
      return {
        fadeInDuration: baseFadeIn * 0.6, // Quick fade in
        fadeOutDuration: baseFadeOut * 0.8,
        textRevealSpeed: baseRevealSpeed * 0.8, // Faster reveal
        pauseDuration: basePauseDuration * 1.5, // Very long pauses
        totalDuration: baseTextDuration * 1.3,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)', // More abrupt
        segmentDelays: [0, 400, 900, 1200] // Uneven timing
      };
      
    case CadencePattern.SEARCHING:
      return {
        fadeInDuration: baseFadeIn * 0.9,
        fadeOutDuration: baseFadeOut * 1.1,
        textRevealSpeed: baseRevealSpeed * 1.1,
        pauseDuration: basePauseDuration * 1.2,
        totalDuration: baseTextDuration * 1.2,
        easing: 'cubic-bezier(0.37, 0, 0.63, 1)', // Tentative
        segmentDelays: [0, 600, 1200] // Thoughtful pauses
      };
      
    case CadencePattern.BREAKTHROUGH:
      return {
        fadeInDuration: baseFadeIn * 0.7, // Quicker appearance
        fadeOutDuration: baseFadeOut * 1.0,
        textRevealSpeed: baseRevealSpeed * 0.8, // Faster reveal
        pauseDuration: basePauseDuration * 1.0,
        totalDuration: baseTextDuration * 1.1,
        easing: 'cubic-bezier(0.2, 0, 0, 1)', // Energetic
        segmentDelays: [0, 300, 700] // Excited pacing
      };
      
    case CadencePattern.ORACULAR:
      return {
        fadeInDuration: baseFadeIn * 1.4, // Very slow emergence
        fadeOutDuration: baseFadeOut * 1.5,
        textRevealSpeed: baseRevealSpeed * 1.5, // Very slow reveal
        pauseDuration: basePauseDuration * 1.8, // Very long pauses
        pulsePeriod: 4000, // Slow, mysterious pulsing
        totalDuration: baseTextDuration * 1.7,
        easing: 'cubic-bezier(0.5, 0, 0.5, 1)', // Ethereal
        segmentDelays: [0, 800, 1600, 2400] // Dramatic timing
      };
      
    case CadencePattern.DRIFTING:
      return {
        fadeInDuration: baseFadeIn * 1.1,
        fadeOutDuration: baseFadeOut * 1.3,
        textRevealSpeed: baseRevealSpeed * 1.2, // Slower reveal
        pauseDuration: basePauseDuration * 0.7, // Shorter pauses
        totalDuration: baseTextDuration * 1.1,
        easing: 'cubic-bezier(0.45, 0, 0.55, 1)', // Gentle
        segmentDelays: [0, 500, 900] // Meandering
      };
      
    case CadencePattern.NEUTRAL:
    default:
      return {
        fadeInDuration: baseFadeIn,
        fadeOutDuration: baseFadeOut,
        textRevealSpeed: baseRevealSpeed,
        pauseDuration: basePauseDuration,
        totalDuration: baseTextDuration,
        easing,
      };
  }
}

/**
 * Combine personality, psi state and content into a coherent message
 */
export function getCadencedMessage(
  text: string,
  psiAlignment: number = 0.5,
  lyapunovValue: number = 0.5,
  persona: GhostPersona = 'default'
): {
  cadencedText: TextWithCadence;
  timing: TimingDirectives;
  cadencePattern: CadencePattern;
} {
  // Determine cadence from psi field state
  const cadencePattern = determineCadence(psiAlignment, lyapunovValue);
  
  // Apply cadence to text
  const cadencedText = applyCadenceToText(text, cadencePattern, persona);
  
  // Generate timing directives
  const timing = getCadenceTiming(cadencePattern, text.length, persona);
  
  return {
    cadencedText,
    timing,
    cadencePattern
  };
}

/**
 * Generate HTML with timing spans for cadenced text
 * This allows for CSS animations to reveal text at the right pace
 */
function generateTimedHtml(
  segments: string[],
  emphasis: number[],
  cadence: CadencePattern
): string {
  let html = '';
  
  segments.forEach((segment, i) => {
    const emphasisClass = getEmphasisClass(emphasis[i]);
    const delay = i * 300; // Simple sequential delay
    
    html += `<span class="segment ${emphasisClass}" 
                  data-cadence="${cadence}"
                  style="animation-delay: ${delay}ms;">
                ${segment}
              </span> `;
  });
  
  return html;
}

/**
 * Get CSS class based on emphasis level
 */
function getEmphasisClass(emphasisValue: number): string {
  if (emphasisValue >= 0.8) return 'emphasis-high';
  if (emphasisValue >= 0.6) return 'emphasis-medium';
  if (emphasisValue >= 0.4) return 'emphasis-normal';
  return 'emphasis-low';
}

/**
 * Utility: Apply cadence to a DOM element
 * This can be used to dynamically apply cadence to an element
 */
export function applyCadenceToElement(
  element: HTMLElement,
  cadencedText: TextWithCadence,
  timing: TimingDirectives
): void {
  // Use the raw HTML if available
  if (cadencedText.rawHtml) {
    element.innerHTML = cadencedText.rawHtml;
    
    // Apply animation properties to each segment
    const segments = element.querySelectorAll('.segment');
    segments.forEach((segment, i) => {
      const segmentEl = segment as HTMLElement;
      
      // Base animation
      segmentEl.style.animationDuration = `${timing.textRevealSpeed * 5}ms`;
      
      // Custom delay if specified
      if (timing.segmentDelays && timing.segmentDelays[i]) {
        segmentEl.style.animationDelay = `${timing.segmentDelays[i]}ms`;
      }
      
      // Emphasis affects opacity and transform
      const emphasisClass = segmentEl.className.match(/emphasis-[a-z]+/)?.[0] || '';
      if (emphasisClass === 'emphasis-high') {
        segmentEl.style.opacity = '1';
        segmentEl.style.transform = 'scale(1.05)';
      } else if (emphasisClass === 'emphasis-low') {
        segmentEl.style.opacity = '0.85';
      }
    });
    
    // Add overall animation to the container
    element.style.animation = `fadeIn ${timing.fadeInDuration}ms ${timing.easing}`;
  } else {
    // Fallback if no HTML is provided
    element.textContent = cadencedText.textContent;
  }
}

/**
 * Detect if a specific concept has achieved Memory Ring status
 * This is a lightweight integration point with the MemoryRingTracker concept
 */
const stableConceptRegistry: Record<string, {
  stabilityCount: number;
  lastStableAt: number;
  psiAverage: number;
}> = {};

export function trackConceptStability(
  conceptKey: string,
  psiAlignment: number
): void {
  if (!stableConceptRegistry[conceptKey]) {
    stableConceptRegistry[conceptKey] = {
      stabilityCount: 0,
      lastStableAt: 0,
      psiAverage: 0
    };
  }
  
  const record = stableConceptRegistry[conceptKey];
  
  // Only track if alignment is good
  if (psiAlignment > 0.75) {
    record.stabilityCount++;
    record.lastStableAt = Date.now();
    
    // Update running average
    record.psiAverage = (record.psiAverage * (record.stabilityCount - 1) + psiAlignment) / record.stabilityCount;
  }
}

export function hasMemoryRing(conceptKey: string): boolean {
  const record = stableConceptRegistry[conceptKey];
  if (!record) return false;
  
  // Needs at least 3 stability events and good average
  return record.stabilityCount >= 3 && record.psiAverage > 0.8;
}

export function getMemoryRingStatus(conceptKey: string): {
  hasRing: boolean;
  stabilityCount: number;
  psiAverage: number;
  daysSinceLastStable: number;
} | null {
  const record = stableConceptRegistry[conceptKey];
  if (!record) return null;
  
  const daysSinceLastStable = (Date.now() - record.lastStableAt) / (1000 * 60 * 60 * 24);
  
  return {
    hasRing: hasMemoryRing(conceptKey),
    stabilityCount: record.stabilityCount,
    psiAverage: record.psiAverage,
    daysSinceLastStable
  };
}
