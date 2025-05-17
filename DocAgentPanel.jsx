// ALAN IDE – DocAgentPanel (Story 3.3)
// Author: Cascade (2025-05-07)
// Features: live doc capsules, underdocumented region alerts, SelectionContext sync

import React from 'react';
import { useSelection } from './SelectionContext';

// Example expected data structure for documentation
// const docData = { capsules: [{ id, summary, coverage }], alerts: ["Node X needs docs", ...] };

export default function DocAgentPanel({ docData = { capsules: [], alerts: [] } }) {
  const { selected, setSelected } = useSelection();
  return (
    <div style={{padding: 16}}>
      <h4 style={{color: '#00FFCC', marginBottom: 8}}>Live Doc Capsules</h4>
      {docData.capsules.length === 0 ? (
        <span style={{color: '#A9B1BD'}}>No documentation capsules found.</span>
      ) : docData.capsules.map((c, i) => (
        <div key={i} style={{marginBottom: 6}}>
          <b style={{color:'#FFD700'}}>Node {c.id}:</b>
          <span style={{marginLeft: 6, color: '#A9B1BD'}}>{c.summary}</span>
          <span style={{marginLeft: 10, color: c.coverage < 0.5 ? '#FF6B6B' : '#00FFCC'}}>
            ({(c.coverage*100).toFixed(0)}% doc)
          </span>
          <button
            style={{
              marginLeft: 10,
              background: selected.includes(c.id) ? '#00FFCC' : '#23272F',
              color: selected.includes(c.id) ? '#23272F' : '#A9B1BD',
              border: '1px solid #00FFCC',
              borderRadius: 4,
              padding: '2px 7px',
              cursor: 'pointer',
              fontWeight: 600
            }}
            onClick={() => setSelected([c.id])}
          >Focus</button>
        </div>
      ))}
      <h4 style={{color: '#FFD700', margin: '14px 0 8px'}}>Alerts</h4>
      <ul style={{color: '#A9B1BD', fontSize: 15}}>
        {docData.alerts.length === 0 ? (
          <li>No alerts.</li>
        ) : docData.alerts.map((a, i) => <li key={i}>{a}</li>)}
      </ul>
    </div>
  );
}
