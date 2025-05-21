// spectralPhaseMemory.js
// Oscillator-based phase memory for recurring temporal patterns (Koopman-inspired)

const STORAGE_KEY = 'spectral-phase-memory';

let oscillators = null;

function loadOscillators() {
  if (oscillators) return oscillators;
  const raw = localStorage.getItem(STORAGE_KEY);
  oscillators = raw ? JSON.parse(raw) : [];
  return oscillators;
}

function saveOscillators() {
  if (oscillators) localStorage.setItem(STORAGE_KEY, JSON.stringify(oscillators));
}

export function updateOscillators(eventType) {
  loadOscillators();
  // Simple demo: each pattern is an oscillator (id, phase, freq, count)
  let osc = oscillators.find(o => o.pattern === eventType);
  if (!osc) {
    osc = { pattern: eventType, phase: 0, freq: 1, count: 1 };
    oscillators.push(osc);
  } else {
    osc.phase = (osc.phase + Math.PI / 4) % (2 * Math.PI);
    osc.count++;
  }
  saveOscillators();
}

export function getOscillators() {
  return loadOscillators();
}

export default {
  updateOscillators,
  getOscillators
};
