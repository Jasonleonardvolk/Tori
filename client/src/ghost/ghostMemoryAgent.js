// ghostMemoryAgent.js
// Agentic overlay trigger/evaluation loop for hyperpersonal memory overlays
// Extended: richer AdaptiveRule types, refined overlay actions/messages, enriched friction/phase signals
import { getOscillators } from '../memory/spectralPhaseMemory';
import { getConceptGraph } from '../memory/conceptGraph';
import { getEvents } from '../memory/eventLogger';
import { showGhostMemoryOverlay } from './ghostMemoryOverlay';
import { parseZoningLanguage, exampleZL } from '../zoning/zoningLanguage';
import { NeighborhoodManager } from '../zoning/NeighborhoodManager';

const zones = parseZoningLanguage(exampleZL);
const manager = new NeighborhoodManager();
manager.loadZones(zones);

let lastOverlayTime = 0;
const OVERLAY_DEBOUNCE_MS = 90000;
const overlayLog = [];

function getOscPhase(oscillatorId) {
  const oscillators = getOscillators();
  const osc = oscillators.find(o => o.pattern === oscillatorId);
  return osc ? (osc.phase / (2 * Math.PI)) % 1 : undefined;
}

function getFriction(zone) {
  // Friction: sum of .friction on concept nodes (if present), plus recent error activity
  const graph = getConceptGraph();
  let frictionScore = 0;
  for (const c of zone.concepts) {
    const node = graph.nodes.find(n => n.id === c || n.label === c);
    if (node && node.friction) frictionScore += node.friction;
    // Integrate error logs (if node.errorCount or node.lastError)
    if (node && node.errorCount) frictionScore += Math.min(node.errorCount * 0.1, 0.5);
    if (node && node.lastError && Date.now() - new Date(node.lastError).getTime() < 1000 * 60 * 60) frictionScore += 0.2;
  }
  // Activity burst: if many recent edits/events
  if (zone.concepts && zone.concepts.length > 0) {
    const now = Date.now();
    let recentActivity = 0;
    for (const c of zone.concepts) {
      const node = graph.nodes.find(n => n.id === c || n.label === c);
      if (node && node.activityLog) {
        recentActivity += node.activityLog.filter(ts => now - new Date(ts).getTime() < 15 * 60 * 1000).length;
      }
    }
    if (recentActivity > 5) frictionScore += 0.2;
  }
  return frictionScore > 0 ? Math.min(frictionScore, 1) : undefined;
}

function checkAdaptiveRuleMatch(rule, oscPhase, friction, zone) {
  if (rule.kind === 'oscillator_sync' && oscPhase !== undefined && rule.params.value) {
    return Math.abs(oscPhase - Number(rule.params.value)) < 0.05;
  }
  if (rule.kind === 'error_streak' && friction !== undefined && rule.params.count) {
    return friction > 0.7;
  }
  if (rule.kind === 'coedit_threshold' && zone) {
    // Match if multiple concepts in the zone were edited together recently
    const graph = getConceptGraph();
    let coeditCount = 0;
    for (const c of zone.concepts) {
      const node = graph.nodes.find(n => n.id === c || n.label === c);
      if (node && node.activityLog) {
        coeditCount += node.activityLog.filter(ts => Date.now() - new Date(ts).getTime() < 10 * 60 * 1000).length;
      }
    }
    return coeditCount >= (rule.params.count || 3);
  }
  if (rule.kind === 'activity_burst' && zone) {
    // Trigger if high activity in short window
    const graph = getConceptGraph();
    let burst = 0;
    for (const c of zone.concepts) {
      const node = graph.nodes.find(n => n.id === c || n.label === c);
      if (node && node.activityLog) {
        burst += node.activityLog.filter(ts => Date.now() - new Date(ts).getTime() < 2 * 60 * 1000).length;
      }
    }
    return burst >= (rule.params.count || 5);
  }
  return false;
}

