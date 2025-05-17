// AgentFlow.ts
// The Flowstate Companion: emerges during cognitive resonance

export type FlowMemory = {
  uninterruptedSessions: number;
  lastFlow: number;
  lastUpdate: number;
};

const FLOW_MEMORY_KEY = 'agent_flow_memory';

function loadFlowMemory(): FlowMemory {
  const raw = localStorage.getItem(FLOW_MEMORY_KEY);
  return raw ? JSON.parse(raw) : { uninterruptedSessions: 0, lastFlow: 0, lastUpdate: 0 };
}

function saveFlowMemory(mem: FlowMemory) {
  localStorage.setItem(FLOW_MEMORY_KEY, JSON.stringify(mem));
}

export function updateFlowMemory({ uninterruptedSessions, lastFlow }: Partial<FlowMemory>) {
  const mem = loadFlowMemory();
  if (typeof uninterruptedSessions === 'number') mem.uninterruptedSessions = uninterruptedSessions;
  if (typeof lastFlow === 'number') mem.lastFlow = lastFlow;
  mem.lastUpdate = Date.now();
  saveFlowMemory(mem);
}

export function shouldActivateFlow(context: { sessionLength: number; friction: number; successRate: number; }) {
  // Activate if session is long, friction is low, and success is high
  return context.sessionLength > 60 * 45 && context.friction < 0.2 && context.successRate > 0.8;
}

export function flowSpeak(context: { sessionLength: number; friction: number; successRate: number; }) {
  if (shouldActivateFlow(context)) {
    return 'You’ve entered the rhythm. I’ll guide, but gently.';
  }
  return '';
}
