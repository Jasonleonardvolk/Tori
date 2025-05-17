import React, { useState, useEffect } from 'react';
import { useSelection } from './SelectionContext';

/**
 * DebugAgentPanel Component
 * 
 * Displays debugging information and allows interaction with MCP agents.
 */
const DebugAgentPanel = ({ mcpClient, debugData = { anomalies: [], notifications: [] }, onRequestHelp, onFeedback }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { selectedItems = [] } = useSelection() || { selectedItems: [] };

  // Connect to MCP client on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await mcpClient?.checkConnection();
        setIsConnected(!!status);
      } catch (error) {
        console.error('Error connecting to MCP client:', error);
        setIsConnected(false);
      }
    };

    checkConnection();

    // Subscribe to MCP messages
    const unsubscribe = mcpClient?.subscribe(message => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      unsubscribe?.();
    };
  }, [mcpClient]);

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isConnected) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to MCP
    try {
      const selectedContext = selectedItems.map(item => ({
        id: item.id,
        type: item.type,
        content: item.content || item.label
      }));
      
      await mcpClient?.sendMessage(input, { selectedContext });
    } catch (error) {
      console.error('Error sending message to MCP:', error);
      // Add error message
      setMessages(prev => [
        ...prev, 
        {
          id: Date.now(),
          type: 'error',
          content: 'Failed to send message to agent',
          timestamp: new Date().toISOString()
        }
      ]);
    }
    
    // Clear input
    setInput('');
  };

  // Request help with selected items
  const requestHelp = () => {
    if (selectedItems.length > 0 && onRequestHelp) {
      onRequestHelp(selectedItems);
    }
  };

  return (
    <div className="debug-agent-panel">
      <div className="panel-header">
        <h3>🔍 Debug Agent</h3>
        <div className="connection-status">
          {isConnected ? (
            <span className="connected">● Connected</span>
          ) : (
            <span className="disconnected">● Disconnected</span>
          )}
        </div>
      </div>
      
      <div className="message-container">
        {/* Display anomalies at the top */}
        {debugData?.anomalies?.length > 0 && (
          <div className="anomalies-section">
            {debugData.anomalies.map((anomaly, index) => (
              <div key={anomaly.id || index} className={`anomaly ${anomaly.severity}`}>
                <div className="anomaly-type">{anomaly.type}:</div>
                <div className="anomaly-message">{anomaly.message}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Display notifications */}
        {debugData?.notifications?.length > 0 && (
          <div className="notifications-section">
            {debugData.notifications.map((notification, index) => (
              <div key={index} className="notification">
                {notification}
              </div>
            ))}
          </div>
        )}
        
        {/* Display regular messages */}
        {messages.length === 0 && debugData?.notifications?.length === 0 && debugData?.anomalies?.length === 0 ? (
          <div className="empty-state">
            No messages yet. Send a message to start debugging.
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.type}`}
            >
              {message.type === 'user' && <div className="avatar user">👤</div>}
              {message.type === 'agent' && <div className="avatar agent">🤖</div>}
              {message.type === 'system' && <div className="avatar system">🔧</div>}
              {message.type === 'error' && <div className="avatar error">⚠️</div>}
              
              <div className="message-content">
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>
      
      <form className="input-container" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your debug question..."
          disabled={!isConnected}
        />
        <button 
          type="submit" 
          disabled={!isConnected || !input.trim()}
        >
          Send
        </button>
      </form>
      
      <div className="debug-actions">
        <button onClick={requestHelp} disabled={selectedItems.length === 0}>
          Analyze Selected ({selectedItems.length})
        </button>
      </div>
    </div>
  );
};

export default DebugAgentPanel;
