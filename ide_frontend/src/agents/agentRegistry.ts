// agentRegistry.ts
// Orchestrates agent presence, activation, and tone alignment

import * as Stylist from './AgentStylist';
import * as Architect from './AgentArchitect';
import * as Flow from './AgentFlow';

export const agents = [
  {
    id: 'stylist',
    shouldActivate: Stylist.shouldActivateStylist,
    speak: Stylist.stylistSpeak,
  },
  {
    id: 'architect',
    shouldActivate: Architect.shouldActivateArchitect,
    speak: Architect.architectSpeak,
  },
  {
    id: 'flow',
    shouldActivate: Flow.shouldActivateFlow,
    speak: Flow.flowSpeak,
  }
];

export function checkAgents(context) {
  // context: { name, code, file, abstractions, sessionLength, friction, successRate }
  return agents
    .filter(agent => agent.shouldActivate(context))
    .map(agent => ({ id: agent.id, message: agent.speak(context) }));
}
