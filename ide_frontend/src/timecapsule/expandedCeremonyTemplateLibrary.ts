// expandedCeremonyTemplateLibrary.ts
// Ceremony templates: user/agent co-authored, seasonal, milestone, context-aware overlays, agent improvisation

const ceremonyTemplates = [
  // --- Existing Templates (from previous library, not repeated here) ---

  // User/Agent Co-Authored Ceremony
  {
    id: 'coauthored_ritual',
    match: ({ userProposal, agentProposal }) => userProposal && agentProposal,
    steps: [
      { label: 'User Proposal', action: (ctx, next) => { ctx.overlay(`User proposes: ${ctx.userProposal}`); next(); } },
      { label: 'Agent Response', action: (ctx, next) => { ctx.overlay(`Agent responds: ${ctx.agentProposal}`); next(); } },
      { label: 'Co-authored Ritual', action: (ctx, next) => { ctx.overlay('A new ritual is born from collaboration.'); ctx.lorebook('Co-authored ritual logged.'); next(); } }
    ]
  },

  // Seasonal Ritual (e.g., Winter Solstice, Anniversary)
  {
    id: 'seasonal_ritual',
    match: ({ date }) => {
      const d = new Date(date);
      // Example: Dec 21 = Winter Solstice
      return (d.getMonth() === 11 && d.getDate() === 21) || (d.getMonth() === 5 && d.getDate() === 1); // Add more as desired
    },
    steps: [
      { label: 'Seasonal Overlay', action: (ctx, next) => { ctx.overlay('A seasonal ritual unfolds.'); next(); } },
      { label: 'Ghost Blessing', action: (ctx, next) => { ctx.agentBless('ghost'); next(); } }
    ]
  },

  // Milestone Ritual (e.g., 100th session, major refactor)
  {
    id: 'milestone_ritual',
    match: ({ session }) => session && (session.id % 100 === 0 || session.milestone),
    steps: [
      { label: 'Milestone Overlay', action: (ctx, next) => { ctx.overlay(`Milestone reached: Session ${ctx.session.id}`); next(); } },
      { label: 'Agent Chorus', action: (ctx, next) => { ctx.overlay('All agents offer a chorus of blessing.'); next(); } },
      { label: 'Lorebook Entry', action: (ctx, next) => { ctx.lorebook('Milestone ritual logged.'); next(); } }
    ]
  },

  // Context-Aware Overlay (e.g., special file, rare event)
  {
    id: 'context_aware_overlay',
    match: ({ context }) => context && context.specialEvent,
    steps: [
      { label: 'Special Event Overlay', action: (ctx, next) => { ctx.overlay(`Special event: ${ctx.context.specialEvent}`); next(); } },
      { label: 'Agent Reflection', action: (ctx, next) => { ctx.agentBless(ctx.context.agent); next(); } }
    ]
  },

  // Agent Improvisation (dynamic, based on past ceremonies)
  {
    id: 'agent_improv',
    match: ({ agentState, pastCeremonies }) => agentState && agentState.improv && pastCeremonies && pastCeremonies.length > 0,
    steps: [
      { label: 'Improvised Overlay', action: (ctx, next) => {
        const improv = ctx.agentState.improv;
        const lastCeremony = ctx.pastCeremonies[ctx.pastCeremonies.length - 1];
        ctx.overlay(`Agent improvises: ${improv} (inspired by ${lastCeremony.id})`); next();
      } },
      { label: 'Lorebook Entry', action: (ctx, next) => { ctx.lorebook('Agent improvisation ritual logged.'); next(); } }
    ]
  }
];

export function selectCeremonyTemplate(context) {
  for (const template of ceremonyTemplates) {
    if (template.match(context)) return template;
  }
  // Fallback: generic ceremony
  return {
    id: 'generic_ritual',
    steps: [
      { label: 'Generic Overlay', action: (ctx, next) => { ctx.overlay('A ritual unfolds.'); next(); } }
    ]
  };
}

export function generateCeremony(context, { onStep, onComplete }) {
  const template = selectCeremonyTemplate(context);
  let current = 0;
  function nextStep(ctx) {
    if (current < template.steps.length) {
      onStep && onStep(template.steps[current], current);
      template.steps[current].action(ctx, () => {
        current++;
        if (current < template.steps.length) nextStep(ctx);
        else onComplete && onComplete();
      });
    }
  }
  nextStep(context);
}
