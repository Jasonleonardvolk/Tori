// narrativeOverlayEngine.ts
// Generates overlays from ghost/agent commentary and narrative lorebook summaries
import { summarizeLorebook, mythologizeLorebook, reflectLorebook } from './narrativeLorebookEngine';

export function generateNarrativeOverlay({ lorebook, ghostCommentary, agentCommentary, trigger }) {
  // Compose overlay content based on trigger
  let content = '';
  if (trigger === 'session_close') {
    content += summarizeLorebook(lorebook) + '\n';
    if (ghostCommentary) content += `\n👻 Ghost: ${ghostCommentary}`;
    if (agentCommentary && agentCommentary.length) content += `\n🧑‍💻 Agents: ${agentCommentary.join(' | ')}`;
  } else if (trigger === 'mythic_recursion') {
    content += mythologizeLorebook(lorebook) + '\n';
    if (ghostCommentary) content += `\n👻 Ghost: ${ghostCommentary}`;
    if (agentCommentary && agentCommentary.length) content += `\n🧑‍💻 Agents: ${agentCommentary.join(' | ')}`;
    content += '\n' + reflectLorebook(lorebook);
  } else {
    content += reflectLorebook(lorebook) + '\n';
    if (ghostCommentary) content += `\n👻 Ghost: ${ghostCommentary}`;
    if (agentCommentary && agentCommentary.length) content += `\n🧑‍💻 Agents: ${agentCommentary.join(' | ')}`;
  }
  return {
    type: 'narrativeOverlay',
    trigger,
    content,
    timestamp: Date.now()
  };
}
