// namingEvolutionWatcher.ts
// Records renames with timestamps and overlay triggers

const namingHistory = {};
// namingHistory[concept] = [{ oldName, newName, timestamp }]

export function recordRename({ oldName, newName, timestamp }) {
  if (!namingHistory[oldName]) namingHistory[oldName] = [];
  namingHistory[oldName].push({ oldName, newName, timestamp });
}

export function getRenameHistory(concept) {
  return namingHistory[concept] || [];
}

export function getRecentRenames(n = 5) {
  return Object.values(namingHistory).flat().slice(-n);
}
