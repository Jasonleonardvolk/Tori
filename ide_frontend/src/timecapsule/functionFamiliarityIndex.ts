// functionFamiliarityIndex.ts
// Logs edits vs hovers per function

const familiarityIndex = {};
// familiarityIndex[functionName] = { edits: 0, hovers: 0, lastEdit: null, lastHover: null }

export function logFunctionHover(functionName, timestamp) {
  if (!familiarityIndex[functionName]) familiarityIndex[functionName] = { edits: 0, hovers: 0, lastEdit: null, lastHover: null };
  familiarityIndex[functionName].hovers++;
  familiarityIndex[functionName].lastHover = timestamp;
}

export function logFunctionEdit(functionName, timestamp) {
  if (!familiarityIndex[functionName]) familiarityIndex[functionName] = { edits: 0, hovers: 0, lastEdit: null, lastHover: null };
  familiarityIndex[functionName].edits++;
  familiarityIndex[functionName].lastEdit = timestamp;
}

export function getFunctionFamiliarity(functionName) {
  return familiarityIndex[functionName] || { edits: 0, hovers: 0, lastEdit: null, lastHover: null };
}

export function getAvoidedFunctions(threshold = 3) {
  return Object.entries(familiarityIndex)
    .filter(([name, data]) => data.hovers >= threshold && data.edits === 0)
    .map(([name]) => name);
}
