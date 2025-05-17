/**
 * Mocked PersonaContext for tests
 */
 
import React, { createContext, useContext } from 'react';

// Define mock personas for tests
export const PERSONAS = {
  POWER_CODER: {
    id: 'power-coder',
    name: 'Power Coder',
    description: 'Traditional IDE experience focused on efficiency',
    icon: 'code',
  },
  CONCEPT_ARCHITECT: {
    id: 'concept-architect',
    name: 'Concept Architect',
    description: 'Systems-thinking view focused on concept relationships',
    icon: 'architecture',
  },
  DESIGN_MAKER: {
    id: 'design-maker',
    name: 'Design-First Maker',
    description: 'UI/UX focused experience with visual tools',
    icon: 'design',
  },
  OPS_ENGINEER: {
    id: 'ops-engineer',
    name: 'Ops/DevTools Engineer',
    description: 'Security and pipeline focused with monitoring',
    icon: 'security',
  },
};

// Create the context
const PersonaContext = createContext();

// Create the provider component with simplified functionality
export const PersonaProvider = ({ children }) => {
  // Simple mock implementation that doesn't rely on state
  const contextValue = {
    currentPersona: PERSONAS.POWER_CODER,
    switchPersona: jest.fn(),
    handlePanicSwitch: jest.fn(),
    layout: {},
    visiblePanels: ['editor', 'terminal'],
    isPanelVisible: jest.fn(() => true),
    getFeature: jest.fn(() => true),
    allPersonas: PERSONAS
  };
  
  return (
    <PersonaContext.Provider value={contextValue}>
      {children}
    </PersonaContext.Provider>
  );
};

// Custom hook to use the persona context
export const usePersona = () => {
  return useContext(PersonaContext);
};

export default PersonaContext;
