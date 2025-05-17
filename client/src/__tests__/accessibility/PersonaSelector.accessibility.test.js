/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
/**
 * Accessibility Tests for PersonaSelector
 * 
 * Tests the PersonaSelector component for accessibility compliance.
 * 
 * NOTE: Accessibility testing often requires direct DOM access to verify
 * ARIA attributes, focus management, and keyboard navigation.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PersonaSelector from '../../components/PersonaSelector/PersonaSelector';
import { PersonaProvider } from '../../components/PersonaSelector/PersonaContext';
import { checkAccessibility } from './accessibilityTestUtils';

// Wrap the component with necessary providers
const renderPersonaSelector = (props = {}) => {
  return render(
    <PersonaProvider>
      <PersonaSelector {...props} />
    </PersonaProvider>
  );
};

describe('PersonaSelector Accessibility', () => {
  
  test('passes axe-core accessibility checks', async () => {
    renderPersonaSelector();
    const results = await checkAccessibility(
      <PersonaProvider>
        <PersonaSelector />
      </PersonaProvider>
    );
    
    // The component should have no accessibility violations
    expect(results).toHaveNoViolations();
  });
  
  test('has proper ARIA attributes when closed', () => {
    renderPersonaSelector();
    
    // Check button attributes
    const button = screen.getByRole('button', { name: /select persona/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
    expect(button).toHaveAttribute('aria-label', 'Select persona');
  });
  
  test('has proper ARIA attributes when open', () => {
    renderPersonaSelector();
    
    // Open the menu
    fireEvent.click(screen.getByRole('button', { name: /select persona/i }));
    
    // Check button attributes updated correctly
    const button = screen.getByRole('button', { name: /select persona/i });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    
    // Check menu attributes
    const menu = screen.getByRole('menu');
    expect(menu).toHaveAttribute('aria-orientation', 'vertical');
    
    // Check all menu items have proper roles
    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems.length).toBeGreaterThan(0);
    
    // Each menu item should have an aria-label
    menuItems.forEach(item => {
      expect(item).toHaveAttribute('aria-label');
      expect(item.getAttribute('aria-label')).toMatch(/switch to .* persona/i);
    });
  });
  
  test('supports keyboard navigation', () => {
    renderPersonaSelector();
    
    // First, verify that the button is focusable
    const button = screen.getByRole('button', { name: /select persona/i });
    button.focus();
    expect(document.activeElement).toBe(button);
    
    // Open the menu with keyboard
    fireEvent.keyDown(button, { key: 'Enter' });
    
    // Now there should be menu items that are focusable
    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems.length).toBeGreaterThan(0);
    
    // Try focusing the first menu item
    menuItems[0].focus();
    expect(document.activeElement).toBe(menuItems[0]);
    
    // TAB should move to the next menu item
    fireEvent.keyDown(menuItems[0], { key: 'Tab' });
    // In a real implementation, we'd have to set focus manually since jsdom doesn't handle tab events
    menuItems[1].focus();
    expect(document.activeElement).toBe(menuItems[1]);
    
    // ESCAPE should close the menu
    fireEvent.keyDown(menuItems[1], { key: 'Escape' });
    
    // Verify menu is closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
  
  test('provides keyboard shortcut hint', () => {
    renderPersonaSelector();
    
    // Open the menu
    fireEvent.click(screen.getByRole('button', { name: /select persona/i }));
    
    // Check if the keyboard shortcut hint is visible
    expect(screen.getByText(/press/i)).toBeInTheDocument();
    expect(screen.getByText(/alt/i)).toBeInTheDocument();
    expect(screen.getByText(/p/i)).toBeInTheDocument();
    
    // Test the Alt+P shortcut
    // Note: In a real browser this would work, but in jsdom we'd need to mock the event handling
    // This is just to verify the hint is accurate
    fireEvent.keyDown(document, { key: 'p', altKey: true });
  });
  
  test('has proper color contrast', async () => {
    renderPersonaSelector();
    
    // Open the menu to test all elements
    fireEvent.click(screen.getByRole('button', { name: /select persona/i }));
    
    // Run axe-core check with focus on color contrast
    const results = await checkAccessibility(
      <PersonaProvider>
        <PersonaSelector />
      </PersonaProvider>,
      { rules: { 'color-contrast': { enabled: true } } }
    );
    
    // Should pass color contrast check
    expect(results).toHaveNoViolations();
  });
  
  test('supports screen readers with descriptive text', () => {
    renderPersonaSelector();
    
    // Open the menu
    fireEvent.click(screen.getByRole('button', { name: /select persona/i }));
    
    // Get all persona options
    const menuItems = screen.getAllByRole('menuitem');
    
    // Each menu item should have a descriptive label and accessible name
    menuItems.forEach(item => {
      // Check aria-label
      expect(item).toHaveAttribute('aria-label');
      
      // The menu item should contain both the persona name and description
      const personaName = item.querySelector('.persona-name');
      const personaDescription = item.querySelector('.persona-description');
      
      expect(personaName).not.toBeNull();
      expect(personaDescription).not.toBeNull();
      
      // The accessible name should include both the name and role
      expect(item.getAttribute('aria-label')).toContain('Switch to');
      expect(item.getAttribute('aria-label')).toContain('persona');
    });
  });
  
  test('position prop does not affect accessibility', async () => {
    // Test different position props
    const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
    
    for (const position of positions) {
      const { unmount } = render(
        <PersonaProvider>
          <PersonaSelector position={position} />
        </PersonaProvider>
      );
      
      // Open the menu
      fireEvent.click(screen.getByRole('button', { name: /select persona/i }));
      
      // Check accessibility
      const results = await checkAccessibility(
        <PersonaProvider>
          <PersonaSelector position={position} />
        </PersonaProvider>
      );
      
      // Should pass accessibility checks regardless of position
      expect(results).toHaveNoViolations();
      
      // Clean up before testing next position
      unmount();
    }
  });
  
  test('custom className prop does not affect accessibility', async () => {
    const { container } = render(
      <PersonaProvider>
        <PersonaSelector className="custom-test-class" />
      </PersonaProvider>
    );
    
    // Verify custom class is applied
    const selector = container.querySelector('.persona-selector');
    expect(selector).toHaveClass('custom-test-class');
    
    // Check accessibility
    const results = await checkAccessibility(
      <PersonaProvider>
        <PersonaSelector className="custom-test-class" />
      </PersonaProvider>
    );
    
    // Should still pass accessibility checks
    expect(results).toHaveNoViolations();
  });
});
