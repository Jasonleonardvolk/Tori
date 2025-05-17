// timedInsightEngine.ts
// Coordinates when, how, and through whom an insight should be delivered

import { composeIntimacyWhisper } from './intimacyWhisperComposer';

const insightQueue = [];

export function queueInsight({ type, message, agent, ghost, trigger, deliverAt }) {
  insightQueue.push({ type, message, agent, ghost, trigger, deliverAt, delivered: false });
}

export function deliverDueInsights(currentTime, agentState, ghostMood, arc) {
  const due = insightQueue.filter(i => !i.delivered && i.deliverAt <= currentTime);
  due.forEach(i => {
    const tone = agentState?.tone || ghostMood || 'gentle';
    const composed = composeIntimacyWhisper({
      message: i.message,
      agent: i.agent,
      ghost: i.ghost,
      tone,
      arc
    });
    // Trigger overlay, toast, or other UI with composed insight
    i.delivered = true;
    if (typeof i.trigger === 'function') i.trigger(composed);
  });
  return due.length;
}
