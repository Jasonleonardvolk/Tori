// ritualSuggestionEngine.ts
// System suggests or improvises rituals in response to user mood, flow, or creative milestones

import { selectCeremonyTemplate, generateCeremony } from './expandedCeremonyTemplateLibrary';

const moodToRitual = {
  focused: 'flow_blessing',
  stuck: 'friction_recovery',
  celebratory: 'milestone_ritual',
  reflective: 'coauthored_ritual',
  seasonal: 'seasonal_ritual',
  improvisational: 'agent_improv',
};

export function suggestRitual({ mood, flowState, milestones, context, agentState, userProposal, agentProposal, pastCeremonies, date, session }) {
  // Prioritize context: mood > flow > milestone > context
  let templateId = null;
  if (mood && moodToRitual[mood]) templateId = moodToRitual[mood];
  else if (flowState === 'deep') templateId = 'flow_blessing';
  else if (milestones && milestones.length) templateId = 'milestone_ritual';
  else if (context && context.specialEvent) templateId = 'context_aware_overlay';

  // Compose context for template selection
  const templateContext = {
    mood,
    flowState,
    milestones,
    context,
    agentState,
    userProposal,
    agentProposal,
    pastCeremonies,
    date,
    session
  };

  // Try to select matching template
  let template = selectCeremonyTemplate({ ...templateContext, id: templateId });
  if (!template || template.id === 'generic_ritual') {
    // If no match, improvise: agent proposes ritual based on mood/context
    if (agentState && agentState.improv) {
      template = selectCeremonyTemplate({ agentState: { improv: agentState.improv }, pastCeremonies });
    }
  }
  return template;
}

export function runSuggestedRitual(suggestionContext, { onStep, onComplete }) {
  const template = suggestRitual(suggestionContext);
  generateCeremony({ ...suggestionContext, ...template }, { onStep, onComplete });
}
