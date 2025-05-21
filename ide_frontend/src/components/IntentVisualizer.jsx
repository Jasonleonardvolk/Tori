// IntentVisualizer.jsx
// Minimal overlay/sidebar to visualize inferred intents and signals
import React, { useEffect, useState } from 'react';
import intentDetectionService from '../services/intentDetectionService';
import intentSpecificationTracker from '../services/intentSpecificationTracker';

const INTENT_COLORS = {
  question: '#4a90e2',
  instruction: '#7ed957',
  opinion: '#f5a623',
  navigation: '#b8e986',
  edit: '#f8e71c',
  voice: '#f06292',
  idle: '#bdbdbd',
  unknown: '#e0e0e0',
};

export default function IntentVisualizer({ intentId }) {
  const [signals, setSignals] = useState([]);
  const [intent, setIntent] = useState(null);

  useEffect(() => {
    async function fetchSignals() {
      if (intentId) {
        const sigs = intentSpecificationTracker.getSignals(intentId);
        setSignals(sigs);
        const details = intentSpecificationTracker.getIntentDetails(intentId);
        setIntent(details);
      }
    }
    fetchSignals();
  }, [intentId]);

  if (!intent) return null;

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 80,
      width: 320,
      background: '#fff',
      borderLeft: '2px solid #eee',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      zIndex: 9999,
      padding: 16,
      fontFamily: 'sans-serif',
      minHeight: 120
    }}>
      <h4 style={{marginTop:0}}>Inferred Intent</h4>
      <div style={{
        fontWeight: 'bold',
        color: INTENT_COLORS[intent.type] || '#333',
        fontSize: 18
      }}>{intent.type} <span style={{fontWeight:'normal',fontSize:14}}>({(intent.confidence*100).toFixed(0)}%)</span></div>
      <div style={{color:'#666',margin:'4px 0 10px 0'}}>{intent.description}</div>
      <div style={{fontSize:13}}>
        <strong>Signals:</strong>
        <ul style={{margin:0,paddingLeft:18}}>
          {signals.map((sig,i) => (
            <li key={i}>
              <span style={{color:INTENT_COLORS[sig.type]||'#999'}}>{sig.type}</span>
              {sig.type==='voice' && sig.pitch && (
                <span style={{marginLeft:8}}>Pitch: {sig.pitch}Hz, Rate: {sig.speakingRate?.toFixed(2)}w/s, Sentiment: {sig.sentiment}</span>
              )}
              {sig.type!=='voice' && (
                <span style={{marginLeft:8}}>{sig.timestamp && new Date(sig.timestamp).toLocaleTimeString()}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
