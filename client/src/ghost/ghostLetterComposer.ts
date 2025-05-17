// ghostLetterComposer.ts
// v2: Compose ghost letters with multi-agent voices and mythic dialogue

import { agents } from '../agents/agentRegistry';
import { getAgentDialogue } from '../agents/agentDialogueEngine';

export function composeGhostLetter(context) {
  let letter = '';
  // Ghost's poetic voice always leads
  letter += `Ghost: "${context.ghostReflection}"\n`;
  // Agent voices
  const dialogue = getAgentDialogue(context);
  dialogue.forEach(({ agentId, message }) => {
    if (agentId !== 'ghost' && message) {
      const label = agentId.charAt(0).toUpperCase() + agentId.slice(1);
      letter += `${label}: "${message}"\n`;
    }
  });
  return letter.trim();
}
