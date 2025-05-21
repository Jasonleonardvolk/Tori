/**
 * Persona Selector Component
 * 
 * Allows users to switch between different personas in the ALAN IDE.
 * Part of Sprint 2 - Phase 3 ALAN IDE implementation.
 */

import React, { useState } from 'react';
import { usePersona } from './PersonaContext';
import './PersonaSelector.css';

// Icons mapping for personas
const PERSONA_ICONS = {
  'power-coder': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5zM21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-2 0H5V5h14v14z"/>
    </svg>
  ),
  'concept-architect': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M15 13.5V8h-2v5.5l-1.5-1.5L10 13.5 12 15.5l2 2 2-2 2-2-1.5-1.5L15 13.5zM12 3C6.5 3 2 7.5 2 13c0 5.5 4.5 10 10 10s10-4.5 10-10c0-5.5-4.5-10-10-10zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
    </svg>
  ),
  'design-maker': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
      <path d="M6 10h12v2H6z"/>
      <path d="M6 14h8v2H6z"/>
    </svg>
  ),
  'ops-engineer': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M12 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6-1.8C18 6.57 15.35 4 12 4s-6 2.57-6 6.2c0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.8 6-9.14zM12 2c4.2 0 8 3.22 8 8.2 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 5.22 7.8 2 12 2z"/>
    </svg>
  ),
};

const PersonaSelector = ({ className = '', position = 'top-right' }) => {
  const { currentPersona, switchPersona, allPersonas } = usePersona();
  const [isOpen, setIsOpen] = useState(false);

  // Convert from object to array for mapping
  const personaArray = Object.values(allPersonas);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handlePersonaClick = (personaId) => {
    switchPersona(personaId);
    setIsOpen(false);
  };

  return (
    <div 
      className={`persona-selector ${position} ${className} ${isOpen ? 'open' : ''}`} 
      data-testid="persona-selector-container"
    >
      <button 
        className="persona-current-btn" 
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select persona"
      >
        <div className="persona-icon">
          {PERSONA_ICONS[currentPersona.id] || (
            <span className="fallback-icon">
              {currentPersona.name.charAt(0)}
            </span>
          )}
        </div>
        <span className="persona-name">{currentPersona.name}</span>
      </button>
      
      {isOpen && (
        <div 
          className="persona-menu"
          role="menu"
          aria-orientation="vertical"
        >
          {personaArray.map(persona => (
            <button
              key={persona.id}
              className={`persona-option ${persona.id === currentPersona.id ? 'active' : ''}`}
              onClick={() => handlePersonaClick(persona.id)}
              role="menuitem"
              aria-label={`Switch to ${persona.name} persona`}
            >
              <div className="persona-icon">
                {PERSONA_ICONS[persona.id] || (
                  <span className="fallback-icon">
                    {persona.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="persona-details">
                <div className="persona-name">{persona.name}</div>
                <div className="persona-description">{persona.description}</div>
              </div>
            </button>
          ))}
          
          <div className="persona-footer">
            <div className="persona-shortcut-hint">
              Press <kbd>Alt</kbd>+<kbd>P</kbd> for panic switch
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaSelector;
