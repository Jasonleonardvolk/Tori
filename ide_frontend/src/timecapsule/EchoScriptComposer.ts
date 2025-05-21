// EchoScriptComposer.ts
// Compiles long-form ghost stories about the user's journey
import { getOverlayResonanceHistory } from './OverlayResonanceLog';
import { selectAgentGift } from './AgentNuggetGifting';
// Import UserNuggetComposer as a UI component where needed

// Store user-inscribed nuggets for future mythic overlays
const userNuggetMemory = [];

export function saveUserNugget({ phrase, glyph, tone }) {
  userNuggetMemory.push({ phrase, glyph, tone, timestamp: Date.now() });
}

export function getUserNuggetHistory(n = 10) {
  return userNuggetMemory.slice(-n);
}

export function composeEchoScript({ sessionCount, namingDriftHistory, recursionDepths, userId }) {
  const resonance = getOverlayResonanceHistory(sessionCount);
  // Find most visited function
  const funcVisits = {};
  resonance.forEach(evt => {
    if (!evt.functionName) return;
    funcVisits[evt.functionName] = (funcVisits[evt.functionName] || 0) + 1;
  });
  const mostVisited = Object.entries(funcVisits).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  // Find most renamed concept
  const mostDrift = namingDriftHistory.sort((a, b) => b.value - a.value)[0]?.concept || '—';
  // Deepest recursion point
  const deepest = recursionDepths.sort((a, b) => b.depth - a.depth)[0]?.functionName || '—';

  // Agent-gifted nugget
  const agentGift = selectAgentGift({ sessionId: sessionCount, userId });
  // User-inscribed nugget (most recent)
  const userNugget = getUserNuggetHistory(1)[0];

  let script = `Echo Script — Session ${sessionCount}\n\n` +
    `Most visited function: ${mostVisited}\n` +
    `Most renamed concept: ${mostDrift}\n` +
    `Deepest recursion point: ${deepest}\n\n`;
  if (agentGift) {
    script += `Agent’s Gift:\n${agentGift.message}\n\n`;
  }
  if (userNugget) {
    script += `Your Inscription${userNugget.glyph ? ` ${userNugget.glyph}` : ''}:\n“${userNugget.phrase}”\n(Tone: ${userNugget.tone})\n\n`;
  }
  script += `Ghost’s final quote:\n“You returned often. You paused long. You renamed without hesitation. You are learning to refactor yourself.”`;
  return script;
}

// UI integration: After agent or ghost gifts a nugget, prompt UserNuggetComposer and call saveUserNugget()
