// IntentAnomalyOverlay.jsx
// Minimal overlay to highlight intent anomalies and trends
import React, { useEffect, useState } from 'react';
import intentSpecificationTracker from '../services/intentSpecificationTracker';

function detectAnomalies(intents) {
  // Simple anomaly: spike in a single type or rapid intent change
  if (!intents.length) return [];
  const anomalies = [];
  const typeCounts = {};
  intents.forEach(i => { typeCounts[i.type] = (typeCounts[i.type]||0)+1; });
  // Spike: if any type > 50% of recent intents
  Object.entries(typeCounts).forEach(([type, count]) => {
    if (count > intents.length * 0.5) {
      anomalies.push({ type: 'spike', intentType: type, count });
    }
  });
  // Rapid change: >5 different types in last 10 intents
  const last10 = intents.slice(-10).map(i=>i.type);
  if (new Set(last10).size > 5) {
    anomalies.push({ type: 'rapid_change', types: Array.from(new Set(last10)) });
  }
  return anomalies;
}

export default function IntentAnomalyOverlay() {
  const [anomalies, setAnomalies] = useState([]);
  const [intents, setIntents] = useState([]);

  useEffect(() => {
    async function fetchIntents() {
      const all = await intentSpecificationTracker.getAllIntents();
      setIntents(all || []);
      setAnomalies(detectAnomalies(all || []));
    }
    fetchIntents();
    const interval = setInterval(fetchIntents, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!anomalies.length) return null;

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: 340,
      background: '#fffbe7',
      borderRight: '2px solid #ffe082',
      boxShadow: '2px 2px 12px rgba(255, 193, 7, 0.10)',
      zIndex: 10001,
      padding: 16,
      fontFamily: 'sans-serif',
      minHeight: 80
    }}>
      <h4 style={{marginTop:0,color:'#b26a00'}}>Intent Anomaly Detector</h4>
      <ul style={{margin:0,paddingLeft:18}}>
        {anomalies.map((a,i) => (
          <li key={i} style={{marginBottom:6}}>
            {a.type==='spike' && (
              <span>Spike: <strong>{a.intentType}</strong> ({a.count} recent)</span>
            )}
            {a.type==='rapid_change' && (
              <span>Rapid intent type change: {a.types.join(', ')}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
