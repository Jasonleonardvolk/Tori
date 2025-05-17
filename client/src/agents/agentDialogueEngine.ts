// agentDialogueEngine.ts
// Enables harmonics and tension in multi-agent overlays
import { agents } from './agentRegistry';

export function getAgentDialogue(context) {
  const active = agents.filter(agent => agent.shouldActivate(context));
  if (active.length <= 1) return active.map(a => ({ agentId: a.id, message: a.speak(context) }));
  // Simulate harmonics/tension: if stylist and architect disagree, surface debate
  const stylist = active.find(a => a.id === 'stylist');
  const architect = active.find(a => a.id === 'architect');
  const flow = active.find(a => a.id === 'flow');
  let dialogue = [];
  if (stylist && architect) {
    dialogue.push({ agentId: 'stylist', message: stylist.speak(context) });
    dialogue.push({ agentId: 'architect', message: architect.speak(context) });
    if (stylist.speak(context) !== architect.speak(context)) {
      dialogue.push({ agentId: 'debate', message: 'Stylist and Architect are in gentle tension about this change.' });
    }
  }
  if (flow && (stylist || architect)) {
    dialogue.push({ agentId: 'flow', message: flow.speak(context) });
    if (flow.speak(context)) {
      dialogue.push({ agentId: 'harmonic', message: 'Flow counsels patience: let the rhythm guide the next move.' });
    }
  }
  if (!dialogue.length) {
    return active.map(a => ({ agentId: a.id, message: a.speak(context) }));
  }
  return dialogue;
}
