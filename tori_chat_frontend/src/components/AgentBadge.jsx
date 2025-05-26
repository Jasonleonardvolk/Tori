import React from 'react';

const AgentBadge = ({ agent, suggestion, compact = false }) => {
  const agentConfig = {
    refactorer: {
      icon: '🛠️',
      label: 'Refactor Tip',
      className: 'refactorer',
      color: '#3b82f6',
      description: 'Code improvement suggestion'
    },
    debugger: {
      icon: '🐛',
      label: 'Debug Alert',
      className: 'debugger', 
      color: '#ef4444',
      description: 'Error detection and fix'
    },
    scholar: {
      icon: '📖',
      label: 'Learn More',
      className: 'scholar',
      color: '#10b981',
      description: 'Documentation and learning'
    }
  };

  const config = agentConfig[agent] || agentConfig.refactorer;

  if (compact) {
    return (
      <span 
        className={`agent-badge-compact ${config.className}`}
        title={`${config.label}: ${config.description}`}
      >
        <span className="badge-icon">{config.icon}</span>
        
        <style jsx>{`
          .agent-badge-compact {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            border-radius: 4px;
            background-color: ${config.color};
            color: white;
            font-size: 12px;
            margin-right: 6px;
            flex-shrink: 0;
          }
          
          .badge-icon {
            line-height: 1;
          }
        `}</style>
      </span>
    );
  }

  return (
    <div className={`agent-badge ${config.className}`}>
      <div className="badge-header">
        <span className="badge-icon">{config.icon}</span>
        <span className="badge-label">{config.label}</span>
      </div>
      
      {suggestion && (
        <div className="badge-content">
          <p className="suggestion-text">{suggestion}</p>
        </div>
      )}

      <style jsx>{`
        .agent-badge {
          display: flex;
          flex-direction: column;
          background-color: var(--tori-bg-secondary);
          border: var(--border-subtle);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 12px;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-fast);
        }

        .agent-badge:hover {
          box-shadow: var(--shadow-md);
        }

        .badge-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background-color: ${config.color};
          color: white;
          font-weight: 600;
          font-size: 12px;
        }

        .badge-icon {
          font-size: 14px;
          line-height: 1;
        }

        .badge-label {
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge-content {
          padding: 12px;
        }

        .suggestion-text {
          margin: 0;
          font-size: 13px;
          line-height: 1.4;
          color: var(--tori-text-primary);
        }

        /* Agent-specific styling */
        .agent-badge.refactorer .badge-header {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }

        .agent-badge.debugger .badge-header {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .agent-badge.scholar .badge-header {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        /* Left border accent */
        .agent-badge.refactorer {
          border-left: 4px solid #3b82f6;
        }

        .agent-badge.debugger {
          border-left: 4px solid #ef4444;
        }

        .agent-badge.scholar {
          border-left: 4px solid #10b981;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .badge-content {
            padding: 8px;
          }
          
          .suggestion-text {
            font-size: 12px;
          }
        }

        /* Dark theme adjustments */
        [data-theme="dark"] .badge-header {
          color: #ffffff;
        }
        
        [data-theme="dark"] .agent-badge {
          background-color: var(--tori-bg-secondary);
          border-color: var(--border-subtle);
        }
      `}</style>
    </div>
  );
};

// Helper component for inline agent mentions in chat
export const InlineAgentMention = ({ agent, children }) => {
  const agentConfig = {
    refactorer: { icon: '🛠️', color: '#3b82f6' },
    debugger: { icon: '🐛', color: '#ef4444' },
    scholar: { icon: '📖', color: '#10b981' }
  };

  const config = agentConfig[agent] || agentConfig.refactorer;

  return (
    <span className="inline-agent-mention">
      <span className="mention-icon">{config.icon}</span>
      <span className="mention-text">{children}</span>

      <style jsx>{`
        .inline-agent-mention {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          background-color: ${config.color}15;
          border: 1px solid ${config.color}30;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          color: ${config.color};
          margin: 0 2px;
        }

        .mention-icon {
          font-size: 12px;
          line-height: 1;
        }

        .mention-text {
          line-height: 1;
        }

        /* Dark theme */
        [data-theme="dark"] .inline-agent-mention {
          background-color: ${config.color}25;
          border-color: ${config.color}40;
          color: ${config.color};
        }
      `}</style>
    </span>
  );
};

export default AgentBadge;
