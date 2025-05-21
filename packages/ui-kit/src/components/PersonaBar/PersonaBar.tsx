import React from 'react';
import './PersonaBar.css';

/**
 * Base Persona interface (copied from data-model for local use)
 */
export interface Persona {
  /** Unique identifier for the persona */
  id: string;
  /** Display name of the persona */
  name: string;
  /** Emoji icon representing the persona */
  icon: string;
  /** Theme color for the persona (CSS variable or hex) */
  color: string;
  /** Optional MBTI personality type */
  mbti?: string;
  /** Optional description of the persona's role/capabilities */
  description?: string;
  /** Optional array of tags/categories this persona belongs to */
  tags?: string[];
  /** Optional persona-specific settings */
  settings?: Record<string, any>;
}

// Import the default personas from the central location

export interface PersonaBarProps {
  /** List of available personas */
  personas: Persona[];
  /** Currently active persona ID */
  active?: string;
  /** Function to set the active persona */
  setActive: (id: string) => void;
  /** Map of unseen message counts by persona ID */
  unseen: Record<string, number>;
  /** Additional CSS class name */
  className?: string;
}

/**
 * PersonaBar component for switching between different assistant personas
 */
export const PersonaBar: React.FC<PersonaBarProps> = ({
  personas,
  active,
  setActive,
  unseen,
  className = '',
}) => {
  return (
    <div className={`itori-persona-bar glass flex gap-2 px-4 py-2 rounded-b-xl2 backdrop-blur-xs ${className}`}>
      {personas.map(p => (
        <button
          key={p.id}
          onClick={() => setActive(p.id)}
          className={`relative flex items-center gap-1 text-sm transition ${active===p.id?'scale-105':''}`}
          style={{ color: p.color }}
        >
          <span>{p.icon}</span>{p.name}
          {unseen[p.id] > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-warning text-[10px] flex items-center justify-center">
              {unseen[p.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default PersonaBar;
