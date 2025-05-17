// ALAN IDE – RefactorAgentPanel (Story 3.1)
// Author: Cascade (2025-05-07)
// Features: cluster detection, modularization suggestions, SelectionContext sync

import React from 'react';
import { useSelection } from './SelectionContext';

// Example expected data structure for clusters/suggestions
// const refactorData = { clusters: [[nodeId]], suggestions: ["Split cluster X", ...] };

export default function RefactorAgentPanel({ refactorData = { clusters: [], suggestions: [] } }) {
  const { selected, setSelected } = useSelection();
  return (
    <div style={{padding: 16}}>
      <h4 style={{color: '#00FFCC', marginBottom: 8}}>Cluster Detection</h4>
      <div style={{marginBottom: 12}}>
        {refactorData.clusters.length === 0 ? (
          <span style={{color: '#A9B1BD'}}>No clusters detected.</span>
        ) : refactorData.clusters.map((cluster, i) => (
          <div key={i} style={{marginBottom: 4}}>
            <b style={{color:'#FFD700'}}>Cluster {i+1}:</b>
            <span style={{marginLeft: 6}}>
              {cluster.map(id => (
                <button
                  key={id}
                  style={{
                    margin: '0 3px',
                    background: selected.includes(id) ? '#00FFCC' : '#23272F',
                    color: selected.includes(id) ? '#23272F' : '#A9B1BD',
                    border: '1px solid #00FFCC',
                    borderRadius: 4,
                    padding: '2px 7px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  onClick={() => setSelected([id])}
                >{id}</button>
              ))}
            </span>
          </div>
        ))}
      </div>
      <h4 style={{color: '#FFD700', marginBottom: 8}}>Suggestions</h4>
      <ul style={{color: '#A9B1BD', fontSize: 15}}>
        {refactorData.suggestions.length === 0 ? (
          <li>No suggestions.</li>
        ) : refactorData.suggestions.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}
