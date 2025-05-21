/**
 * Persona Context
 * 
 * Provides context for the current persona and methods to switch between personas.
 * Part of Sprint 2 - Phase 3 ALAN IDE implementation.
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Define the available personas
export const PERSONAS = {
  POWER_CODER: {
    id: 'power-coder',
    name: 'Power Coder',
    description: 'Traditional IDE experience focused on efficiency and keyboard shortcuts',
    icon: 'code',
    panels: ['editor', 'terminal', 'output', 'debug'],
    features: {
      showCodeEditor: true,
      showConceptGraph: false,
      terminalProminent: true,
      keyboardFocused: true,
      showSuggestions: true,
      autoCompletion: true,
    }
  },
  CONCEPT_ARCHITECT: {
    id: 'concept-architect',
    name: 'Concept Architect',
    description: 'Systems-thinking view focused on concept relationships and architecture',
    icon: 'architecture',
    panels: ['concept-field', 'editor', 'ripple-preview'],
    features: {
      showCodeEditor: true,
      showConceptGraph: true,
      conceptGraphProminent: true,
      showKoopmanOverlay: true,
      showPhaseColors: true,
      showRippleEffects: true,
    }
  },
  DESIGN_MAKER: {
    id: 'design-maker',
    name: 'Design-First Maker',
    description: 'UI/UX focused experience with visual tools and previews',
    icon: 'design',
    panels: ['editor', 'preview', 'component-library', 'design-tools'],
    features: {
      showCodeEditor: true,
      splitView: true,
      previewProminent: true,
      showComponentLibrary: true,
      livePreview: true,
      showDesignTools: true,
    }
  },
  OPS_ENGINEER: {
    id: 'ops-engineer',
    name: 'Ops/DevTools Engineer',
    description: 'Security and pipeline focused with monitoring and analytics',
    icon: 'security',
    panels: ['editor', 'security-analysis', 'dependency-graph', 'vault-manager'],
    features: {
      showCodeEditor: true,
      showSecurityTools: true,
      showDependencyGraph: true,
      showVaultManager: true,
      showPipelineStatus: true,
      showMonitoring: true,
    }
  },
};

// Create the context
const PersonaContext = createContext();

// Create the provider component
export const PersonaProvider = ({ children }) => {
  // State for the current persona
  const [currentPersona, setCurrentPersona] = useState(PERSONAS.POWER_CODER);
  
  // State for panel layout
  const [layout, setLayout] = useState({});
  
  // State for panel visibility
  const [visiblePanels, setVisiblePanels] = useState([]);
  
  // Function to switch personas
  const switchPersona = useCallback((personaId) => {
    const newPersona = Object.values(PERSONAS).find(p => p.id === personaId);
    
    if (newPersona) {
      setCurrentPersona(newPersona);
      
      // Update visible panels based on persona
      setVisiblePanels(newPersona.panels || []);
      
      // Generate layout based on persona
      const newLayout = generateLayoutForPersona(newPersona);
      setLayout(newLayout);
      
      // Store the selected persona in local storage
      localStorage.setItem('alanide_persona', personaId);
      
      console.log(`Switched to ${newPersona.name} persona`);
      
      // Trigger custom event for persona change
      window.dispatchEvent(new CustomEvent('persona-changed', { 
        detail: { persona: newPersona } 
      }));
      
      return true;
    }
    
    console.error(`Invalid persona: ${personaId}`);
    return false;
  }, []);
  
  // Function to handle panic switch (Alt+P)
  const handlePanicSwitch = useCallback(() => {
    // Always switch back to Power Coder mode
    switchPersona(PERSONAS.POWER_CODER.id);
  }, [switchPersona]);
  
  // Setup keyboard shortcut for panic switch
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+P for panic switch
      if (e.altKey && e.key === 'p') {
        handlePanicSwitch();
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePanicSwitch]);
  
  // Load saved persona from local storage on initial render
  useEffect(() => {
    const savedPersona = localStorage.getItem('alanide_persona');
    if (savedPersona) {
      switchPersona(savedPersona);
    } else {
      // Initialize layout for default persona
      const initialLayout = generateLayoutForPersona(currentPersona);
      setLayout(initialLayout);
      setVisiblePanels(currentPersona.panels || []);
    }
  }, [currentPersona, switchPersona]);
  
  // Helper to generate layout for a persona
  const generateLayoutForPersona = (persona) => {
    // This is a simplified implementation
    // In a real implementation, this would generate a more sophisticated layout
    // based on the persona's preferences and panels
    
    switch (persona.id) {
      case 'power-coder':
        return {
          direction: 'column',
          first: {
            direction: 'row',
            first: { type: 'panel', component: 'editor', size: 70 },
            second: { type: 'panel', component: 'terminal', size: 30 }
          },
          second: { type: 'panel', component: 'output', size: 20 }
        };
        
      case 'concept-architect':
        return {
          direction: 'row',
          first: { type: 'panel', component: 'concept-field', size: 60 },
          second: {
            direction: 'column',
            first: { type: 'panel', component: 'editor', size: 70 },
            second: { type: 'panel', component: 'ripple-preview', size: 30 }
          }
        };
        
      case 'design-maker':
        return {
          direction: 'row',
          first: { type: 'panel', component: 'editor', size: 40 },
          second: {
            direction: 'column',
            first: { type: 'panel', component: 'preview', size: 60 },
            second: {
              direction: 'row',
              first: { type: 'panel', component: 'component-library', size: 50 },
              second: { type: 'panel', component: 'design-tools', size: 50 }
            }
          }
        };
        
      case 'ops-engineer':
        return {
          direction: 'column',
          first: {
            direction: 'row',
            first: { type: 'panel', component: 'editor', size: 60 },
            second: { type: 'panel', component: 'security-analysis', size: 40 }
          },
          second: {
            direction: 'row',
            first: { type: 'panel', component: 'dependency-graph', size: 50 },
            second: { type: 'panel', component: 'vault-manager', size: 50 }
          }
        };
        
      default:
        return {
          direction: 'column',
          first: { type: 'panel', component: 'editor', size: 70 },
          second: { type: 'panel', component: 'terminal', size: 30 }
        };
    }
  };
  
  // Check if a panel should be visible
  const isPanelVisible = (panelId) => {
    return visiblePanels.includes(panelId);
  };
  
  // Get feature settings for current persona
  const getFeature = (featureId) => {
    return currentPersona.features?.[featureId] || false;
  };
  
  const contextValue = {
    currentPersona,
    switchPersona,
    handlePanicSwitch,
    layout,
    visiblePanels,
    isPanelVisible,
    getFeature,
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
  const context = useContext(PersonaContext);
  
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  
  return context;
};

export default PersonaContext;
