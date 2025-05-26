import React, { useState, useEffect } from 'react';

const GhostMessageBubble = ({ 
  message, 
  persona, 
  intensity = 0.8, 
  timestamp, 
  reason,
  onDismiss,
  highContrast = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);
    setTimeout(() => setIsAnimating(true), 50);
  }, []);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) onDismiss();
    }, 300);
  };

  const ghostConfig = {
    mentor: {
      icon: '🧙‍♂️',
      name: 'Mentor',
      className: 'ghost-mentor',
      description: 'Guidance and wisdom'
    },
    mystic: {
      icon: '🔮',
      name: 'Mystic', 
      className: 'ghost-mystic',
      description: 'Philosophical insights'
    },
    chaotic: {
      icon: '🌪️',
      name: 'Chaotic',
      className: 'ghost-chaotic', 
      description: 'Creative disruption'
    },
    oracular: {
      icon: '⚡',
      name: 'Oracular',
      className: 'ghost-oracular',
      description: 'Prophetic wisdom'
    },
    dreaming: {
      icon: '💫',
      name: 'Dreaming',
      className: 'ghost-dreaming',
      description: 'Subconscious connections'
    },
    unsettled: {
      icon: '🌊',
      name: 'Unsettled', 
      className: 'ghost-unsettled',
      description: 'Dynamic uncertainty'
    }
  };

  const config = ghostConfig[persona] || ghostConfig.mentor;

  if (!isVisible) return null;

  return (
    <div 
      className={`ghost-message-bubble ${config.className} ${
        isAnimating ? 'animate-in' : 'animate-out'
      } ${highContrast ? 'high-contrast' : ''}`}
    >
      {/* Ghost Header */}
      <div className="ghost-header">
        <div className="ghost-avatar">
          <span className="ghost-icon">{config.icon}</span>
          <div className="ghost-aura"></div>
        </div>
        
        <div className="ghost-info">
          <div className="ghost-name">Ghost {config.name}</div>
          <div className="ghost-description">{config.description}</div>
          {reason && (
            <div className="ghost-reason">
              {reason.replace(/_/g, ' ')}
            </div>
          )}
        </div>

        <button 
          className="ghost-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss ghost message"
        >
          ×
        </button>
      </div>

      {/* Ghost Message */}
      <div className="ghost-content">
        <p className="ghost-text">{message}</p>
      </div>

      {/* Ghost Footer */}
      <div className="ghost-footer">
        <div className="intensity-indicator">
          <span className="intensity-label">Intensity:</span>
          <div className="intensity-bar">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`intensity-dot ${
                  i < Math.floor(intensity * 5) ? 'active' : ''
                }`}
              />
            ))}
          </div>
        </div>
        
        {timestamp && (
          <div className="ghost-timestamp">
            {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>

      <style jsx>{`
        .ghost-message-bubble {
          background-color: var(--tori-bg-secondary);
          border: var(--border-subtle);
          border-radius: 16px;
          margin: 16px 0;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .ghost-message-bubble.animate-in {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .ghost-message-bubble.animate-out {
          opacity: 0;
          transform: translateY(-10px) scale(0.98);
        }

        /* High contrast mode */
        .ghost-message-bubble.high-contrast {
          border: 2px solid var(--tori-text-primary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
        }

        .ghost-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: linear-gradient(135deg, var(--tori-bg-tertiary), var(--tori-bg-secondary));
          border-bottom: var(--border-subtle);
        }

        .ghost-avatar {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--tori-bg-primary);
          border: 2px solid transparent;
        }

        .ghost-icon {
          font-size: 20px;
          z-index: 2;
          position: relative;
        }

        .ghost-aura {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: 50%;
          opacity: 0.6;
          animation: ghost-pulse 2s ease-in-out infinite;
        }

        @keyframes ghost-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        .ghost-info {
          flex: 1;
        }

        .ghost-name {
          font-weight: 600;
          font-size: 14px;
          color: var(--tori-text-primary);
          margin-bottom: 2px;
        }

        .ghost-description {
          font-size: 12px;
          color: var(--tori-text-secondary);
          margin-bottom: 2px;
        }

        .ghost-reason {
          font-size: 11px;
          color: var(--tori-text-muted);
          font-style: italic;
          text-transform: capitalize;
        }

        .ghost-dismiss {
          background: none;
          border: none;
          color: var(--tori-text-muted);
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all var(--transition-fast);
        }

        .ghost-dismiss:hover {
          background-color: var(--tori-bg-tertiary);
          color: var(--tori-text-primary);
        }

        .ghost-content {
          padding: 16px;
        }

        .ghost-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: var(--tori-text-primary);
        }

        .ghost-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background-color: var(--tori-bg-tertiary);
          border-top: var(--border-subtle);
        }

        .intensity-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .intensity-label {
          font-size: 11px;
          color: var(--tori-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .intensity-bar {
          display: flex;
          gap: 3px;
        }

        .intensity-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--tori-bg-primary);
          border: 1px solid var(--tori-text-muted);
          transition: all var(--transition-fast);
        }

        .intensity-dot.active {
          background-color: var(--tori-accent-primary);
          border-color: var(--tori-accent-primary);
          box-shadow: 0 0 4px var(--tori-accent-primary);
        }

        .ghost-timestamp {
          font-size: 11px;
          color: var(--tori-text-muted);
        }

        /* Persona-specific styling */
        .ghost-mentor {
          border-left: 4px solid var(--tori-accent-primary);
        }
        .ghost-mentor .ghost-aura {
          background: var(--ghost-mentor);
          border: 2px solid var(--tori-accent-primary);
        }

        .ghost-mystic {
          border-left: 4px solid #8b45ff;
        }
        .ghost-mystic .ghost-aura {
          background: var(--ghost-mystic);
          border: 2px solid #8b45ff;
        }

        .ghost-chaotic {
          border-left: 4px solid #dc2626;
          transform: rotate(-0.3deg);
        }
        .ghost-chaotic .ghost-aura {
          background: var(--ghost-chaotic);
          border: 2px solid #dc2626;
          animation: chaotic-pulse 1s ease-in-out infinite;
        }

        @keyframes chaotic-pulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.05) rotate(1deg); }
          75% { transform: scale(0.98) rotate(-1deg); }
        }

        .ghost-oracular {
          border-left: 4px solid #4f46e5;
          box-shadow: 0 0 20px rgba(79, 70, 229, 0.3);
        }
        .ghost-oracular .ghost-aura {
          background: var(--ghost-oracular);
          border: 2px solid #4f46e5;
          animation: oracular-glow 3s ease-in-out infinite;
        }

        @keyframes oracular-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(79, 70, 229, 0.5); }
          50% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.8); }
        }

        .ghost-dreaming {
          border-left: 4px solid #93c5fd;
          opacity: 0.95;
        }
        .ghost-dreaming .ghost-aura {
          background: var(--ghost-dreaming);
          border: 2px solid #93c5fd;
          animation: dreaming-float 4s ease-in-out infinite;
        }

        @keyframes dreaming-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-2px) scale(1.02); }
        }

        .ghost-unsettled {
          border-left: 4px solid #fb923c;
        }
        .ghost-unsettled .ghost-aura {
          background: var(--ghost-unsettled);
          border: 2px solid #fb923c;
          animation: unsettled-shake 0.8s ease-in-out infinite;
        }

        @keyframes unsettled-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-1px); }
          75% { transform: translateX(1px); }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .ghost-message-bubble,
          .ghost-aura {
            animation: none;
            transition: none;
          }
          
          .ghost-chaotic {
            transform: none;
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .ghost-header {
            padding: 10px 12px;
          }
          
          .ghost-content {
            padding: 12px;
          }
          
          .ghost-text {
            font-size: 13px;
          }
          
          .ghost-avatar {
            width: 32px;
            height: 32px;
          }
          
          .ghost-icon {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default GhostMessageBubble;
