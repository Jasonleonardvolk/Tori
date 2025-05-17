import React, { useState, useRef } from 'react';
import './AgentPanel.css';
import RefactorAgent from './RefactorAgent';
import DebugAgent from './DebugAgent';
import DocAgent from './DocAgent';
import MemoryAgent from './MemoryAgent';
import ConsoleAgent from './ConsoleAgent';
import AgentConfigDock from './AgentConfigDock';
import IntentVisualizer from '../IntentVisualizer';
import IntentHistory from '../IntentHistory';
import IntentAnomalyOverlay from '../IntentAnomalyOverlay';
import FrustrationIntervention from '../FrustrationIntervention';
import WebSocketStatus from '../WebSocketStatus';
import behavioralSignalEmitter from '../../services/behavioralSignalEmitter';
import intentDetectionService from '../../services/intentDetectionService';

/**
 * AgentPanel
 * 
 * Main container for all agent assistants. Provides tabbed interface to
 * access different agent types (refactor, debug, docs, memory, console).
 * 
 * @param {Object} props
 * @param {string} props.wsStatus - WebSocket connection status ('connecting', 'open', 'disconnected')
 * @param {Function} props.onSendMessage - Function to send messages through WebSocket
 */
const AgentPanel = ({ wsStatus = 'disconnected', onSendMessage }) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('refactor');
  // Track the most recent intentId (for visualization)
  const [currentIntentId, setCurrentIntentId] = useState(null);
  const lastIntentRef = useRef(null);

  // Notification count for each tab (would be connected to real agent service)
  const notifications = {
    refactor: 2,
    debug: 1,
    docs: 0,
    memory: 0,
    console: 0
  };
  
  // Tab definitions with icons and labels
  const tabs = [
    { id: 'refactor', label: 'Refactor', icon: '🧠' },
    { id: 'debug', label: 'Debug', icon: '🐞' },
    { id: 'docs', label: 'Docs', icon: '📘' },
    { id: 'memory', label: 'Memory', icon: '🧬' },
    { id: 'console', label: 'Console', icon: '💬' }
  ];
  
  // Configuration for each agent type
  const [agentConfig, setAgentConfig] = useState({
    refactor: 'passive', // passive, active, autopilot
    debug: 'active',     // passive, active, alert-only
    docs: 'passive',     // passive, on-change
    memory: 'passive',   // passive, active
    console: 'active'    // passive, active
  });
  
  // Handle agent config changes
  const handleConfigChange = (agentType, configValue) => {
    setAgentConfig(prev => ({
      ...prev,
      [agentType]: configValue
    }));
  };

  // Listen for new intent detections (for visualization)
  React.useEffect(() => {
    // Example: subscribe to some event bus or intent detection callback
    // Here we patch the intentDetectionService for demo
    const origDetectIntent = intentDetectionService.detectIntentOnCreation;
    intentDetectionService.detectIntentOnCreation = async function(payload) {
      const result = await origDetectIntent.call(this, payload);
      if (result && result.intentId && result.intentId !== lastIntentRef.current) {
        setCurrentIntentId(result.intentId);
        lastIntentRef.current = result.intentId;
      }
      return result;
    };
    return () => {
      intentDetectionService.detectIntentOnCreation = origDetectIntent;
    };
  }, []);

  // Render the active agent content
  const renderAgentContent = () => {
    switch (activeTab) {
      case 'refactor':
        return <RefactorAgent mode={agentConfig.refactor} />;
      case 'debug':
        return <DebugAgent mode={agentConfig.debug} />;
      case 'docs':
        return <DocAgent mode={agentConfig.docs} />;
      case 'memory':
        return <MemoryAgent mode={agentConfig.memory} />;
      case 'console':
        return <ConsoleAgent mode={agentConfig.console} />;
      default:
        return <div>Select an agent tab</div>;
    }
  };

  return (
    <div className="agent-panel-container">
      {/* Tab Header */}
      <div className="agent-panel-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`agent-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="agent-tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
            {notifications[tab.id] > 0 && (
              <span className="agent-tab-badge">{notifications[tab.id]}</span>
            )}
          </button>
        ))}
      </div>
      {/* Agent Content */}
      <div className="agent-panel-content">
        {renderAgentContent()}
      </div>
      {/* Agent Configuration Dock */}
      <AgentConfigDock 
        agentConfig={agentConfig}
        onConfigChange={handleConfigChange}
        activeTab={activeTab}
      />
      {/* Frustration-Aware Intervention */}
      <FrustrationIntervention />
      {/* Intent Anomaly Overlay */}
      <IntentAnomalyOverlay />
      {/* Intent Visualizer Overlay */}
      {currentIntentId && <IntentVisualizer intentId={currentIntentId} />}
      {/* Intent History Timeline */}
      <IntentHistory />
      
      {/* WebSocket Status Indicator */}
      <div className="agent-panel-footer">
        <WebSocketStatus 
          status={wsStatus} 
          onReconnect={() => onSendMessage({ type: 'reconnect' })}
        />
      </div>
    </div>
  );
};

export default AgentPanel;
