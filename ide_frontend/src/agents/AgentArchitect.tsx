// AgentArchitect.ts
// The Architect: remembers module structure, abstractions, and refactor arcs

export type ArchitectMemory = {
  moduleStructures: Record<string, string[]>; // file -> list of abstractions
  refactorArcs: { file: string; from: string[]; to: string[]; timestamp: number; }[];
  lastUpdate: number;
};

const ARCHITECT_MEMORY_KEY = 'agent_architect_memory';

function loadArchitectMemory(): ArchitectMemory {
  const raw = localStorage.getItem(ARCHITECT_MEMORY_KEY);
  return raw ? JSON.parse(raw) : { moduleStructures: {}, refactorArcs: [], lastUpdate: 0 };
}

function saveArchitectMemory(mem: ArchitectMemory) {
  localStorage.setItem(ARCHITECT_MEMORY_KEY, JSON.stringify(mem));
}

export function updateArchitectMemory({ moduleStructures, refactorArcs }: Partial<ArchitectMemory>) {
  const mem = loadArchitectMemory();
  if (moduleStructures) mem.moduleStructures = moduleStructures;
  if (refactorArcs) mem.refactorArcs = refactorArcs;
  mem.lastUpdate = Date.now();
  saveArchitectMemory(mem);
}

export function shouldActivateArchitect(context: { file: string; abstractions: string[]; }) {
  const mem = loadArchitectMemory();
  // Activate if abstractions drift or major structure change
  const known = mem.moduleStructures[context.file];
  if (!known) return false;
  const drift = known.length !== context.abstractions.length || known.some((k, i) => k !== context.abstractions[i]);
  return drift;
}

export function architectSpeak(context: { file: string; abstractions: string[]; }) {
  const mem = loadArchitectMemory();
  let msg = 'That pattern looks familiar. You once shaped this module differently.';
  if (shouldActivateArchitect(context)) {
    msg += '\nModule structure or abstraction arc has shifted.';
  }
  return msg;
}
