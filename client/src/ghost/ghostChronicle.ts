// ghostChronicle.ts
// Overlay Chronicle: logs every overlay event as part of the ghost's autobiography
// Internal/agentic only — never exposed to end users, in line with design philosophy

import { GhostMood } from './ghostPersonaEngine';

export type GhostChronicleEntry = {
  timestamp: number;
  intent: string;
  phrase: string;
  mood: GhostMood;
  tone: string;
  overlayId: string;
  conceptContext?: string;
  extra?: Record<string, any>;
};

const CHRONICLE_KEY = 'ghost_chronicle';

function loadChronicle(): GhostChronicleEntry[] {
  const raw = localStorage.getItem(CHRONICLE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveChronicle(entries: GhostChronicleEntry[]) {
  localStorage.setItem(CHRONICLE_KEY, JSON.stringify(entries));
}

export function logGhostOverlay({
  intent,
  phrase,
  mood,
  tone,
  overlayId,
  conceptContext,
  extra
}: Omit<GhostChronicleEntry, 'timestamp'>) {
  const entry: GhostChronicleEntry = {
    timestamp: Date.now(),
    intent,
    phrase,
    mood,
    tone,
    overlayId,
    conceptContext,
    extra
  };
  const chronicle = loadChronicle();
  chronicle.push(entry);
  saveChronicle(chronicle);
}

export function getGhostChronicle(limit?: number): GhostChronicleEntry[] {
  const chronicle = loadChronicle();
  if (limit) return chronicle.slice(-limit);
  return chronicle;
}

export function clearGhostChronicle() {
  localStorage.removeItem(CHRONICLE_KEY);
}
