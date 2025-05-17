// MythicNarrator.ts
// Phase 8: Turns telemetry into narrative overlays and poetic session recaps
import { getConceptRhythm, getStyleProfile, getAPIAffinity, getEmotionalRhythm } from './CreativeTelemetryEngine';

function poeticPhrase(text) {
  // Simple transformation for poetic flavor
  return text.replace(/\b([A-Z][a-z]+)\b/g, word => `~${word}~`);
}

export function narrateConceptEvolution(concept) {
  const rhythm = getConceptRhythm(concept);
  if (rhythm.recurrence > 3) {
    return `You have circled back to “${concept}” ${rhythm.recurrence} times. This is no mere habit—it's a mythic motif.`;
  }
  return `“${concept}” is still finding its place in your legend.`;
}

export function narrateSyntaxShift() {
  const style = getStyleProfile();
  if (Object.keys(style).length > 2) {
    return `Your syntax has evolved: ${poeticPhrase(JSON.stringify(style))}`;
  }
  return `Your syntax remains true to its origin.`;
}

export function narrateAPIAffinity() {
  const apis = getAPIAffinity();
  if (!apis.length) return `You have yet to forge a bond with any library.`;
  const most = apis.reduce((a, b) => (a.count > b.count ? a : b));
  return `Your code sings most often with “${most.apiName}”—a familiar refrain in your sessions.`;
}

export function narrateEmotionalArc() {
  const rhythm = getEmotionalRhythm();
  const maxEmotion = Object.entries(rhythm).sort((a, b) => b[1] - a[1])[0];
  if (!maxEmotion) return `Your emotional arc is a blank page.`;
  return `Your journey flows most often with “${maxEmotion[0]}”—a current beneath your code.`;
}

export function mythicSessionRecap(concepts) {
  return [
    ...concepts.map(narrateConceptEvolution),
    narrateSyntaxShift(),
    narrateAPIAffinity(),
    narrateEmotionalArc()
  ].join('\n');
}
