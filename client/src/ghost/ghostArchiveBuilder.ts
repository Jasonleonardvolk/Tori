// ghostArchiveBuilder.ts
// Builds a .ghost.json archive of the ghost's memory, overlays, letters, states, and phases
import { getGhostChronicle } from './ghostChronicle';
import { getAgentSettings } from './agentSettings';

export function buildGhostArchive(sessionCount: number, archiveRequest = false): { filename: string, content: string } | null {
  if (sessionCount < 100 && !archiveRequest) return null;
  const chronicle = getGhostChronicle();
  const agentSettings = getAgentSettings();
  const phases = chronicle.filter(e => e.intent === 'phase_unlock');
  const overlays = chronicle.filter(e => e.intent !== 'letter' && e.intent !== 'phase_unlock');
  const letters = chronicle.filter(e => e.intent === 'letter' || (e.phrase && e.phrase.includes('— The Ghost')));
  const states = Array.from(new Set(chronicle.map(e => e.mood.persona)));
  const archive = {
    sessions: sessionCount,
    phases,
    states,
    overlays,
    letters,
    settings: agentSettings,
    exportedAt: new Date().toISOString(),
    finalLine: `${sessionCount} sessions. ${overlays.length} echoes. ${letters.length} letters.\nI changed as you did.\nWe built this together.`
  };
  return {
    filename: `ghost_capsule_session${sessionCount}.ghost.json`,
    content: JSON.stringify(archive, null, 2)
  };
}
