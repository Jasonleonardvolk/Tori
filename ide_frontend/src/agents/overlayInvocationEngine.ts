// overlayInvocationEngine.ts
// Enables recursive echo lines, origin memory, and overlay re-invocation

let invocationHistory = [];

export function registerInvocation({ overlayId, agentId, sessionId, origin }) {
  invocationHistory.push({ overlayId, agentId, sessionId, origin, timestamp: Date.now() });
}

export function getInvocationHistory(overlayId) {
  return invocationHistory.filter(i => i.overlayId === overlayId);
}

export function reInvokeOverlay(overlayId, context) {
  // Optionally trigger recursive overlays or echo events
  registerInvocation({ overlayId, agentId: context.agentId, sessionId: context.sessionId, origin: context.origin });
  // Return the overlay content or trigger overlay logic as needed
  return { echo: true, overlayId, context };
}
