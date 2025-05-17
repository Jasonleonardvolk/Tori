// overlayRitualTriggerEngine.ts
// Allows overlays to trigger new rituals or agent commentary in response to user actions

export function handleOverlayAction({ actionType, context, triggerRitual, addAgentCommentary }) {
  // actionType: e.g. 'accept', 'reflect', 'revisit', 'close', etc.
  // context: { session, node, agent, overlayContent, ... }
  if (actionType === 'revisit' && triggerRitual) {
    triggerRitual({
      type: 'return',
      context,
      message: `Ritual of Return triggered by revisiting ${context.node || 'an artifact'}.`
    });
  }
  if (actionType === 'reflect' && addAgentCommentary) {
    addAgentCommentary({
      agent: context.agent,
      commentary: `Agent ${context.agent} reflects: "${context.overlayContent}"`
    });
  }
  // Extend for more action types as needed
}
