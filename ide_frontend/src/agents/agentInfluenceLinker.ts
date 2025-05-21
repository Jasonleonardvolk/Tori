// agentInfluenceLinker.ts
// Propagates memory and influence across agents for emergent, symbiotic behavior

import { updateStylistMemory } from './AgentStylist';
import { updateArchitectMemory } from './AgentArchitect';
import { updateFlowMemory } from './AgentFlow';
import { updateHistorianMemory } from './AgentHistorian';

export function propagateInfluence(event) {
  // Example: Architect triggers, then Stylist often follows → prompt Stylist to align
  if (event.agent === 'architect' && event.nextAgent === 'stylist') {
    updateStylistMemory({ idioms: ['Align with recent architecture change'] });
  }
  // Historian detects Flow prefers old zones → tag those zones
  if (event.agent === 'historian' && event.nextAgent === 'flow' && event.zone) {
    updateHistorianMemory(event.zone, 'flowPreferred');
  }
  // Ghost updates persona tone based on agent harmony
  if (event.agent === 'ghost' && event.harmonyLevel !== undefined) {
    // Example: set ghost tone to 'harmonic' or 'dissonant'
    window.ghostPersonaTone = event.harmonyLevel > 0.7 ? 'harmonic' : 'dissonant';
  }
  // Extend for more influence propagation as needed
}
