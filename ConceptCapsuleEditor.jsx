// ALAN IDE – ConceptCapsuleEditor (Epic 4, Story 4.1)
// Author: Cascade (2025-05-07)
// Features: panel layout, data fetch by node_id, SelectionContext sync

import React, { useEffect, useState } from 'react';
import { useSelection } from './SelectionContext';
import ReactCodeMirror from '@uiw/react-codemirror';
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode';
import { javascript } from '@codemirror/lang-javascript';

// --- Panel-to-canvas sync: Event helper ---
export function triggerConceptGraphUpdate() {
  window.dispatchEvent(new Event('concept-graph-updated'));
}

// Example backend fetch: /api/concept-capsule/:node_id
async function fetchConceptCapsule(node_id) {
  if (!node_id) return null;
  const res = await fetch(`/api/concept-capsule/${node_id}`);
  if (!res.ok) return null;
  return await res.json();
}

export default function ConceptCapsuleEditor() {
  const { selected, setSelected } = useSelection();
  const node_id = selected[0];
  const [capsule, setCapsule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [koopmanLoading, setKoopmanLoading] = useState(false);

  // Fetch capsule data (with Koopman, eigenmodes, etc)
  useEffect(() => {
    if (!node_id) { setCapsule(null); return; }
    setLoading(true);
    fetchConceptCapsule(node_id)
      .then(setCapsule)
      .finally(() => setLoading(false));
  }, [node_id]);

  // Handler: eigenmode select triggers re-fetch for that mode (if supported by backend)
  async function handleEigenmodeSelect(modeId) {
    if (!node_id || !modeId) return;
    setKoopmanLoading(true);
    // Try /api/concept-capsule/:node_id?mode=:modeId
    let url = `/api/concept-capsule/${node_id}`;
    if (modeId) url += `?mode=${encodeURIComponent(modeId)}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCapsule(data);
        setSelected([node_id]); // keep node selected
      }
    } finally {
      setKoopmanLoading(false);
    }
  }

  return (
    <div style={{background: 'var(--color-surface, #23272F)', borderRadius: 8, padding: 18, minWidth: 340, minHeight: 320}}>
      <h2 style={{color: 'var(--color-primary, #00FFCC)', marginBottom: 10}}>Concept Capsule Editor</h2>
      {!node_id && <div style={{color: '#A9B1BD'}}>Select a concept node to edit.</div>}
      {loading && <div style={{color: '#FFD700'}}>Loading...</div>}
      {capsule && (
        <div>
          {/* --- Morph Controls (Epsilon, Apply, History) --- */}
          {capsule.morph && (
            <MorphControlsSection morph={capsule.morph} nodeId={node_id} />
          )}
          {/* --- Embedded Code Editor (CodeMirror) --- */}
          <CodeEditorSection code={capsule.code} nodeId={node_id} />
          {/* --- Coupling Graph Mini-View --- */}
          {capsule.couplingGraph && (
            <div style={{margin: '18px 0'}}>
              <div style={{color: '#00FFCC', fontWeight: 600, marginBottom: 4}}>Coupling Graph (Local)</div>
              <CouplingGraphMiniView graph={capsule.couplingGraph} selected={node_id} />
            </div>
          )}
          {/* --- Koopman Influence Bar Chart & Eigenmode Selector --- */}
          {koopmanLoading && <div style={{color: '#FFD700'}}>Loading Koopman data…</div>}
          {Array.isArray(capsule.koopmanInfluence) && capsule.koopmanInfluence.length > 0 && !koopmanLoading && (
            <div style={{margin: '18px 0'}}>
              <div style={{color: '#00FFCC', fontWeight: 600, marginBottom: 4}}>Koopman Influence</div>
              <KoopmanInfluenceBarChart data={capsule.koopmanInfluence} selected={capsule.selectedModeId} />
            </div>
          )}
          {Array.isArray(capsule.eigenmodes) && capsule.eigenmodes.length > 0 && !koopmanLoading && (
            <div style={{margin: '18px 0'}}>
              <div style={{color: '#FFD700', fontWeight: 600, marginBottom: 4}}>Eigenmode Selector</div>
              <EigenmodeSelector modes={capsule.eigenmodes} selected={capsule.selectedModeId} onSelect={handleEigenmodeSelect} />
            </div>
          )}

          <div style={{fontSize: 20, fontWeight: 600, color: '#FFD700', marginBottom: 4}}>{capsule.title}</div>
          <div style={{color: '#A9B1BD', marginBottom: 8}}>{capsule.summary}</div>

          {/* Phase Signature Visualization */}
          {Array.isArray(capsule.phaseSignature) && capsule.phaseSignature.length > 0 && (
            <div style={{margin: '18px 0'}}>
              <div style={{color: '#00FFCC', fontWeight: 600, marginBottom: 4}}>Phase Signature</div>
              <PhaseSignatureChart data={capsule.phaseSignature} />
            </div>
          )}

          {/* Resonance Profile Visualization */}
          {Array.isArray(capsule.resonanceProfile) && capsule.resonanceProfile.length > 0 && (
            <div style={{margin: '18px 0'}}>
              <div style={{color: '#FFD700', fontWeight: 600, marginBottom: 4}}>Resonance Profile</div>
              <ResonanceProfileChart data={capsule.resonanceProfile} />
            </div>
          )}

          {/* Placeholder for Koopman, coupling, code, morph controls, etc. */}
          <div style={{background: '#181A1B', borderRadius: 6, padding: 12, color: '#00FFCC', margin: '16px 0'}}>
            <b>Concept Data:</b>
            <pre style={{fontSize: 13, color: '#A9B1BD'}}>{JSON.stringify(capsule, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Morph Controls Section ---
function MorphControlsSection({ morph, nodeId }) {
  const [epsilon, setEpsilon] = React.useState(morph.epsilon || 0.0);
  const [applying, setApplying] = React.useState(false);
  const [applied, setApplied] = React.useState(false);
  const [history, setHistory] = React.useState(morph.history || []);
  const [selectedHistory, setSelectedHistory] = React.useState('');

  React.useEffect(() => {
    setEpsilon(morph.epsilon || 0.0);
    setHistory(morph.history || []);
    setSelectedHistory('');
  }, [morph, nodeId]);

  async function handleApply() {
    setApplying(true);
    // Simulate API: POST /api/concept-capsule/:nodeId/morph { epsilon }
    await fetch(`/api/concept-capsule/${nodeId}/morph`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ epsilon })
    });
    setApplying(false); setApplied(true);
    setTimeout(() => setApplied(false), 1200);
  }

  async function handleRestore(historyId) {
    setApplying(true);
    // Simulate API: POST /api/concept-capsule/:nodeId/morph/restore { historyId }
    await fetch(`/api/concept-capsule/${nodeId}/morph/restore`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ historyId })
    });
    setSelectedHistory(historyId);
    setApplying(false); setApplied(true);
    // Panel-to-canvas sync: trigger canvas reload
    if (window && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('concept-graph-updated'));
    }
    setTimeout(() => setApplied(false), 1200);
  }

  return (
    <div style={{margin: '18px 0'}}>
      <div style={{color: '#00FFCC', fontWeight: 600, marginBottom: 4}}>Morph Controls</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10}}>
        <span style={{color:'#FFD700'}}>ε:</span>
        <input
          type="range"
          min={morph.epsilonMin || 0}
          max={morph.epsilonMax || 1}
          step={morph.epsilonStep || 0.01}
          value={epsilon}
          onChange={e => setEpsilon(Number(e.target.value))}
          style={{flex:1, accentColor:'#00FFCC'}}
        />
        <span style={{color:'#00FFCC', fontWeight:600, fontSize:15, minWidth:40, textAlign:'right'}}>{epsilon.toFixed(3)}</span>
        <button
          onClick={handleApply}
          disabled={applying}
          style={{background:'#FFD700', color:'#23272F', border:'none', borderRadius:5, padding:'6px 14px', fontWeight:600, cursor:applying?'not-allowed':'pointer'}}>
          {applying ? 'Applying...' : applied ? 'Applied!' : 'Apply'}
        </button>
      </div>
      <div style={{marginTop: 6}}>
        <select
          value={selectedHistory}
          onChange={e => handleRestore(e.target.value)}
          style={{padding:6, borderRadius:5, background:'#23272F', color:'#FFD700', fontWeight:600, minWidth:160}}>
          <option value=''>Morph history…</option>
          {history.map(h => (
            <option key={h.id} value={h.id}>{h.label || h.id}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// --- CodeMirror Code Editor Section ---
function CodeEditorSection({ code, nodeId }) {
  const [value, setValue] = React.useState(code || '');
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  React.useEffect(() => { setValue(code || ''); setSaved(false); }, [code, nodeId]);
  async function handleSave() {
    setSaving(true);
    // Simulate API save: POST /api/concept-capsule/:nodeId/code
    await fetch(`/api/concept-capsule/${nodeId}/code`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ code: value })
    });
    setSaving(false); setSaved(true);
    // Panel-to-canvas sync: trigger canvas reload
    if (window && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('concept-graph-updated'));
    }
    setTimeout(() => setSaved(false), 1500);
  }
  return (
    <div style={{margin: '18px 0'}}>
      <div style={{color: '#FFD700', fontWeight: 600, marginBottom: 4}}>Code Capsule</div>
      <div style={{borderRadius: 7, overflow: 'hidden', border: '1.5px solid #23272F'}}>
        <ReactCodeMirror
          value={value}
          height="120px"
          theme={prefersDark ? vscodeDark : vscodeLight}
          extensions={[javascript()]}
          onChange={setValue}
          basicSetup={{ lineNumbers: true, highlightActiveLine: true }}
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{marginTop: 8, background:'#00FFCC', color:'#23272F', border:'none', borderRadius:5, padding:'5px 15px', fontWeight:600, cursor:saving?'not-allowed':'pointer'}}>
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
      </button>
    </div>
  );
}

// --- Coupling Graph Mini-View ---
function CouplingGraphMiniView({ graph, selected }) {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return null;
  const w = 110, h = 90, pad = 12;
  // Normalize node positions (assume graph.nodes: [{id, x, y}], x/y in [0,1])
  const nodes = graph.nodes.map(n => ({...n, px: pad + n.x * (w-2*pad), py: pad + n.y * (h-2*pad)}));
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  // Find neighbors of selected
  const neighbors = new Set(
    graph.edges.filter(e => e.source === selected || e.target === selected)
      .map(e => e.source === selected ? e.target : e.source)
  );
  return (
    <svg width={w} height={h} style={{background:'#181A1B', borderRadius: 7}}>
      {/* Edges */}
      {graph.edges.map((e,i) => (
        <line
          key={i}
          x1={nodeMap[e.source]?.px}
          y1={nodeMap[e.source]?.py}
          x2={nodeMap[e.target]?.px}
          y2={nodeMap[e.target]?.py}
          stroke="#A9B1BD"
          strokeWidth={neighbors.has(e.source) || neighbors.has(e.target) ? 2.7 : 1.2}
          opacity={0.7}
        />
      ))}
      {/* Nodes */}
      {nodes.map(n => (
        <circle
          key={n.id}
          cx={n.px}
          cy={n.py}
          r={n.id === selected ? 11 : neighbors.has(n.id) ? 8 : 6}
          fill={n.id === selected ? '#FFD700' : neighbors.has(n.id) ? '#00FFCC' : '#23272F'}
          stroke={n.id === selected ? '#FF007F' : '#A9B1BD'}
          strokeWidth={n.id === selected ? 3 : 1.5}
          opacity={n.id === selected ? 1 : 0.85}
        />
      ))}
    </svg>
  );
}

// --- Koopman Influence Bar Chart ---
function KoopmanInfluenceBarChart({ data = [], selected }) {
  const w = 180, h = 60, pad = 8, barH = 16;
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.value), 1e-8);
  return (
    <svg width={w} height={h}>
      {data.map((d, i) => (
        <g key={d.modeId}>
          <rect
            x={pad}
            y={pad + i * (barH + 4)}
            width={(w - 2 * pad) * (d.value / maxVal)}
            height={barH}
            fill={selected === d.modeId ? '#FFD700' : '#00FFCC'}
            opacity={selected === d.modeId ? 1 : 0.7}
            rx={5}
          />
          <text
            x={pad + 6}
            y={pad + i * (barH + 4) + barH/2 + 4}
            fontSize={13}
            fill="#23272F"
            fontWeight={selected === d.modeId ? 700 : 500}
          >{d.modeId}</text>
          <text
            x={w - pad - 4}
            y={pad + i * (barH + 4) + barH/2 + 4}
            fontSize={13}
            fill="#A9B1BD"
            textAnchor="end"
          >{d.value.toFixed(2)}</text>
        </g>
      ))}
    </svg>
  );
}

// --- Eigenmode Selector ---
function EigenmodeSelector({ modes = [], selected, onSelect }) {
  return (
    <select
      value={selected || ''}
      onChange={e => onSelect && onSelect(e.target.value)}
      style={{padding: 6, borderRadius: 5, background: '#23272F', color: '#FFD700', fontSize: 15, fontWeight: 600, marginTop: 4, minWidth: 120}}>
      <option value='' disabled>Select eigenmode…</option>
      {modes.map(m => (
        <option key={m.id} value={m.id} style={{color:'#FFD700'}}>
          {m.label} (Entropy: {m.entropy})
        </option>
      ))}
    </select>
  );
}

// --- Phase Signature Chart ---
function PhaseSignatureChart({ data = [] }) {
  const w = 180, h = 46, pad = 8;
  if (!data.length) return null;
  const points = data.map((v, i) => [
    pad + (w - 2 * pad) * (i / (data.length - 1)),
    h - pad - v * (h - 2 * pad)
  ]);
  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ' ' + p[1]).join(' ');
  return (
    <svg width={w} height={h}>
      <polyline points={points.map(p => p.join(',')).join(' ')} fill="none" stroke="#00FFCC" strokeWidth={2.5} />
      <circle cx={points[0][0]} cy={points[0][1]} r={3} fill="#FFD700" />
      <circle cx={points[points.length-1][0]} cy={points[points.length-1][1]} r={3} fill="#FF007F" />
    </svg>
  );
}
// --- Resonance Profile Chart ---
function ResonanceProfileChart({ data = [] }) {
  const w = 180, h = 46, pad = 8;
  if (!data.length) return null;
  const points = data.map((v, i) => [
    pad + (w - 2 * pad) * (i / (data.length - 1)),
    h - pad - v * (h - 2 * pad)
  ]);
  return (
    <svg width={w} height={h}>
      <polyline points={points.map(p => p.join(',')).join(' ')} fill="none" stroke="#FFD700" strokeWidth={2.5} />
      <circle cx={points[0][0]} cy={points[0][1]} r={3} fill="#00FFCC" />
      <circle cx={points[points.length-1][0]} cy={points[points.length-1][1]} r={3} fill="#FF007F" />
    </svg>
  );
}

    </div>
  );
}
