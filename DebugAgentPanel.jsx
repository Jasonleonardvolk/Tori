// ALAN IDE – DebugAgentPanel (Story 3.2)
// Author: Cascade (2025-05-07)
// Features: anomaly detection, notifications, SelectionContext sync

import React from 'react';
import { useSelection } from './SelectionContext';

// Example expected data structure for anomalies/notifications
// const debugData = { anomalies: [{ id, type, severity, message }], notifications: ["Node X unstable", ...] };

export default function DebugAgentPanel({ debugData = { anomalies: [], notifications: [] } }) {
  const { selected, setSelected } = useSelection();
  return (
    <div style={{padding: 16}}>
      <h4 style={{color: '#FF007F', marginBottom: 8}}>Phase/Spectral Anomalies</h4>
      {debugData.anomalies.length === 0 ? (
        <span style={{color: '#A9B1BD'}}>No anomalies detected.</span>
      ) : debugData.anomalies.map((a, i) => (
        <div key={i} style={{marginBottom: 6}}>
          <b style={{color:'#FFD700'}}>{a.type}:</b>
          <span style={{marginLeft: 6, color: a.severity === 'high' ? '#FF6B6B' : '#A9B1BD'}}>
            {a.message}
          </span>
          <button
            style={{
              marginLeft: 10,
              background: selected.includes(a.id) ? '#00FFCC' : '#23272F',
              color: selected.includes(a.id) ? '#23272F' : '#A9B1BD',
              border: '1px solid #00FFCC',
              borderRadius: 4,
              padding: '2px 7px',
              cursor: 'pointer',
              fontWeight: 600
            }}
            onClick={() => setSelected([a.id])}
          >Focus</button>
        </div>
      ))}
      <h4 style={{color: '#FFD700', margin: '14px 0 8px'}}>Notifications</h4>
      <ul style={{color: '#A9B1BD', fontSize: 15}}>
        {debugData.notifications.length === 0 ? (
          <li>No notifications.</li>
        ) : debugData.notifications.map((n, i) => <li key={i}>{n}</li>)}
      </ul>
    </div>
  );
}
