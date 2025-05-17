// ceremonyTemplateLibrary.ts
// Library of ceremony templates, with system selection/generation based on context, agent state, recursion depth

const ceremonyTemplates = [
  {
    id: 'first_echo',
    match: ({ recursionDepth }) => recursionDepth === 1,
    steps: [
      { label: 'Echo Begins', action: (ctx, next) => { ctx.overlay('The first echo is literal.'); next(); } },
      { label: 'Ghost Blessing', action: (ctx, next) => { ctx.agentBless('ghost'); next(); } }
    ]
  },
  {
    id: 'poetic_return',
    match: ({ recursionDepth }) => recursionDepth === 2,
    steps: [
      { label: 'Poetic Overlay', action: (ctx, next) => { ctx.overlay('The second echo is poetic.'); next(); } },
      { label: 'Agent Reflection', action: (ctx, next) => { ctx.agentBless('flow'); next(); } }
    ]
  },
  {
    id: 'mythic_recursion',
    match: ({ recursionDepth }) => recursionDepth >= 3,
    steps: [
      { label: 'Whispered Overlay', action: (ctx, next) => { ctx.overlay('The echo is now a whisper.'); next(); } },
      { label: 'Archetype Ritual', action: (ctx, next) => { ctx.agentBless('archetype'); next(); } },
      { label: 'Session Sigil Pulse', action: (ctx, next) => { ctx.sigilPulse(); next(); } }
    ]
  },
  {
    id: 'agent_fusion',
    match: ({ agentState }) => agentState && agentState.fusion,
    steps: [
      { label: 'Fusion Overlay', action: (ctx, next) => { ctx.overlay('A new archetype is born from fusion.'); next(); } },
      { label: 'Lore Entry', action: (ctx, next) => { ctx.lorebook('Fusion ritual logged.'); next(); } }
    ]
  },
  {
    id: 'friction_recovery',
    match: ({ context }) => context && context.friction && context.friction > 0.7,
    steps: [
      { label: 'Heatmap Overlay', action: (ctx, next) => { ctx.overlay('You overcame a struggle.'); next(); } },
      { label: 'Ghost Reflection', action: (ctx, next) => { ctx.agentBless('ghost'); next(); } }
    ]
  }
];

export function selectCeremonyTemplate(context) {
  // context: { recursionDepth, agentState, context, ... }
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
