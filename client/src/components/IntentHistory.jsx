// IntentHistory.jsx
// Visualizes a history/timeline of inferred intents and key signals
import React, { useEffect, useState } from 'react';
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

export default function IntentHistory() {
  const [intents, setIntents] = useState([]);

  useEffect(() => {
    async function fetchIntents() {
      const all = await intentSpecificationTracker.getAllIntents();
      setIntents(all || []);
    }
    fetchIntents();
    const interval = setInterval(fetchIntents, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      bottom: 0,
      width: 360,
      maxHeight: '40vh',
      overflowY: 'auto',
      background: '#fafbfc',
      borderLeft: '2px solid #eee',
      borderTop: '2px solid #eee',
      boxShadow: '0 -2px 8px rgba(0,0,0,0.07)',
      zIndex: 9999,
      padding: 12,
      fontFamily: 'sans-serif',
      fontSize: 14
    }}>
      <h4 style={{marginTop:0}}>Intent History</h4>
      <ul style={{margin:0,padding:0,listStyle:'none'}}>
        {intents.slice(-20).reverse().map(intent => (
          <li key={intent.id} style={{marginBottom:8,padding:6,borderRadius:6,background:'#fff',boxShadow:'0 1px 3px rgba(0,0,0,0.03)'}}>
            <span style={{color:INTENT_COLORS[intent.type]||'#333',fontWeight:'bold'}}>{intent.type}</span>
            <span style={{marginLeft:8,fontSize:13,color:'#888'}}>{intent.description}</span>
            <span style={{marginLeft:8,fontSize:12,color:'#aaa'}}>{intent.updatedAt && new Date(intent.updatedAt).toLocaleTimeString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
