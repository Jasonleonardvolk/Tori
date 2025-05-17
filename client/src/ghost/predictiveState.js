// ghost.predictiveState.js
// Predicts user intent, likely errors, and manages phantom branching for Ghost Mode

const phantomBranches = [];
const debugShadows = [];

export function addPhantomBranch(context, alternatives) {
  phantomBranches.push({context, alternatives, time: Date.now()});
}

export function getPhantomBranches() {
  return phantomBranches;
}

export function addDebugShadow(lineOrBlock) {
  debugShadows.push({lineOrBlock, time: Date.now()});
}

export function getDebugShadows() {
  return debugShadows;
}

export default {
  addPhantomBranch,
  getPhantomBranches,
  addDebugShadow,
  getDebugShadows
};
