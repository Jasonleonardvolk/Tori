// ZoningInspector.tsx
// Agent/dev-facing inspector for Zoning Language neighborhoods, friction/activity, phase resonance, AdaptiveRule status, and event/phase simulation
import React, { useState, useEffect } from 'react';
import { parseZoningLanguage, exampleZL } from './zoningLanguage';
import { NeighborhoodManager } from './NeighborhoodManager';
import { ZLZone, AdaptiveRule } from './types';
import spectralPhaseMemory from '../memory/spectralPhaseMemory';
import conceptGraph from '../memory/conceptGraph';

// For demo: parse example ZL and instantiate manager
const zones = parseZoningLanguage(exampleZL);
const manager = new NeighborhoodManager();
manager.loadZones(zones);

function checkPhaseResonance(oscPhase: number|undefined, phaseWindow: [number, number]|undefined): boolean {
  if (oscPhase === undefined || !phaseWindow) return false;
  // phaseWindow is [min, max] in 0.0-1.0
  return oscPhase >= phaseWindow[0] && oscPhase <= phaseWindow[1];
}

function checkAdaptiveRuleMatch(rule: AdaptiveRule, oscPhase: number|undefined, friction: number|undefined): boolean {
  if (rule.kind === 'oscillator_sync' && oscPhase !== undefined && rule.params.value) {
    // Match if oscillator phase is close to value (normalized 0.0-1.0)
    return Math.abs(oscPhase - Number(rule.params.value)) < 0.05;
  }
  if (rule.kind === 'error_streak' && friction !== undefined && rule.params.count) {
    // Simple demo: friction > threshold
    return friction > 0.7;
  }
  // Extend for other rule types as needed
  return false;
}

function AdaptiveRuleStatus({ rule, oscPhase, friction }: { rule: AdaptiveRule, oscPhase: number|undefined, friction: number|undefined }) {
  const matched = checkAdaptiveRuleMatch(rule, oscPhase, friction);
  return (
    <div style={{ fontSize: '0.9em', color: matched ? '#4ef0ff' : '#666', marginLeft: '1.5em' }}>
      <b>{rule.kind}</b> {JSON.stringify(rule.params)} {matched && <span style={{marginLeft:8}}>&#x2714;</span>}
    </div>
  );
}

function LiveSignals({ zone, oscPhase, friction, overlayActive, phaseResonance }: { zone: ZLZone, oscPhase: number|undefined, friction: number|undefined, overlayActive: boolean, phaseResonance: boolean }) {
  return (
    <div style={{ marginTop: '0.6em', display: 'flex', gap: '1.5em', alignItems: 'center' }}>
      {oscPhase !== undefined && (
        <span style={{ color: '#4ef0ff' }}>
          <b>Phase:</b> {oscPhase.toFixed(2)}
        </span>
      )}
      {phaseResonance && (
        <span style={{ color: '#4ef0ff', fontWeight: 600 }}>
          Phase Resonance
        </span>
      )}
      {friction !== undefined && (
        <span style={{ color: friction > 0.7 ? '#ff4e4e' : '#ffe44e' }}>
          <b>Friction:</b> {friction.toFixed(2)}
        </span>
      )}
      <span style={{ color: overlayActive ? '#4ef0ff' : '#888' }}>
        <b>Overlay:</b> {overlayActive ? 'Active' : '—'}
      </span>
    </div>
  );
}

function ZoneCard({ zone, oscPhase, friction, overlayActive }: { zone: ZLZone, oscPhase: number|undefined, friction: number|undefined, overlayActive: boolean }) {
  const phaseResonance = checkPhaseResonance(oscPhase, zone.phaseWindow);
  return (
    <div style={{
      border: `2px solid ${zone.color || '#888'}`,
      borderRadius: 12,
      margin: '1em 0',
      padding: '1em',
      background: '#1a1a1a',
      color: '#fff',
      boxShadow: '0 2px 8px #0004'
    }}>
      <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: zone.color || '#fff' }}>{zone.label}</div>
      <div style={{ margin: '0.3em 0' }}>
        <b>Concepts:</b> {zone.concepts.join(', ')}
      </div>
      {zone.anchor && <div><b>Anchor:</b> {zone.anchor}</div>}
      {zone.tone && <div><b>Tone:</b> {zone.tone}</div>}
      {zone.oscillator && <div><b>Oscillator:</b> {zone.oscillator}</div>}
      {zone.phaseWindow && <div><b>Phase Window:</b> [{zone.phaseWindow[0]}, {zone.phaseWindow[1]}]</div>}
      {zone.relatesTo && zone.relatesTo.length > 0 && <div><b>Relates to:</b> {zone.relatesTo.join(', ')}</div>}
      {zone.decay && <div><b>Decay:</b> true</div>}
      {zone.inferred && <div><b>Inferred:</b> true</div>}
      {zone.adaptiveRules && zone.adaptiveRules.length > 0 && (
        <div style={{ marginTop: '0.5em' }}>
          <b>Adaptive Rules:</b>
          {zone.adaptiveRules.map((rule, i) => <AdaptiveRuleStatus rule={rule} oscPhase={oscPhase} friction={friction} key={i} />)}
        </div>
      )}
      <LiveSignals zone={zone} oscPhase={oscPhase} friction={friction} overlayActive={overlayActive} phaseResonance={phaseResonance} />
    </div>
  );
}