function getOverlayActionForRule(rule, zone) {
  if (!rule) return undefined;
  if (rule.kind === 'oscillator_sync') {
    return () => {/* e.g., open related file, show phase tips */};
  }
  if (rule.kind === 'error_streak') {
    return () => {/* e.g., show last fix, suggest break */};
  }
  if (rule.kind === 'coedit_threshold') {
    return () => {/* e.g., suggest refactor, show diff */};
  }
  if (rule.kind === 'activity_burst') {
    return () => {/* e.g., prompt for commit, suggest summary */};
  }
  return undefined;
}

function getOverlayMessage(zone, rule, oscPhase, friction) {
  if (!rule) {
    if (oscPhase !== undefined && zone.phaseWindow) return `[${zone.label}] In phase window.`;
    return `[${zone.label}] Contextual nudge.`;
  }
  if (rule.kind === 'oscillator_sync') return `[${zone.label}] ⚡ Phase resonance! You're in your ${zone.oscillator} cycle.`;
  if (rule.kind === 'error_streak') return `[${zone.label}] 🚨 High friction: repeated errors or struggles detected.`;
  if (rule.kind === 'coedit_threshold') return `[${zone.label}] ✨ Multiple concepts edited together. Consider refactoring or reviewing links.`;
  if (rule.kind === 'activity_burst') return `[${zone.label}] 💡 Activity burst! Lots of recent edits—time to checkpoint or summarize?`;
  return `[${zone.label}] Contextual nudge.`;
}

export async function evaluateAgenticTriggers({ currentFile, activeConceptId }) {
  const now = Date.now();
  if (now - lastOverlayTime < OVERLAY_DEBOUNCE_MS) return;

  for (const zone of manager.all()) {
    const oscPhase = zone.oscillator ? getOscPhase(zone.oscillator) : undefined;
    const friction = getFriction(zone);
    let ruleMatched = false;
    if (zone.adaptiveRules && zone.adaptiveRules.length > 0) {
      for (const rule of zone.adaptiveRules) {
        if (checkAdaptiveRuleMatch(rule, oscPhase, friction, zone)) {
          triggerOverlay(zone, rule, oscPhase, friction);
          ruleMatched = true;
          break;
        }
      }
    }
    if (!ruleMatched && oscPhase !== undefined && zone.phaseWindow) {
      if (oscPhase >= zone.phaseWindow[0] && oscPhase <= zone.phaseWindow[1]) {
        triggerOverlay(zone, null, oscPhase, friction);
      }
    }
  }
}

function triggerOverlay(zone, rule, oscPhase, friction) {
  lastOverlayTime = Date.now();
  const overlayId = `ghost_${zone.id}_${Date.now()}`;
  const message = getOverlayMessage(zone, rule, oscPhase, friction);
  const onAct = getOverlayActionForRule(rule, zone);
  showGhostMemoryOverlay({
    message,
    overlayId,
    onAct: onAct ? () => { onAct(); logOverlayAction(overlayId, 'acted', zone, rule); } : undefined,
    onDismiss: () => logOverlayAction(overlayId, 'dismissed', zone, rule)
  });
  logOverlayAction(overlayId, 'shown', zone, rule);
  window.activeOverlays = window.activeOverlays || [];
  if (!window.activeOverlays.includes(zone.id)) window.activeOverlays.push(zone.id);
  window.dispatchEvent(new Event('ghostOverlayState'));
}

function logOverlayAction(overlayId, action, zone, rule) {
  overlayLog.push({
    overlayId,
    action,
    zone: zone.id,
    rule: rule ? rule.kind : null,
    time: Date.now()
  });
}

export function getOverlayLog() {
  return overlayLog;
}

export function startGhostMemoryAgent({ getCurrentFile, getActiveConceptId }) {
  setInterval(() => {
    evaluateAgenticTriggers({
      currentFile: getCurrentFile && getCurrentFile(),
      activeConceptId: getActiveConceptId && getActiveConceptId()
    });
  }, 12000);
}
