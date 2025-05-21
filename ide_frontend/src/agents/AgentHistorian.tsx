// AgentHistorian.ts
// Tracks long-term evolution of concept zones, surfacing rare insights

export type HistorianMemory = {
  conceptZones: Record<string, { entries: number; lastTouched: number; firstTouched: number; driftEvents: number[]; }>; // zone -> stats
  lastUpdate: number;
};

const HISTORIAN_MEMORY_KEY = 'agent_historian_memory';

function loadHistorianMemory(): HistorianMemory {
  const raw = localStorage.getItem(HISTORIAN_MEMORY_KEY);
  return raw ? JSON.parse(raw) : { conceptZones: {}, lastUpdate: 0 };
}

function saveHistorianMemory(mem: HistorianMemory) {
  localStorage.setItem(HISTORIAN_MEMORY_KEY, JSON.stringify(mem));
}

export function updateHistorianMemory(zone: string, eventType: 'entry' | 'drift') {
  const mem = loadHistorianMemory();
  if (!mem.conceptZones[zone]) {
    mem.conceptZones[zone] = { entries: 0, lastTouched: 0, firstTouched: Date.now(), driftEvents: [] };
  }
  if (eventType === 'entry') {
    mem.conceptZones[zone].entries++;
    mem.conceptZones[zone].lastTouched = Date.now();
  }
  if (eventType === 'drift') {
    mem.conceptZones[zone].driftEvents.push(Date.now());
  }
  mem.lastUpdate = Date.now();
  saveHistorianMemory(mem);
}

export function shouldActivateHistorian(zone: string) {
  const mem = loadHistorianMemory();
  // Activate if zone not touched for 20+ sessions or drift events > 3
  const zoneMem = mem.conceptZones[zone];
  if (!zoneMem) return false;
  const longAbsence = Date.now() - zoneMem.lastTouched > 20 * 60 * 60 * 1000;
  const drifted = zoneMem.driftEvents.length > 3;
  return longAbsence || drifted;
}

export function historianSpeak(zone: string) {
  const mem = loadHistorianMemory();
  const zoneMem = mem.conceptZones[zone];
  if (!zoneMem) return '';
  let msg = `This zone remembers you. First touched ${new Date(zoneMem.firstTouched).toLocaleDateString()}.`;
  if (shouldActivateHistorian(zone)) {
    msg += '\nMuch has changed since then.';
    if (zoneMem.driftEvents.length > 3) {
      msg += '\nYou have drifted here more than once.';
    }
  }
  return msg;
}