// --- Event/Phase Simulation Controls ---
function SimulationPanel({ onSimulatePhase, onSimulateFriction }: { onSimulatePhase: (osc: string, value: number) => void, onSimulateFriction: (zoneId: string, value: number) => void }) {
  const [osc, setOsc] = useState('bugFixCycle');
  const [phase, setPhase] = useState(0.5);
  const [zoneId, setZoneId] = useState('debug_loop');
  const [friction, setFriction] = useState(0.5);
  return (
    <div style={{ background: '#191919', padding: '1em', borderRadius: 10, marginBottom: 24 }}>
      <div style={{ color: '#4ef0ff', fontWeight: 600, marginBottom: 8 }}>Simulation Controls</div>
      <div style={{ display: 'flex', gap: '1em', alignItems: 'center' }}>
        <span>Oscillator:</span>
        <input value={osc} onChange={e => setOsc(e.target.value)} style={{ width: 120 }} />
        <span>Phase:</span>
        <input type="number" min={0} max={1} step={0.01} value={phase} onChange={e => setPhase(Number(e.target.value))} style={{ width: 60 }} />
        <button onClick={() => onSimulatePhase(osc, phase)}>Set Phase</button>
      </div>
      <div style={{ display: 'flex', gap: '1em', alignItems: 'center', marginTop: 12 }}>
        <span>Zone:</span>
        <input value={zoneId} onChange={e => setZoneId(e.target.value)} style={{ width: 120 }} />
        <span>Friction:</span>
        <input type="number" min={0} max={1} step={0.01} value={friction} onChange={e => setFriction(Number(e.target.value))} style={{ width: 60 }} />
        <button onClick={() => onSimulateFriction(zoneId, friction)}>Set Friction</button>
      </div>
    </div>
  );
}

export default function ZoningInspector() {
  const [allZones] = useState<ZLZone[]>(manager.all());
  const [oscPhases, setOscPhases] = useState<Record<string, number>>({});
  const [frictions, setFrictions] = useState<Record<string, number>>({});
  const [overlays, setOverlays] = useState<string[]>(window.activeOverlays || []);

  // --- Wire to real agent state ---
  useEffect(() => {
    // Oscillator phases
    const oscillators = spectralPhaseMemory.getOscillators();
    const phases: Record<string, number> = {};
    oscillators.forEach((o: any) => {
      phases[o.pattern] = (o.phase / (2 * Math.PI)) % 1;
    });
    setOscPhases(phases);
    // Friction: from conceptGraph or simulation
    // (Here, just keep simulated values unless real agent signals are wired)
    // Overlay state
    function overlayListener() {
      setOverlays(window.activeOverlays || []);
    }
    window.addEventListener('ghostOverlayState', overlayListener);
    overlayListener();
    return () => window.removeEventListener('ghostOverlayState', overlayListener);
  }, []);

  // --- Simulation handlers ---
  function handleSimulatePhase(osc: string, value: number) {
    setOscPhases(phases => ({ ...phases, [osc]: value }));
  }
  function handleSimulateFriction(zoneId: string, value: number) {
    setFrictions(f => ({ ...f, [zoneId]: value }));
  }

  return (
    <div style={{ background: '#111', color: '#fff', padding: '2em', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#4ef0ff' }}>Zoning Inspector <span style={{ fontSize: '0.6em', color: '#aaa' }}>agent/dev tool</span></h2>
      <SimulationPanel onSimulatePhase={handleSimulatePhase} onSimulateFriction={handleSimulateFriction} />
      <div style={{ fontSize: '1em', color: '#aaa', marginBottom: '1.5em' }}>
        <b>{allZones.length}</b> conceptual neighborhoods loaded
      </div>
      {allZones.map(zone => (
        <ZoneCard
          zone={zone}
          oscPhase={oscPhases[zone.oscillator || '']}
          friction={frictions[zone.id]}
          overlayActive={overlays.includes(zone.id)}
          key={zone.id}
        />
      ))}
      <div style={{ marginTop: '2em', color: '#888', fontSize: '0.9em' }}>
        <b>Note:</b> Signals for phase resonance and AdaptiveRule match are now shown. Use simulation controls above to test overlays and triggers in real time. Wire to more agent state as needed.
      </div>
    </div>
  );
}
