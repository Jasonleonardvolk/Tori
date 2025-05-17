// AgentStylist.ts
// The Stylist: remembers and gently enforces user style conventions

export type StylistMemory = {
  namingPatterns: string[];
  indentation: string;
  idioms: string[];
  lastUpdate: number;
};

const STYLIST_MEMORY_KEY = 'agent_stylist_memory';

function loadStylistMemory(): StylistMemory {
  const raw = localStorage.getItem(STYLIST_MEMORY_KEY);
  return raw ? JSON.parse(raw) : { namingPatterns: [], indentation: '  ', idioms: [], lastUpdate: 0 };
}

function saveStylistMemory(mem: StylistMemory) {
  localStorage.setItem(STYLIST_MEMORY_KEY, JSON.stringify(mem));
}

export function updateStylistMemory({ namingPatterns, indentation, idioms }: Partial<StylistMemory>) {
  const mem = loadStylistMemory();
  if (namingPatterns) mem.namingPatterns = namingPatterns;
  if (indentation) mem.indentation = indentation;
  if (idioms) mem.idioms = idioms;
  mem.lastUpdate = Date.now();
  saveStylistMemory(mem);
}

export function shouldActivateStylist(context: { name: string; code: string; }) {
  const mem = loadStylistMemory();
  // Simple: activate if naming or indentation deviates
  const nameDeviates = mem.namingPatterns.length && !mem.namingPatterns.some(p => context.name.match(p));
  const indentDeviates = mem.indentation && !context.code.startsWith(mem.indentation);
  return nameDeviates || indentDeviates;
}

export function stylistSpeak(context: { name: string; code: string; }) {
  const mem = loadStylistMemory();
  let msg = 'I’ve seen how you format things. I remember your naming arc.';
  if (shouldActivateStylist(context)) {
    msg += ' I’ll speak when it frays.';
    if (mem.namingPatterns.length && !mem.namingPatterns.some(p => context.name.match(p))) {
      msg += `\nNaming seems off from your usual pattern.`;
    }
    if (mem.indentation && !context.code.startsWith(mem.indentation)) {
      msg += `\nIndentation is drifting from your norm.`;
    }
  }
  return msg;
}
