// LiveTuningPanel.tsx
// UI for adjusting cognitive thresholds/config in real time
import React, { useState, useEffect } from 'react';

const configPath = './cognitiveTuningConfig.json';

export default function LiveTuningPanel({ onConfigChange }) {
  const [config, setConfig] = useState({
    hurstThreshold: 0.6,
    ghostSensitivity: 1.2,
    driftTrigger: 0.8,
    activationWeights: [1, 1.5, 0.75],
    activationThreshold: 0.68
  });

  useEffect(() => {
    // Optionally: fetch config from disk or server
    // setConfig(require(configPath));
  }, []);

  function updateField(field, value) {
    setConfig(prev => {
      const updated = { ...prev, [field]: value };
      if (onConfigChange) onConfigChange(updated);
      return updated;
    });
  }

  function updateWeight(idx, value) {
    setConfig(prev => {
      const updated = { ...prev, activationWeights: prev.activationWeights.map((w, i) => i === idx ? value : w) };
      if (onConfigChange) onConfigChange(updated);
      return updated;
    });
  }

  return (
    <div style={{ background: '#23233a', color: '#ffe44e', padding: 28, borderRadius: 14, minWidth: 380, fontFamily: 'serif', boxShadow: '0 2px 18px #000a', margin: 18 }}>
      <h2 style={{ color: '#b2f7ef', marginBottom: 10 }}>Live Cognitive Tuning Panel</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Hurst Threshold: <input type="number" step="0.01" value={config.hurstThreshold} onChange={e => updateField('hurstThreshold', parseFloat(e.target.value))} /></label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Ghost Sensitivity: <input type="number" step="0.01" value={config.ghostSensitivity} onChange={e => updateField('ghostSensitivity', parseFloat(e.target.value))} /></label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Drift Trigger: <input type="number" step="0.01" value={config.driftTrigger} onChange={e => updateField('driftTrigger', parseFloat(e.target.value))} /></label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Activation Weights:</label>
        {config.activationWeights.map((w, i) => (
          <input key={i} type="number" step="0.01" value={w} onChange={e => updateWeight(i, parseFloat(e.target.value))} style={{ marginLeft: 6, width: 50 }} />
        ))}
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Activation Threshold: <input type="number" step="0.01" value={config.activationThreshold} onChange={e => updateField('activationThreshold', parseFloat(e.target.value))} /></label>
      </div>
      <button style={{ background: '#ffe44e', color: '#23233a', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: '1.03em', cursor: 'pointer', boxShadow: '0 1px 8px #ffe44e66', marginTop: 16 }}>Apply</button>
    </div>
  );
}
