// ghost.interactionSignals.js
// Tracks micro-interactions, cognitive echoes, idea loops, and velocity/hestitation patterns for Ghost Mode

import behavioralSignalEmitter from '../services/behavioralSignalEmitter';

const echoTraces = [];
const ideaLoops = new Map();
const velocityBuffer = [];

export function recordEchoTrace({text, pos, time}) {
  echoTraces.push({text, pos, time, faded: false});
}

export function getEchoTraces() {
  return echoTraces.filter(e => !e.faded);
}

export function fadeEchoTraces() {
  const now = Date.now();
  echoTraces.forEach(e => {
    if (now - e.time > 30000) e.faded = true;
  });
}

export function recordIdeaLoop(concept, context) {
  if (!ideaLoops.has(concept)) ideaLoops.set(concept, []);
  ideaLoops.get(concept).push(context);
}

export function getIdeaLoops() {
  return Array.from(ideaLoops.entries()).filter(([_, arr]) => arr.length > 2);
}

export function recordVelocityEvent(type, time) {
  velocityBuffer.push({type, time});
  if (velocityBuffer.length > 20) velocityBuffer.shift();
}

export function detectMicroBurst() {
  // 3 actions in 2s, then pause, then repeat
  let bursts = 0;
  for (let i = 3; i < velocityBuffer.length; i++) {
    const t0 = velocityBuffer[i-3].time, t1 = velocityBuffer[i].time;
    if (t1 - t0 < 2000) bursts++;
  }
  return bursts > 1;
}

export default {
  recordEchoTrace,
  getEchoTraces,
  fadeEchoTraces,
  recordIdeaLoop,
  getIdeaLoops,
  recordVelocityEvent,
  detectMicroBurst
};
