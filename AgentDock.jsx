// ALAN IDE – AgentDock (Epic 3, Stories 3.1–3.4)
// Author: Cascade (2025-05-07)
// Features: tabbed agent interface, notifications, SelectionContext sync

import React, { useState } from 'react';
import RefactorAgentPanel from './RefactorAgentPanel';
import DebugAgentPanel from './DebugAgentPanel';
import DocAgentPanel from './DocAgentPanel';

const AGENT_TABS = [
  { key: 'refactor', label: 'Refactor', icon: '🧩', component: RefactorAgentPanel },
  { key: 'debug', label: 'Debug', icon: '🛠️', component: DebugAgentPanel },
  { key: 'doc', label: 'Doc', icon: '📄', component: DocAgentPanel },
];

export default function AgentDock({ notifications = [] }) {
  const [activeTab, setActiveTab] = useState('refactor');
  const ActivePanel = AGENT_TABS.find(t => t.key === activeTab).component;
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 340,
      minHeight: 220,
      background: 'var(--color-surface, #23272F)',
      borderTopLeftRadius: 10,
      boxShadow: '0 0 20px #0008',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Tab Bar */}
      <div style={{display: 'flex', alignItems: 'center', borderBottom: '1px solid #333'}}>
        {AGENT_TABS.map(tab => (
          <button
            key={tab.key}
            style={{
              flex: 1,
              background: activeTab === tab.key ? '#00FFCC' : 'transparent',
              color: activeTab === tab.key ? '#23272F' : '#A9B1BD',
              border: 'none',
              padding: '10px 0',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              borderTopLeftRadius: tab.key === 'refactor' ? 10 : 0,
              borderTopRightRadius: tab.key === 'doc' ? 10 : 0,
              transition: 'background 0.2s, color 0.2s',
            }}
            onClick={() => setActiveTab(tab.key)}
          >{tab.icon} {tab.label}</button>
        ))}
      </div>
      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{background: '#FFD700', color: '#23272F', padding: 6, fontWeight: 600, fontSize: 14}}>
          {notifications.map((n, i) => <div key={i}>⚡ {n}</div>)}
        </div>
      )}
      {/* Active Agent Panel */}
      <div style={{flex: 1, overflowY: 'auto'}}>
        <ActivePanel />
      </div>
    </div>
  );
}
