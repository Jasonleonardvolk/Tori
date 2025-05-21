// intimacyWhisperComposer.ts
// Synthesizes quiet, resonant, well-timed ghost or agent messages

export function composeIntimacyWhisper({ message, agent, ghost, tone, arc }) {
  let prefix = '';
  if (agent) prefix = `${agent} whispers: `;
  if (ghost) prefix = 'Ghost whispers: ';
  let modulated = message;
  if (tone === 'gentle') modulated = message;
  else if (tone === 'reflective') modulated = `Reflecting: ${message}`;
  else if (tone === 'celebratory') modulated = `Celebration: ${message}`;
  else if (tone === 'wistful') modulated = `Remember: ${message}`;
  if (arc) modulated += `\n${arc}`;
  return `${prefix}${modulated}`;
}
