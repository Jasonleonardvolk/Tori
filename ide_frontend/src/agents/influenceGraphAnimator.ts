// influenceGraphAnimator.ts
// Animates the Agent Influence Graph: edge fades, node drift, glyph whisper trails

let edgeAnimations = {};
let nodeAnimations = {};

export function animateEdge(edgeId, { toneConfidence, recent }) {
  // toneConfidence: 0-1, recent: boolean
  edgeAnimations[edgeId] = {
    fade: toneConfidence < 0.5,
    brighten: toneConfidence > 0.7,
    pulse: recent,
    lastUpdate: Date.now()
  };
}

export function animateNode(agentId, { glyphChanged, drift }) {
  nodeAnimations[agentId] = {
    drift: !!drift,
    glyphGlow: !!glyphChanged,
    lastUpdate: Date.now()
  };
}

export function getEdgeAnimation(edgeId) {
  return edgeAnimations[edgeId] || {};
}

export function getNodeAnimation(agentId) {
  return nodeAnimations[agentId] || {};
}

export function clearOldAnimations(ttl = 7000) {
  const now = Date.now();
  Object.keys(edgeAnimations).forEach(id => {
    if (now - edgeAnimations[id].lastUpdate > ttl) delete edgeAnimations[id];
  });
  Object.keys(nodeAnimations).forEach(id => {
    if (now - nodeAnimations[id].lastUpdate > ttl) delete nodeAnimations[id];
  });
}
