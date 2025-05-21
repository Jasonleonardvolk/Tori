/**
 * Test utility for rendering components with providers
 */

import React from 'react';
import { render } from '@testing-library/react';
import { PersonaProvider } from '../../../components/PersonaSelector/PersonaContext';

/**
 * Custom render function that wraps the component with necessary providers
 * @param {JSX.Element} ui - The component to render
 * @param {Object} options - Render options
 * @returns {Object} - The render result
 */
export const renderWithProviders = (ui, options = {}) => {
  const { wrapper, ...renderOptions } = options;
  
  const Wrapper = ({ children }) => {
    return <PersonaProvider>{children}</PersonaProvider>;
  };
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export default renderWithProviders;
