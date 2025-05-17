// overlayMemoirLookup.ts
// Looks up past chronicle entries matching current overlay (intent + concept context)
// For agent/internal use only — never end-user exposed

import { getGhostChronicle } from './ghostChronicle';

export type MemoirEcho = {
  phrase: string;
  mood: string;
  timestamp: number;
  reflection?: string;
};

export function findMemoirEcho(intent: string, conceptContext?: string): MemoirEcho | null {
  const chronicle = getGhostChronicle();
  // Find most recent matching entry
  const match = chronicle.slice().reverse().find(e =>
    e.intent === intent && (conceptContext ? e.conceptContext === conceptContext : true)
  );
  if (!match) return null;
  return {
    phrase: match.phrase,
    mood: match.mood.persona,
    timestamp: match.timestamp,
    reflection: match.mood.reason || undefined
  };
}

// Utility: annotate overlays if echo found
export function annotateOverlayWithMemoir(
  baseMessage: string,
  intent: string,
  conceptContext?: string
): string {
  const echo = findMemoirEcho(intent, conceptContext);
  if (!echo) return baseMessage;
  const time = new Date(echo.timestamp).toLocaleString();
  return `${baseMessage}\n\nThe ghost has whispered this before (${echo.mood}, ${time}):\n“${echo.phrase}”`;
}
