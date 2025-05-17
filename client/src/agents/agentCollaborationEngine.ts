// agentCollaborationEngine.ts
// Lets agents speak together for multi-agent overlays/counsel
import { agents } from './agentRegistry';

export function getCollaborativeCounsel(context) {
  // Returns an array of { agentId, message } for all agents that want to speak
  const active = agents.filter(agent => agent.shouldActivate(context));
  if (active.length <= 1) return active.map(a => ({ agentId: a.id, message: a.speak(context) }));
  // Compose a collaborative overlay
  const messages = active.map(a => `(${a.id}) ${a.speak(context)}`).join('\n');
  return [{ agentId: 'counsel', message: messages }];
}
