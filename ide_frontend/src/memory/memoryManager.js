// memoryManager.js
// Orchestrates event logging, concept graph, and spectral-phase memory modules

import eventLogger from './eventLogger';
import conceptGraph from './conceptGraph';
import spectralPhaseMemory from './spectralPhaseMemory';

export async function recordEvent(event) {
  await eventLogger.logEvent(event);
  // Concept extraction (simple example: group edits, tests, errors)
  if (event.type === 'text_insert' || event.type === 'text_delete') {
    conceptGraph.addConceptNode({ id: event.file + ':' + event.details.line, type: 'code_edit', file: event.file, line: event.details.line });
  }
  if (event.type === 'run_test') {
    conceptGraph.addConceptNode({ id: 'test:' + event.target, type: 'test_run', file: event.target });
    conceptGraph.addConceptEdge(event.file + ':' + event.details.line, 'test:' + event.target);
  }
  // Spectral-phase update
  spectralPhaseMemory.updateOscillators(event.type);
}

export async function recallContext({ file, line, type }) {
  // Example: recall last struggle, victory, or pattern at this file/line
  const events = await eventLogger.getEvents({ file, limit: 100 });
  const node = conceptGraph.findConceptNode(n => n.file === file && (!line || n.line === line));
  const oscillators = spectralPhaseMemory.getOscillators();
  return { events, node, oscillators };
}

export default {
  recordEvent,
  recallContext
};
