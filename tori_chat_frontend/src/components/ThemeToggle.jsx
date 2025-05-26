import React, { useState, useEffect } from 'react';

const ThemeToggle = () => {
  const [theme, setTheme] = useState('light');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('tori-theme') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Apply theme to document
  const applyTheme = (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('tori-theme', newTheme);
  };

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${theme}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title={`Current: ${theme} theme`}
    >
      <div className="toggle-container">
        <div className="toggle-track">
          <div className="toggle-thumb">
            <span className="toggle-icon">
              {theme === 'light' ? '☀️' : '🌙'}
            </span>
          </div>
        </div>
        <span className="toggle-label">
          {theme === 'light' ? 'Light' : 'Dark'}
        </span>
      </div>

      <style jsx>{`
        .theme-toggle {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--tori-bg-secondary);
          border: var(--border-subtle);
          color: var(--tori-text-primary);
        }

        .theme-toggle:hover {
          background-color: var(--tori-bg-tertiary);
          box-shadow: var(--shadow-sm);
        }

        .toggle-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toggle-track {
          width: 48px;
          height: 24px;
          background-color: var(--tori-bg-tertiary);
          border-radius: 12px;
          position: relative;
          transition: background-color 0.3s ease;
          border: var(--border-subtle);
        }

        .theme-toggle.dark .toggle-track {
          background-color: var(--tori-accent-primary);
        }

        .toggle-thumb {
          width: 20px;
          height: 20px;
          background-color: var(--tori-bg-secondary);
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
        }

        .theme-toggle.dark .toggle-thumb {
          transform: translateX(24px);
          background-color: var(--tori-bg-primary);
        }

        .toggle-icon {
          font-size: 12px;
          line-height: 1;
        }

        .toggle-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--tori-text-secondary);
          min-width: 40px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .toggle-label {
            display: none;
          }
          
          .theme-toggle {
            padding: 6px;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .theme-toggle {
            border: 2px solid var(--tori-text-primary);
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .toggle-track,
          .toggle-thumb,
          .theme-toggle {
            transition: none;
          }
        }
      `}</style>
    </button>
  );
};

export default ThemeToggle;
