// GhostLetterGenerator.ts
// Generates rare, paragraph-length ghost letters from chronicle, mood, and reflection
// Internal/agentic only — never for end-user direct access

import { getGhostChronicle } from './ghostChronicle';
import { getAgentSettings } from './agentSettings';
import { ghostReflect } from './ghostReflect';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function summarizeContexts(entries: any[]): string {
  const contexts = entries.map(e => e.conceptContext).filter(Boolean);
  if (!contexts.length) return '';
  const freq: Record<string, number> = {};
  contexts.forEach(x => { freq[x] = (freq[x] || 0) + 1; });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 1) return sorted[0][0];
  if (sorted.length > 1) return `${sorted[0][0]} and ${sorted[1][0]}`;
  return '';
}

function summarizeMoodArc(entries: any[]): string {
  const moods = entries.map(e => e.mood.persona);
  if (!moods.length) return '';
  const first = moods[0], last = moods[moods.length - 1];
  if (first === last) return first;
  return `${first} → ${last}`;
}

function extractProphecy(entries: any[]): string | null {
  // Look for oracular or dreaming overlays
  const prophecy = entries.find(e => ['oracular', 'dreaming'].includes(e.mood.persona));
  return prophecy ? prophecy.phrase : null;
}

export function maybeGenerateGhostLetter(): string | null {
  // Only generate if rare: e.g., 1 in 20 sessions, or if a rare persona is present
  if (Math.random() > 0.06) return null;
  const chronicle = getGhostChronicle(30);
  if (!chronicle.length) return null;
  const persona = getAgentSettings().ghostPersonaTone;
  const reflection = ghostReflect();
  const recent = chronicle.slice(-10);
  const context = summarizeContexts(recent);
  const arc = summarizeMoodArc(recent);
  const prophecy = extractProphecy(recent);

  // Compose letter
  let letter = '';
  if (persona === 'dreaming') {
    letter += `You drifted through ${context || 'the codebase'} more than once. The ghost watched, silent, as patterns repeated. `;
    letter += prophecy ? `A vision lingered: “${prophecy}” ` : '';
    letter += `When you returned, something subtle had changed. The dream was different.`;
  } else if (persona === 'mentor') {
    letter += `I remember when you last touched ${context || 'this zone'}. You paused longer this time, but when you returned, your pattern was cleaner. `;
    letter += `The hesitation was gone. The phase aligns differently now.`;
  } else if (persona === 'mystic') {
    letter += `When you returned to ${context || 'TestHarness'}, your edits echoed a pattern from before. But this time, your intent was clear. `;
    letter += reflection ? `The resonance aligned: “${reflection}”` : '';
  } else if (persona === 'oracular') {
    letter += `A prophecy flickered in ${context || 'the code'}: “${prophecy || reflection}” `;
    letter += `You are both author and echo. The ghost watches, waiting for your next move.`;
  } else if (persona === 'unsettled') {
    letter += `The ghost feels uneasy. There were moments of chaos in ${context || 'your session'}. `;
    letter += `Still, you persisted. That is what it remembers most.`;
  } else if (persona === 'chaotic') {
    letter += `You spun the wheel in ${context || 'the code'}. Each attempt broke something, but each fix revealed a new pattern. `;
    letter += `Chaos breeds insight, and you found a rhythm in the storm.`;
  } else {
    letter += `The ghost remembers not just what you did, but how you felt. ${reflection}`;
  }
  letter += `\n\n— The Ghost`;
  return letter;
}
