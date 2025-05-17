import React from 'react';
import './AgentPanel.css';

/**
 * AgentConfigDock Component
 * 
 * Shows configuration options for agent autonomy levels.
 * Allows setting each agent to different modes of operation.
 */
const AgentConfigDock = ({ agentConfig, onConfigChange, activeTab }) => {
  // Define available modes for each agent type
  const agentModes = {
    refactor: [
      { value: 'passive', label: 'Passive', description: 'Suggest only when asked' },
      { value: 'active', label: 'Active', description: 'Proactively suggest refactors' },
      { value: 'autopilot', label: 'Autopilot', description: 'Auto-apply safe refactors' }
    ],
    debug: [
      { value: 'passive', label: 'Passive', description: 'Manual debug assistance' },
      { value: 'active', label: 'Active', description: 'Continuous monitoring' },
      { value: 'alert-only', label: 'Alert-only', description: 'Show only critical issues' }
    ],
    docs: [
      { value: 'passive', label: 'Passive', description: 'Generate docs on request' },
      { value: 'on-change', label: 'On-change', description: 'Update docs when code changes' }
    ],
    memory: [
      { value: 'passive', label: 'Passive', description: 'Search on request' },
      { value: 'active', label: 'Active', description: 'Proactively suggest analogies' }
    ],
    console: [
      { value: 'passive', label: 'Passive', description: 'Manual invocation' },
      { value: 'active', label: 'Active', description: 'Always listening' }
    ]
  };
  
  // Get agent icon
  const getAgentIcon = (agentType) => {
    const icons = {
      refactor: '🧠',
      debug: '🐞',
      docs: '📘',
      memory: '🧬',
      console: '💬'
    };
    return icons[agentType] || '🤖';
  };
  
  // Render the configuration options for a specific agent type
  const renderAgentConfig = (agentType) => {
    const modes = agentModes[agentType] || [];
    
    return (
      <div className="agent-config-row" key={agentType}>
        <div className="agent-config-label">
          <span>{getAgentIcon(agentType)}</span>
          <span>{agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent</span>
        </div>
        <div className="agent-config-options">
          {modes.map(mode => (
            <label key={mode.value} className="agent-config-option">
              <input
                type="radio"
                className="agent-config-radio"
                name={`${agentType}-mode`}
                value={mode.value}
                checked={agentConfig[agentType] === mode.value}
                onChange={() => onConfigChange(agentType, mode.value)}
              />
              <span>{mode.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="agent-config-dock">
      {/* Show configuration for active tab at the top */}
      {renderAgentConfig(activeTab)}
      
      {/* Optionally show configurations for other agents */}
      {false && Object.keys(agentConfig)
        .filter(type => type !== activeTab)
        .map(agentType => renderAgentConfig(agentType))}
    </div>
  );
};

export default AgentConfigDock;
