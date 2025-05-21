/**
 * Tests for PersonaContext
 * 
 * Tests the functionality of the PersonaContext provider and usePersona hook.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersonaProvider, usePersona } from '../../../components/PersonaSelector/PersonaContext';

// Test component that uses the persona context
const TestComponent = () => {
  const { 
    currentPersona, 
    switchPersona, 
    handlePanicSwitch,
    isPanelVisible,
    getFeature 
  } = usePersona();
  
  return (
    <div>
      <div data-testid="current-persona">{currentPersona.name}</div>
      <div data-testid="panel-editor-visible">{isPanelVisible('editor').toString()}</div>
      <div data-testid="feature-showCodeEditor">{getFeature('showCodeEditor').toString()}</div>
      <button 
        data-testid="switch-to-concept"
        onClick={() => switchPersona('concept-architect')}
      >
        Switch to Concept Architect
      </button>
      <button 
        data-testid="panic-switch"
        onClick={handlePanicSwitch}
      >
        Panic Switch
      </button>
    </div>
  );
};

describe('PersonaContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Setup localStorage mock
    jest.spyOn(window.localStorage.__proto__, 'setItem');
    jest.spyOn(window.localStorage.__proto__, 'getItem');
    
    // Mock window.dispatchEvent
    window.dispatchEvent = jest.fn();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('defaults to Power Coder persona when no saved preference exists', () => {
    render(
      <PersonaProvider>
        <TestComponent />
      </PersonaProvider>
    );
    
    expect(screen.getByTestId('current-persona')).toHaveTextContent('Power Coder');
    expect(localStorage.getItem).toHaveBeenCalledWith('alanide_persona');
  });
  
  test('switches persona correctly when switchPersona is called', () => {
    render(
      <PersonaProvider>
        <TestComponent />
      </PersonaProvider>
    );
    
    // Initial state
    expect(screen.getByTestId('current-persona')).toHaveTextContent('Power Coder');
    
    // Switch persona
    fireEvent.click(screen.getByTestId('switch-to-concept'));
    
    // Verify persona changed
    expect(screen.getByTestId('current-persona')).toHaveTextContent('Concept Architect');
    expect(localStorage.setItem).toHaveBeenCalledWith('alanide_persona', 'concept-architect');
    expect(window.dispatchEvent).toHaveBeenCalled();
  });
  
  test('panic switch returns to Power Coder persona', () => {
    render(
      <PersonaProvider>
        <TestComponent />
      </PersonaProvider>
    );
    
    // Switch to a different persona first
    fireEvent.click(screen.getByTestId('switch-to-concept'));
    expect(screen.getByTestId('current-persona')).toHaveTextContent('Concept Architect');
    
    // Trigger panic switch
    fireEvent.click(screen.getByTestId('panic-switch'));
    
    // Verify we're back to Power Coder
    expect(screen.getByTestId('current-persona')).toHaveTextContent('Power Coder');
  });
  
  test('Alt+P keyboard shortcut triggers panic switch', () => {
    render(
      <PersonaProvider>
        <TestComponent />
      </PersonaProvider>
    );
    
    // Switch to a different persona first
    fireEvent.click(screen.getByTestId('switch-to-concept'));
    expect(screen.getByTestId('current-persona')).toHaveTextContent('Concept Architect');
    
    // Simulate Alt+P keyboard shortcut
    fireEvent.keyDown(window, { key: 'p', altKey: true });
    
    // Verify we're back to Power Coder
    expect(screen.getByTestId('current-persona')).toHaveTextContent('Power Coder');
  });
  
  test('loads saved persona from localStorage on initial render', () => {
    // Mock localStorage to return a saved persona
    localStorage.getItem.mockReturnValue('design-maker');
    
    render(
      <PersonaProvider>
        <TestComponent />
      </PersonaProvider>
    );
    
    expect(screen.getByTestId('current-persona')).toHaveTextContent('Design-First Maker');
    expect(localStorage.getItem).toHaveBeenCalledWith('alanide_persona');
  });
  
  test('isPanelVisible returns correct value based on current persona', () => {
    render(
      <PersonaProvider>
        <TestComponent />
      </PersonaProvider>
    );
    
    // Power Coder has editor panel
    expect(screen.getByTestId('panel-editor-visible')).toHaveTextContent('true');
    
    // Switch persona to one that also has editor panel
    fireEvent.click(screen.getByTestId('switch-to-concept'));
    expect(screen.getByTestId('panel-editor-visible')).toHaveTextContent('true');
  });
  
  test('getFeature returns correct value based on current persona', () => {
    render(
      <PersonaProvider>
        <TestComponent />
      </PersonaProvider>
    );
    
    // Power Coder has showCodeEditor feature enabled
    expect(screen.getByTestId('feature-showCodeEditor')).toHaveTextContent('true');
    
    // Switch persona to one that also has showCodeEditor feature enabled
    fireEvent.click(screen.getByTestId('switch-to-concept'));
    expect(screen.getByTestId('feature-showCodeEditor')).toHaveTextContent('true');
  });
});
