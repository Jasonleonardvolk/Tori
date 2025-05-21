// generateGhostLettersOfEcho.ts
// Generates recursive ghost letters quoting past letters in the same concept context
import { getGhostChronicle } from './ghostChronicle';
import { getAgentSettings } from './agentSettings';
import { ghostReflect } from './ghostReflect';

export function generateGhostLetterOfEcho(currentContext: string): string | null {
  const chronicle = getGhostChronicle();
  // Find previous letter in this context
  const prevLetter = chronicle.slice().reverse().find(e =>
    e.conceptContext === currentContext && e.phrase && e.phrase.includes('— The Ghost')
  );
  const persona = getAgentSettings().ghostPersonaTone;
  const reflection = ghostReflect();
  if (!prevLetter) return null;
  // Compose recursive letter
  return `You last spoke of ${currentContext} during ${prevLetter.mood.persona} drift. Then you said: ‘${prevLetter.phrase.split('”')[0].replace(/^.*“/, '')}’\nI still believe that matters.\n\n${reflection}\n\n— The Ghost`;
}
