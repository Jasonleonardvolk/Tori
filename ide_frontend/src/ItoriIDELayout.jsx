import React, { useState, useCallback, useEffect } from 'react';
import ConceptFieldCanvas from './components/ConceptFieldCanvas';
import AgentPanel from './components/AgentPanel';
import FieldMeditationMode from './components/FieldMeditationMode';
import WebSocketStatus from './components/WebSocketStatus';
import useAlanSocket from './hooks/useAlanSocket';
import './theme.css';

/**
 * ItoriIDELayout
 * 
 * Main layout component combining the Concept Field Canvas and Agent Panel.
 * Implements the ITORI IDE UI/UX wireframes.
 */
const ItoriIDELayout = () => {
  // State for selected nodes
  const [selectedNodes, setSelectedNodes] = useState([]);
  // State for active mode
  const [activeMode, setActiveMode] = useState('normal'); // 'normal', 'meditation'
  // State for WebSocket messages
  const [wsMessages, setWsMessages] = useState([]);
  
  // Handle WebSocket messages
  const handleWsMessage = useCallback((message) => {
    console.log('Received WS message:', message);
    setWsMessages(prev => [...prev, message]);
    
    // Handle different message types here
    if (message.type === 'concept_update') {
      // Update concept field or other UI components
    } else if (message.type === 'ping_response') {
      console.log('Ping response received:', message);
    }
  }, []);
  
  // Initialize WebSocket connection
  const { status: wsStatus, send: wsSend, reconnect: wsReconnect } = useAlanSocket(handleWsMessage);
  
  // Track message count for display
  const [messageCount, setMessageCount] = useState(0);
  
  // Update message count when messages change
  useEffect(() => {
    setMessageCount(wsMessages.length);
  }, [wsMessages]);
  
  // Handle node selection from canvas
  const handleNodeSelect = (nodeIds) => {
    console.log('Selected nodes:', nodeIds);
    setSelectedNodes(nodeIds);
  };
  
  // Toggle meditation mode
  const toggleMeditationMode = () => {
    setActiveMode(activeMode === 'normal' ? 'meditation' : 'normal');
  };
  
  // Render based on active mode
  if (activeMode === 'meditation') {
    return <FieldMeditationMode onClose={toggleMeditationMode} />;
  }
  
  return (
    <div className="itori-ide-layout">
      {/* Header with mode controls */}
      <div className="itori-ide-header">
        <div className="itori-ide-logo">
          <span className="logo-text">ITORI IDE</span>
          <span className="logo-version">Alpha 0.3</span>
          <div className="ws-header-status">
            <WebSocketStatus 
              status={wsStatus} 
              onReconnect={wsReconnect} 
            />
            {messageCount > 0 && (
              <span className="ws-message-count">{messageCount}</span>
            )}
          </div>
        </div>
        
        <div className="mode-controls">
          <div className="mode-button" onClick={toggleMeditationMode}>
            <span>🧘</span>
            <span>Field Meditation</span>
          </div>
          <div 
            className="mode-button" 
            onClick={() => wsSend({ type: 'ping', timestamp: Date.now() })}
          >
            <span>📡</span>
            <span>Ping Server</span>
          </div>
        </div>
      </div>
      
      {/* Main content container */}
      <div className="itori-ide-container">
        {/* Left side - Concept Field Canvas */}
        <div className="itori-ide-canvas-container">
          <ConceptFieldCanvas 
            onNodeSelect={handleNodeSelect}
            selectedNodes={selectedNodes}
          />
        </div>
        
        {/* Right side - Agent Panel */}
        <div className="itori-ide-panel-container">
          <AgentPanel wsStatus={wsStatus} onSendMessage={wsSend} />
        </div>
      </div>
      
      {/* Styles for the layout */}
      <style jsx>{`
        .itori-ide-layout {
          width: 100%;
          height: 100vh;
          background-color: var(--color-bg);
          color: var(--color-text-primary);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .itori-ide-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-sm) var(--space-md);
          background-color: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .itori-ide-logo {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }
        
        .logo-text {
          font-weight: bold;
          letter-spacing: 1px;
        }
        
        .logo-version {
          font-size: var(--font-size-xs);
          opacity: 0.7;
          background-color: rgba(255, 255, 255, 0.1);
          padding: 1px 6px;
          border-radius: var(--radius-sm);
        }
        
        .mode-controls {
          display: flex;
          gap: var(--space-md);
        }
        
        .mode-button {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-xs) var(--space-sm);
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast) var(--easing-standard);
        }
        
        .mode-button:hover {
          background-color: var(--color-primary);
          color: var(--color-bg-dark);
        }
        
        .itori-ide-container {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        
        .itori-ide-canvas-container {
          flex: 2;
          min-width: 0;
          padding: var(--space-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .itori-ide-panel-container {
          flex: 1;
          max-width: 400px;
          min-width: 320px;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .ws-header-status {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          margin-left: var(--space-xs);
        }
        
        .ws-message-count {
          background-color: var(--color-primary);
          color: var(--color-bg-dark);
          font-size: 10px;
          min-width: 16px;
          height: 16px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default ItoriIDELayout;
