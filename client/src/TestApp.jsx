import React, { useState, useEffect } from 'react';

function TestApp() {
  const [serverStatus, setServerStatus] = useState('Checking...');
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    // Check server health
    fetch('http://localhost:3003/api/health')
      .then(response => response.json())
      .then(data => {
        setServerStatus(`Server is online! Server time: ${data.time}`);
      })
      .catch(error => {
        setServerStatus(`Server error: ${error.message}`);
      });

    // Try to get agent suggestions
    fetch('http://localhost:3003/api/agent-suggestions')
      .then(response => response.json())
      .then(data => {
        setApiData(data);
      })
      .catch(error => {
        console.error('API error:', error);
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>ALAN IDE Test App</h1>
      
      <div style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        backgroundColor: '#f0f8ff', 
        border: '1px solid #b0c4de',
        borderRadius: '4px'
      }}>
        <h2>Server Status</h2>
        <p>{serverStatus}</p>
      </div>
      
      {apiData && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f0fff0', 
          border: '1px solid #98fb98',
          borderRadius: '4px'
        }}>
          <h2>Agent Suggestions</h2>
          <ul>
            {apiData.map(suggestion => (
              <li key={suggestion.id} style={{ marginBottom: '10px' }}>
                <div>
                  <strong>{suggestion.icon} {suggestion.label}</strong>
                </div>
                <div style={{ fontSize: '0.9em', color: '#555' }}>
                  {suggestion.explanation}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <p>
          This is a simplified test application to verify that the basic React setup
          is working correctly with the API server.
        </p>
      </div>
    </div>
  );
}

export default TestApp;
